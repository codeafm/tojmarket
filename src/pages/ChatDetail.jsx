import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  subscribeToMessages, 
  sendMessage, 
  markMessagesAsRead,
  getChatWithListing 
} from "../firebase/chats"; // Исправленный путь
import { getUserProfile } from "../firebase/users"; // Исправленный путь
import "./ChatDetail.css";

export default function ChatDetail() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Загружаем информацию о чате
    getChatWithListing(chatId).then(setChat);

    // Подписываемся на сообщения
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      
      // Отмечаем сообщения как прочитанные
      markMessagesAsRead(chatId, user.uid);
    });

    return () => unsubscribe();
  }, [chatId, user, navigate]);

  useEffect(() => {
    // Загружаем информацию о собеседнике
    if (chat) {
      const otherUserId = chat.participants.find(id => id !== user.uid);
      getUserProfile(otherUserId).then(setOtherUser);
    }
  }, [chat, user]);

  useEffect(() => {
    // Скролл к последнему сообщению
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(chatId, user.uid, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (!chat || !otherUser) {
    return <div className="loading">Загрузка чата...</div>;
  }

  return (
    <div className="chatDetail">
      <div className="chatHeader">
        <Link to="/chats" className="backBtn">← Назад к чатам</Link>
        <div className="chatUser">
          <div className="chatUserAvatar">
            {otherUser?.photoURL ? (
              <img src={otherUser.photoURL} alt={otherUser.name} />
            ) : (
              <div className="avatarPlaceholder">
                {(otherUser?.name?.[0] || "U").toUpperCase()}
              </div>
            )}
          </div>
          <div className="chatUserInfo">
            <h3>{otherUser?.name || otherUser?.phone || "Пользователь"}</h3>
            {chat.listing && (
              <Link to={`/listing/${chat.listing.id}`} className="chatListingLink">
                Объявление: {chat.listing.title}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="messagesContainer">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.senderId === user.uid ? 'own' : 'other'}`}
          >
            <div className="messageBubble">
              <div className="messageText">{message.text}</div>
              <div className="messageTime">
                {message.createdAt?.toDate().toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="messageForm" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
          className="messageInput"
        />
        <button 
          type="submit" 
          className="sendBtn"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? "..." : "→"}
        </button>
      </form>
    </div>
  );
}