import React, { useMemo, useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase/firebase.js";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Header({ theme, setTheme }) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [sp] = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);

  const [q, setQ] = useState(sp.get("q") || "");

  const meLabel = useMemo(() => {
    const name = user?.displayName || "";
    const email = user?.email || "";
    return name || (email ? email.split("@")[0] : "Профиль");
  }, [user]);

  // Подписка на непрочитанные сообщения
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnread = 0;
      
      snapshot.docs.forEach(doc => {
        const chatData = doc.data();
        const userUnread = chatData.unreadCount?.[user.uid] || 0;
        totalUnread += userUnread;
      });

      setUnreadCount(totalUnread);
    }, (error) => {
      console.error("Error subscribing to unread messages:", error);
    });

    return () => unsubscribe();
  }, [user]);

  function onSearchSubmit(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    nav(`/listings?${p.toString()}`);
  }

  return (
    <header className="topbar">
      <div className="container topbarRow">
        <Link to="/" className="brand">
          <span className="logo">TM</span>
          <span className="brandText">TojMarket</span>
        </Link>

        <nav className="nav">
          <NavLink to="/listings" className={({ isActive }) => "navLink" + (isActive ? " active" : "")}>
            Объявления
          </NavLink>
          <NavLink to="/create" className={({ isActive }) => "navLink" + (isActive ? " active" : "")}>
            Подать
          </NavLink>
          <NavLink to="/vin" className={({ isActive }) => "navLink" + (isActive ? " active" : "")}>
            VIN
          </NavLink>
        </nav>

        <form className="topSearch" onSubmit={onSearchSubmit}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: iPhone, Toyota…"
          />
        </form>

        <div className="topActions">
          <button
            className="iconBtn"
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="button"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {user ? (
            <>
              {/* Кнопка чата с красивым бейджем */}
              <Link to="/chats" className="iconBtn chatLink" title="Чаты">
                💬
                {unreadCount > 0 && (
                  <span className="headerChatBadge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              
              <Link to="/profile" className="userChip" title="Профиль">
                <span className="avatar">{(meLabel?.[0] || "A").toUpperCase()}</span>
                <span className="userName">{meLabel}</span>
              </Link>
              <button className="btnGhost" onClick={logout} type="button">Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btnGhost">Вход</Link>
              <Link to="/register" className="btnPrimary">Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}