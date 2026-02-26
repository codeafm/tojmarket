import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

 

const firebaseConfig = {
  apiKey: "AIzaSyCWgmUOzf25JlFCT5c5vBpz1Ln3bhPTHxg",
  authDomain: "tojmarket-78adf.firebaseapp.com",
  projectId: "tojmarket-78adf",
  storageBucket: "tojmarket-78adf.firebasestorage.app",
  messagingSenderId: "396052752694",
  appId: "1:396052752694:web:5313bb0d8e404cf1efab97",
  measurementId: "G-6V8YDDBV1C"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Добавьте эту функцию в файл src/firebase/listings.js

/**
 * Получить количество объявлений по каждой категории
 * @returns {Promise<Object>} Объект с количеством по категориям
 */
export async function getCategoryCounts() {
  try {
    const listingsRef = collection(db, "listings");
    const snapshot = await getDocs(listingsRef);
    
    const counts = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const category = data.category;
      
      if (category) {
        counts[category] = (counts[category] || 0) + 1;
      } else {
        counts['other'] = (counts['other'] || 0) + 1;
      }
    });
    
    return counts;
  } catch (error) {
    console.error("Ошибка получения количества по категориям:", error);
    return {};
  }
}