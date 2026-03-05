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
  orderBy,
} from "firebase/firestore";

/**
 * Получить профиль пользователя по UID
 * @param {string} uid - ID пользователя
 * @returns {Promise<Object>} Профиль пользователя
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    const base = {
      uid,
      name: "",
      phone: "",
      whatsapp: "",
      telegram: "",
      instagram: "",
      city: "",
      description: "",
      verified: false,
      createdAt: null,
      updatedAt: null,
    };

    if (!snap.exists()) {
      // Создаем базовый профиль, если его нет
      await setDoc(ref, {
        ...base,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      return base;
    }
    
    return { ...base, ...snap.data(), uid };
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

/**
 * Создать или обновить профиль пользователя (полная замена или слияние)
 * @param {string} uid - ID пользователя
 * @param {Object} data - Данные профиля
 * @returns {Promise<void>}
 */
export async function upsertUserProfile(uid, data) {
  if (!uid) throw new Error("uid required");
  
  try {
    const ref = doc(db, "users", uid);
    
    // Проверяем, существует ли документ
    const snap = await getDoc(ref);
    const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
    
    await setDoc(
      ref,
      {
        ...data,
        uid,
        updatedAt: serverTimestamp(),
        createdAt: createdAt,
      },
      { merge: true }
    );
    
    return { success: true };
  } catch (error) {
    console.error("Error upserting user profile:", error);
    throw error;
  }
}

/**
 * Обновить профиль пользователя (частичное обновление)
 * @param {string} uid - ID пользователя
 * @param {Object} patch - Поля для обновления
 * @returns {Promise<Object>}
 */
export async function updateUserProfile(uid, patch) {
  if (!uid) throw new Error("uid required");
  
  try {
    const ref = doc(db, "users", uid);
    
    // Очищаем пустые строки и undefined значения
    const cleanPatch = Object.entries(patch).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = typeof value === 'string' ? value.trim() : value;
      }
      return acc;
    }, {});
    
    await updateDoc(ref, { 
      ...cleanPatch, 
      updatedAt: serverTimestamp() 
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

/**
 * Получить объявления пользователя
 * @param {string} uid - ID пользователя
 * @param {string} email - Email пользователя (опционально)
 * @param {number} lim - Лимит объявлений
 * @returns {Promise<Array>} Массив объявлений
 */
export async function listUserListings(uid, email = "", lim = 200) {
  if (!uid && !email) return [];

  const max = Math.min(Number(lim || 200), 500);
  const all = [];
  const seen = new Set();

  async function run(qRef) {
    try {
      const snap = await getDocs(qRef);
      for (const d of snap.docs) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        
        const data = d.data();
        all.push({ 
          id: d.id, 
          ...data,
          // Преобразуем Timestamp в Date для удобства
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        });
      }
    } catch (error) {
      console.error("Error in run query:", error);
    }
  }

  try {
    if (uid) {
      // Запрос по ownerUid
      await run(
        query(
          collection(db, "listings"), 
          where("ownerUid", "==", uid), 
          qLimit(max)
        )
      );
      
      // Запрос по ownerId (для обратной совместимости)
      await run(
        query(
          collection(db, "listings"), 
          where("ownerId", "==", uid), 
          qLimit(max)
        )
      );
    }

    const em = String(email || "").trim();
    if (em) {
      await run(
        query(
          collection(db, "listings"), 
          where("ownerEmail", "==", em), 
          qLimit(max)
        )
      );
    }

    // Сортируем по дате создания (новые сначала)
    all.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.getTime?.() || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?.getTime?.() || 0;
      return bTime - aTime;
    });

    return all.slice(0, max);
  } catch (error) {
    console.error("Error listing user listings:", error);
    throw error;
  }
}

/**
 * Проверить, существует ли профиль пользователя
 * @param {string} uid - ID пользователя
 * @returns {Promise<boolean>}
 */
export async function userProfileExists(uid) {
  if (!uid) return false;
  
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch (error) {
    console.error("Error checking user profile:", error);
    return false;
  }
}

/**
 * Удалить профиль пользователя (осторожно!)
 * @param {string} uid - ID пользователя
 * @returns {Promise<Object>}
 */
export async function deleteUserProfile(uid) {
  if (!uid) throw new Error("uid required");
  
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting user profile:", error);
    throw error;
  }
}

/**
 * Получить статистику пользователя
 * @param {string} uid - ID пользователя
 * @returns {Promise<Object>} Статистика
 */
export async function getUserStats(uid) {
  if (!uid) return null;
  
  try {
    const listings = await listUserListings(uid, "", 1000);
    
    const stats = {
      totalListings: listings.length,
      activeListings: listings.filter(l => l.status !== 'archived' && l.status !== 'deleted').length,
      totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
      totalPrice: listings.reduce((sum, l) => sum + (l.price || 0), 0),
      byPlan: {
        base: listings.filter(l => l.plan === 'base').length,
        vip: listings.filter(l => l.plan === 'vip').length,
        top: listings.filter(l => l.plan === 'top').length
      },
      byCategory: listings.reduce((acc, l) => {
        const cat = l.category || 'other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {})
    };
    
    stats.averagePrice = stats.totalListings > 0 
      ? Math.round(stats.totalPrice / stats.totalListings) 
      : 0;
    
    return stats;
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
}

/**
 * Обновить контактную информацию пользователя
 * @param {string} uid - ID пользователя
 * @param {Object} contacts - Контактные данные
 * @returns {Promise<Object>}
 */
export async function updateUserContacts(uid, contacts) {
  if (!uid) throw new Error("uid required");
  
  const allowedFields = ['phone', 'whatsapp', 'telegram', 'instagram', 'city'];
  const updateData = {};
  
  Object.entries(contacts).forEach(([key, value]) => {
    if (allowedFields.includes(key)) {
      updateData[key] = value?.trim() || '';
    }
  });
  
  return updateUserProfile(uid, updateData);
}

/**
 * Получить публичные данные пользователя для карточки объявления
 * @param {string} uid - ID пользователя
 * @returns {Promise<Object>} Публичные данные
 */
export async function getPublicUserData(uid) {
  if (!uid) return null;
  
  try {
    const profile = await getUserProfile(uid);
    
    // Возвращаем только публичные поля
    return {
      uid: profile.uid,
      name: profile.name,
      verified: profile.verified,
      createdAt: profile.createdAt,
      city: profile.city
    };
  } catch (error) {
    console.error("Error getting public user data:", error);
    return null;
  }
}