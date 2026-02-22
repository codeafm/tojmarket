// src/firebase/listings.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as qLimit,
  serverTimestamp,
  increment,
  getCountFromServer,
} from "firebase/firestore";

import { db, auth } from "./firebase.js";

// ===== helpers =====
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ✅ безопасная чистка (убирает File/DOM/Proxy/undefined)
function sanitizeForFirestore(obj) {
  try {
    return JSON.parse(JSON.stringify(obj || {}));
  } catch {
    return {};
  }
}

function toTsSeconds(v) {
  // createdAt может быть Timestamp, Date, number, null
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v?.seconds === "number") return v.seconds;
  const d = v instanceof Date ? v : null;
  return d ? Math.floor(d.getTime() / 1000) : 0;
}

function mapDoc(d) {
  const data = d.data() || {};

  // ✅ совместимость: attrs/spec
  const spec = data?.spec || data?.attrs || {};
  const attrs = data?.attrs || data?.spec || {};

  // ✅ совместимость: stats/views
  const stats = data?.stats || { views: data?.views || 0 };

  // ✅ совместимость: ownerUid/ownerId
  const ownerUid = data?.ownerUid || data?.ownerId || "";
  const ownerId = data?.ownerId || data?.ownerUid || "";

  return {
    id: d.id,
    ...data,
    spec,
    attrs,
    stats,
    ownerUid,
    ownerId,
  };
}

function includesText(listing, qText) {
  const q = norm(qText);
  if (!q) return true;

  const hay = norm(
    [
      listing.title,
      listing.description,
      listing.city,
      listing.category,
      listing?.spec ? Object.values(listing.spec).join(" ") : "",
      listing?.attrs ? Object.values(listing.attrs).join(" ") : "",
    ].join(" ")
  );

  return hay.includes(q);
}

function matchExtra(listing, extra) {
  if (!extra) return true;

  // фильтр по характеристикам — ищем и в spec и в attrs
  const spec = listing.spec || {};
  const attrs = listing.attrs || {};

  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined || v === null) continue;
    const vv = String(v).trim();
    if (!vv || vv === "all") continue;

    const av = spec[k] ?? attrs[k];
    if (av === undefined || av === null) return false;
    if (norm(av) !== norm(vv)) return false;
  }
  return true;
}

// ✅ проверка, что объявление принадлежит текущему пользователю
async function assertOwner(listingId) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  const ref = doc(db, "listings", listingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Listing not found");

  const data = snap.data() || {};
  const owner = data?.ownerUid || data?.ownerId;
  if (owner !== u.uid) throw new Error("Permission denied");

  return { ref, data };
}

// ===== API =====

// ✅ Создать объявление (структура как на 3-м скрине)
export async function createListing(payload) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  const clean = sanitizeForFirestore(payload);
  delete clean.proactiveRefresh;

  // берём характеристики только из spec/attrs
  const rawSpec = clean.spec || clean.attrs || {};
  const spec = { ...(rawSpec && typeof rawSpec === "object" ? rawSpec : {}) };

  // ✅ если по ошибке category/city/title/price лежат внутри spec/attrs — поднимем наверх
  if (!clean.category && spec.category) {
    clean.category = spec.category;
    delete spec.category;
  }
  if (!clean.city && spec.city) {
    clean.city = spec.city;
    delete spec.city;
  }
  if (!clean.title && spec.title) {
    clean.title = spec.title;
    delete spec.title;
  }
  if (!clean.description && spec.description) {
    clean.description = spec.description;
    delete spec.description;
  }
  if (
    (clean.price === undefined || clean.price === null || clean.price === "") &&
    spec.price !== undefined
  ) {
    clean.price = spec.price;
    delete spec.price;
  }

  const data = {
    category: String(clean.category || "").trim(),
    city: String(clean.city || "").trim(),
    title: String(clean.title || "").trim(),
    description: String(clean.description || "").trim(),
    plan: String(clean.plan || "base").trim(),
    price: Number(clean.price || 0),

    photos: Array.isArray(clean.photos) ? clean.photos.filter(Boolean) : [],

    // owner (как у тебя в базе)
    ownerUid: u.uid,
    ownerId: u.uid, // на всякий случай
    ownerEmail: u.email || "",
    ownerName: String(clean.ownerName || u.displayName || "").trim(),

    // ✅ характеристики отдельно
    spec,

    stats: clean.stats && typeof clean.stats === "object" ? clean.stats : { views: 0 },

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "listings"), data);
  return ref.id;
}

