import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToUserChats } from "../firebase/chats";
import { getUserProfile } from "../firebase/users";
import { getListingById } from "../firebase/listings";
import "./Chats.css";

export default function Chats() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [listings, setListings] = useState({});

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserChats(user.uid, async (chatsData) => {
      console.log("Получены чаты:", chatsData);
      
      const usersPromises = chatsData.map(chat => {
        const otherUserId = chat.participants?.find(id => id !== user.uid);
        if (!otherUserId) return Promise.resolve(null);
        return getUserProfile(otherUserId).catch(() => null);
      });

      const listingsPromises = chatsData.map(chat => 
        chat.listingId ? getListingById(chat.listingId).catch(() => null) : Promise.resolve(null)
      );

      const [users, listingsData] = await Promise.all([
        Promise.all(usersPromises),
        Promise.all(listingsPromises)
      ]);

      const usersMap = {};
      const listingsMap = {};

      users.forEach((userProfile, index) => {
        const otherUserId = chatsData[index]?.participants?.find(id => id !== user.uid);
        if (userProfile && otherUserId) {
          usersMap[otherUserId] = userProfile;
        }
      });

      listingsData.forEach((listing, index) => {
        const listingId = chatsData[index]?.listingId;
        if (listing && listingId) {
          listingsMap[listingId] = listing;
        }
      });

      setUserData(usersMap);
      setListings(listingsMap);
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diff < 48 * 60 * 60 * 1000) {
        return "Вчера";
      } else if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      }
    } catch {
      return "";
    }
  };

  const sortedChats = [...chats].sort((a, b) => {
    if (!user) return 0;

    const aUnread = Number(a.unreadCount?.[user.uid] ?? 0);
    const bUnread = Number(b.unreadCount?.[user.uid] ?? 0);

    if (aUnread > 0 && bUnread === 0) return -1;
    if (aUnread === 0 && bUnread > 0) return 1;

    const aTime = a.lastMessageTime?.toDate?.() || new Date(0);
    const bTime = b.lastMessageTime?.toDate?.() || new Date(0);

    return bTime - aTime;
  });

  if (!user) {
    return (
      <div className="chatsPage">
        <div className="emptyChats">
          <div className="emptyChatsIcon">💬</div>
          <h3>Войдите в аккаунт</h3>
          <p>Чтобы увидеть свои чаты, необходимо авторизоваться</p>
          <Link to="/login" className="btnPrimary">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chatsPage">
        <div className="loadingContainer">
          <div className="loadingSpinner"></div>
          <p>Загрузка чатов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatsPage">
      <div className="chatsHeader">
        <h1>Мои чаты</h1>
        {chats.length > 0 && (
          <span className="chatsCount">
            {chats.length} {chats.length === 1 ? 'чат' : 
              chats.length < 5 ? 'чата' : 'чатов'}
          </span>
        )}
      </div>
      
      {chats.length === 0 ? (
        <div className="emptyChats">
          <div className="emptyChatsIcon">💬</div>
          <h3>У вас пока нет чатов</h3>
          <p>Начните общение с продавцом на странице объявления</p>
          <Link to="/listings" className="btnPrimary">
            Найти объявления
          </Link>
        </div>
      ) : (
        <div className="chatsList">
          {sortedChats.map(chat => {
            const otherUserId = chat.participants?.find(id => id !== user.uid);
            const otherUser = userData[otherUserId] || { 
              name: "Пользователь",
              phone: "Неизвестный номер"
            };
            const listing = listings[chat.listingId];
            const unreadCount = Number(chat.unreadCount?.[user.uid] ?? 0);

            return (
              <Link 
                key={chat.id} 
                to={`/chats/${chat.id}`}
                className={`chatItem ${unreadCount > 0 ? 'unread' : ''}`}
              >
                <div className="chatAvatar">
                  {otherUser?.photoURL ? (
                    <img 
                      src={otherUser.photoURL} 
                      alt={otherUser.name || "User"} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="avatarPlaceholder">${(otherUser?.name?.[0] || otherUserId?.[0] || "U").toUpperCase()}</div>`;
                      }}
                    />
                  ) : (
                    <div className="avatarPlaceholder">
                      {(otherUser?.name?.[0] || otherUserId?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="chatInfo">
                  <div className="chatHeader">
                    <div className="chatNameContainer">
                      <span className="chatName">
                        {otherUser?.name || otherUser?.phone || "Пользователь"}
                      </span>
                    </div>
                    <span className="chatTime">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  
                  <div className="chatPreview">
                    <span className={`chatMessage ${unreadCount > 0 ? 'unread' : ''}`}>
                      {chat.lastMessage || "Нет сообщений"}
                    </span>
                    {unreadCount > 0 && (
                      <span className="unreadBadge">{unreadCount}</span>
                    )}
                  </div>
                  
                  {listing && (
                    <div className="chatListing">
                      <span className="listingTitle">
                        {listing.title || "Объявление"}
                      </span>
                      {listing.price && (
                        <span className="listingPrice">
                          {listing.price.toLocaleString()} TJS
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}