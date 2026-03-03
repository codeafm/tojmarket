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
