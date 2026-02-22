// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase.js";

/**
 * Регистрация
 * Создаёт Firebase Auth пользователя + документ users/{uid} в Firestore
 */
export async function registerUser({ email, password, username, phone = "", whatsapp = "" }) {
  const e1 = (email || "").trim();
  const u1 = (username || "").trim();

  if (!e1) throw new Error("Email пустой");
  if (!password) throw new Error("Пароль пустой");
  if (!u1) throw new Error("Username пустой");

  const cred = await createUserWithEmailAndPassword(auth, e1, password);

  // (не обязательно, но удобно)
  try {
    await updateProfile(cred.user, { displayName: u1 });
  } catch (_) {}

  const userRef = doc(db, "users", cred.user.uid);

  await setDoc(
    userRef,
    {
      uid: cred.user.uid,
      email: e1,
      username: u1,
      phone: String(phone || "").trim(),
      whatsapp: String(whatsapp || "").trim(), // можно хранить и как phone
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return cred.user;
}

/**
 * Вход
 */
export async function loginUser({ email, password }) {
  const e1 = (email || "").trim();
  if (!e1) throw new Error("Email пустой");
  if (!password) throw new Error("Пароль пустой");
  const cred = await signInWithEmailAndPassword(auth, e1, password);
  return cred.user;
}

/**
 * Выход
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Получить профиль пользователя (users/{uid})
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Создать профиль, если его нет (полезно для старых аккаунтов)
 */
export async function ensureUserProfile(user, fallback = {}) {
  if (!user?.uid) return null;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const username =
    (fallback.username || "").trim() ||
    (user.displayName || "").trim() ||
    (user.email ? user.email.split("@")[0] : "user");

  const data = {
    uid: user.uid,
    email: user.email || "",
    username,
    phone: String(fallback.phone || "").trim(),
    whatsapp: String(fallback.whatsapp || "").trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, data, { merge: true });
  return data;
}
