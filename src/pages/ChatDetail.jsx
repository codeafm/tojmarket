import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  subscribeToMessages, 
  sendMessage, 
  markMessagesAsRead,
  getChatById
} from "../firebase/chats";
import { getUserProfile } from "../firebase/users";
import { getListingById } from "../firebase/listings";
import "./ChatDetail.css";

export default function ChatDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  // Прокрутка вниз
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Загрузка чата
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadChat = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError("ID чата не указан");
          return;
        }

        const chatData = await getChatById(id);
        
        if (!chatData) {
          setError("Чат не найден");
          return;
        }

        if (!chatData.participants?.includes(user.uid)) {
          setError("У вас нет доступа к этому чату");
          return;
        }

        setChat(chatData);

        const otherUserId = chatData.participants.find(pid => pid !== user.uid);
        if (otherUserId) {
          const userProfile = await getUserProfile(otherUserId);
          setOtherUser(userProfile);
        }

        if (chatData.listingId) {
          const listingData = await getListingById(chatData.listingId);
          setListing(listingData);
        }

      } catch (err) {
        console.error("Error loading chat:", err);
        setError("Ошибка при загрузке чата");
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [id, user, navigate]);

  // Подписка на сообщения
  useEffect(() => {
    if (!user || !id || !chat) return;

    let unsubscribe;

    const setupSubscription = async () => {
      try {
        unsubscribe = subscribeToMessages(id, (newMessages) => {
          const hasNewMessage = newMessages.length > prevMessagesLengthRef.current;
          
          setMessages(newMessages);
          
          if (hasNewMessage) {
            setTimeout(() => scrollToBottom("smooth"), 100);
          }
          
          if (newMessages.length > 0) {
            markMessagesAsRead(id, user.uid).catch(console.error);
          }

          prevMessagesLengthRef.current = newMessages.length;
        });
      } catch (err) {
        console.error("Error subscribing to messages:", err);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id, user, chat]);

  // Прокрутка при загрузке
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => scrollToBottom("auto"), 100);
    }
  }, [loading]);

  // Отправка сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user || !id) return;

    setSending(true);
    try {
      await sendMessage(id, user.uid, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Ошибка при отправке сообщения");
    } finally {
      setSending(false);
    }
  };

  // Форматирование времени
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  // Форматирование даты
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Сегодня";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Вчера";
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return "";
    }
  };

  // Группировка сообщений по датам
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!user) {
    return (
      <div className="chatDetail">
        <div className="errorContainer">
          <p>Необходимо войти в систему</p>
          <Link to="/login" className="btnPrimary">Войти</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chatDetail">
        <div className="loadingContainer">
          <div className="loadingSpinner"></div>
          <p>Загрузка чата...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chatDetail">
        <div className="errorContainer">
          <p className="errorMessage">{error}</p>
          <button onClick={() => navigate('/chats')} className="btnSecondary">
            Вернуться к чатам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatDetail">
      {/* Шапка чата */}
      <div className="chatDetailHeader">
        <button onClick={() => navigate('/chats')} className="backButton">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="chatUserInfo">
          <div className="chatAvatar">
            {otherUser?.photoURL ? (
              <img 
                src={otherUser.photoURL} 
                alt={otherUser.name || "User"} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="avatarPlaceholder">${(otherUser?.name?.[0] || "U").toUpperCase()}</div>`;
                }}
              />
            ) : (
              <div className="avatarPlaceholder">
                {(otherUser?.name?.[0] || otherUser?.phone?.[0] || "U").toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="userDetails">
            <h3>{otherUser?.name || otherUser?.phone || "Пользователь"}</h3>
            <div className="userMeta">
              <span className="userStatus">
                <span className="statusDot"></span>
                {otherUserTyping ? "печатает..." : "онлайн"}
              </span>
              {listing && (
                <>
                  <span className="metaSeparator">•</span>
                  <Link to={`/listing/${listing.id}`} className="listingLink">
                    {listing.title}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="messagesContainer" ref={messagesContainerRef}>
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="messageGroup">
            <div className="dateSeparator">
              <span>{date}</span>
            </div>
            
            {dateMessages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.senderId === user.uid ? 'own' : 'other'}`}
              >
                <div className="messageBubble">
                  <div className="messageText">{message.text}</div>
                  <div className="messageFooter">
                    <span className="messageTime">
                      {formatTime(message.createdAt)}
                    </span>
                    {message.senderId === user.uid && (
                      <span className="messageStatus">
                        {message.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {/* Индикатор печатания */}
        {otherUserTyping && (
          <div className="typingIndicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      <form className="messageForm" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Написать сообщение..."
          className="messageInput"
          disabled={sending}
          autoFocus
        />
        <button 
          type="submit" 
          className={`sendButton ${!newMessage.trim() || sending ? 'disabled' : ''}`}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <div className="sendingDots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}