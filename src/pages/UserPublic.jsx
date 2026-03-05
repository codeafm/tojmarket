// src/pages/UserPublic.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { listUserListings } from "../firebase/users.js";
import "./UserPublic.css";

function digitsOnly(s = "") {
  return String(s).replace(/\D/g, "");
}

function formatDate(timestamp) {
  if (!timestamp) return "недавно";
  
  if (timestamp?.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  
  try {
    return new Date(timestamp).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "недавно";
  }
}

function formatPrice(price) {
  if (!price && price !== 0) return "—";
  return new Intl.NumberFormat("ru-RU").format(price) + " TJS";
}

function formatPhone(phone) {
  if (!phone) return "Не указан";
  
  if (phone.includes('+') || phone.includes('(')) return phone;
  
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 12 && cleaned.startsWith('992')) {
    return cleaned.replace(/(\d{3})(\d{2})(\d{3})(\d{4})/, "+$1 ($2) $3-$4");
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "+$1 ($2) $3-$4-$5");
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "+7 ($1) $2-$3-$4");
  }
  
  return phone;
}

export default function UserPublic() {
  const { id } = useParams(); // Изменено с uid на id для соответствия маршруту в App.jsx
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [error, setError] = useState(null);

  // Логируем id из URL
  console.log("🔍 Текущий id из URL:", id);
  console.log("🔍 Тип id:", typeof id);
  console.log("🔍 Длина id:", id?.length);

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

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("📢 Начинаем загрузку профиля для id:", id);
        
        if (!id) {
          console.log("❌ ID не указан в URL");
          setError("ID пользователя не указан");
          setLoading(false);
          return;
        }

        // Получаем профиль по ID напрямую из коллекции users
        console.log("📢 Получаем документ users/", id);
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        
        console.log("📢 Результат запроса:", {
          exists: userSnap.exists(),
          id: userSnap.id
        });
        
        if (!userSnap.exists()) {
          console.log("❌ Пользователь с ID не найден:", id);
          setError(`Пользователь не найден`);
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        console.log("✅ Профиль найден, данные:", userData);
        
        // Формируем профиль из данных Firestore
        const profileData = {
          uid: id, // Сохраняем ID как uid для внутреннего использования
          name: userData.name || userData.username || userData.displayName || "Пользователь",
          username: userData.username || "",
          email: userData.email || "",
          phone: userData.phone || "",
          whatsapp: userData.whatsapp || "",
          city: userData.city || "",
          bio: userData.bio || userData.description || "",
          verified: userData.verified || false,
          createdAt: userData.createdAt || null,
          photoURL: userData.photoURL || "",
          instagram: userData.instagram || "",
          telegram: userData.telegram || ""
        };
        
        console.log("✅ Сформирован профиль:", profileData);
        setProfile(profileData);
        
        // Загружаем объявления пользователя по ID
        console.log("📢 Загружаем объявления для ID:", id);
        const listingsData = await listUserListings(id, "", 200);
        console.log("✅ Объявления загружены, количество:", listingsData.length);
        setItems(listingsData || []);
        
      } catch (error) {
        console.error("❌ Ошибка загрузки профиля:", error);
        setError(error.message || "Не удалось загрузить профиль");
        showNotification("error", "Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]); // Зависимость от id

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

  if (loading) {
    return (
      <div className="public-page">
        <div className="public-loading-skeleton">
          <div className="public-skeleton-cover"></div>
          <div className="public-skeleton-content">
            <div className="public-skeleton-avatar"></div>
            <div className="public-skeleton-info">
              <div className="public-skeleton-title"></div>
              <div className="public-skeleton-meta"></div>
            </div>
          </div>
          <div className="public-skeleton-stats">
            {[1,2,3].map(i => <div key={i} className="public-skeleton-stat"></div>)}
          </div>
          <div className="public-skeleton-listings">
            {[1,2,3].map(i => (
              <div key={i} className="public-skeleton-card"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-page">
        <div className="public-error-state">
          <div className="public-error-icon">👤</div>
          <h2 className="public-error-title">Профиль не найден</h2>
          <p className="public-error-message">{error || "Пользователь не найден"}</p>
          <div className="public-error-actions">
            <button onClick={() => navigate(-1)} className="public-btn-secondary">
              ← Назад
            </button>
            <Link to="/" className="public-btn-primary">
              На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasPhone = !!(profile?.phone);
  const hasWhatsApp = !!(profile?.whatsapp);
  const hasEmail = !!(profile?.email);
  const hasCity = !!(profile?.city);

  return (
    <div className="public-page">
      {/* Уведомления */}
      {notification.show && (
        <div className={`public-notification public-notification-${notification.type}`}>
          <span className="public-notification-icon">
            {notification.type === "success" ? "✅" : 
             notification.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="public-notification-message">{notification.message}</span>
        </div>
      )}

      {/* Кнопка назад */}
      <button onClick={() => navigate(-1)} className="public-back-button">
        ← Назад
      </button>

      {/* Шапка профиля */}
      <div className="public-profile-header">
        <div className="public-profile-cover">
          <div className="public-cover-gradient"></div>
        </div>

        <div className="public-profile-info">
          <div className="public-avatar-wrapper">
            <div className="public-avatar-large">
              {profile?.username?.[0]?.toUpperCase() || 
               profile?.name?.[0]?.toUpperCase() || 
               profile?.email?.[0]?.toUpperCase() || 
               "U"}
            </div>
            {profile?.verified && (
              <div className="public-verified-badge-large">✓</div>
            )}
          </div>

          <div className="public-profile-details">
            <h1 className="public-profile-name">
              {profile?.name || profile?.username || "Пользователь"}
              {profile?.verified && <span className="public-verified-tag">Подтверждён</span>}
            </h1>
            
            <div className="public-profile-meta">
              {hasCity && (
                <div className="public-meta-chip">
                  <span className="public-meta-icon">📍</span>
                  <span className="public-meta-text">{profile.city}</span>
                </div>
              )}
              <div className="public-meta-chip">
                <span className="public-meta-icon">📅</span>
                <span className="public-meta-text">
                  на сайте с {formatDate(profile?.createdAt)}
                </span>
              </div>
              {profile?.username && (
                <div className="public-meta-chip">
                  <span className="public-meta-icon">@</span>
                  <span className="public-meta-text">{profile.username}</span>
                </div>
              )}
            </div>

            {profile?.bio && (
              <div className="public-profile-bio">
                <p className="public-bio-text">{profile.bio}</p>
              </div>
            )}

            {/* Социальные сети */}
            {(profile?.instagram || profile?.telegram) && (
              <div className="public-social-links">
                {profile?.instagram && (
                  <a 
                    href={`https://instagram.com/${profile.instagram}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="public-social-link instagram"
                  >
                    📷 Instagram
                  </a>
                )}
                {profile?.telegram && (
                  <a 
                    href={`https://t.me/${profile.telegram}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="public-social-link telegram"
                  >
                    ✈️ Telegram
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="public-profile-stats">
            <div className="public-stat-item">
              <span className="public-stat-number">{stats.total}</span>
              <span className="public-stat-label">объявлений</span>
            </div>
            <div className="public-stat-item">
              <span className="public-stat-number">{stats.views.toLocaleString()}</span>
              <span className="public-stat-label">просмотров</span>
            </div>
            <div className="public-stat-item">
              <span className="public-stat-number">{stats.avgPrice.toLocaleString()}</span>
              <span className="public-stat-label">ср. цена</span>
            </div>
          </div>
        </div>
      </div>

      {/* Контактная информация */}
      <div className="public-contacts-section">
        <h2 className="public-section-title">
          <span className="public-title-icon">📞</span>
          Контакты продавца
        </h2>

        <div className="public-contacts-grid">
          {/* Телефон */}
          <div className="public-contact-card">
            <div className="public-contact-icon">📱</div>
            <div className="public-contact-content">
              <span className="public-contact-label">Телефон</span>
              <span className="public-contact-value">
                {hasPhone ? formatPhone(profile.phone) : "Не указан"}
              </span>
            </div>
            {hasPhone && (
              <button 
                className="public-contact-button"
                onClick={() => handleContact('call')}
                title="Позвонить"
              >
                📞
              </button>
            )}
          </div>

          {/* WhatsApp */}
          <div className="public-contact-card public-whatsapp">
            <div className="public-contact-icon">💬</div>
            <div className="public-contact-content">
              <span className="public-contact-label">WhatsApp</span>
              <span className="public-contact-value">
                {hasWhatsApp ? formatPhone(profile.whatsapp) : "Не указан"}
              </span>
            </div>
            {hasWhatsApp && (
              <button 
                className="public-contact-button"
                onClick={() => handleContact('whatsapp')}
                title="Написать в WhatsApp"
              >
                💬
              </button>
            )}
          </div>

          {/* Email */}
          <div className="public-contact-card public-email">
            <div className="public-contact-icon">✉️</div>
            <div className="public-contact-content">
              <span className="public-contact-label">Email</span>
              <span className="public-contact-value">
                {hasEmail ? profile.email : "Не указан"}
              </span>
            </div>
            {hasEmail && (
              <a 
                href={`mailto:${profile.email}`}
                className="public-contact-button"
                title="Написать email"
              >
                ✉️
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Премиум статистика */}
      {(stats.vipCount > 0 || stats.topCount > 0) && (
        <div className="public-premium-section">
          <h2 className="public-section-title">
            <span className="public-title-icon">⭐</span>
            Премиум объявления
          </h2>
          <div className="public-premium-stats">
            {stats.vipCount > 0 && (
              <div className="public-premium-badge public-vip">
                <span className="public-premium-icon">⭐</span>
                <span className="public-premium-count">{stats.vipCount}</span>
                <span className="public-premium-label">VIP</span>
              </div>
            )}
            {stats.topCount > 0 && (
              <div className="public-premium-badge public-top">
                <span className="public-premium-icon">🔥</span>
                <span className="public-premium-count">{stats.topCount}</span>
                <span className="public-premium-label">TOP</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Объявления продавца */}
      <div className="public-listings-section">
        <div className="public-listings-header">
          <h2 className="public-section-title">
            <span className="public-title-icon">📦</span>
            Объявления продавца
            {stats.total > 0 && (
              <span className="public-title-badge">{stats.total}</span>
            )}
          </h2>
          
          {stats.total > 0 && (
            <div className="public-sort-controls">
              <select 
                className="public-sort-select"
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
          )}
        </div>

        {sortedItems.length === 0 ? (
          <div className="public-empty-listings">
            <div className="public-empty-icon-large">📭</div>
            <h3 className="public-empty-title">У продавца пока нет объявлений</h3>
            <p className="public-empty-text">Попробуйте зайти позже</p>
          </div>
        ) : (
          <div className="public-listings-grid">
            {sortedItems.map((item, index) => {
              const itemPlan = String(item.plan || "base").toLowerCase();
              
              return (
                <Link 
                  key={item.id} 
                  to={`/listing/${item.id}`} 
                  className="public-listing-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="public-card-image-wrapper">
                    {item.photos?.[0] ? (
                      <img 
                        src={item.photos[0]} 
                        alt={item.title || "Фото"} 
                        className="public-card-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="public-no-image">
                        <span className="public-no-image-icon">📷</span>
                        <span className="public-no-image-text">Нет фото</span>
                      </div>
                    )}
                    
                    {itemPlan === "vip" && (
                      <span className="public-card-badge public-vip-badge">⭐ VIP</span>
                    )}
                    {itemPlan === "top" && (
                      <span className="public-card-badge public-top-badge">🔥 TOP</span>
                    )}
                    
                    <div className="public-card-price">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                  
                  <div className="public-card-content">
                    <h3 className="public-card-title">
                      {item.title || "Без названия"}
                    </h3>
                    
                    <div className="public-card-location">
                      <span className="public-location-icon">📍</span>
                      <span className="public-location-text">
                        {item.city || "Город не указан"}
                      </span>
                    </div>
                    
                    <div className="public-card-footer">
                      <div className="public-card-time">
                        <span className="public-time-icon">⏱️</span>
                        <span className="public-time-text">
                          {item.createdAt?.seconds 
                            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "short",
                              })
                            : "недавно"}
                        </span>
                      </div>
                      <div className="public-card-views">
                        <span className="public-views-icon">👁</span>
                        <span className="public-views-text">{item.views || 0}</span>
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