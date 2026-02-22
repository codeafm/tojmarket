import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { getUserProfile, listUserListings } from "../firebase/users.js";

function digitsOnly(s = "") {
  return String(s).replace(/\D/g, "");
}

function formatDate(timestamp) {
  if (!timestamp) return "недавно";
  const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function UserPublic() {
  const { uid } = useParams();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    views: 0,
    avgPrice: 0
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await getUserProfile(uid);
        setProfile(p);
        
        const res = await listUserListings(uid, 200);
        setItems(res);
        
        // Рассчитываем статистику
        const total = res.length;
        const views = res.reduce((sum, item) => sum + (item.views || 0), 0);
        const avgPrice = total > 0 
          ? Math.round(res.reduce((sum, item) => sum + (item.price || 0), 0) / total) 
          : 0;
        
        setStats({ total, views, avgPrice });
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const tel = digitsOnly(profile?.phone || profile?.whatsapp || "");
  const wa = digitsOnly(profile?.whatsapp || profile?.phone || "");

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👤</div>
        <h3>Профиль не найден</h3>
        <p>Пользователь с таким ID не существует</p>
        <Link to="/" className="btnPrimary">На главную</Link>
      </div>
    );
  }

  return (
    <div className="user-public-page">
      {/* Шапка профиля */}
      <div className="public-profile-header">
        <div className="public-profile-cover">
          <div className="profile-cover-gradient" />
        </div>

        <div className="public-profile-info">
          <div className="public-avatar-wrapper">
            <div className="public-avatar">
              {(profile?.name?.[0] || "U").toUpperCase()}
            </div>
            {profile?.verified && (
              <div className="verified-badge" title="Подтверждённый продавец">✓</div>
            )}
          </div>

          <div className="public-profile-details">
            <h1 className="public-profile-name">
              {profile?.name || "Пользователь"}
              {profile?.verified && <span className="verified-text">Подтверждён</span>}
            </h1>
            
            <div className="public-profile-meta">
              {profile?.city && (
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{profile.city}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span>На сайте с {formatDate(profile?.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="public-profile-stats">
            <div className="stat-badge">
              <span className="stat-badge-value">{stats.total}</span>
              <span className="stat-badge-label">объявлений</span>
            </div>
            <div className="stat-badge">
              <span className="stat-badge-value">{stats.views}</span>
              <span className="stat-badge-label">просмотров</span>
            </div>
            <div className="stat-badge">
              <span className="stat-badge-value">{stats.avgPrice.toLocaleString()}</span>
              <span className="stat-badge-label">ср. цена</span>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="public-profile-content">
        {/* Левая колонка - контакты */}
        <div className="public-profile-sidebar">
          <div className="contacts-card">
            <h3 className="contacts-title">Контакты продавца</h3>

            {/* Телефон */}
            <div className="contact-item-large">
              <div className="contact-icon-wrapper">
                <span className="contact-icon">📱</span>
              </div>
              <div className="contact-details">
                <span className="contact-label">Телефон</span>
                <span className="contact-value">{profile?.phone || "Не указан"}</span>
              </div>
              {tel && (
                <a href={`tel:${tel}`} className="contact-action-btn" title="Позвонить">
                  📞
                </a>
              )}
            </div>

            {/* WhatsApp */}
            <div className="contact-item-large">
              <div className="contact-icon-wrapper whatsapp">
                <span className="contact-icon">💬</span>
              </div>
              <div className="contact-details">
                <span className="contact-label">WhatsApp</span>
                <span className="contact-value">{profile?.whatsapp || "Не указан"}</span>
              </div>
              {wa && (
                <a 
                  href={`https://wa.me/${wa}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="contact-action-btn whatsapp"
                  title="Написать в WhatsApp"
                >
                  💬
                </a>
              )}
            </div>

            {/* Дополнительная информация */}
            {profile?.bio && (
              <div className="contact-bio">
                <p>{profile.bio}</p>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="contact-actions">
              {tel && (
                <a href={`tel:${tel}`} className="action-btn primary">
                  <span className="btn-icon">📞</span>
                  Позвонить
                </a>
              )}
              {wa && (
                <a 
                  href={`https://wa.me/${wa}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="action-btn secondary"
                >
                  <span className="btn-icon">💬</span>
                  WhatsApp
                </a>
              )}
            </div>

            {/* Рейтинг (заглушка) */}
            <div className="seller-rating">
              <div className="rating-stars">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className="star active">★</span>
                ))}
              </div>
              <span className="rating-text">5.0 • 0 отзывов</span>
            </div>
          </div>

          {/* Быстрая статистика */}
          <div className="quick-stats-card">
            <h4>Активность</h4>
            <div className="quick-stats-grid">
              <div className="quick-stat">
                <span className="quick-stat-value">{stats.total}</span>
                <span className="quick-stat-label">Всего</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{stats.views}</span>
                <span className="quick-stat-label">Просмотры</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">
                  {items.filter(x => x.plan === 'vip' || x.plan === 'top').length}
                </span>
                <span className="quick-stat-label">VIP/TOP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - объявления */}
        <div className="public-profile-listings">
          <div className="listings-header">
            <h2 className="listings-title">
              Объявления продавца
              <span className="listings-count">{stats.total}</span>
            </h2>
            
            {/* Фильтры (опционально) */}
            <select className="listings-sort">
              <option value="newest">Сначала новые</option>
              <option value="price_desc">Сначала дороже</option>
              <option value="price_asc">Сначала дешевле</option>
            </select>
          </div>

          {items.length === 0 ? (
            <div className="empty-listings">
              <div className="empty-icon">📭</div>
              <h3>У продавца пока нет объявлений</h3>
              <p>Попробуйте зайти позже</p>
            </div>
          ) : (
            <div className="listings-grid">
              {items.map((item) => (
                <div key={item.id} className="listing-wrapper">
                  <ListingCard item={item} />
                  {item.plan === 'vip' && (
                    <span className="listing-badge vip">VIP</span>
                  )}
                  {item.plan === 'top' && (
                    <span className="listing-badge top">TOP</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}