// ✅ Обновить объявление (обычное)
export async function updateListing(id, patch) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  const clean = sanitizeForFirestore(patch);
  delete clean.proactiveRefresh;

  // ✅ если пришёл spec/attrs — сохраняем только в spec
  const newSpec =
    clean.spec && typeof clean.spec === "object"
      ? clean.spec
      : clean.attrs && typeof clean.attrs === "object"
      ? clean.attrs
      : null;

  // убираем дубли
  delete clean.attrs;
  delete clean.spec;

  const ref = doc(db, "listings", id);
  await updateDoc(ref, {
    ...clean,
    ...(newSpec ? { spec: newSpec } : {}),
    updatedAt: serverTimestamp(),
  });
  return true;
}

// ✅ Обновить только владельцу (используй в Profile Edit)
export async function updateListingByOwner(id, patch) {
  const clean = sanitizeForFirestore(patch);
  delete clean.proactiveRefresh;

  const newSpec =
    clean.spec && typeof clean.spec === "object"
      ? clean.spec
      : clean.attrs && typeof clean.attrs === "object"
      ? clean.attrs
      : null;

  delete clean.attrs;
  delete clean.spec;

  const { ref } = await assertOwner(id);

  await updateDoc(ref, {
    ...clean,
    ...(newSpec ? { spec: newSpec } : {}),
    updatedAt: serverTimestamp(),
  });

  return true;
}

// ✅ Удалить (обычное)
export async function deleteListing(id) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  await deleteDoc(doc(db, "listings", id));
  return true;
}

// ✅ Удалить только владельцу
export async function deleteListingByOwner(id) {
  const { ref } = await assertOwner(id);
  await deleteDoc(ref);
  return true;
}

// ✅ Получить одно объявление
export async function getListing(id) {
  const snap = await getDoc(doc(db, "listings", id));
  if (!snap.exists()) return null;
  return mapDoc(snap);
}

// ✅ Лента объявлений с фильтрами
export async function listListings(params = {}) {
  const {
    qText = "",
    category = "all",
    city = "",
    status = "all", // base/vip/top
    sort = "new", // new/cheap/expensive
    priceFrom = 0,
    priceTo = 999999999,
    extra = {},
    limit = 200,
  } = params;

  // запрос простой, остальное фильтруем на клиенте
  let qRef = query(
    collection(db, "listings"),
    orderBy("createdAt", "desc"),
    qLimit(Math.min(limit, 500))
  );

  if (category && category !== "all") {
    qRef = query(
      collection(db, "listings"),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      qLimit(Math.min(limit, 500))
    );
  }

  const snap = await getDocs(qRef);
  let items = snap.docs.map(mapDoc);

  if (city && city.trim()) {
    const c = norm(city);
    items = items.filter((x) => norm(x.city).includes(c));
  }

  items = items.filter((x) => includesText(x, qText));

  if (status && status !== "all") {
    items = items.filter((x) => String(x.plan || "base") === status);
  }

  const pf = Number(priceFrom || 0);
  const pt = Number(priceTo || 999999999);
  items = items.filter((x) => {
    const p = Number(x.price);
    if (!Number.isFinite(p)) return false;
    return p >= pf && p <= pt;
  });

  items = items.filter((x) => matchExtra(x, extra));

  if (sort === "cheap") items.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === "expensive") items.sort((a, b) => Number(b.price) - Number(a.price));
  else {
    // new: уже desc по createdAt
  }

  return items.slice(0, limit);
}

// ✅ Count
export async function listListingsCount({ category = "all" } = {}) {
  try {
    let qRef = collection(db, "listings");
    if (category && category !== "all") {
      qRef = query(collection(db, "listings"), where("category", "==", category));
    }
    const res = await getCountFromServer(qRef);
    return res.data().count || 0;
  } catch (e) {
    const list = await listListings({ category, limit: 500 });
    return list.length;
  }
}

// ✅ Похожие (category, excludeId, lim)
export async function listRecommendedByCategory(category, excludeId = null, lim = 12) {
  if (!category) return [];
  const take = Math.min(Number(lim || 12) + 6, 50);

  const qRef = query(
    collection(db, "listings"),
    where("category", "==", category),
    orderBy("createdAt", "desc"),
    qLimit(take)
  );

  const snap = await getDocs(qRef);
  let items = snap.docs.map(mapDoc);

  if (excludeId) items = items.filter((x) => x.id !== excludeId);
  return items.slice(0, Math.min(Number(lim || 12), 50));
}

// ✅ +1 просмотр
export async function registerView(id) {
  if (!id) return;
  try {
    await updateDoc(doc(db, "listings", id), {
      "stats.views": increment(1),
    });
  } catch (e) {
    console.warn("registerView failed:", e?.message || e);
  }
}

// ✅ чтобы ListingDetail.jsx мог импортировать
export const incrementListingViews = registerView;
