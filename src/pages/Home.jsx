// src/pages/Home.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categorySchemas.js";
import { listListings, listListingsCount, getCategoryCounts } from "../firebase/listings.js";

const CAT_ICONS = {
  auto: "🚗",
  phones: "📱",
  tablets: "📱",
  computers: "💻",
  realty: "🏠",
  clothes: "👕",
  services: "🧰",
  other: "✨",
  electronics: "📺",
  furniture: "🪑",
  pets: "🐕",
  jobs: "💼",
  education: "📚",
  sport: "⚽",
  beauty: "💄",
  kids: "🧸",
  tickets: "🎫",
  rent: "🔑",
  repair: "🔧",
  transport: "🚚",
  construction: "🏗️",
  gardening: "🌱",
  music: "🎵",
  games: "🎮",
  books: "📖",
  collectibles: "🏆",
  art: "🎨",
  photography: "📷"
};

export default function Home() {
  const nav = useNavigate();
  const [qText, setQText] = useState("");
  const [city, setCity] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [totalCount, setTotalCount] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [fresh, setFresh] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Функция для определения приоритета плана
  const getPlanPriority = useCallback((plan) => {
    const planStr = String(plan || "base").toLowerCase();
    if (planStr === "vip") return 0;      // VIP - самый высокий приоритет
    if (planStr === "top") return 1;      // TOP - средний приоритет
    return 2;                              // Базовый - низкий приоритет
  }, []);

  // ✅ ИСПРАВЛЕНО: добавляем computers и tablets в список популярных категорий
  const topCats = useMemo(() => {
    // Берем первые 12 категорий
    const allCats = CATEGORIES.slice(0, 12);
    
    // Проверяем, есть ли computers в списке
    const hasComputers = allCats.some(c => c.id === "computers");
    
    // Если нет computers, добавляем его вручную
    if (!hasComputers) {
      const computersCat = CATEGORIES.find(c => c.id === "computers");
      if (computersCat) {
        allCats.pop();
        allCats.push(computersCat);
      }
    }
    
    // Проверяем, есть ли tablets в списке
    const hasTablets = allCats.some(c => c.id === "tablets");
    
    // Если нет tablets, добавляем его
    if (!hasTablets) {
      const tabletsCat = CATEGORIES.find(c => c.id === "tablets");
      if (tabletsCat) {
        allCats.pop();
        allCats.push(tabletsCat);
      }
    }
    
    return allCats;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const total = await listListingsCount();
        setTotalCount(total);
        
        const counts = await getCategoryCounts();
        console.log("📊 Category counts:", counts);
        console.log("📊 Tablets count:", counts?.tablets);
        
        setCategoryCounts(counts);
        
        // ✅ Загружаем 8 свежих объявлений (для сетки 4x2)
        const res = await listListings({ sort: "new", limit: 8 });
        setFresh(res);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Сортируем свежие объявления: сначала VIP, потом TOP, потом базовые
  const sortedFresh = useMemo(() => {
    if (!fresh.length) return [];
    
    return [...fresh].sort((a, b) => {
      // Сначала сортируем по плану (VIP > TOP > base)
      const planA = getPlanPriority(a.plan);
      const planB = getPlanPriority(b.plan);
      
      if (planA !== planB) {
        return planA - planB; // Меньше число = выше приоритет
      }
      
      // Если план одинаковый, сортируем по дате (новые primero)
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [fresh, getPlanPriority]);

  function goSearch(e) {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (qText.trim()) p.set("q", qText.trim());
    if (city.trim()) p.set("city", city.trim());
    nav(`/listings?${p.toString()}`);
  }

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("ru-RU").format(price) + " TJS";
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "недавно";
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  // ✅ Обновляем скелетоны для 8 карточек
  const renderSkeletons = () => {
    return Array(8).fill(0).map((_, i) => (
      <div key={i} className="modern-skeleton-card">
        <div className="skeleton-image"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-price"></div>
          <div className="skeleton-meta">
            <div className="skeleton-location"></div>
            <div className="skeleton-time"></div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="home-page">
      {/* Hero секция с поиском */}
      <div className={`hero-section ${isSearchFocused ? "focused" : ""}`}>
        <div className="hero-content">
          <div className="hero-stats">
            {totalCount === null ? (
              <div className="skeleton-stats"></div>
            ) : (
              <>
                <span className="stats-number">{totalCount.toLocaleString("ru-RU")}</span>
                <span className="stats-text">объявлений в Таджикистане</span>
              </>
            )}
          </div>

          <form className="search-form" onSubmit={goSearch}>
            <div className="search-wrapper">
              <div className="search-input-group">
                <span className="search-icon">🔍</span>
                <input
                  className="search-field"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Что ищем? iPhone, Toyota, квартира..."
                  type="text"
                />
              </div>
              <div className="city-input-group">
                <span className="city-icon">📍</span>
                <input
                  className="city-field"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Город"
                  type="text"
                />
              </div>
              <button className="search-button" type="submit">
                <span>Найти</span>
                <span className="button-arrow">→</span>
              </button>
            </div>
          </form>
        </div>

        {/* Популярные категории с реальными цифрами */}
        <div className="categories-section">
          <h3 className="categories-title">Популярные категории</h3>
          <div className="categories-grid">
            {topCats.map((c) => {
              // Объединяем phones и tablets в одну категорию
              let count = categoryCounts[c.id] || 0;
              let displayName = c.title;
              let linkCat = c.id;
              
              if (c.id === "phones") {
                // Для телефонов показываем сумму телефонов и планшетов
                count = (categoryCounts.phones || 0) + (categoryCounts.tablets || 0);
                displayName = "Телефоны и планшеты";
                linkCat = "phones,tablets"; // для поиска по обеим категориям
              }
              
              return (
                <button
                  key={c.id}
                  className="category-card"
                  onClick={() => nav(`/listings?cat=${linkCat}`)}
                  type="button"
                >
                  <span className="category-icon">{CAT_ICONS[c.id] || "📌"}</span>
                  <span className="category-name">{displayName}</span>
                  <span className="category-count">
                    {count > 0 ? count.toLocaleString("ru-RU") : "0"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Свежие объявления */}
      <div className="listings-section">
        <div className="section-header">
          <div className="header-left">
            <h2 className="section-title">
              <span className="title-icon">🔥</span>
              Свежие объявления
            </h2>
            <p className="section-subtitle">
              {sortedFresh.length > 0 
                ? `${sortedFresh.length} новых предложений` 
                : "Новые предложения каждый день"}
            </p>
          </div>
          <Link className="view-all-link" to="/listings">
            <span>Смотреть все</span>
            <span className="arrow">→</span>
          </Link>
        </div>

        {/* ✅ Сетка 4x2 (8 карточек) */}
        <div className="home-listings-grid grid-4x2">
          {loading ? (
            renderSkeletons()
          ) : sortedFresh.length > 0 ? (
            sortedFresh.map((item, index) => {
              const plan = String(item.plan || "base").toLowerCase();
              const itemViews = item?.stats?.views ?? item?.views ?? 0;
              
              return (
                <Link
                  key={item.id} 
                  to={`/listing/${item.id}`} 
                  className="modern-listing-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="card-image-wrapper">
                    {item.photos?.[0] ? (
                      <img 
                        src={item.photos[0]} 
                        alt={item.title} 
                        className="card-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-image">
                        <span className="no-image-icon">📷</span>
                        <span className="no-image-text">Нет фото</span>
                      </div>
                    )}
                    
                    {plan !== "base" && (
                      <span className={`card-badge ${plan}`}>
                        {plan === "vip" ? "⭐ VIP" : "🔥 TOP"}
                      </span>
                    )}
                  </div>
                  
                  <div className="card-content">
                    <h3 className="card-title">{item.title || "Без названия"}</h3>
                    
                    <div className="card-price">
                      {formatPrice(item.price)}
                    </div>
                    
                    <div className="card-meta">
                      <div className="meta-location">
                        <span className="meta-icon">📍</span>
                        <span className="meta-text">{item.city || "Город не указан"}</span>
                      </div>
                      <div className="meta-time">
                        <span className="meta-icon">⏱️</span>
                        <span className="meta-text">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="card-footer">
                      <div className="footer-views">
                        <span className="views-icon">👁</span>
                        <span className="views-count">{itemViews}</span>
                      </div>
                      {item.category && (
                        <span className="footer-category">
                          {CAT_ICONS[item.category] || "📦"} {
                            item.category === "tablets" ? "Планшеты" : 
                            item.category === "phones" ? "Телефоны" : 
                            item.category
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Пока нет объявлений</h3>
              <p>Будьте первым, кто создаст объявление!</p>
              <Link to="/create" className="btn-primary">
                Создать объявление
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Преимущества платформы */}
      <div className="features-section">
        <div className="section-header centered">
          <h2 className="section-title">
            <span className="title-icon">✨</span>
            Почему выбирают TojMarket
          </h2>
          <p className="section-subtitle">Самая удобная площадка для покупки и продажи в Таджикистане</p>
        </div>

        <div className="features-grid">
          {[
            { icon: "🛡️", title: "Безопасная сделка", desc: "Защита от мошенников и безопасные платежи" },
            { icon: "⚡", title: "Мгновенная публикация", desc: "Ваше объявление появится через секунду" },
            { icon: "📱", title: "Удобный интерфейс", desc: "Ищите и покупайте с любого устройства" },
            { icon: "🎯", title: "Точный поиск", desc: "Умные фильтры для быстрого поиска" },
            { icon: "💬", title: "Чат с продавцом", desc: "Общайтесь прямо на платформе" },
            { icon: "⭐", title: "Проверенные продавцы", desc: "Рейтинг и отзывы о пользователях" }
          ].map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA секция */}
      <div className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Готовы начать?</h2>
          <p className="cta-subtitle">
            Присоединяйтесь к тысячам пользователей TojMarket
          </p>
          <div className="cta-buttons">
            <Link to="/create" className="btn-primary btn-large">
              Продать товар
            </Link>
            <Link to="/listings" className="btn-outline btn-large">
              Найти покупку
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}