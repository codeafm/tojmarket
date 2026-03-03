import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

// Создание нового чата
export async function createChat(listingId, buyerId, sellerId, firstMessage) {
  try {
    const chatRef = await addDoc(collection(db, "chats"), {
      listingId,
      buyerId,
      sellerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: firstMessage,
      lastMessageTime: serverTimestamp(),
      participants: [buyerId, sellerId],
      unreadCount: {
        [buyerId]: 0,
        [sellerId]: 1 // Первое сообщение для продавца
      }
    });

    // Добавляем первое сообщение
    await addDoc(collection(db, "messages"), {
      chatId: chatRef.id,
      senderId: buyerId,
      text: firstMessage,
      createdAt: serverTimestamp(),
      read: false
    });

    return chatRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

// Получение чатов пользователя
export function subscribeToUserChats(userId, callback) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const chats = [];
    snapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    callback(chats);
  });
}

// Получение сообщений чата
export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
}

// Отправка сообщения
export async function sendMessage(chatId, senderId, text) {
  try {
    // Добавляем сообщение
    await addDoc(collection(db, "messages"), {
      chatId,
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false
    });

    // Обновляем информацию о чате
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();
    
    // Определяем получателя
    const receiverId = chatData.participants.find(id => id !== senderId);
    
    // Обновляем счетчик непрочитанных
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${receiverId}`]: (chatData.unreadCount?.[receiverId] || 0) + 1
    });

  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Отметить сообщения как прочитанные
export async function markMessagesAsRead(chatId, userId) {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("chatId", "==", chatId),
      where("senderId", "!=", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    // Сбрасываем счетчик непрочитанных
    const chatRef = doc(db, "chats", chatId);
    batch.update(chatRef, {
      [`unreadCount.${userId}`]: 0
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

// Получить информацию о чате с объявлением
export async function getChatWithListing(chatId) {
  try {
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    if (!chatDoc.exists()) return null;

    const chatData = chatDoc.data();
    
    // Получаем информацию об объявлении
    const listingDoc = await getDoc(doc(db, "listings", chatData.listingId));
    
    return {
      id: chatDoc.id,
      ...chatData,
      listing: listingDoc.exists() ? { id: listingDoc.id, ...listingDoc.data() } : null
    };
  } catch (error) {
    console.error("Error getting chat with listing:", error);
    return null;
  }
}