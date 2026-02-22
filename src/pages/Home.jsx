import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categorySchemas.js";
import { listListings, listListingsCount } from "../firebase/listings.js";
import ListingCard from "../components/ListingCard.jsx";

const CAT_ICONS = {
  auto: "🚗",
  phones: "📱",
  realty: "🏠",
  clothes: "👕",
  services: "🧰",
  other: "✨",
  electronics: "💻",
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

  const [count, setCount] = useState(null);
  const [fresh, setFresh] = useState([]);
  const [loading, setLoading] = useState(true);

  const topCats = useMemo(() => CATEGORIES.slice(0, 12), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const c = await listListingsCount();
        setCount(c);
      } catch {
        setCount(null);
      }
      const res = await listListings({ sort: "new", limit: 12 });
      setFresh(res);
      setLoading(false);
    })();
  }, []);

  function goSearch(e) {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (qText.trim()) p.set("q", qText.trim());
    if (city.trim()) p.set("city", city.trim());
    nav(`/listings?${p.toString()}`);
  }

  // Скелетоны для загрузки
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, i) => (
      <div key={i} className="listingCard">
        <div className="thumb">
          <div className="skeleton" style={{ width: "100%", height: "100%" }} />
        </div>
        <div className="cardBody">
          <div className="skeleton" style={{ width: "80%", height: "24px", marginBottom: "12px" }} />
          <div className="skeleton" style={{ width: "60%", height: "16px", marginBottom: "16px" }} />
          <div className="priceRow">
            <div className="skeleton" style={{ width: "40%", height: "24px" }} />
            <div className="skeleton" style={{ width: "20%", height: "16px" }} />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="home-page">
      {/* Hero секция с поиском */}
      <div className={`somonTop ${isSearchFocused ? "focused" : ""}`}>
        <div className="somonSearchRow">
          <div className="somonCount">
            {count === null ? (
              <span className="skeleton" style={{ width: "200px", height: "28px" }} />
            ) : (
              <>
                <span className="count-number">{count.toLocaleString("ru-RU")}</span>
                <span className="count-text">объявлений рядом с вами</span>
              </>
            )}
          </div>

          <form className="somonSearch" onSubmit={goSearch}>
            <div className="search-container">
              <input
                className="search-input"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Что ищем? iPhone, Toyota, квартира..."
                type="text"
              />
              <input
                className="city-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Город (например Душанбе)"
                type="text"
              />
              <button className="btnPrimary search-button" type="submit">
                <span className="search-icon">🔍</span>
                <span className="search-text">Найти</span>
              </button>
            </div>
          </form>
        </div>

        {/* Популярные категории */}
        <div className="categories-section">
          <h3 className="categories-title">Популярные категории</h3>
          <div className="catGrid">
            {topCats.map((c) => (
              <button
                key={c.id}
                className="catItem"
                onClick={() => nav(`/listings?cat=${c.id}`)}
                type="button"
              >
                <span className="catIcon">{CAT_ICONS[c.id] || "📌"}</span>
                <span className="catTitle">{c.title}</span>
                <span className="catCount muted small">
                  {Math.floor(Math.random() * 1000)}+
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Свежие объявления */}
      <div className="section">
        <div className="sectionHead">
          <div className="sectionHead-left">
            <h2 className="section-title gradient-text">Свежие объявления</h2>
            <p className="section-subtitle muted">
              {fresh.length > 0 ? `Показано ${fresh.length} из ${count || 0}` : "Новые предложения каждый день"}
            </p>
          </div>
          <Link className="btnGhost" to="/listings">
            Смотреть все
            <span className="arrow">→</span>
          </Link>
        </div>

        <div className="cardsGrid">
          {loading ? (
            renderSkeletons()
          ) : fresh.length > 0 ? (
            fresh.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))
          ) : (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="empty-icon">📭</div>
              <h3>Пока нет объявлений</h3>
              <p>Будьте первым, кто создаст объявление!</p>
              <Link to="/create" className="btnPrimary">
                Создать объявление
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Преимущества платформы */}
      <div className="features-section" style={{ marginTop: "60px" }}>
        <div className="sectionHead" style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 className="section-title gradient-text">Почему выбирают TojMarket</h2>
          <p className="section-subtitle muted">Самая удобная площадка для покупки и продажи в Таджикистане</p>
        </div>

        <div className="features-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "30px"
        }}>
          {[
            { icon: "🛡️", title: "Безопасная сделка", desc: "Защита от мошенников и безопасные платежи" },
            { icon: "⚡", title: "Мгновенная публикация", desc: "Ваше объявление появится через секунду" },
            { icon: "📱", title: "Удобный интерфейс", desc: "Ищите и покупайте с любого устройства" },
            { icon: "🎯", title: "Точный поиск", desc: "Умные фильтры для быстрого поиска" },
            { icon: "💬", title: "Чат с продавцом", desc: "Общайтесь прямо на платформе" },
            { icon: "⭐", title: "Проверенные продавцы", desc: "Рейтинг и отзывы о пользователях" }
          ].map((feature, i) => (
            <div key={i} className="feature-card" style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "30px",
              textAlign: "center",
              transition: "var(--transition)"
            }}>
              <div style={{
                fontSize: "48px",
                marginBottom: "20px"
              }}>{feature.icon}</div>
              <h3 style={{ marginBottom: "12px" }}>{feature.title}</h3>
              <p className="muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA секция */}
      <div className="cta-section" style={{
        background: "var(--gradient)",
        borderRadius: "var(--radius-xl)",
        padding: "60px 40px",
        marginTop: "60px",
        textAlign: "center",
        color: "white"
      }}>
        <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>Готовы начать?</h2>
        <p style={{ fontSize: "18px", marginBottom: "32px", opacity: 0.9 }}>
          Присоединяйтесь к тысячам пользователей TojMarket
        </p>
        <div className="cta-buttons" style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <Link to="/create" className="btn" style={{
            background: "white",
            color: "var(--primary)",
            padding: "16px 32px",
            fontSize: "16px"
          }}>
            Продать товар
          </Link>
          <Link to="/listings" className="btn" style={{
            background: "transparent",
            color: "white",
            border: "2px solid white",
            padding: "16px 32px",
            fontSize: "16px"
          }}>
            Найти покупку
          </Link>
        </div>
      </div>
    </div>
  );
}