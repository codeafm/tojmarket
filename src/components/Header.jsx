import React, { useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header({ theme, setTheme }) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [sp] = useSearchParams();

  const [q, setQ] = useState(sp.get("q") || "");

  const meLabel = useMemo(() => {
    const name = user?.displayName || "";
    const email = user?.email || "";
    return name || (email ? email.split("@")[0] : "Профиль");
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
              <Link to="/profile" className="userChip" title="Профиль">
                <span className="avatar">{(meLabel?.[0] || "A").toUpperCase()}</span>
                <span className="userName">{meLabel}</span>
              </Link>
              <button className="btnGhost" onClick={logout} type="button">Выйти</button>
              <Link to="/create" className="btnPrimary">+ Подать</Link>
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
