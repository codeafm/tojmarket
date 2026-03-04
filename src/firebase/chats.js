// src/firebase/chats.js

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  limit
} from "firebase/firestore";
import { db } from "./firebase";

// Получить или создать чат с объявлением
export async function getChatWithListing(listingId, buyerId, sellerId) {
  try {
    // ВАЖНО: Проверяем, что все параметры есть
    if (!listingId || !buyerId || !sellerId) {
      console.error("Missing required parameters:", { listingId, buyerId, sellerId });
      return null;
    }

    const chatsRef = collection(db, "chats");
    
    // Ищем существующий чат
    const q = query(
      chatsRef,
      where("listingId", "==", listingId),
      where("participants", "array-contains", buyerId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Если чат существует, возвращаем его
    if (!querySnapshot.empty) {
      const chatDoc = querySnapshot.docs[0];
      return {
        id: chatDoc.id,
        ...chatDoc.data()
      };
    }
    
    // Создаем новый чат
    const newChat = {
      listingId,
      participants: [buyerId, sellerId],
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      unreadCount: {
        [buyerId]: 0,
        [sellerId]: 1 // Первое сообщение от покупателя
      }
    };
    
    const docRef = await addDoc(chatsRef, newChat);
    
    return {
      id: docRef.id,
      ...newChat
    };
  } catch (error) {
    console.error("Error getting chat with listing:", error);
    return null;
  }
}

// Подписаться на чаты пользователя
export function subscribeToUserChats(userId, callback) {
  if (!userId) return () => {};
  
  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef,
    where("participants", "array-contains", userId),
    orderBy("lastMessageTime", "desc")
  );
  
  return onSnapshot(q, async (snapshot) => {
    const chats = [];
    snapshot.forEach((doc) => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(chats);
  }, (error) => {
    console.error("Error subscribing to chats:", error);
  });
}

// Получить чат по ID
export async function getChatById(chatId) {
  if (!chatId) return null;
  
  try {
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      return {
        id: chatDoc.id,
        ...chatDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting chat by ID:", error);
    return null;
  }
}

// Подписаться на сообщения чата
export function subscribeToMessages(chatId, callback) {
  if (!chatId) return () => {};
  
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(messages);
  }, (error) => {
    console.error("Error subscribing to messages:", error);
  });
}

// Отправить сообщение
export async function sendMessage(chatId, senderId, text) {
  if (!chatId || !senderId || !text) {
    throw new Error("Missing required parameters");
  }
  
  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messageRef = await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false
    });
    
    // Обновляем информацию о чате
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${senderId}`]: 0 // Обнуляем для отправителя
    });
    
    return {
      id: messageRef.id,
      senderId,
      text,
      createdAt: new Date()
    };
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Отметить сообщения как прочитанные
export async function markMessagesAsRead(chatId, userId) {
  if (!chatId || !userId) return;
  
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}
// src/firebase/chats.js - добавьте эту функцию

// Создать новый чат
// src/firebase/chats.js

// Создать новый чат с первым сообщением
export async function createChat(listingId, buyerId, sellerId, firstMessage) {
  try {
    if (!listingId || !buyerId || !sellerId) {
      throw new Error("Missing required parameters");
    }

    const chatsRef = collection(db, "chats");
    
    // Проверяем, существует ли уже такой чат
    const q = query(
      chatsRef,
      where("listingId", "==", listingId),
      where("participants", "array-contains", buyerId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Если чат уже существует, возвращаем его
    if (!querySnapshot.empty) {
      const existingChat = querySnapshot.docs[0];
      
      // Если есть первое сообщение и чат пустой, отправляем его
      if (firstMessage) {
        await sendMessage(existingChat.id, buyerId, firstMessage);
      }
      
      return existingChat.id;
    }
    
    // Создаем новый чат
    const newChat = {
      listingId,
      participants: [buyerId, sellerId],
      createdAt: serverTimestamp(),
      lastMessage: firstMessage || "",
      lastMessageTime: serverTimestamp(),
      unreadCount: {
        [buyerId]: 0,
        [sellerId]: firstMessage ? 1 : 0
      }
    };
    
    const docRef = await addDoc(chatsRef, newChat);
    
    // Если есть первое сообщение, отправляем его
    if (firstMessage) {
      await sendMessage(docRef.id, buyerId, firstMessage);
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}