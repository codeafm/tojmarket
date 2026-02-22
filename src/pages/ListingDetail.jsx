import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getListing,
  listRecommendedByCategory,
  incrementListingViews,
} from "../firebase/listings.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserProfile } from "../firebase/users.js";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [actionFeedback, setActionFeedback] = useState({ show: false, action: "", success: false });

  const views = useMemo(() => item?.stats?.views ?? item?.views ?? 0, [item]);

  const createdLabel = useMemo(() => {
    const ts = item?.createdAt;
    const seconds = ts?.seconds;
    if (!seconds) return "";
    const d = new Date(seconds * 1000);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [item]);

  const formatPrice = useCallback((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("ru-RU");
  }, []);

  const formatPhone = useCallback((phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 12) {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "+$1 ($2) $3-$4-$5");
    } else if (cleaned.length === 11) {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 ($2) $3-$4-$5");
    }
    return phone;
  }, []);

  // Получение данных продавца
  const fetchSellerProfile = useCallback(async (sellerId) => {
    if (!sellerId) return;
    try {
      const profile = await getUserProfile(sellerId);
      setSellerProfile(profile);
    } catch (error) {
      console.error("Ошибка загрузки профиля продавца:", error);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const data = await getListing(id);

        if (!alive) return;

        if (!data) {
          setItem({ _missing: true });
          setSimilar([]);
          setCurrentImage(null);
          return;
        }

        setItem(data);
        setCurrentImage(data?.photos?.[0] || null);
        
        // Загружаем профиль продавца
        if (data.sellerId) {
          fetchSellerProfile(data.sellerId);
        }

        if (data?.category) {
          const sim = await listRecommendedByCategory(data.category, id, 8);
          if (!alive) return;
          setSimilar(sim || []);
        } else {
          setSimilar([]);
        }

        incrementListingViews(id);

        // Проверяем, есть ли в избранном
        if (user) {
          const wishlist = JSON.parse(localStorage.getItem(`wishlist_${user.uid}`) || "[]");
          setInWishlist(wishlist.includes(id));
        }
      } catch (e) {
        console.error(e);
        if (alive) setItem({ _error: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, user, fetchSellerProfile]);

  // Функция для показа уведомлений
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  }, []);

  // Функция для показа обратной связи о действии
  const showActionFeedback = useCallback((action, success = true) => {
    setActionFeedback({ show: true, action, success });
    setTimeout(() => setActionFeedback({ show: false, action: "", success: false }), 2000);
  }, []);

  // Навигация по изображениям
  const nextImage = useCallback(() => {
    if (!item?.photos?.length) return;
    const newIndex = (selectedImageIndex + 1) % item.photos.length;
    setSelectedImageIndex(newIndex);
    setCurrentImage(item.photos[newIndex]);
    showActionFeedback(`Фото ${newIndex + 1} из ${item.photos.length}`);
  }, [item?.photos, selectedImageIndex, showActionFeedback]);

  const prevImage = useCallback(() => {
    if (!item?.photos?.length) return;
    const newIndex = (selectedImageIndex - 1 + item.photos.length) % item.photos.length;
    setSelectedImageIndex(newIndex);
    setCurrentImage(item.photos[newIndex]);
    showActionFeedback(`Фото ${newIndex + 1} из ${item.photos.length}`);
  }, [item?.photos, selectedImageIndex, showActionFeedback]);

  // Обработчики кнопок
  const handleCall = useCallback(() => {
    const phone = sellerProfile?.phone || item?.sellerPhone;
    if (phone) {
      window.location.href = `tel:${phone.replace(/\D/g, "")}`;
      showNotification("success", `📞 Звонок на номер ${formatPhone(phone)}`);
      showActionFeedback("Звонок инициирован", true);
    } else {
      showNotification("error", "❌ Номер телефона не указан");
      showActionFeedback("Нет номера", false);
    }
  }, [sellerProfile, item, formatPhone, showNotification, showActionFeedback]);

  const handleWhatsApp = useCallback(() => {
    const phone = sellerProfile?.whatsapp || sellerProfile?.phone || item?.sellerPhone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
      showNotification("success", "💬 WhatsApp открыт в новой вкладке");
      showActionFeedback("WhatsApp открыт", true);
    } else {
      showNotification("error", "❌ Номер WhatsApp не указан");
      showActionFeedback("Нет WhatsApp", false);
    }
  }, [sellerProfile, item, showNotification, showActionFeedback]);

  const handleEmail = useCallback(() => {
    const email = sellerProfile?.email || item?.sellerEmail;
    if (email) {
      window.location.href = `mailto:${email}?subject=Вопрос по объявлению: ${item?.title}&body=Здравствуйте! Меня интересует ваше объявление: ${window.location.href}`;
      showNotification("success", `✉️ Email открыт для ${email}`);
      showActionFeedback("Email открыт", true);
    } else {
      showNotification("error", "❌ Email не указан");
      showActionFeedback("Нет email", false);
    }
  }, [sellerProfile, item, showNotification, showActionFeedback]);

  const handleWishlist = useCallback(() => {
    if (!user) {
      showNotification("warning", "⚠️ Войдите, чтобы добавлять в избранное");
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
      showActionFeedback("Удалено из избранного", true);
    } else {
      wishlist.push(id);
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
      setInWishlist(true);
      showNotification("success", "❤️ Добавлено в избранное");
      showActionFeedback("Добавлено в избранное", true);
    }
  }, [user, inWishlist, id, navigate, showNotification, showActionFeedback]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: item?.title,
        text: item?.description,
        url: window.location.href,
      }).then(() => {
        showNotification("success", "📤 Поделились успешно!");
        showActionFeedback("Поделились", true);
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        showNotification("success", "📋 Ссылка скопирована в буфер обмена");
        showActionFeedback("Ссылка скопирована", true);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification("success", "📋 Ссылка скопирована в буфер обмена");
      showActionFeedback("Ссылка скопирована", true);
    }
  }, [item, showNotification, showActionFeedback]);

  const handleContactSeller = useCallback(() => {
    if (user) {
      navigate(`/chat?seller=${item?.sellerId}&listing=${id}`);
      showNotification("success", "💭 Чат открыт");
      showActionFeedback("Чат открыт", true);
    } else {
      showNotification("warning", "⚠️ Войдите, чтобы написать продавцу");
      showActionFeedback("Требуется вход", false);
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [user, item, id, navigate, showNotification, showActionFeedback]);

  const handleViewSeller = useCallback(() => {
    if (item?.sellerId) {
      navigate(`/user/${item.sellerId}`);
      showNotification("success", "👤 Профиль продавца открыт");
      showActionFeedback("Профиль открыт", true);
    } else {
      showNotification("error", "❌ Информация о продавце недоступна");
      showActionFeedback("Нет данных", false);
    }
  }, [item, navigate, showNotification, showActionFeedback]);

  const handleFavorite = useCallback(() => {
    if (!user) {
      showNotification("warning", "⚠️ Войдите, чтобы добавить в избранное");
      showActionFeedback("Требуется вход", false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    setIsFavorite(!isFavorite);
    const message = isFavorite ? "Удалено из избранного" : "Добавлено в избранное";
    showNotification(isFavorite ? "error" : "success", `❤️ ${message}`);
    showActionFeedback(message, !isFavorite);
  }, [user, isFavorite, navigate, showNotification, showActionFeedback]);

  const handleReport = useCallback(() => {
    showNotification("success", "⚠️ Жалоба отправлена модератору");
    showActionFeedback("Жалоба отправлена", true);
  }, [showNotification, showActionFeedback]);

  const handleImageZoom = useCallback((e) => {
    if (!zoomImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  }, [zoomImage]);

  if (loading) {
    return (
      <div className="loading-state fade-in">
        <div className="loading-spinner" />
        <p className="slide-up">Загружаем объявление...</p>
      </div>
    );
  }

  if (!item) return <div className="empty-state fade-in">Загрузка…</div>;
  if (item._missing) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-icon bounce">🔍</div>
        <h3 className="slide-up">Объявление не найдено</h3>
        <p className="slide-up">Возможно, оно было удалено или никогда не существовало</p>
        <Link to="/listings" className="btnPrimary slide-up">Вернуться к списку</Link>
      </div>
    );
  }
  if (item._error) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-icon shake">⚠️</div>
        <h3 className="slide-up">Ошибка загрузки</h3>
        <p className="slide-up">Не удалось загрузить объявление. Попробуйте позже</p>
        <button onClick={() => window.location.reload()} className="btnPrimary slide-up">
          Обновить
        </button>
      </div>
    );
  }

  const plan = String(item.plan || "base").toLowerCase();
  const photos = item.photos || [];
  const hasSpecs = item.attrs && Object.keys(item.attrs).length > 0;

  return (
    <div className="listing-detail-page fade-in">
      {/* Уведомления в правом верхнем углу */}
      {notification.show && (
        <div className={`notification ${notification.type} slide-in-right`}>
          <span className="notification-icon">
            {notification.type === "success" ? "✅" : 
             notification.type === "error" ? "❌" : 
             notification.type === "warning" ? "⚠️" : "ℹ️"}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      {/* Временная обратная связь на кнопке */}
      {actionFeedback.show && (
        <div className={`action-feedback ${actionFeedback.success ? 'success' : 'error'} slide-up`}>
          <span className="feedback-icon">
            {actionFeedback.success ? '✓' : '✗'}
          </span>
          <span className="feedback-message">{actionFeedback.action}</span>
        </div>
      )}

      {/* Верхняя навигация */}
      <div className="detail-navigation slide-in-right">
        <button onClick={() => navigate(-1)} className="btnGhost hover-lift">
          ← Назад
        </button>
        <div className="detail-breadcrumbs muted small">
          <Link to={`/category/${item.category}`} className="breadcrumb-link hover-underline">
            {item.category || "—"}
          </Link>
          <span className="separator">•</span>
          <span className="hover-lift">{item.city || "—"}</span>
          {createdLabel && (
            <>
              <span className="separator">•</span>
              <span>{createdLabel}</span>
            </>
          )}
          <span className="separator">•</span>
          <span className="views-count pulse">
            <span className="views-icon">👁</span> {views.toLocaleString()}
          </span>
        </div>
        <div className="detail-actions">
          <button onClick={handleShare} className="btn-icon iconBtn hover-scale" title="Поделиться">
            📤
          </button>
          <button onClick={handleFavorite} className="btn-icon iconBtn hover-scale" title="В избранное">
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </div>

      <div className="detail-layout">
        {/* Левая колонка - основная информация */}
        <div className="detail-main">
          {/* Галерея */}
          <div className="card gallery-card slide-in-right" style={{ animationDelay: '0.1s' }}>
            <div 
              className="gallery-main" 
              onMouseMove={handleImageZoom}
              onMouseLeave={() => setZoomImage(false)}
            >
              {currentImage ? (
                <div className={`image-zoom-container ${zoomImage ? 'zoomed' : ''}`}>
                  <img 
                    src={currentImage} 
                    alt={item.title || "Фото"} 
                    onClick={() => setShowFullGallery(true)}
                    className={`gallery-main-image ${zoomImage ? 'zoomed' : ''}`}
                    style={zoomImage ? {
                      transform: `scale(2)`,
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`
                    } : {}}
                    onMouseEnter={() => setZoomImage(true)}
                  />
                </div>
              ) : (
                <div className="gallery-placeholder">
                  <span className="bounce">📷</span>
                  <p>Нет фото</p>
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button className="gallery-nav prev hover-scale" onClick={prevImage}>
                    ←
                  </button>
                  <button className="gallery-nav next hover-scale" onClick={nextImage}>
                    →
                  </button>
                </>
              )}

              <span className={`badge-plan ${plan} slide-in-left`}>
                {plan === "vip" ? "VIP" : plan === "top" ? "TOP" : "Базовый"}
              </span>
            </div>

            {photos.length > 1 && (
              <div className="gallery-thumbs fade-in">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    className={`gallery-thumb hover-scale ${index === selectedImageIndex ? "active" : ""}`}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setCurrentImage(photo);
                    }}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <img src={photo} alt={`Фото ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Информация о товаре */}
          <div className="card detail-info slide-in-right" style={{ animationDelay: '0.2s' }}>
            <div className="detail-header">
              <h1 className="detail-title gradient-text">{item.title || "—"}</h1>
            </div>

            <div className="detail-price-section">
              <div className="detail-price pulse-slow">{formatPrice(item.price)} TJS</div>
              <div className="detail-meta">
                <span className="meta-chip hover-lift">📍 {item.city || "—"}</span>
                <span className="meta-chip hover-lift">📦 {item.category || "—"}</span>
              </div>
            </div>

            <div className="divider" />

            {/* Информация о продавце */}
            <div className="detail-section seller-info">
              <h3 className="section-title">Продавец</h3>
              <div className="seller-card hover-lift">
                <div className="seller-avatar" onClick={handleViewSeller}>
                  {sellerProfile?.name?.[0] || item.sellerName?.[0] || "?"}
                </div>
                <div className="seller-details">
                  <h4 onClick={handleViewSeller} className="seller-name hover-underline">
                    {sellerProfile?.name || item.sellerName || "Продавец"}
                  </h4>
                  {sellerProfile?.verified && (
                    <span className="verified-badge pulse">✓ Проверенный продавец</span>
                  )}
                </div>
                <button className="btn-secondary btn-sm hover-lift" onClick={handleViewSeller}>
                  Профиль
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* Описание */}
            <div className="detail-section">
              <h3 className="section-title">Описание</h3>
              {item.description ? (
                <div className="detail-description fade-in">{item.description}</div>
              ) : (
                <p className="muted">Описание отсутствует</p>
              )}
            </div>

            {/* Характеристики */}
            {hasSpecs && (
              <>
                <div className="divider" />
                <div className="detail-section">
                  <h3 className="section-title">Характеристики</h3>
                  <div className="specs-grid">
                    {Object.entries(item.attrs)
                      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
                      .map(([key, value], index) => (
                        <div className="spec-item hover-lift" key={key} style={{ animationDelay: `${index * 0.1}s` }}>
                          <span className="spec-key">{key}</span>
                          <span className="spec-value">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Похожие объявления */}
          <div className="card similar-section slide-in-right" style={{ animationDelay: '0.3s' }}>
            <div className="similar-header">
              <h3 className="section-title">Похожие объявления</h3>
              <Link to="/listings" className="btnGhost hover-lift">
                Смотреть все →
              </Link>
            </div>

            {similar.length === 0 ? (
              <div className="empty-state small">
                <p className="muted">Нет похожих объявлений</p>
              </div>
            ) : (
              <div className="similar-grid">
                {similar.map((x, index) => {
                  const xViews = x?.stats?.views ?? x?.views ?? 0;
                  const xPlan = String(x.plan || "base").toLowerCase();
                  
                  return (
                    <Link 
                      key={x.id} 
                      to={`/listing/${x.id}`} 
                      className="similar-card hover-lift"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="similar-image">
                        {x.photos?.[0] ? (
                          <img src={x.photos[0]} alt={x.title || ""} />
                        ) : (
                          <div className="image-placeholder">📷</div>
                        )}
                        {xPlan !== "base" && (
                          <span className={`badge-mini ${xPlan}`}>
                            {xPlan === "vip" ? "VIP" : "TOP"}
                          </span>
                        )}
                      </div>
                      <div className="similar-content">
                        <h4 className="similar-title">{x.title || "—"}</h4>
                        <p className="similar-price">{formatPrice(x.price)} TJS</p>
                        <div className="similar-meta">
                          <span>{x.city || "—"}</span>
                          <span>👁 {xViews}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - контакты и действия */}
        <aside className="detail-sidebar">
          <div className="card contact-card sticky slide-in-left" style={{ animationDelay: '0.2s' }}>
            <div className="contact-header">
              <div>
                <div className="muted small">Цена</div>
                <div className="contact-price pulse-slow">{formatPrice(item.price)} TJS</div>
              </div>
              <span className={`badge-plan ${plan} slide-in-right`}>
                {plan === "vip" ? "VIP" : plan === "top" ? "TOP" : "Базовый"}
              </span>
            </div>

            <div className="divider" />

            <div className="contact-stats">
              <div className="stat-row hover-lift" onClick={() => navigate(`/city/${item.city}`)}>
                <span className="muted">📍 Город</span>
                <span className="stat-value clickable">{item.city || "—"}</span>
              </div>
              <div className="stat-row hover-lift" onClick={() => navigate(`/category/${item.category}`)}>
                <span className="muted">📦 Категория</span>
                <span className="stat-value clickable">{item.category || "—"}</span>
              </div>
              <div className="stat-row">
                <span className="muted">👁 Просмотры</span>
                <span className="stat-value">{views.toLocaleString()}</span>
              </div>
              {createdLabel && (
                <div className="stat-row">
                  <span className="muted">📅 Опубликовано</span>
                  <span className="stat-value">{createdLabel}</span>
                </div>
              )}
            </div>

            <div className="divider" />

            {/* Контактные кнопки с визуальной обратной связью */}
            <div className="contact-actions">
              <button 
                className="btnPrimary contact-btn hover-lift" 
                type="button" 
                onClick={handleCall}
                onMouseDown={(e) => e.currentTarget.classList.add('pressed')}
                onMouseUp={(e) => e.currentTarget.classList.remove('pressed')}
                onMouseLeave={(e) => e.currentTarget.classList.remove('pressed')}
              >
                <span className="btn-icon pulse">📞</span>
                Позвонить
              </button>
              
              <button 
                className="btn-success contact-btn hover-lift" 
                type="button" 
                onClick={handleWhatsApp}
                onMouseDown={(e) => e.currentTarget.classList.add('pressed')}
                onMouseUp={(e) => e.currentTarget.classList.remove('pressed')}
                onMouseLeave={(e) => e.currentTarget.classList.remove('pressed')}
              >
                <span className="btn-icon pulse">💬</span>
                WhatsApp
              </button>
              
              <button 
                className="btn-secondary contact-btn hover-lift" 
                type="button" 
                onClick={handleEmail}
                onMouseDown={(e) => e.currentTarget.classList.add('pressed')}
                onMouseUp={(e) => e.currentTarget.classList.remove('pressed')}
                onMouseLeave={(e) => e.currentTarget.classList.remove('pressed')}
              >
                <span className="btn-icon pulse">✉️</span>
                Написать
              </button>
              
              {/* Дополнительные контакты (показываются по клику) */}
              {!showContactInfo ? (
                <button 
                  className="btn-ghost contact-btn hover-lift" 
                  type="button" 
                  onClick={() => setShowContactInfo(true)}
                >
                  <span className="btn-icon">🔽</span>
                  Показать все контакты
                </button>
              ) : (
                <>
                  <button 
                    className="btn-ghost contact-btn hover-lift" 
                    type="button" 
                    onClick={handleViewSeller}
                  >
                    <span className="btn-icon">👤</span>
                    Профиль продавца
                  </button>
                  
                  <button 
                    className={`btn-ghost contact-btn ${inWishlist ? 'active' : ''} hover-lift`} 
                    type="button" 
                    onClick={handleWishlist}
                  >
                    <span className="btn-icon pulse">{inWishlist ? '❤️' : '🤍'}</span>
                    {inWishlist ? 'В избранном' : 'В избранное'}
                  </button>
                  
                  <button 
                    className="btn-secondary contact-btn hover-lift" 
                    type="button" 
                    onClick={handleContactSeller}
                  >
                    <span className="btn-icon">💭</span>
                    Чат с продавцом
                  </button>
                  
                  <button 
                    className="btn-ghost contact-btn hover-lift" 
                    type="button" 
                    onClick={handleReport}
                  >
                    <span className="btn-icon">⚠️</span>
                    Пожаловаться
                  </button>
                  
                  <button 
                    className="btn-ghost contact-btn hover-lift" 
                    type="button" 
                    onClick={() => setShowContactInfo(false)}
                  >
                    <span className="btn-icon">🔼</span>
                    Скрыть
                  </button>
                </>
              )}
            </div>

            {/* Информация о безопасности */}
            <div className="contact-note muted small fade-in">
              <p className="hover-lift">🔒 Безопасная сделка</p>
              <p className="hover-lift">⚠️ Не переводите деньги до осмотра товара</p>
              <p className="hover-lift">📱 ID: {item.id?.slice(-6) || "—"}</p>
              {sellerProfile?.rating && (
                <p className="hover-lift">⭐ Рейтинг продавца: {sellerProfile.rating.toFixed(1)}</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Модальное окно полной галереи */}
      {showFullGallery && (
        <div className="modal-overlay fade-in" onClick={() => setShowFullGallery(false)}>
          <div className="full-gallery slide-up" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-close hover-scale" onClick={() => setShowFullGallery(false)}>
              ✕
            </button>
            <div className="full-gallery-content">
              <img 
                src={currentImage} 
                alt={item.title} 
                className="fade-in"
              />
              {photos.length > 1 && (
                <>
                  <button className="gallery-nav-large prev hover-scale" onClick={prevImage}>
                    ←
                  </button>
                  <button className="gallery-nav-large next hover-scale" onClick={nextImage}>
                    →
                  </button>
                </>
              )}
            </div>
            <div className="full-gallery-counter fade-in">
              {selectedImageIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}