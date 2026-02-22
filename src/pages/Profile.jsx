import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserProfile, listUserListings } from "../firebase/users.js";
import { updateListingByOwner, deleteListingByOwner } from "../firebase/listings.js";

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

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const p = await getUserProfile(user.uid);
      setProfile(p);

      const items = await listUserListings(user.uid, user.email, 200);
      setMyListings(items);
    } catch (error) {
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
    });
    setEditOpen(true);
  }

  function closeEdit() {
    if (saving) return;
    setEditOpen(false);
    setEditItem(null);
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editItem?.id) return;

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

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Необходима авторизация</h3>
        <p>Войдите в аккаунт, чтобы просмотреть профиль</p>
        <div className="actions">
          <Link to="/login" className="btnPrimary">Войти</Link>
          <Link to="/register" className="btnGhost">Регистрация</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Уведомления */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === "success" ? "✅" : notification.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="notification-message">{notification.message}</span>
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
              <div className="verified-badge-large">✓</div>
            )}
          </div>

          <div className="profile-info-content">
            <div className="profile-name-section">
              <h1 className="profile-name">{profile?.name || user?.displayName || "Пользователь"}</h1>
              <span className="profile-role">Продавец</span>
            </div>
            
            <div className="profile-contact-row">
              <div className="profile-contact-item">
                <span className="contact-icon">📧</span>
                <span>{user?.email}</span>
              </div>
              <div className="profile-contact-item">
                <span className="contact-icon">📅</span>
                <span>На сайте с {profile?.createdAt ? formatDate(profile.createdAt) : "недавно"}</span>
              </div>
            </div>
          </div>

          <div className="profile-quick-actions">
            <button className="btnPrimary" onClick={() => navigate('/create')}>
              <span className="btn-icon">+</span>
              Создать
            </button>
            <button className="btnGhost" onClick={load}>
              <span className="btn-icon">🔄</span>
              Обновить
            </button>
          </div>
        </div>
      </div>

      {/* Статистика в виде красивых карточек */}
      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <span className="stat-icon">📦</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Всего объявлений</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <span className="stat-icon">👁️</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.views.toLocaleString()}</span>
            <span className="stat-label">Просмотров</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatPrice(stats.totalPrice)}</span>
            <span className="stat-label">Общая сумма</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.activeListings}</span>
            <span className="stat-label">Активных</span>
          </div>
        </div>
      </div>

      {/* Контактная информация в виде красивых плиток */}
      <div className="contact-cards-grid">
        <div className="contact-card">
          <div className="contact-card-header">
            <span className="contact-card-icon">📱</span>
            <h3>Телефон</h3>
          </div>
          <p className="contact-card-value">{profile?.phone || "Не указан"}</p>
          {tel && (
            <a href={`tel:${tel}`} className="contact-card-action">
              Позвонить
            </a>
          )}
        </div>

        <div className="contact-card">
          <div className="contact-card-header">
            <span className="contact-card-icon">💬</span>
            <h3>WhatsApp</h3>
          </div>
          <p className="contact-card-value">{profile?.whatsapp || "Не указан"}</p>
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="contact-card-action">
              Написать
            </a>
          )}
        </div>

        <div className="contact-card">
          <div className="contact-card-header">
            <span className="contact-card-icon">📍</span>
            <h3>Город</h3>
          </div>
          <p className="contact-card-value">{profile?.city || "Не указан"}</p>
        </div>

        <div className="contact-card">
          <div className="contact-card-header">
            <span className="contact-card-icon">🆔</span>
            <h3>UID</h3>
          </div>
          <p className="contact-card-value code">{user.uid.slice(0, 12)}...</p>
        </div>
      </div>

      {/* Статистика по планам */}
      <div className="plans-section">
        <h2 className="section-title">Планы размещения</h2>
        <div className="plans-progress">
          <div className="plan-progress-item">
            <div className="plan-progress-header">
              <span className="plan-name vip">VIP</span>
              <span className="plan-count">{stats.vip}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill vip" style={{ width: `${(stats.vip / stats.total * 100) || 0}%` }} />
            </div>
          </div>

          <div className="plan-progress-item">
            <div className="plan-progress-header">
              <span className="plan-name top">TOP</span>
              <span className="plan-count">{stats.top}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill top" style={{ width: `${(stats.top / stats.total * 100) || 0}%` }} />
            </div>
          </div>

          <div className="plan-progress-item">
            <div className="plan-progress-header">
              <span className="plan-name base">Базовые</span>
              <span className="plan-count">{stats.total - stats.vip - stats.top}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill base" style={{ width: `${((stats.total - stats.vip - stats.top) / stats.total * 100) || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Вкладки и контент */}
      <div className="tabs-section">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <span className="tab-icon">📋</span>
            Мои объявления
            <span className="tab-badge">{stats.total}</span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="tab-icon">📊</span>
            Статистика
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
            Настройки
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'listings' && (
            <div className="listings-tab">
              {/* Фильтры */}
              <div className="filters-bar">
                <div className="filters-left">
                  <select 
                    className="filter-select"
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                  >
                    <option value="all">Все объявления</option>
                    <option value="base">Обычные</option>
                    <option value="vip">VIP</option>
                    <option value="top">TOP</option>
                  </select>

                  <select 
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Сначала новые</option>
                    <option value="oldest">Сначала старые</option>
                    <option value="price_desc">Сначала дороже</option>
                    <option value="price_asc">Сначала дешевле</option>
                  </select>
                </div>

                <div className="filters-right">
                  <span className="results-count">
                    Найдено: {filteredListings.length}
                  </span>
                </div>
              </div>

              {/* Список объявлений с красивой анимацией */}
              {loading ? (
                <div className="listings-skeleton">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="skeleton-card" />
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="empty-listings">
                  <span className="empty-icon">📭</span>
                  <h3>Объявлений пока нет</h3>
                  <p>Создайте первое объявление, чтобы начать продавать</p>
                  <button className="btnPrimary" onClick={() => navigate('/create')}>
                    Создать объявление
                  </button>
                </div>
              ) : (
                <div className="listings-grid">
                  {filteredListings.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="listing-item"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ListingCard item={item} />
                      <div className="listing-item-footer">
                        <button className="item-action edit" onClick={() => openEdit(item)}>
                          ✏️ Редактировать
                        </button>
                        <button className="item-action delete" onClick={() => setDeleteConfirm(item)}>
                          🗑️ Удалить
                        </button>
                        <Link to={`/listing/${item.id}`} className="item-action view">
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
            <div className="stats-tab">
              <div className="stats-grid">
                <div className="stats-chart-card">
                  <h3>Просмотры по дням</h3>
                  <div className="chart-placeholder">
                    📊 График появится скоро
                  </div>
                </div>
                <div className="stats-info-card">
                  <h3>Детальная информация</h3>
                  <div className="stats-list">
                    <div className="stats-row">
                      <span>Средняя цена:</span>
                      <strong>{formatPrice(stats.avgPrice)} TJS</strong>
                    </div>
                    <div className="stats-row">
                      <span>Всего просмотров:</span>
                      <strong>{stats.views}</strong>
                    </div>
                    <div className="stats-row">
                      <span>Активных объявлений:</span>
                      <strong>{stats.activeListings}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка настроек */}
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-grid">
                <div className="setting-card">
                  <h4>Профиль</h4>
                  <p>Личная информация и контакты</p>
                  <button className="btnGhost">Настроить</button>
                </div>
                <div className="setting-card">
                  <h4>Уведомления</h4>
                  <p>Настройки оповещений</p>
                  <button className="btnGhost">Настроить</button>
                </div>
                <div className="setting-card">
                  <h4>Безопасность</h4>
                  <p>Пароль и защита</p>
                  <button className="btnGhost">Настроить</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Удалить объявление?</h3>
            <p>Вы уверены, что хотите удалить "{deleteConfirm.title}"?</p>
            <p className="warning">Это действие нельзя отменить</p>
            <div className="modal-actions">
              <button className="btnGhost" onClick={() => setDeleteConfirm(null)}>Отмена</button>
              <button className="btnDanger" onClick={() => onDelete(deleteConfirm)}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}