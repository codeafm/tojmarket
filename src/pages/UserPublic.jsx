import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
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

function formatPrice(price) {
  if (!price) return "—";
  return new Intl.NumberFormat("ru-RU").format(price) + " TJS";
}

function formatPhone(phone) {
  if (!phone) return "Не указан";
  if (phone.includes('+')) return phone;
  
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "+$1 ($2) $3-$4-$5");
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 ($2) $3-$4-$5");
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "+7 ($1) $2-$3-$4");
  }
  return phone;
}

export default function UserPublic() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [error, setError] = useState(null);

  const stats = useMemo(() => {
    const total = items.length;
    const views = items.reduce((sum, item) => sum + (item.views || 0), 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
    const avgPrice = total > 0 ? Math.round(totalPrice / total) : 0;
    const vipCount = items.filter(x => x.plan === 'vip').length;
    const topCount = items.filter(x => x.plan === 'top').length;
    
    return { total, views, avgPrice, totalPrice, vipCount, topCount };
  }, [items]);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      case "oldest":
        return sorted.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      case "price_desc":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "price_asc":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "popular":
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      default:
        return sorted;
    }
  }, [items, sortBy]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Загружаем профиль для UID:", uid);
        
        // 1. Загружаем профиль пользователя
        const profileData = await getUserProfile(uid);
        console.log("Профиль загружен:", profileData);
        
        if (!profileData) {
          setError("Пользователь не найден");
          setLoading(false);
          return;
        }
        
        setProfile(profileData);
        
        // 2. Загружаем объявления пользователя
        console.log("Загружаем объявления для UID:", uid);
        const listingsData = await listUserListings(uid, 200);
        console.log("Объявления загружены:", listingsData.length);
        setItems(listingsData);
        
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
        setError(error.message || "Не удалось загрузить профиль");
        showNotification("error", "Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchUserData();
    }
  }, [uid]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  };

  const handleContact = (type) => {
    const phone = type === 'call' 
      ? profile?.phone || profile?.whatsapp
      : profile?.whatsapp || profile?.phone;
    
    if (!phone) {
      showNotification("error", "Контакт не указан");
      return;
    }

    const cleanPhone = digitsOnly(phone);
    if (type === 'call') {
      window.location.href = `tel:${cleanPhone}`;
      showNotification("success", `Звонок на ${formatPhone(phone)}`);
    } else {
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
      showNotification("success", "WhatsApp открыт");
    }
  };

  const tel = digitsOnly(profile?.phone || profile?.whatsapp || "");
  const wa = digitsOnly(profile?.whatsapp || profile?.phone || "");

  if (loading) {
    return (
      <div className="user-public-page">
        <div className="loading-skeleton">
          <div className="skeleton-cover"></div>
          <div className="skeleton-content">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-info">
              <div className="skeleton-title"></div>
              <div className="skeleton-meta"></div>
            </div>
          </div>
          <div className="skeleton-stats">
            {[1,2,3].map(i => <div key={i} className="skeleton-stat"></div>)}
          </div>
          <div className="skeleton-listings">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="user-public-page">
        <div className="error-state">
          <div className="error-icon">👤</div>
          <h2>Профиль не найден</h2>
          <p>{error || "Пользователь с таким ID не существует"}</p>
          <Link to="/" className="btn-primary">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="user-public-page">
      {/* Уведомления */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Кнопка назад */}
      <button onClick={() => navigate(-1)} className="back-button">
        ← Назад
      </button>

      {/* Шапка профиля */}
      <div className="profile-header-modern">
        <div className="profile-cover">
          <div className="cover-gradient"></div>
        </div>

        <div className="profile-info-modern">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">
              {(profile?.name?.[0] || profile?.email?.[0] || "U").toUpperCase()}
            </div>
            {profile?.verified && (
              <div className="verified-badge-large">✓</div>
            )}
          </div>

          <div className="profile-details">
            <h1 className="profile-name-large">
              {profile?.name || profile?.username || "Пользователь"}
              {profile?.verified && <span className="verified-tag">Подтверждён</span>}
            </h1>
            
            <div className="profile-meta-modern">
              {profile?.city && (
                <div className="meta-chip">
                  <span>📍</span>
                  <span>{profile.city}</span>
                </div>
              )}
              <div className="meta-chip">
                <span>📅</span>
                <span>с {formatDate(profile?.createdAt)}</span>
              </div>
            </div>

            {profile?.bio && (
              <div className="profile-bio-modern">
                <p>{profile.bio}</p>
              </div>
            )}
          </div>

          <div className="profile-stats-modern">
            <div className="stat-item-modern">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">объявлений</span>
            </div>
            <div className="stat-item-modern">
              <span className="stat-number">{stats.views}</span>
              <span className="stat-label">просмотров</span>
            </div>
            <div className="stat-item-modern">
              <span className="stat-number">{stats.avgPrice.toLocaleString()}</span>
              <span className="stat-label">ср. цена</span>
            </div>
          </div>
        </div>
      </div>

      {/* Контактная информация */}
      <div className="contacts-section-modern">
        <h2 className="section-title-modern">
          <span className="title-icon">📞</span>
          Контакты продавца
        </h2>

        <div className="contacts-grid-modern">
          {/* Телефон */}
          <div className="contact-card-modern">
            <div className="contact-icon-modern">📱</div>
            <div className="contact-content-modern">
              <span className="contact-label">Телефон</span>
              <span className="contact-value">{formatPhone(profile?.phone) || "Не указан"}</span>
            </div>
            {tel && (
              <button 
                className="contact-button"
                onClick={() => handleContact('call')}
              >
                📞
              </button>
            )}
          </div>

          {/* WhatsApp */}
          <div className="contact-card-modern whatsapp">
            <div className="contact-icon-modern">💬</div>
            <div className="contact-content-modern">
              <span className="contact-label">WhatsApp</span>
              <span className="contact-value">{formatPhone(profile?.whatsapp) || "Не указан"}</span>
            </div>
            {wa && (
              <button 
                className="contact-button"
                onClick={() => handleContact('whatsapp')}
              >
                💬
              </button>
            )}
          </div>

          {/* Email */}
          <div className="contact-card-modern email">
            <div className="contact-icon-modern">✉️</div>
            <div className="contact-content-modern">
              <span className="contact-label">Email</span>
              <span className="contact-value">{profile?.email || "Не указан"}</span>
            </div>
            {profile?.email && (
              <a 
                href={`mailto:${profile.email}`}
                className="contact-button"
              >
                ✉️
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Премиум статистика */}
      {(stats.vipCount > 0 || stats.topCount > 0) && (
        <div className="premium-section">
          <h2 className="section-title-modern">
            <span className="title-icon">⭐</span>
            Премиум объявления
          </h2>
          <div className="premium-stats">
            {stats.vipCount > 0 && (
              <div className="premium-badge vip">
                <span className="premium-icon">⭐</span>
                <span className="premium-count">{stats.vipCount}</span>
                <span className="premium-label">VIP</span>
              </div>
            )}
            {stats.topCount > 0 && (
              <div className="premium-badge top">
                <span className="premium-icon">🔥</span>
                <span className="premium-count">{stats.topCount}</span>
                <span className="premium-label">TOP</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Объявления продавца */}
      <div className="listings-section-modern">
        <div className="listings-header-modern">
          <h2 className="section-title-modern">
            <span className="title-icon">📦</span>
            Объявления продавца
            <span className="title-badge">{stats.total}</span>
          </h2>
          
          <div className="sort-controls">
            <select 
              className="sort-select-modern"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">✨ Сначала новые</option>
              <option value="oldest">📅 Сначала старые</option>
              <option value="price_desc">💰 Сначала дороже</option>
              <option value="price_asc">💵 Сначала дешевле</option>
              <option value="popular">🔥 По популярности</option>
            </select>
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="empty-listings-modern">
            <div className="empty-icon-large">📭</div>
            <h3>У продавца пока нет объявлений</h3>
            <p>Попробуйте зайти позже</p>
          </div>
        ) : (
          <div className="listings-grid-modern">
            {sortedItems.map((item) => {
              const itemPlan = String(item.plan || "base").toLowerCase();
              
              return (
                <Link 
                  key={item.id} 
                  to={`/listing/${item.id}`} 
                  className="listing-card-modern"
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
                      <div className="no-image-modern">
                        <span className="no-image-icon">📷</span>
                        <span className="no-image-text">Нет фото</span>
                      </div>
                    )}
                    
                    {itemPlan === "vip" && (
                      <span className="card-badge-modern vip">⭐ VIP</span>
                    )}
                    {itemPlan === "top" && (
                      <span className="card-badge-modern top">🔥 TOP</span>
                    )}
                    
                    <div className="card-price-modern">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                  
                  <div className="card-content-modern">
                    <h3 className="card-title-modern">{item.title || "Без названия"}</h3>
                    
                    <div className="card-location-modern">
                      <span className="location-icon">📍</span>
                      <span className="location-text">{item.city || "Город не указан"}</span>
                    </div>
                    
                    <div className="card-footer-modern">
                      <div className="card-time">
                        <span className="time-icon">⏱️</span>
                        <span className="time-text">
                          {item.createdAt?.seconds 
                            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "short",
                              })
                            : "недавно"}
                        </span>
                      </div>
                      <div className="card-views">
                        <span className="views-icon">👁</span>
                        <span className="views-text">{item.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}