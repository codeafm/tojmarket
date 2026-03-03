import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit as qLimit,
  getDocs,
} from "firebase/firestore";

export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  const base = {
    uid,
    name: "",
    phone: "",
    whatsapp: "",
    city: "",
    createdAt: null,
    updatedAt: null,
  };

  if (!snap.exists()) return base;
  return { ...base, ...snap.data(), uid };
}

export async function upsertUserProfile(uid, data) {
  if (!uid) throw new Error("uid required");
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      ...data,
      uid,
      updatedAt: serverTimestamp(),
      createdAt: data?.createdAt || serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateUserProfile(uid, patch) {
  if (!uid) throw new Error("uid required");
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

// ✅ ownerUid / ownerId / ownerEmail, без orderBy (индексы не нужны)
export async function listUserListings(uid, email = "", lim = 200) {
  if (!uid && !email) return [];

  const max = Math.min(Number(lim || 200), 500);
  const all = [];
  const seen = new Set();

  async function run(qRef) {
    const snap = await getDocs(qRef);
    for (const d of snap.docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      all.push({ id: d.id, ...d.data() });
    }
  }

  if (uid) {
    await run(query(collection(db, "listings"), where("ownerUid", "==", uid), qLimit(max)));
    await run(query(collection(db, "listings"), where("ownerId", "==", uid), qLimit(max)));
  }

  const em = String(email || "").trim();
  if (em) {
    await run(query(collection(db, "listings"), where("ownerEmail", "==", em), qLimit(max)));
  }

  all.sort((a, b) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
  return all.slice(0, max);
}