import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserPublic from "./pages/UserPublic.jsx";

import Home from "./pages/Home.jsx";
import Listings from "./pages/Listings.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import CreateListing from "./pages/CreateListing.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VinCheck from "./pages/VinCheck.jsx";
import NotFound from "./pages/NotFound.jsx";

import "./App.css";

export default function App() {
  const [theme, setTheme] = useState(() => {
    // Проверяем сохраненную тему или системные настройки
    const savedTheme = localStorage.getItem("tm_theme");
    if (savedTheme) return savedTheme;
    
    // Проверяем системные настройки
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
    return "light";
  });

  const location = useLocation();

  useEffect(() => {
    // Сохраняем тему
    localStorage.setItem("tm_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    
    // Добавляем/убираем класс для body
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [theme]);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [location.pathname]);

  // Функция для переключения темы
  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <div className="app">
      {/* Фоновый градиент */}
      <div className="bg" />
      
      {/* Шапка с передачей функции переключения темы */}
      <Header 
        theme={theme} 
        setTheme={setTheme} 
        toggleTheme={toggleTheme}
      />

      {/* Основной контент */}
      <main className="main">
        <div className="container">
          <div className="page">
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={<Home />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/vin" element={<VinCheck />} />
              <Route path="/user/:id" element={<UserPublic />} />

              {/* Защищенные маршруты */}
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreateListing />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile/:tab"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Аутентификация */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* 404 */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="footer">
        <div className="container">
          <div className="footerRow">
            <div className="brandMini">TojMarket</div>
            <div className="footerLinks">
              <a href="/about" className="footerLink muted small">О нас</a>
              <span className="footerDivider">•</span>
              <a href="/terms" className="footerLink muted small">Условия</a>
              <span className="footerDivider">•</span>
              <a href="/privacy" className="footerLink muted small">Конфиденциальность</a>
            </div>
            <div className="muted small">
              © {new Date().getFullYear()} • Купи/Продай • v1.0.0
            </div>
          </div>
        </div>
      </footer>

      {/* Кнопка быстрого возврата наверх (опционально) */}
      <button 
        className="scroll-top-btn iconBtn"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Наверх"
      >
        ↑
      </button>
    </div>
  );
}