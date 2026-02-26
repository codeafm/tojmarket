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
  }, []);

  const getCleanPhone = useCallback((phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  }, []);

  // Получение данных продавца
  const fetchSellerProfile = useCallback(async (sellerId) => {
    if (!sellerId) return null;
    
    try {
      console.log("Загружаем профиль продавца с ID:", sellerId);
      
      const profile = await getUserProfile(sellerId);
      
      if (profile) {
        console.log("Профиль загружен через getUserProfile:", profile);
        setSellerProfile(profile);
        return profile;
      }
      
      const sellerRef = doc(db, "users", sellerId);
      const sellerSnap = await getDoc(sellerRef);
      
      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        console.log("Профиль загружен прямым запросом:", sellerData);
        
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
      }
      return null;
    } catch (error) {
      console.error("Ошибка загрузки профиля продавца:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
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
        
        // Загружаем профиль продавца
        const sellerId = data.ownerId || data.ownerUid || data.sellerId;
        console.log("sellerId для загрузки:", sellerId);
        
        if (sellerId) {
          await fetchSellerProfile(sellerId);
        } else {
          console.log("Нет sellerId, используем данные из объявления");
          setSellerProfile({
            name: data.ownerName || data.sellerName || "Продавец",
            phone: data.ownerPhone || data.sellerPhone || "",
            whatsapp: data.ownerWhatsApp || data.sellerWhatsApp || data.ownerPhone || data.sellerPhone || "",
            email: data.ownerEmail || data.sellerEmail || "",
            verified: false
          });
        }

        if (data?.category) {
          const sim = await listRecommendedByCategory(data.category, id, 8);
          if (!alive) return;
          setSimilar(sim || []);
        } else {
          setSimilar([]);
        }

        await incrementListingViews(id);

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

  // Функция для показа обратной связи
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
  }, [item?.photos, selectedImageIndex]);

  const prevImage = useCallback(() => {
    if (!item?.photos?.length) return;
    const newIndex = (selectedImageIndex - 1 + item.photos.length) % item.photos.length;
    setSelectedImageIndex(newIndex);
    setCurrentImage(item.photos[newIndex]);
  }, [item?.photos, selectedImageIndex]);

  // Обработчики кнопок с улучшенной проверкой
  const handleCall = useCallback(() => {
    console.log("handleCall - sellerProfile:", sellerProfile);
    
    const phone = sellerProfile?.phone || item?.ownerPhone || item?.sellerPhone || "";
    
    console.log("Телефон для звонка:", phone);
    
    if (phone && phone.trim() !== "") {
      const cleanPhone = getCleanPhone(phone);
      if (cleanPhone && cleanPhone.length >= 10) {
        try {
          window.location.href = `tel:${cleanPhone}`;
          showNotification("success", `📞 Звонок на ${formatPhone(phone)}`);
          showActionFeedback("Звонок инициирован", true);
        } catch (error) {
          console.error("Ошибка при звонке:", error);
          showNotification("error", "❌ Не удалось совершить звонок");
          showActionFeedback("Ошибка", false);
        }
      } else {
        showNotification("error", "❌ Некорректный номер");
        showActionFeedback("Ошибка", false);
      }
    } else {
      showNotification("error", "❌ Номер не указан");
      showActionFeedback("Нет номера", false);
    }
  }, [sellerProfile, item, formatPhone, getCleanPhone, showNotification, showActionFeedback]);

  const handleWhatsApp = useCallback(() => {
    console.log("handleWhatsApp - sellerProfile:", sellerProfile);
    
    const phone = sellerProfile?.whatsapp || sellerProfile?.phone || item?.ownerPhone || item?.sellerPhone || "";
    
    console.log("WhatsApp номер:", phone);
    
    if (phone && phone.trim() !== "") {
      const cleanPhone = getCleanPhone(phone);
      if (cleanPhone && cleanPhone.length >= 10) {
        try {
          // Пробуем открыть WhatsApp разными способами
          const waUrl = `https://wa.me/${cleanPhone}`;
          const waIntent = `whatsapp://send?phone=${cleanPhone}`;
          
          // Сначала пробуем открыть приложение
          const win = window.open(waIntent, "_blank");
          
          // Если не получилось, открываем веб-версию
          if (!win || win.closed || typeof win.closed === 'undefined') {
            setTimeout(() => {
              window.open(waUrl, "_blank");
            }, 100);
          }
          
          showNotification("success", "💬 WhatsApp открыт");
          showActionFeedback("WhatsApp открыт", true);
        } catch (error) {
          console.error("Ошибка при открытии WhatsApp:", error);
          window.open(`https://wa.me/${cleanPhone}`, "_blank");
          showNotification("success", "💬 WhatsApp открыт в браузере");
          showActionFeedback("WhatsApp открыт", true);
        }
      } else {
        showNotification("error", "❌ Некорректный номер");
        showActionFeedback("Ошибка", false);
      }
    } else {
      showNotification("error", "❌ WhatsApp не указан");
      showActionFeedback("Нет WhatsApp", false);
    }
  }, [sellerProfile, item, getCleanPhone, showNotification, showActionFeedback]);

  const handleEmail = useCallback(() => {
    console.log("handleEmail - sellerProfile:", sellerProfile);
    
    const email = sellerProfile?.email || item?.ownerEmail || item?.sellerEmail || "";
    
    console.log("Email:", email);
    
    if (email && email.trim() !== "" && email.includes('@')) {
      try {
        const subject = encodeURIComponent(`Вопрос по объявлению: ${item?.title || "Объявление"}`);
        const body = encodeURIComponent(
          `Здравствуйте! Меня интересует ваше объявление:\n\n${window.location.href}\n\nСпасибо!`
        );
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        showNotification("success", `✉️ Email: ${email}`);
        showActionFeedback("Email открыт", true);
      } catch (error) {
        console.error("Ошибка при открытии email:", error);
        showNotification("error", "❌ Не удалось открыть почтовый клиент");
        showActionFeedback("Ошибка", false);
      }
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
    const shareData = {
      title: item?.title || "Объявление на TojMarket",
      text: item?.description || "Посмотрите это объявление",
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          showNotification("success", "📤 Поделились успешно!");
          showActionFeedback("Поделились", true);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error("Ошибка при шаринге:", error);
            copyToClipboard();
          }
        });
    } else {
      copyToClipboard();
    }

    function copyToClipboard() {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          showNotification("success", "📋 Ссылка скопирована");
          showActionFeedback("Ссылка скопирована", true);
        })
        .catch(() => {
          showNotification("error", "❌ Не удалось скопировать ссылку");
          showActionFeedback("Ошибка", false);
        });
    }
  }, [item, showNotification, showActionFeedback]);

  const handleContactSeller = useCallback(() => {
    const sellerId = item?.ownerId || item?.ownerUid || item?.sellerId;
    
    if (!user) {
      showNotification("warning", "⚠️ Войдите в аккаунт");
      showActionFeedback("Требуется вход", false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    
    if (sellerId) {
      navigate(`/chat?seller=${sellerId}&listing=${id}`);
      showNotification("success", "💭 Чат открыт");
      showActionFeedback("Чат открыт", true);
    } else {
      showNotification("error", "❌ Информация о продавце недоступна");
      showActionFeedback("Ошибка", false);
    }
  }, [user, item, id, navigate, showNotification, showActionFeedback]);

  const handleViewSeller = useCallback(() => {
    const sellerId = item?.ownerId || item?.ownerUid || item?.sellerId;
    
    if (sellerId) {
      navigate(`/user/${sellerId}`);
      showNotification("success", "👤 Профиль продавца открыт");
      showActionFeedback("Профиль открыт", true);
    } else {
      showNotification("error", "❌ Информация о продавце недоступна");
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

  const hasPhone = !!(sellerProfile?.phone || item?.ownerPhone || item?.sellerPhone);
  const hasWhatsApp = !!(sellerProfile?.whatsapp || sellerProfile?.phone || item?.ownerPhone || item?.sellerPhone);
  const hasEmail = !!(sellerProfile?.email || item?.ownerEmail || item?.sellerEmail);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Загружаем объявление...</p>
      </div>
    );
  }

  if (!item) return <div className="empty-state">Загрузка…</div>;
  if (item._missing) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>Объявление не найдено</h3>
        <p>Возможно, оно было удалено или никогда не существовало</p>
        <Link to="/listings" className="btnPrimary">Вернуться к списку</Link>
      </div>
    );
  }
  if (item._error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Ошибка загрузки</h3>
        <p>Не удалось загрузить объявление. Попробуйте позже</p>
        <button onClick={() => window.location.reload()} className="btnPrimary">
          Обновить
        </button>
      </div>
    );
  }

  const plan = String(item.plan || "base").toLowerCase();
  const photos = item.photos || [];
  const hasSpecs = item.attrs && Object.keys(item.attrs).length > 0;

  return (
    <div className="listing-detail-page">
      {/* Уведомления */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
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
        <div className={`action-feedback ${actionFeedback.success ? 'success' : 'error'}`}>
          <span className="feedback-icon">{actionFeedback.success ? '✓' : '✗'}</span>
          <span className="feedback-message">{actionFeedback.action}</span>
        </div>
      )}

      {/* Верхняя навигация */}
      <div className="detail-navigation">
        <button onClick={() => navigate(-1)} className="btnGhost">
          ← Назад
        </button>
        <div className="detail-breadcrumbs muted small">
          <Link to={`/category/${item.category}`} className="breadcrumb-link">
            {item.category || "—"}
          </Link>
          <span className="separator">•</span>
          <span>{item.city || "—"}</span>
          {createdLabel && (
            <>
              <span className="separator">•</span>
              <span>{createdLabel}</span>
            </>
          )}
          <span className="separator">•</span>
          <span className="views-count">👁 {views.toLocaleString()}</span>
        </div>
        <div className="detail-actions">
          <button onClick={handleShare} className="btn-icon iconBtn" title="Поделиться">
            📤
          </button>
        </div>
      </div>

      <div className="detail-layout">
        {/* Левая колонка - основная информация */}
        <div className="detail-main">
          {/* Галерея */}
          <div className="card gallery-card">
            <div className="gallery-main">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={item.title || "Фото"} 
                  onClick={() => setShowFullGallery(true)}
                  className="gallery-main-image"
                />
              ) : (
                <div className="gallery-placeholder">
                  <span>📷</span>
                  <p>Нет фото</p>
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={prevImage}>
                    ←
                  </button>
                  <button className="gallery-nav next" onClick={nextImage}>
                    →
                  </button>
                </>
              )}

              <span className={`badge-plan ${plan}`}>
                {plan === "vip" ? "VIP" : plan === "top" ? "TOP" : "Базовый"}
              </span>
            </div>

            {photos.length > 1 && (
              <div className="gallery-thumbs">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    className={`gallery-thumb ${index === selectedImageIndex ? "active" : ""}`}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setCurrentImage(photo);
                    }}
                  >
                    <img src={photo} alt={`Фото ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Информация о товаре */}
          <div className="card detail-info">
            <div className="detail-header">
              <h1 className="detail-title">{item.title || "—"}</h1>
            </div>

            <div className="detail-price-section">
              <div className="detail-price">{formatPrice(item.price)} TJS</div>
              <div className="detail-meta">
                <span className="meta-chip">📍 {item.city || "—"}</span>
                <span className="meta-chip">📦 {item.category || "—"}</span>
              </div>
            </div>

            <div className="divider" />

            {/* Информация о продавце */}
            <div className="detail-section seller-info">
              <h3 className="section-title">Продавец</h3>
              <div className="seller-card">
                <div className="seller-avatar" onClick={handleViewSeller}>
                  {sellerProfile?.name?.[0] || item.ownerName?.[0] || item.sellerName?.[0] || "?"}
                </div>
                <div className="seller-details">
                  <h4 onClick={handleViewSeller} className="seller-name">
                    {sellerProfile?.name || item.ownerName || item.sellerName || "Продавец"}
                  </h4>
                  {sellerProfile?.verified && (
                    <span className="verified-badge">✓ Проверенный продавец</span>
                  )}
                  {hasPhone && (
                    <span className="seller-phone small" onClick={handleCall}>
                      📞 {formatPhone(sellerProfile?.phone || item?.ownerPhone || item?.sellerPhone)}
                    </span>
                  )}
                </div>
                <button className="btn-secondary btn-sm" onClick={handleViewSeller}>
                  Профиль
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* Описание */}
            <div className="detail-section">
              <h3 className="section-title">Описание</h3>
              {item.description ? (
                <div className="detail-description">{item.description}</div>
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
          </div>

          {/* Похожие объявления */}
          <div className="card similar-section">
            <div className="similar-header">
              <h3 className="section-title">Похожие объявления</h3>
              <Link to="/listings" className="btnGhost">
                Смотреть все →
              </Link>
            </div>

            {similar.length === 0 ? (
              <div className="empty-state small">
                <p className="muted">Нет похожих объявлений</p>
              </div>
            ) : (
              <div className="similar-grid">
                {similar.map((x) => {
                  const xViews = x?.stats?.views ?? x?.views ?? 0;
                  const xPlan = String(x.plan || "base").toLowerCase();
                  
                  return (
                    <Link key={x.id} to={`/listing/${x.id}`} className="similar-card">
                      <div className="similar-image">
                        {x.photos?.[0] ? (
                          <img src={x.photos[0]} alt={x.title || ""} />
                        ) : (
                          <div className="image-placeholder">📷</div>
                        )}
                        <span className={`badge-mini ${xPlan}`}>
                          {xPlan === "vip" ? "VIP" : xPlan === "top" ? "TOP" : ""}
                        </span>
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
          <div className="card contact-card sticky">
            <div className="contact-header">
              <div>
                <div className="muted small">Цена</div>
                <div className="contact-price">{formatPrice(item.price)} TJS</div>
              </div>
              <span className={`badge-plan ${plan}`}>
                {plan === "vip" ? "VIP" : plan === "top" ? "TOP" : "Базовый"}
              </span>
            </div>

            <div className="divider" />

            <div className="contact-stats">
              <div className="stat-row" onClick={() => navigate(`/city/${item.city}`)}>
                <span className="muted">📍 Город</span>
                <span className="stat-value clickable">{item.city || "—"}</span>
              </div>
              <div className="stat-row" onClick={() => navigate(`/category/${item.category}`)}>
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

            {/* Контактные кнопки с отображением номеров */}
            <div className="contact-actions">
              {hasPhone ? (
                <button className="btnPrimary contact-btn" type="button" onClick={handleCall}>
                  <span className="btn-icon">📞</span>
                  <div className="contact-btn-content">
                    <span>Позвонить</span>
                    <span className="contact-number">
                      {formatPhone(sellerProfile?.phone || item?.ownerPhone || item?.sellerPhone)}
                    </span>
                  </div>
                </button>
              ) : (
                <button className="btnPrimary contact-btn" type="button" disabled style={{ opacity: 0.6 }}>
                  <span className="btn-icon">📞</span>
                  <div className="contact-btn-content">
                    <span>Позвонить</span>
                    <span className="contact-number">Нет номера</span>
                  </div>
                </button>
              )}

              {hasWhatsApp ? (
                <button className="btn-success contact-btn" type="button" onClick={handleWhatsApp}>
                  <span className="btn-icon">💬</span>
                  <div className="contact-btn-content">
                    <span>WhatsApp</span>
                    <span className="contact-number">
                      {formatPhone(sellerProfile?.whatsapp || sellerProfile?.phone || item?.ownerPhone || item?.sellerPhone)}
                    </span>
                  </div>
                </button>
              ) : (
                <button className="btn-success contact-btn" type="button" disabled style={{ opacity: 0.6 }}>
                  <span className="btn-icon">💬</span>
                  <div className="contact-btn-content">
                    <span>WhatsApp</span>
                    <span className="contact-number">Нет WhatsApp</span>
                  </div>
                </button>
              )}

              {hasEmail ? (
                <button className="btn-secondary contact-btn" type="button" onClick={handleEmail}>
                  <span className="btn-icon">✉️</span>
                  <div className="contact-btn-content">
                    <span>Написать</span>
                    <span className="contact-number">{sellerProfile?.email || item?.ownerEmail || item?.sellerEmail}</span>
                  </div>
                </button>
              ) : (
                <button className="btn-secondary contact-btn" type="button" disabled style={{ opacity: 0.6 }}>
                  <span className="btn-icon">✉️</span>
                  <div className="contact-btn-content">
                    <span>Написать</span>
                    <span className="contact-number">Нет email</span>
                  </div>
                </button>
              )}
              
              {/* Кнопка для показа всех контактов */}
              <button 
                className="btn-ghost contact-btn" 
                type="button" 
                onClick={handleShowAllContacts}
              >
                <span className="btn-icon">📋</span>
                <div className="contact-btn-content">
                  <span>Все контакты</span>
                  <span className="contact-number">
                    {hasPhone && "📞 "}
                    {hasWhatsApp && "💬 "}
                    {hasEmail && "✉️"}
                  </span>
                </div>
              </button>

              {showContactInfo && (
                <>
                  <button className="btn-ghost contact-btn" type="button" onClick={handleWishlist}>
                    <span className="btn-icon">{inWishlist ? '❤️' : '🤍'}</span>
                    {inWishlist ? 'В избранном' : 'В избранное'}
                  </button>
                  
                  <button className="btn-secondary contact-btn" type="button" onClick={handleContactSeller}>
                    <span className="btn-icon">💭</span>
                    Чат с продавцом
                  </button>
                  
                  <button className="btn-ghost contact-btn" type="button" onClick={handleReport}>
                    <span className="btn-icon">⚠️</span>
                    Пожаловаться
                  </button>
                </>
              )}
            </div>

            <div className="contact-note muted small">
              <p>🔒 Безопасная сделка</p>
              <p>⚠️ Не переводите деньги до осмотра товара</p>
              <p>📱 ID: {item.id?.slice(-6) || "—"}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Модальное окно полной галереи */}
      {showFullGallery && (
        <div className="modal-overlay" onClick={() => setShowFullGallery(false)}>
          <div className="full-gallery" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-close" onClick={() => setShowFullGallery(false)}>
              ✕
            </button>
            <div className="full-gallery-content">
              <img src={currentImage} alt={item.title} />
              {photos.length > 1 && (
                <>
                  <button className="gallery-nav-large prev" onClick={prevImage}>
                    ←
                  </button>
                  <button className="gallery-nav-large next" onClick={nextImage}>
                    →
                  </button>
                </>
              )}
            </div>
            <div className="full-gallery-counter">
              {selectedImageIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}