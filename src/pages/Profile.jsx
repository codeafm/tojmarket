import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserProfile, updateUserProfile, listUserListings } from "../firebase/users.js";
import { updateListingByOwner, deleteListingByOwner } from "../firebase/listings.js";
import "./Profile.css"; // Только этот CSS файл

function digitsOnly(s = "") {
  return String(s).replace(/\D/g, "");
}

function formatPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("ru-RU");
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

// Категории для выбора
const CATEGORIES = [
  "Недвижимость",
  "Транспорт",
  "Работа",
  "Услуги",
  "Электроника",
  "Одежда",
  "Животные",
  "Для дома и дачи",
  "Спорт и отдых",
  "Другое"
];

// Города Таджикистана
const CITIES = [
  "Душанбе",
  "Худжанд",
  "Куляб",
  "Курган-Тюбе",
  "Истаравшан",
  "Канибадам",
  "Пенджикент",
  "Хорог",
  "Турсунзаде",
  "Другие"
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");
  
  const [sortBy, setSortBy] = useState("newest");
  const [filterPlan, setFilterPlan] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  // Состояние для редактирования объявления
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Состояние для редактирования профиля
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    city: "",
    telegram: "",
    instagram: "",
    description: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  async function load() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const p = await getUserProfile(user.uid);
      setProfile(p);
      
      // Заполняем форму профиля при загрузке
      if (p) {
        setProfileForm({
          name: p.name || "",
          phone: p.phone || "",
          whatsapp: p.whatsapp || "",
          city: p.city || "",
          telegram: p.telegram || "",
          instagram: p.instagram || "",
          description: p.description || ""
        });
      }

      const items = await listUserListings(user.uid, user.email, 200);
      setMyListings(items);
    } catch (error) {
      console.error("Error loading profile:", error);
      showNotification("error", "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.uid]);

  function showNotification(type, message) {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  }

  const wa = digitsOnly(profile?.whatsapp || profile?.phone || "");
  const tel = digitsOnly(profile?.phone || profile?.whatsapp || "");

  const stats = useMemo(() => ({
    total: myListings.length,
    vip: myListings.filter(x => x.plan === 'vip').length,
    top: myListings.filter(x => x.plan === 'top').length,
    views: myListings.reduce((sum, x) => sum + (x.views || 0), 0),
    totalPrice: myListings.reduce((sum, x) => sum + (x.price || 0), 0),
    activeListings: myListings.filter(x => x.status !== 'archived').length,
    avgPrice: myListings.length > 0 
      ? Math.round(myListings.reduce((sum, x) => sum + (x.price || 0), 0) / myListings.length) 
      : 0
  }), [myListings]);

  const filteredListings = useMemo(() => {
    let filtered = [...myListings];

    if (filterPlan !== "all") {
      filtered = filtered.filter(x => x.plan === filterPlan);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case "oldest":
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        case "price_asc":
          return (a.price || 0) - (b.price || 0);
        case "price_desc":
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [myListings, filterPlan, sortBy]);

  // Валидация формы объявления
  function validateEditForm() {
    const errors = {};
    if (!editItem.title?.trim()) errors.title = "Введите название";
    if (!editItem.category) errors.category = "Выберите категорию";
    if (!editItem.city) errors.city = "Выберите город";
    if (!editItem.price || editItem.price < 1) errors.price = "Введите корректную цену";
    if (!editItem.description?.trim()) errors.description = "Введите описание";
    
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openEdit(item) {
    setEditItem({
      id: item.id,
      title: item.title || "",
      category: item.category || "",
      city: item.city || "",
      price: item.price ?? 0,
      plan: item.plan || "base",
      description: item.description || "",
      spec: item.spec || item.attrs || {},
      images: item.images || []
    });
    setEditErrors({});
    setEditOpen(true);
  }

  function closeEdit() {
    if (saving) return;
    setEditOpen(false);
    setEditItem(null);
    setEditErrors({});
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editItem?.id) return;
    
    if (!validateEditForm()) {
      showNotification("error", "Пожалуйста, заполните все обязательные поля");
      return;
    }

    setSaving(true);
    try {
      const patch = {
        title: String(editItem.title || "").trim(),
        category: String(editItem.category || "").trim(),
        city: String(editItem.city || "").trim(),
        plan: String(editItem.plan || "base").trim(),
        description: String(editItem.description || "").trim(),
        price: Number(editItem.price || 0),
        spec: editItem.spec || {},
        updatedAt: new Date()
      };

      await updateListingByOwner(editItem.id, patch);

      setMyListings((prev) =>
        prev.map((x) => (x.id === editItem.id ? { ...x, ...patch } : x))
      );

      showNotification("success", "Объявление успешно обновлено");
      closeEdit();
    } catch (err) {
      console.error(err);
      showNotification("error", err?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item) {
    if (!item?.id) return;

    try {
      await deleteListingByOwner(item.id);
      setMyListings((prev) => prev.filter((x) => x.id !== item.id));
      setDeleteConfirm(null);
      showNotification("success", "Объявление удалено");
    } catch (err) {
      console.error(err);
      showNotification("error", err?.message || "Ошибка удаления");
    }
  }

  // Функции для редактирования профиля
  function openProfileEdit() {
    setProfileForm({
      name: profile?.name || "",
      phone: profile?.phone || "",
      whatsapp: profile?.whatsapp || "",
      city: profile?.city || "",
      telegram: profile?.telegram || "",
      instagram: profile?.instagram || "",
      description: profile?.description || ""
    });
    setProfileErrors({});
    setProfileEditOpen(true);
  }

  function closeProfileEdit() {
    if (savingProfile) return;
    setProfileEditOpen(false);
    setProfileErrors({});
  }

  function validateProfileForm() {
    const errors = {};
    if (!profileForm.name?.trim()) errors.name = "Введите имя";
    if (!profileForm.phone?.trim()) errors.phone = "Введите телефон";
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSaveProfile(e) {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      showNotification("error", "Пожалуйста, заполните обязательные поля");
      return;
    }

    setSavingProfile(true);
    try {
      const updateData = {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        whatsapp: profileForm.whatsapp?.trim() || "",
        city: profileForm.city?.trim() || "",
        telegram: profileForm.telegram?.trim() || "",
        instagram: profileForm.instagram?.trim() || "",
        description: profileForm.description?.trim() || ""
      };

      await updateUserProfile(user.uid, updateData);

      setProfile(prev => ({
        ...prev,
        ...updateData
      }));

      showNotification("success", "Профиль успешно обновлен");
      closeProfileEdit();
    } catch (err) {
      console.error(err);
      showNotification("error", err?.message || "Ошибка обновления профиля");
    } finally {
      setSavingProfile(false);
    }
  }

  if (!user) {
    return (
      <div className="profile-empty-state">
        <div className="profile-empty-icon">🔒</div>
        <h3 className="profile-empty-title">Необходима авторизация</h3>
        <p className="profile-empty-text">Войдите в аккаунт, чтобы просмотреть профиль</p>
        <div className="profile-empty-actions">
          <Link to="/login" className="profile-btn-primary">Войти</Link>
          <Link to="/register" className="profile-btn-ghost">Регистрация</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Уведомления */}
      {notification.show && (
        <div className={`profile-notification profile-notification-${notification.type}`}>
          <span className="profile-notification-icon">
            {notification.type === "success" ? "✅" : notification.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="profile-notification-message">{notification.message}</span>
        </div>
      )}

      {/* Шапка профиля с обложкой */}
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-cover-gradient" />
        </div>
        
        <div className="profile-info-row">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {(profile?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
            {profile?.verified && (
              <div className="profile-verified-badge">✓</div>
            )}
          </div>

          <div className="profile-info-content">
            <div className="profile-name-section">
              <h1 className="profile-name">{profile?.name || user?.displayName || "Пользователь"}</h1>
              <span className="profile-role">Продавец</span>
            </div>
            
            <div className="profile-contact-row">
              <div className="profile-contact-item">
                <span className="profile-contact-icon">📧</span>
                <span>{user?.email}</span>
              </div>
              <div className="profile-contact-item">
                <span className="profile-contact-icon">📅</span>
                <span>На сайте с {profile?.createdAt ? formatDate(profile.createdAt) : "недавно"}</span>
              </div>
            </div>
          </div>

          <div className="profile-quick-actions">
            <button className="profile-btn-primary" onClick={() => navigate('/create')}>
              <span className="profile-btn-icon">+</span>
              Создать
            </button>
            <button className="profile-btn-ghost" onClick={load}>
              <span className="profile-btn-icon">🔄</span>
              Обновить
            </button>
          </div>
        </div>
      </div>

      {/* Статистика в виде красивых карточек */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-icon profile-stat-icon-blue">
            <span className="profile-stat-emoji">📦</span>
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-value">{stats.total}</span>
            <span className="profile-stat-label">Всего объявлений</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon profile-stat-icon-green">
            <span className="profile-stat-emoji">👁️</span>
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-value">{stats.views.toLocaleString()}</span>
            <span className="profile-stat-label">Просмотров</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon profile-stat-icon-purple">
            <span className="profile-stat-emoji">💰</span>
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-value">{formatPrice(stats.totalPrice)}</span>
            <span className="profile-stat-label">Общая сумма</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon profile-stat-icon-orange">
            <span className="profile-stat-emoji">📊</span>
          </div>
          <div className="profile-stat-info">
            <span className="profile-stat-value">{stats.activeListings}</span>
            <span className="profile-stat-label">Активных</span>
          </div>
        </div>
      </div>

      {/* Контактная информация */}
      <div className="profile-contacts-grid">
        <div className="profile-contact-card">
          <div className="profile-contact-card-header">
            <span className="profile-contact-card-icon">📱</span>
            <h3 className="profile-contact-card-title">Телефон</h3>
          </div>
          <p className="profile-contact-card-value">{profile?.phone || "Не указан"}</p>
          {tel && (
            <a href={`tel:${tel}`} className="profile-contact-card-action">
              Позвонить
            </a>
          )}
        </div>

        <div className="profile-contact-card">
          <div className="profile-contact-card-header">
            <span className="profile-contact-card-icon">💬</span>
            <h3 className="profile-contact-card-title">WhatsApp</h3>
          </div>
          <p className="profile-contact-card-value">{profile?.whatsapp || "Не указан"}</p>
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="profile-contact-card-action">
              Написать
            </a>
          )}
        </div>

        <div className="profile-contact-card">
          <div className="profile-contact-card-header">
            <span className="profile-contact-card-icon">📍</span>
            <h3 className="profile-contact-card-title">Город</h3>
          </div>
          <p className="profile-contact-card-value">{profile?.city || "Не указан"}</p>
        </div>

        {profile?.telegram && (
          <div className="profile-contact-card">
            <div className="profile-contact-card-header">
              <span className="profile-contact-card-icon">📨</span>
              <h3 className="profile-contact-card-title">Telegram</h3>
            </div>
            <p className="profile-contact-card-value">@{profile.telegram}</p>
            <a href={`https://t.me/${profile.telegram}`} target="_blank" rel="noreferrer" className="profile-contact-card-action">
              Написать
            </a>
          </div>
        )}
      </div>

      {/* Статистика по планам */}
      <div className="profile-plans-section">
        <h2 className="profile-section-title">Планы размещения</h2>
        <div className="profile-plans-progress">
          <div className="profile-plan-item">
            <div className="profile-plan-header">
              <span className="profile-plan-name profile-plan-vip">VIP</span>
              <span className="profile-plan-count">{stats.vip}</span>
            </div>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill profile-progress-vip" style={{ width: `${(stats.vip / stats.total * 100) || 0}%` }} />
            </div>
          </div>

          <div className="profile-plan-item">
            <div className="profile-plan-header">
              <span className="profile-plan-name profile-plan-top">TOP</span>
              <span className="profile-plan-count">{stats.top}</span>
            </div>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill profile-progress-top" style={{ width: `${(stats.top / stats.total * 100) || 0}%` }} />
            </div>
          </div>

          <div className="profile-plan-item">
            <div className="profile-plan-header">
              <span className="profile-plan-name profile-plan-base">Базовые</span>
              <span className="profile-plan-count">{stats.total - stats.vip - stats.top}</span>
            </div>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill profile-progress-base" style={{ width: `${((stats.total - stats.vip - stats.top) / stats.total * 100) || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Вкладки и контент */}
      <div className="profile-tabs-section">
        <div className="profile-tabs-header">
          <button 
            className={`profile-tab-btn ${activeTab === 'listings' ? 'profile-tab-active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <span className="profile-tab-icon">📋</span>
            Мои объявления
            <span className="profile-tab-badge">{stats.total}</span>
          </button>
          
          <button 
            className={`profile-tab-btn ${activeTab === 'stats' ? 'profile-tab-active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="profile-tab-icon">📊</span>
            Статистика
          </button>
          
          <button 
            className={`profile-tab-btn ${activeTab === 'settings' ? 'profile-tab-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="profile-tab-icon">⚙️</span>
            Настройки
          </button>
        </div>

        <div className="profile-tabs-content">
          {activeTab === 'listings' && (
            <div className="profile-listings-tab">
              {/* Фильтры */}
              <div className="profile-filters-bar">
                <div className="profile-filters-left">
                  <select 
                    className="profile-filter-select"
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                  >
                    <option value="all">Все объявления</option>
                    <option value="base">Обычные</option>
                    <option value="vip">VIP</option>
                    <option value="top">TOP</option>
                  </select>

                  <select 
                    className="profile-filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Сначала новые</option>
                    <option value="oldest">Сначала старые</option>
                    <option value="price_desc">Сначала дороже</option>
                    <option value="price_asc">Сначала дешевле</option>
                  </select>
                </div>

                <div className="profile-filters-right">
                  <span className="profile-results-count">
                    Найдено: {filteredListings.length}
                  </span>
                </div>
              </div>

              {/* Список объявлений */}
              {loading ? (
                <div className="profile-listings-skeleton">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="profile-skeleton-card" />
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="profile-empty-listings">
                  <span className="profile-empty-icon">📭</span>
                  <h3 className="profile-empty-title">Объявлений пока нет</h3>
                  <p className="profile-empty-text">Создайте первое объявление, чтобы начать продавать</p>
                  <button className="profile-btn-primary" onClick={() => navigate('/create')}>
                    Создать объявление
                  </button>
                </div>
              ) : (
                <div className="profile-listings-grid">
                  {filteredListings.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="profile-listing-item"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ListingCard item={item} />
                      <div className="profile-listing-footer">
                        <button className="profile-item-action profile-item-edit" onClick={() => openEdit(item)}>
                          ✏️ Редактировать
                        </button>
                        <button className="profile-item-action profile-item-delete" onClick={() => setDeleteConfirm(item)}>
                          🗑️ Удалить
                        </button>
                        <Link to={`/listing/${item.id}`} className="profile-item-action profile-item-view">
                          👁️ Просмотр
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Вкладка статистики */}
          {activeTab === 'stats' && (
            <div className="profile-stats-tab">
              <div className="profile-stats-grid">
                <div className="profile-stats-chart-card">
                  <h3 className="profile-stats-title">Просмотры по дням</h3>
                  <div className="profile-chart-placeholder">
                    📊 График появится скоро
                  </div>
                </div>
                <div className="profile-stats-info-card">
                  <h3 className="profile-stats-title">Детальная информация</h3>
                  <div className="profile-stats-list">
                    <div className="profile-stats-row">
                      <span>Средняя цена:</span>
                      <strong>{formatPrice(stats.avgPrice)} TJS</strong>
                    </div>
                    <div className="profile-stats-row">
                      <span>Всего просмотров:</span>
                      <strong>{stats.views}</strong>
                    </div>
                    <div className="profile-stats-row">
                      <span>Активных объявлений:</span>
                      <strong>{stats.activeListings}</strong>
                    </div>
                    <div className="profile-stats-row">
                      <span>Конверсия:</span>
                      <strong>{stats.total > 0 ? Math.round((stats.activeListings / stats.total) * 100) : 0}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка настроек */}
          {activeTab === 'settings' && (
            <div className="profile-settings-tab">
              <div className="profile-settings-grid">
                <div className="profile-setting-card">
                  <h4 className="profile-setting-title">Профиль</h4>
                  <p className="profile-setting-description">Личная информация и контакты</p>
                  <button className="profile-btn-ghost" onClick={openProfileEdit}>
                    Редактировать
                  </button>
                </div>
                <div className="profile-setting-card">
                  <h4 className="profile-setting-title">Уведомления</h4>
                  <p className="profile-setting-description">Настройки оповещений</p>
                  <button className="profile-btn-ghost">Настроить</button>
                </div>
                <div className="profile-setting-card">
                  <h4 className="profile-setting-title">Безопасность</h4>
                  <p className="profile-setting-description">Пароль и защита</p>
                  <button className="profile-btn-ghost">Настроить</button>
                </div>
              </div>

              {/* Дополнительная информация профиля */}
              <div className="profile-info-card">
                <h3 className="profile-info-title">О себе</h3>
                <p className="profile-info-text">{profile?.description || "Информация не добавлена"}</p>
              </div>

              {profile?.telegram && (
                <div className="profile-info-card">
                  <h3 className="profile-info-title">Социальные сети</h3>
                  <div className="profile-social-links">
                    {profile.telegram && (
                      <a href={`https://t.me/${profile.telegram}`} target="_blank" rel="noreferrer" className="profile-social-link profile-social-telegram">
                        Telegram: @{profile.telegram}
                      </a>
                    )}
                    {profile.instagram && (
                      <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" className="profile-social-link profile-social-instagram">
                        Instagram: @{profile.instagram}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования объявления */}
      {editOpen && editItem && (
        <div className="profile-modal-overlay" onClick={closeEdit}>
          <div className="profile-modal-content profile-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">Редактировать объявление</h2>
              <button className="profile-modal-close" onClick={closeEdit}>×</button>
            </div>
            
            <form onSubmit={onSaveEdit} className="profile-edit-form">
              <div className="profile-form-grid">
                <div className="profile-form-group profile-form-full">
                  <label className="profile-form-label">Название <span className="profile-required">*</span></label>
                  <input
                    type="text"
                    value={editItem.title}
                    onChange={(e) => setEditItem({...editItem, title: e.target.value})}
                    className={`profile-form-input ${editErrors.title ? 'profile-error' : ''}`}
                    placeholder="Введите название объявления"
                  />
                  {editErrors.title && <span className="profile-error-message">{editErrors.title}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Категория <span className="profile-required">*</span></label>
                  <select
                    value={editItem.category}
                    onChange={(e) => setEditItem({...editItem, category: e.target.value})}
                    className={`profile-form-select ${editErrors.category ? 'profile-error' : ''}`}
                  >
                    <option value="">Выберите категорию</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {editErrors.category && <span className="profile-error-message">{editErrors.category}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Город <span className="profile-required">*</span></label>
                  <select
                    value={editItem.city}
                    onChange={(e) => setEditItem({...editItem, city: e.target.value})}
                    className={`profile-form-select ${editErrors.city ? 'profile-error' : ''}`}
                  >
                    <option value="">Выберите город</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {editErrors.city && <span className="profile-error-message">{editErrors.city}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Цена (TJS) <span className="profile-required">*</span></label>
                  <input
                    type="number"
                    value={editItem.price}
                    onChange={(e) => setEditItem({...editItem, price: Number(e.target.value)})}
                    className={`profile-form-input ${editErrors.price ? 'profile-error' : ''}`}
                    min="0"
                    step="1"
                  />
                  {editErrors.price && <span className="profile-error-message">{editErrors.price}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">План размещения</label>
                  <select
                    value={editItem.plan}
                    onChange={(e) => setEditItem({...editItem, plan: e.target.value})}
                    className="profile-form-select"
                  >
                    <option value="base">Обычное</option>
                    <option value="vip">VIP</option>
                    <option value="top">TOP</option>
                  </select>
                </div>

                <div className="profile-form-group profile-form-full">
                  <label className="profile-form-label">Описание <span className="profile-required">*</span></label>
                  <textarea
                    value={editItem.description}
                    onChange={(e) => setEditItem({...editItem, description: e.target.value})}
                    className={`profile-form-textarea ${editErrors.description ? 'profile-error' : ''}`}
                    rows="5"
                    placeholder="Подробно опишите ваш товар или услугу"
                  />
                  {editErrors.description && <span className="profile-error-message">{editErrors.description}</span>}
                </div>

                {/* Спецификации (если есть) */}
                {Object.keys(editItem.spec || {}).length > 0 && (
                  <div className="profile-form-group profile-form-full">
                    <label className="profile-form-label">Характеристики</label>
                    <div className="profile-specs-grid">
                      {Object.entries(editItem.spec).map(([key, value]) => (
                        <div key={key} className="profile-spec-item">
                          <span className="profile-spec-key">{key}:</span>
                          <span className="profile-spec-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-modal-actions">
                <button type="button" className="profile-btn-ghost" onClick={closeEdit} disabled={saving}>
                  Отмена
                </button>
                <button type="submit" className="profile-btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования профиля */}
      {profileEditOpen && (
        <div className="profile-modal-overlay" onClick={closeProfileEdit}>
          <div className="profile-modal-content profile-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">Редактировать профиль</h2>
              <button className="profile-modal-close" onClick={closeProfileEdit}>×</button>
            </div>
            
            <form onSubmit={onSaveProfile} className="profile-edit-form">
              <div className="profile-form-grid">
                <div className="profile-form-group profile-form-full">
                  <label className="profile-form-label">Имя <span className="profile-required">*</span></label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className={`profile-form-input ${profileErrors.name ? 'profile-error' : ''}`}
                    placeholder="Как к вам обращаться"
                  />
                  {profileErrors.name && <span className="profile-error-message">{profileErrors.name}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Телефон <span className="profile-required">*</span></label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className={`profile-form-input ${profileErrors.phone ? 'profile-error' : ''}`}
                    placeholder="+992 XXX XXX XXX"
                  />
                  {profileErrors.phone && <span className="profile-error-message">{profileErrors.phone}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">WhatsApp</label>
                  <input
                    type="tel"
                    value={profileForm.whatsapp}
                    onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                    className="profile-form-input"
                    placeholder="+992 XXX XXX XXX"
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Город</label>
                  <select
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                    className="profile-form-select"
                  >
                    <option value="">Выберите город</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Telegram</label>
                  <input
                    type="text"
                    value={profileForm.telegram}
                    onChange={(e) => setProfileForm({...profileForm, telegram: e.target.value})}
                    className="profile-form-input"
                    placeholder="@username"
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Instagram</label>
                  <input
                    type="text"
                    value={profileForm.instagram}
                    onChange={(e) => setProfileForm({...profileForm, instagram: e.target.value})}
                    className="profile-form-input"
                    placeholder="@username"
                  />
                </div>

                <div className="profile-form-group profile-form-full">
                  <label className="profile-form-label">О себе</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                    className="profile-form-textarea"
                    rows="4"
                    placeholder="Расскажите немного о себе и своей деятельности"
                  />
                </div>
              </div>

              <div className="profile-modal-actions">
                <button type="button" className="profile-btn-ghost" onClick={closeProfileEdit} disabled={savingProfile}>
                  Отмена
                </button>
                <button type="submit" className="profile-btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Сохранение...' : 'Сохранить профиль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirm && (
        <div className="profile-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-modal-title">Удалить объявление?</h3>
            <p className="profile-modal-text">Вы уверены, что хотите удалить "{deleteConfirm.title}"?</p>
            <p className="profile-warning">Это действие нельзя отменить</p>
            <div className="profile-modal-actions">
              <button className="profile-btn-ghost" onClick={() => setDeleteConfirm(null)}>Отмена</button>
              <button className="profile-btn-danger" onClick={() => onDelete(deleteConfirm)}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}