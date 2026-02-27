// src/pages/ListingDetail.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getListing,
  listRecommendedByCategory,
  incrementListingViews,
} from "../firebase/listings.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserProfile } from "../firebase/users.js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import "./ListingDetail.css";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ show: false, action: "", success: false });
  const [connectionError, setConnectionError] = useState(false);
  const [showFullPhone, setShowFullPhone] = useState(false);

  const views = useMemo(() => item?.stats?.views ?? item?.views ?? 0, [item]);

  const createdLabel = useMemo(() => {
    const ts = item?.createdAt;
    if (ts?.seconds) {
      const d = new Date(ts.seconds * 1000);
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } else if (ts?.toDate) {
      const d = ts.toDate();
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } else if (ts) {
      const d = new Date(ts);
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return "";
  }, [item]);

  const formatPrice = useCallback((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("ru-RU") + " TJS";
  }, []);

  // Функция для маскировки номера телефона (показывает только первые 4 и последние 2 цифры)
  const maskPhone = useCallback((phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      const start = cleaned.slice(0, 4);
      const end = cleaned.slice(-2);
      const masked = '*'.repeat(cleaned.length - 6);
      return `${start}${masked}${end}`;
    }
    return phone;
  }, []);

  const formatPhone = useCallback((phone, showFull = false) => {
    if (!phone) return "Не указан";
    if (phone.includes('+')) return phone;
    
    const cleaned = phone.replace(/\D/g, "");
    
    // Форматируем номер для отображения
    let formatted = "";
    if (cleaned.length === 12) {
      formatted = cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "+$1 ($2) $3-$4-$5");
    } else if (cleaned.length === 11) {
      formatted = cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 ($2) $3-$4-$5");
    } else if (cleaned.length === 10) {
      formatted = cleaned.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "+7 ($1) $2-$3-$4");
    } else {
      formatted = phone;
    }
    
    // Если нужно показать маскированную версию
    if (!showFull && cleaned.length >= 10) {
      const masked = maskPhone(formatted);
      return masked;
    }
    
    return formatted;
  }, [maskPhone]);

  const getCleanPhone = useCallback((phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  }, []);

  const fetchSellerProfile = useCallback(async (ownerId) => {
    if (!ownerId) return null;
    
    try {
      console.log("Загружаем профиль продавца с ID:", ownerId);
      
      const sellerRef = doc(db, "users", ownerId);
      const sellerSnap = await getDoc(sellerRef);
      
      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        console.log("Профиль продавца загружен:", sellerData);
        
        const profileData = {
          name: sellerData.username || sellerData.displayName || sellerData.name || "Продавец",
          phone: sellerData.phone || "",
          whatsapp: sellerData.whatsapp || sellerData.phone || "",
          email: sellerData.email || "",
          verified: sellerData.verified || false,
          rating: sellerData.rating || 0,
          uid: sellerData.uid
        };
        
        setSellerProfile(profileData);
        return profileData;
      } else {
        console.log("Профиль продавца не найден в Firebase");
        try {
          const profile = await getUserProfile(ownerId);
          if (profile) {
            setSellerProfile(profile);
            return profile;
          }
        } catch (e) {
          console.error("Запасной вариант тоже не сработал:", e);
        }
        return null;
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля продавца:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setConnectionError(false);
      
      try {
        console.log("Загружаем объявление с ID:", id);
        const data = await getListing(id);
        console.log("Полученные данные объявления:", data);

        if (!alive) return;

        if (!data) {
          setItem({ _missing: true });
          setSimilar([]);
          setCurrentImage(null);
          return;
        }

        setItem(data);
        setCurrentImage(data?.photos?.[0] || null);
        
        const ownerId = data.ownerId || data.ownerUid || data.sellerId;
        console.log("ownerId для загрузки:", ownerId);
        
        if (ownerId) {
          const profile = await fetchSellerProfile(ownerId);
          if (!profile) {
            console.log("Профиль не найден, но это не критично");
          }
        }

        if (data?.category) {
          const sim = await listRecommendedByCategory(data.category, id, 8);
          if (!alive) return;
          setSimilar(sim || []);
        }

        try {
          await incrementListingViews(id);
        } catch (viewError) {
          console.warn("Не удалось увеличить просмотры:", viewError);
        }

        if (user) {
          const wishlist = JSON.parse(localStorage.getItem(`wishlist_${user.uid}`) || "[]");
          setInWishlist(wishlist.includes(id));
        }
      } catch (e) {
        console.error("Ошибка загрузки:", e);
        if (e.code === 'permission-denied') {
          setConnectionError(true);
        }
        if (alive) setItem({ _error: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, user, fetchSellerProfile]);

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  }, []);

  const showActionFeedback = useCallback((action, success = true) => {
    setActionFeedback({ show: true, action, success });
    setTimeout(() => setActionFeedback({ show: false, action: "", success: false }), 2000);
  }, []);

  const nextImage = useCallback(() => {
    if (!item?.photos?.length) return;
    const newIndex = (selectedImageIndex + 1) % item.photos.length;
    setSelectedImageIndex(newIndex);
    setCurrentImage(item.photos[newIndex]);
  }, [item?.photos, selectedImageIndex]);

  const prevImage = useCallback(() => {
    if (!item?.photos?.length) return;
    const newIndex = (selectedImageIndex - 1 + item.photos.length) % item.photos.length;
    setSelectedImageIndex(newIndex);
    setCurrentImage(item.photos[newIndex]);
  }, [item?.photos, selectedImageIndex]);

  const handleCall = useCallback(() => {
    const phone = sellerProfile?.phone || "";
    if (phone) {
      const cleanPhone = getCleanPhone(phone);
      window.location.href = `tel:${cleanPhone}`;
      showNotification("success", `📞 Звонок на ${formatPhone(phone, true)}`);
      showActionFeedback("Звонок инициирован", true);
    } else {
      showNotification("error", "❌ Номер не указан");
      showActionFeedback("Нет номера", false);
    }
  }, [sellerProfile, formatPhone, getCleanPhone, showNotification, showActionFeedback]);

  const handleWhatsApp = useCallback(() => {
    const phone = sellerProfile?.whatsapp || sellerProfile?.phone || "";
    if (phone) {
      const cleanPhone = getCleanPhone(phone);
      
      const message = encodeURIComponent(
        `Здравствуйте! Меня интересует ваше объявление:\n\n` +
        `🚗 *${item?.title || "Товар"}*\n` +
        `💰 Цена: ${formatPrice(item?.price)}\n` +
        `📍 Город: ${item?.city || "Не указан"}\n` +
        `📦 Категория: ${item?.category || "Не указана"}\n\n` +
        `🔗 Ссылка на объявление: ${window.location.href}\n\n` +
        `Скажите, пожалуйста, товар еще доступен?`
      );
      
      const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;
      window.open(waUrl, "_blank");
      
      showNotification("success", "💬 WhatsApp открыт");
      showActionFeedback("Сообщение готово", true);
    } else {
      showNotification("error", "❌ WhatsApp не указан");
      showActionFeedback("Нет WhatsApp", false);
    }
  }, [sellerProfile, item, formatPrice, getCleanPhone, showNotification, showActionFeedback]);

  const handleEmail = useCallback(() => {
    const email = sellerProfile?.email || "";
    if (email && email.includes('@')) {
      window.location.href = `mailto:${email}?subject=Вопрос по объявлению: ${item?.title}`;
      showNotification("success", `✉️ Email: ${email}`);
      showActionFeedback("Email открыт", true);
    } else {
      showNotification("error", "❌ Email не указан");
      showActionFeedback("Нет email", false);
    }
  }, [sellerProfile, item, showNotification, showActionFeedback]);

  const handleWishlist = useCallback(() => {
    if (!user) {
      showNotification("warning", "⚠️ Войдите в аккаунт");
      showActionFeedback("Требуется вход", false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const wishlistKey = `wishlist_${user.uid}`;
    const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || "[]");

    if (inWishlist) {
      const newWishlist = wishlist.filter(wishId => wishId !== id);
      localStorage.setItem(wishlistKey, JSON.stringify(newWishlist));
      setInWishlist(false);
      showNotification("success", "❤️ Удалено из избранного");
      showActionFeedback("Удалено", true);
    } else {
      wishlist.push(id);
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
      setInWishlist(true);
      showNotification("success", "❤️ Добавлено в избранное");
      showActionFeedback("Добавлено", true);
    }
  }, [user, inWishlist, id, navigate, showNotification, showActionFeedback]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: item?.title,
        url: window.location.href,
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        showNotification("success", "📋 Ссылка скопирована");
        showActionFeedback("Ссылка скопирована", true);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification("success", "📋 Ссылка скопирована");
      showActionFeedback("Ссылка скопирована", true);
    }
  }, [item, showNotification, showActionFeedback]);

  const handleViewSeller = useCallback(() => {
    const ownerId = item?.ownerId || item?.ownerUid || item?.sellerId;
    if (ownerId) {
      navigate(`/user/${ownerId}`);
      showNotification("success", "👤 Профиль продавца открыт");
      showActionFeedback("Профиль открыт", true);
    } else {
      showNotification("error", "❌ Профиль не найден");
      showActionFeedback("Ошибка", false);
    }
  }, [item, navigate, showNotification, showActionFeedback]);

  const handleReport = useCallback(() => {
    showNotification("success", "⚠️ Жалоба отправлена модератору");
    showActionFeedback("Жалоба отправлена", true);
  }, [showNotification, showActionFeedback]);

  const handleShowAllContacts = useCallback(() => {
    setShowContactInfo(!showContactInfo);
  }, [showContactInfo]);

  const toggleShowFullPhone = useCallback(() => {
    setShowFullPhone(!showFullPhone);
  }, [showFullPhone]);

  const hasPhone = !!(sellerProfile?.phone);
  const hasWhatsApp = !!(sellerProfile?.whatsapp);
  const hasEmail = !!(sellerProfile?.email);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Загружаем объявление...</p>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="error-container">
        <div className="error-icon">🔌</div>
        <h2 className="error-title">Ошибка соединения</h2>
        <p className="error-message">Проверьте подключение к интернету</p>
        <button onClick={() => window.location.reload()} className="error-button">
          Обновить
        </button>
      </div>
    );
  }

  if (!item) return <div className="empty-container">Загрузка…</div>;
  
  if (item._missing) {
    return (
      <div className="empty-container">
        <div className="empty-icon">🔍</div>
        <h2 className="empty-title">Объявление не найдено</h2>
        <p className="empty-message">Возможно, оно было удалено или никогда не существовало</p>
        <Link to="/listings" className="empty-button">Вернуться к списку</Link>
      </div>
    );
  }
  
  if (item._error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">Ошибка загрузки</h2>
        <p className="error-message">Не удалось загрузить объявление. Попробуйте позже</p>
        <button onClick={() => window.location.reload()} className="error-button">
          Обновить
        </button>
      </div>
    );
  }

  const plan = String(item.plan || "base").toLowerCase();
  const photos = item.photos || [];
  const hasSpecs = item.spec && Object.keys(item.spec).length > 0;

  return (
    <div className="listing-detail">
      {/* Уведомления */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-icon">
            {notification.type === "success" ? "✅" : 
             notification.type === "error" ? "❌" : 
             notification.type === "warning" ? "⚠️" : "ℹ️"}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      {/* Обратная связь на кнопке */}
      {actionFeedback.show && (
        <div className={`action-feedback action-feedback-${actionFeedback.success ? 'success' : 'error'}`}>
          <span className="feedback-icon">{actionFeedback.success ? '✓' : '✗'}</span>
          <span className="feedback-message">{actionFeedback.action}</span>
        </div>
      )}

      {/* Навигация */}
      <nav className="detail-nav">
        <button onClick={() => navigate(-1)} className="nav-back">
          ← Назад
        </button>
        <div className="nav-info">
          <Link to={`/category/${item.category}`} className="nav-link">
            {item.category || "—"}
          </Link>
          <span className="nav-separator">•</span>
          <span>{item.city || "—"}</span>
          {createdLabel && (
            <>
              <span className="nav-separator">•</span>
              <span>{createdLabel}</span>
            </>
          )}
          <span className="nav-separator">•</span>
          <span className="nav-views">👁 {views.toLocaleString()}</span>
        </div>
        <button onClick={handleShare} className="nav-share" title="Поделиться">
          📤
        </button>
      </nav>

      <div className="detail-grid">
        {/* Левая колонка */}
        <div className="detail-main">
          {/* Галерея */}
          <section className="gallery-section">
            <div className="gallery-main">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={item.title || "Фото"} 
                  onClick={() => setShowFullGallery(true)}
                  className="gallery-image"
                />
              ) : (
                <div className="gallery-placeholder">
                  <span className="placeholder-icon">📷</span>
                  <p className="placeholder-text">Нет фото</p>
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button className="gallery-nav gallery-prev" onClick={prevImage}>
                    ←
                  </button>
                  <button className="gallery-nav gallery-next" onClick={nextImage}>
                    →
                  </button>
                </>
              )}

              <div className={`listing-badge badge-${plan}`}>
                {plan === "vip" ? "⭐ VIP" : plan === "top" ? "🔥 TOP" : "📋 Базовый"}
              </div>
            </div>

            {photos.length > 1 && (
              <div className="gallery-thumbs">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    className={`gallery-thumb ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setCurrentImage(photo);
                    }}
                  >
                    <img src={photo} alt={`Фото ${index + 1}`} className="thumb-image" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Информация о товаре */}
          <section className="info-section">
            <header className="info-header">
              <h1 className="info-title">{item.title || "—"}</h1>
              <div className="info-price">
                <span className="price-currency">TJS</span>
                <span className="price-amount">{formatPrice(item.price).replace(' TJS', '')}</span>
              </div>
            </header>
            
            <div className="info-tags">
              <span className="info-tag">
                <span className="tag-icon">📍</span>
                {item.city || "—"}
              </span>
              <span className="info-tag">
                <span className="tag-icon">📦</span>
                {item.category || "—"}
              </span>
            </div>

            <div className="info-divider"></div>

            {/* Продавец */}
            <div className="seller-section">
              <h3 className="section-title">👤 Продавец</h3>
              <div className="seller-card">
                <div className="seller-avatar" onClick={handleViewSeller}>
                  {sellerProfile?.name?.[0] || item.ownerName?.[0] || item.sellerName?.[0] || "?"}
                </div>
                <div className="seller-details">
                  <div className="seller-name" onClick={handleViewSeller}>
                    {sellerProfile?.name || item.ownerName || item.sellerName || "Продавец"}
                    {sellerProfile?.verified && (
                      <span className="verified-badge" title="Подтвержденный продавец">✓</span>
                    )}
                  </div>
                  <div className="seller-contacts">
                    {hasPhone && (
                      <span className="seller-contact" onClick={handleCall}>
                        📞 {formatPhone(sellerProfile?.phone, showFullPhone)}
                      </span>
                    )}
                    {hasWhatsApp && !hasPhone && (
                      <span className="seller-contact" onClick={handleWhatsApp}>
                        💬 {formatPhone(sellerProfile?.whatsapp, showFullPhone)}
                      </span>
                    )}
                  </div>
                </div>
                <button className="seller-profile-btn" onClick={handleViewSeller}>
                  Профиль
                </button>
              </div>
            </div>

            <div className="info-divider"></div>

            {/* Описание */}
            <div className="description-section">
              <h3 className="section-title">📝 Описание</h3>
              {item.description ? (
                <p className="description-text">{item.description}</p>
              ) : (
                <p className="description-empty">Описание отсутствует</p>
              )}
            </div>

            {/* Характеристики */}
            {hasSpecs && (
              <>
                <div className="info-divider"></div>
                <div className="specs-section">
                  <h3 className="section-title">⚙️ Характеристики</h3>
                  <div className="specs-grid">
                    {Object.entries(item.spec)
                      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
                      .map(([key, value]) => (
                        <div className="spec-item" key={key}>
                          <span className="spec-key">{key}</span>
                          <span className="spec-value">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Похожие объявления */}
          {similar.length > 0 && (
            <section className="similar-section">
              <header className="similar-header">
                <h3 className="section-title">🔥 Похожие объявления</h3>
                <Link to="/listings" className="similar-link">
                  Все <span className="link-arrow">→</span>
                </Link>
              </header>
              <div className="similar-grid">
                {similar.map((x, index) => {
                  const xViews = x?.stats?.views ?? x?.views ?? 0;
                  const xPlan = String(x.plan || "base").toLowerCase();
                  
                  return (
                    <Link key={x.id} to={`/listing/${x.id}`} className="similar-card">
                      <div className="similar-card-image">
                        {x.photos?.[0] ? (
                          <img src={x.photos[0]} alt={x.title || ""} className="similar-image" />
                        ) : (
                          <div className="similar-placeholder">📷</div>
                        )}
                        {xPlan !== "base" && (
                          <span className={`similar-badge badge-${xPlan}`}>
                            {xPlan === "vip" ? "VIP" : "TOP"}
                          </span>
                        )}
                      </div>
                      <div className="similar-card-content">
                        <h4 className="similar-title">{x.title || "—"}</h4>
                        <p className="similar-price">{formatPrice(x.price)}</p>
                        <div className="similar-meta">
                          <span className="similar-city">📍 {x.city || "—"}</span>
                          <span className="similar-views">👁 {xViews}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Правая колонка */}
        <aside className="detail-sidebar">
          <div className="sidebar-sticky">
            {/* Контактная карточка */}
            <div className="contact-card">
              <div className="contact-header">
                <div className="contact-price">
                  <span className="price-label">Цена</span>
                  <span className="price-value">{formatPrice(item.price)}</span>
                </div>
                <div className={`contact-badge badge-${plan}`}>
                  {plan === "vip" ? "⭐ VIP" : plan === "top" ? "🔥 TOP" : "📋 Базовый"}
                </div>
              </div>

              <div className="contact-stats">
                <div className="stat-item" onClick={() => navigate(`/city/${item.city}`)}>
                  <span className="stat-icon">📍</span>
                  <div className="stat-content">
                    <span className="stat-label">Город</span>
                    <span className="stat-value stat-clickable">{item.city || "—"}</span>
                  </div>
                </div>
                <div className="stat-item" onClick={() => navigate(`/category/${item.category}`)}>
                  <span className="stat-icon">📦</span>
                  <div className="stat-content">
                    <span className="stat-label">Категория</span>
                    <span className="stat-value stat-clickable">{item.category || "—"}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👁</span>
                  <div className="stat-content">
                    <span className="stat-label">Просмотры</span>
                    <span className="stat-value">{views.toLocaleString()}</span>
                  </div>
                </div>
                {createdLabel && (
                  <div className="stat-item">
                    <span className="stat-icon">📅</span>
                    <div className="stat-content">
                      <span className="stat-label">Опубликовано</span>
                      <span className="stat-value">{createdLabel}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="contact-actions">
                {hasPhone && (
                  <button className="action-btn action-call" onClick={handleCall}>
                    <span className="action-icon">📞</span>
                    <div className="action-content">
                      <span className="action-label">Позвонить</span>
                      <div className="phone-display">
                        <span className="action-detail">
                          {formatPhone(sellerProfile?.phone, showFullPhone)}
                        </span>
                        <button 
                          className="phone-toggle" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowFullPhone();
                          }}
                        >
                  
                        </button>
                      </div>
                    </div>
                  </button>
                )}

                {hasWhatsApp && (
                  <button className="action-btn action-whatsapp" onClick={handleWhatsApp}>
                    <span className="action-icon">💬</span>
                    <div className="action-content">
                      <span className="action-label">WhatsApp</span>
                      <div className="phone-display">
                        <span className="action-detail">
                          {formatPhone(sellerProfile?.whatsapp, showFullPhone)}
                        </span>
                        <button 
                          className="phone-toggle" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowFullPhone();
                          }}
                        >
                 
                        </button>
                      </div>
                    </div>
                  </button>
                )}

                {hasEmail && (
                  <button className="action-btn action-email" onClick={handleEmail}>
                    <span className="action-icon">✉️</span>
                    <div className="action-content">
                      <span className="action-label">Email</span>
                      <span className="action-detail">{sellerProfile?.email}</span>
                    </div>
                  </button>
                )}
                
                {!hasPhone && !hasWhatsApp && !hasEmail && (
                  <div className="no-contacts">
                    <p>Контакты продавца не указаны</p>
                  </div>
                )}

                <button 
                  className="action-btn action-more" 
                  onClick={handleShowAllContacts}
                >
                  <span className="action-icon">📋</span>
                  <span className="action-label">{showContactInfo ? 'Скрыть' : 'Все действия'}</span>
                </button>

                {showContactInfo && (
                  <div className="more-actions">
                    <button className="more-action" onClick={handleWishlist}>
                      <span className="more-icon">{inWishlist ? '❤️' : '🤍'}</span>
                      <span>{inWishlist ? 'В избранном' : 'В избранное'}</span>
                    </button>
                    <button className="more-action" onClick={handleReport}>
                      <span className="more-icon">⚠️</span>
                      <span>Пожаловаться</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="safety-notes">
                <div className="safety-note">
                  <span className="note-icon">🔒</span>
                  <span className="note-text">Безопасная сделка</span>
                </div>
                <div className="safety-note note-warning">
                  <span className="note-icon">⚠️</span>
                  <span className="note-text">Не переводите деньги до осмотра</span>
                </div>
                <div className="safety-note note-id">
                  <span className="note-icon">📱</span>
                  <span className="note-text">ID: {item.id?.slice(-6) || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Полная галерея */}
      {showFullGallery && (
        <div className="gallery-modal" onClick={() => setShowFullGallery(false)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-modal-close" onClick={() => setShowFullGallery(false)}>
              ✕
            </button>
            <img src={currentImage} alt={item.title} className="gallery-modal-image" />
            {photos.length > 1 && (
              <>
                <button className="gallery-modal-nav modal-prev" onClick={prevImage}>
                  ←
                </button>
                <button className="gallery-modal-nav modal-next" onClick={nextImage}>
                  →
                </button>
              </>
            )}
            <div className="gallery-modal-counter">
              {selectedImageIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}