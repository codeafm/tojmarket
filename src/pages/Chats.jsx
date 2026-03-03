import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToUserChats } from "../firebase/chats"; // Исправленный путь
import { getUserProfile } from "../firebase/users"; // Исправленный путь
import { getListingById } from "../firebase/listings"; // Исправленный путь
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
      // Загружаем данные пользователей и объявлений для каждого чата
      const usersPromises = chatsData.map(chat => {
        const otherUserId = chat.participants.find(id => id !== user.uid);
        return getUserProfile(otherUserId);
      });

      const listingsPromises = chatsData.map(chat => 
        getListingById(chat.listingId).catch(() => null)
      );

      const [users, listingsData] = await Promise.all([
        Promise.all(usersPromises),
        Promise.all(listingsPromises)
      ]);

      const usersMap = {};
      const listingsMap = {};

      users.forEach((userProfile, index) => {
        const otherUserId = chatsData[index].participants.find(id => id !== user.uid);
        if (userProfile) {
          usersMap[otherUserId] = userProfile;
        }
      });

      listingsData.forEach((listing, index) => {
        if (listing) {
          listingsMap[chatsData[index].listingId] = listing;
        }
      });

      setUserData(usersMap);
      setListings(listingsMap);
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="loading">Загрузка чатов...</div>;
  }

  return (
    <div className="chatsPage">
      <h1>Мои чаты</h1>
      
      {chats.length === 0 ? (
        <div className="emptyChats">
          <p>У вас пока нет чатов</p>
          <Link to="/listings" className="btnPrimary">
            Найти объявления
          </Link>
        </div>
      ) : (
        <div className="chatsList">
          {chats.map(chat => {
            const otherUserId = chat.participants.find(id => id !== user.uid);
            const otherUser = userData[otherUserId] || { name: "Пользователь" };
            const listing = listings[chat.listingId];
            const unreadCount = chat.unreadCount?.[user.uid] || 0;

            return (
              <Link 
                key={chat.id} 
                to={`/chats/${chat.id}`}
                className={`chatItem ${unreadCount > 0 ? 'unread' : ''}`}
              >
                <div className="chatAvatar">
                  {otherUser?.photoURL ? (
                    <img src={otherUser.photoURL} alt={otherUser.name} />
                  ) : (
                    <div className="avatarPlaceholder">
                      {(otherUser?.name?.[0] || otherUserId?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="chatInfo">
                  <div className="chatHeader">
                    <span className="chatName">
                      {otherUser?.name || otherUser?.phone || "Пользователь"}
                    </span>
                    <span className="chatTime">
                      {chat.lastMessageTime?.toDate().toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="chatPreview">
                    <span className="chatMessage">
                      {chat.lastMessage}
                    </span>
                    {unreadCount > 0 && (
                      <span className="unreadBadge">{unreadCount}</span>
                    )}
                  </div>
                  
                  {listing && (
                    <div className="chatListing">
                      Объявление: {listing.title}
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