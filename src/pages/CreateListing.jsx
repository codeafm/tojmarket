import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createListing } from "../firebase/listings.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase.js";

function onlyDigits(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

// Схемы характеристик для разных категорий
const CATEGORY_SCHEMAS = {
  phones: {
    title: "Телефоны",
    icon: "📱",
    fields: [
      { name: "brand", label: "Бренд", type: "text", placeholder: "Apple, Samsung, Xiaomi...", required: false },
      { name: "model", label: "Модель", type: "text", placeholder: "iPhone 15 Pro Max", required: false },
      { name: "memory", label: "Память", type: "text", placeholder: "256 ГБ", required: false },
      { name: "ram", label: "RAM", type: "text", placeholder: "8 ГБ", required: false },
      { name: "color", label: "Цвет", type: "text", placeholder: "Черный, Белый...", required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новый", "Как новый", "Б/у", "На запчасти"], required: false },
      { name: "battery", label: "Батарея (%)", type: "number", placeholder: "100", required: false }
    ]
  },
  tablets: {
    title: "Планшеты",
    icon: "📟",
    fields: [
      { name: "brand", label: "Бренд", type: "text", placeholder: "Apple, Samsung, Huawei...", required: false },
      { name: "model", label: "Модель", type: "text", placeholder: "iPad Pro 12.9", required: false },
      { name: "memory", label: "Память", type: "text", placeholder: "256 ГБ", required: false },
      { name: "ram", label: "RAM", type: "text", placeholder: "8 ГБ", required: false },
      { name: "color", label: "Цвет", type: "text", placeholder: "Серый, Золотой...", required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новый", "Как новый", "Б/у", "На запчасти"], required: false },
      { name: "screen", label: "Экран (дюймы)", type: "text", placeholder: "12.9", required: false }
    ]
  },
  laptops: {
    title: "Ноутбуки",
    icon: "💻",
    fields: [
      { name: "brand", label: "Бренд", type: "text", placeholder: "Apple, Dell, HP, Lenovo...", required: false },
      { name: "model", label: "Модель", type: "text", placeholder: "MacBook Pro 16", required: false },
      { name: "processor", label: "Процессор", type: "text", placeholder: "Apple M3, Intel i7...", required: false },
      { name: "ram", label: "RAM", type: "text", placeholder: "16 ГБ", required: false },
      { name: "storage", label: "Накопитель", type: "text", placeholder: "512 ГБ SSD", required: false },
      { name: "screen", label: "Экран", type: "text", placeholder: '16" Retina', required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новый", "Как новый", "Б/у", "На запчасти"], required: false }
    ]
  },
  accessories: {
    title: "Аксессуары",
    icon: "🎧",
    fields: [
      { name: "type", label: "Тип", type: "text", placeholder: "Чехол, Зарядка, Наушники...", required: false },
      { name: "brand", label: "Бренд", type: "text", placeholder: "Apple, Samsung, Anker...", required: false },
      { name: "compatibility", label: "Совместимость", type: "text", placeholder: "Для iPhone 15", required: false },
      { name: "color", label: "Цвет", type: "text", placeholder: "Черный, Белый...", required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новый", "Как новый", "Б/у"], required: false }
    ]
  },
  audio: {
    title: "Аудио",
    icon: "🔊",
    fields: [
      { name: "type", label: "Тип", type: "text", placeholder: "Наушники, Колонки, Микрофон...", required: false },
      { name: "brand", label: "Бренд", type: "text", placeholder: "Sony, JBL, Apple...", required: false },
      { name: "model", label: "Модель", type: "text", placeholder: "AirPods Pro 2", required: false },
      { name: "wireless", label: "Беспроводные", type: "select", options: ["Да", "Нет"], required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новый", "Как новый", "Б/у"], required: false }
    ]
  },
  auto: {
    title: "Автомобили",
    icon: "🚗",
    fields: [
      { name: "brand", label: "Марка", type: "text", placeholder: "Toyota, Mercedes, BMW...", required: false },
      { name: "model", label: "Модель", type: "text", placeholder: "Camry, E-Class, X5...", required: false },
      { name: "year", label: "Год выпуска", type: "number", placeholder: "2020", required: false },
      { name: "mileage", label: "Пробег (км)", type: "number", placeholder: "50000", required: false },
      { name: "fuel", label: "Топливо", type: "select", options: ["Бензин", "Дизель", "Газ", "Гибрид", "Электро"], required: false },
      { name: "transmission", label: "Коробка", type: "select", options: ["Механика", "Автомат", "Робот", "Вариатор"], required: false },
      { name: "drive", label: "Привод", type: "select", options: ["Передний", "Задний", "Полный"], required: false },
      { name: "body", label: "Кузов", type: "select", options: ["Седан", "Хэтчбек", "Универсал", "Кроссовер", "Внедорожник", "Купе", "Минивэн"], required: false },
      { name: "color", label: "Цвет", type: "text", placeholder: "Черный, Белый...", required: false }
    ]
  },
  realty: {
    title: "Недвижимость",
    icon: "🏠",
    fields: [
      { name: "type", label: "Тип", type: "select", options: ["Квартира", "Дом", "Комната", "Участок", "Коммерческая"], required: false },
      { name: "rooms", label: "Комнат", type: "select", options: ["1", "2", "3", "4", "5+"], required: false },
      { name: "area", label: "Площадь (м²)", type: "number", placeholder: "65", required: false },
      { name: "floor", label: "Этаж", type: "text", placeholder: "5 из 9", required: false },
      { name: "repair", label: "Ремонт", type: "select", options: ["Без ремонта", "Косметический", "Евроремонт", "Дизайнерский"], required: false },
      { name: "furniture", label: "Мебель", type: "select", options: ["Есть", "Частично", "Нет"], required: false }
    ]
  },
  clothes: {
    title: "Одежда",
    icon: "👕",
    fields: [
      { name: "type", label: "Тип", type: "text", placeholder: "Платье, Рубашка, Джинсы...", required: false },
      { name: "brand", label: "Бренд", type: "text", placeholder: "Nike, Adidas, Zara...", required: false },
      { name: "size", label: "Размер", type: "text", placeholder: "S, M, L, XL, 42...", required: false },
      { name: "gender", label: "Для кого", type: "select", options: ["Мужское", "Женское", "Детское", "Унисекс"], required: false },
      { name: "material", label: "Материал", type: "text", placeholder: "Хлопок, Кожа...", required: false },
      { name: "color", label: "Цвет", type: "text", placeholder: "Черный, Белый...", required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новое с биркой", "Новое", "Как новое", "Б/у"], required: false }
    ]
  },
  furniture: {
    title: "Мебель",
    icon: "🪑",
    fields: [
      { name: "type", label: "Тип", type: "text", placeholder: "Диван, Стол, Кровать...", required: false },
      { name: "material", label: "Материал", type: "text", placeholder: "Дерево, Металл, Пластик...", required: false },
      { name: "color", label: "Цвет", type: "text", placeholder: "Белый, Коричневый...", required: false },
      { name: "dimensions", label: "Размеры", type: "text", placeholder: "200x90x80 см", required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новое", "Как новое", "Б/у"], required: false }
    ]
  },
  pets: {
    title: "Животные",
    icon: "🐕",
    fields: [
      { name: "type", label: "Вид", type: "text", placeholder: "Собака, Кошка, Птица...", required: false },
      { name: "breed", label: "Порода", type: "text", placeholder: "Лабрадор, Мейн-кун...", required: false },
      { name: "age", label: "Возраст", type: "text", placeholder: "2 года", required: false },
      { name: "gender", label: "Пол", type: "select", options: ["Мальчик", "Девочка"], required: false },
      { name: "vaccinated", label: "Прививки", type: "select", options: ["Да", "Нет"], required: false },
      { name: "documents", label: "Документы", type: "select", options: ["Есть", "Нет"], required: false }
    ]
  },
  jobs: {
    title: "Работа",
    icon: "💼",
    fields: [
      { name: "company", label: "Компания", type: "text", placeholder: "Название компании", required: false },
      { name: "position", label: "Должность", type: "text", placeholder: "Программист, Водитель...", required: false },
      { name: "employment", label: "Тип занятости", type: "select", options: ["Полная", "Частичная", "Удаленная", "Стажировка"], required: false },
      { name: "experience", label: "Опыт", type: "text", placeholder: "1-3 года", required: false },
      { name: "education", label: "Образование", type: "text", placeholder: "Высшее, Среднее...", required: false },
      { name: "salary", label: "Зарплата", type: "text", placeholder: "от 5000 TJS", required: false }
    ]
  },
  services: {
    title: "Услуги",
    icon: "🧰",
    fields: [
      { name: "serviceType", label: "Тип услуги", type: "text", placeholder: "Ремонт, Уборка, Обучение...", required: false },
      { name: "price", label: "Цена", type: "text", placeholder: "от 100 TJS/час", required: false },
      { name: "experience", label: "Опыт", type: "text", placeholder: "5 лет", required: false },
      { name: "guarantee", label: "Гарантия", type: "select", options: ["Есть", "Нет"], required: false }
    ]
  },
  other: {
    title: "Другое",
    icon: "✨",
    fields: [
      { name: "brand", label: "Бренд", type: "text", placeholder: "Бренд", required: false },
      { name: "condition", label: "Состояние", type: "select", options: ["Новый", "Как новый", "Б/у"], required: false },
      { name: "color", label: "Цвет", type: "text", placeholder: "Цвет", required: false }
    ]
  }
};

export default function CreateListing() {
  const nav = useNavigate();
  const { user } = useAuth();

  // main fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("phones");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [plan, setPlan] = useState("base");
  const [description, setDescription] = useState("");

  // Dynamic spec fields based on category
  const [specs, setSpecs] = useState({});

  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Get current category schema
  const currentSchema = CATEGORY_SCHEMAS[category] || CATEGORY_SCHEMAS.other;

  // Reset specs when category changes
  useEffect(() => {
    setSpecs({});
  }, [category]);

  const canSubmit = useMemo(() => {
    if (!user?.uid) return false;
    if (saving) return false;
    if (!title.trim()) return false;
    if (!category.trim()) return false;
    if (!city.trim()) return false;
    const p = Number(onlyDigits(price));
    if (!Number.isFinite(p) || p <= 0) return false;
    return true;
  }, [user?.uid, saving, title, category, city, price]);

  // Обработка выбора файлов с превью
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 6);
    setFiles(selectedFiles);
    
    const previews = selectedFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  // Удаление фото
  const removeFile = (index) => {
    const newFiles = [...files];
    const newPreviews = [...filePreviews];
    
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  // Очистка превью при размонтировании
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  async function uploadPhotos(uid, fileArr) {
    const out = [];
    const safe = (fileArr || []).slice(0, 6);

    for (let i = 0; i < safe.length; i++) {
      const f = safe[i];
      const path = `listings/${uid}/${Date.now()}_${i}_${f.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, f);
      const url = await getDownloadURL(r);
      out.push(url);
    }

    return out;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setErr("");

    try {
      const photoUrls = await uploadPhotos(user.uid, files);

      // Clean up specs - remove empty values
      const cleanSpecs = {};
      Object.entries(specs).forEach(([key, value]) => {
        if (value && value.trim()) {
          cleanSpecs[key] = value.trim();
        }
      });

      const payload = {
        title: title.trim(),
        category: category.trim(),
        city: city.trim(),
        description: description.trim(),
        plan,
        price: Number(onlyDigits(price)),
        photos: photoUrls,
        attrs: cleanSpecs, // Save specs as attrs
        ownerName: user?.displayName || user?.email || "Пользователь",
        ownerId: user.uid,
        ownerEmail: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const id = await createListing(payload);
      nav(`/listing/${id}`);
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || "Ошибка публикации");
    } finally {
      setSaving(false);
    }
  }

  // Handle spec field change
  const handleSpecChange = (fieldName, value) => {
    setSpecs(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  if (!user) {
    return (
      <div className="create-listing-page">
        <div className="auth-required">
          <div className="auth-icon">🔒</div>
          <h2>Необходима авторизация</h2>
          <p>Чтобы создать объявление, войдите в свой аккаунт</p>
          <div className="auth-buttons">
            <Link to="/login" className="btn-primary">Войти</Link>
            <Link to="/register" className="btn-outline">Регистрация</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing-page">
      {/* Шапка страницы */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📝</span>
            Создать объявление
          </h1>
          <p className="page-subtitle">
            {saving ? "Публикуем ваше объявление..." : "Заполните все поля и нажмите “Опубликовать”"}
          </p>
        </div>
        <div className="header-status">
          <span className={`status-badge ${saving ? "loading" : ""}`}>
            {saving ? (
              <>
                <span className="spinner-small" />
                Публикация
              </>
            ) : (
              <>
                <span className="status-dot" />
                Черновик
              </>
            )}
          </span>
        </div>
      </div>

      {/* Навигация назад */}
      <div className="back-nav">
        <Link className="back-link" to="/listings">
          <span className="back-arrow">←</span>
          Назад к объявлениям
        </Link>
      </div>

      {/* Прогресс бар */}
      <div className="progress-bar-container">
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Основное</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Фото</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Детали</div>
          </div>
        </div>
      </div>

      {/* Ошибка */}
      {err && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Ошибка при публикации</h4>
            <p>{err}</p>
          </div>
          <button className="error-close" onClick={() => setErr("")}>✕</button>
        </div>
      )}

      {/* Карточка с формой */}
      <div className="form-card">
        <form onSubmit={onSubmit}>
          {/* ШАГ 1: Основная информация */}
          <div className="form-section" style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📋</span>
                Основная информация
              </h2>
              <span className="required-badge">Обязательные поля</span>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">
                  Название объявления <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${!title.trim() && title ? 'error' : ''}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: iPhone 15 Pro Max 256GB"
                  disabled={saving}
                />
                <div className="input-hint">
                  Хорошее название привлекает больше покупателей
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Категория <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={saving}
                >
                  {Object.entries(CATEGORY_SCHEMAS).map(([key, schema]) => (
                    <option key={key} value={key}>
                      {schema.icon} {schema.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Город <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Душанбе"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Цена (TJS) <span className="required-star">*</span>
                </label>
                <div className="price-input-wrapper">
                  <input
                    type="text"
                    className="form-input price-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="3400"
                    inputMode="numeric"
                    disabled={saving}
                  />
                  {price && (
                    <span className="price-preview">
                      {Number(onlyDigits(price)).toLocaleString()} TJS
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите товар подробнее: состояние, комплектация, особенности, возможность торга..."
                  rows={5}
                  disabled={saving}
                />
                <div className="textarea-counter">
                  {description.length} / 1000
                </div>
              </div>
            </div>

            <div className="form-navigation">
              <button
                type="button"
                className="btn-outline"
                onClick={() => nav("/listings")}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentStep(2)}
                disabled={!title.trim() || !category || !city.trim() || !price}
              >
                Далее
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          {/* ШАГ 2: Фотографии */}
          <div className="form-section" style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📸</span>
                Фотографии
              </h2>
              <span className="badge-secondary">до 6 шт.</span>
            </div>
            
            <div className="photo-upload-area">
              <input
                type="file"
                id="photo-upload"
                className="file-input"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={saving}
              />
              
              {filePreviews.length === 0 ? (
                <label htmlFor="photo-upload" className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">
                    <span className="upload-title">Нажмите для загрузки</span>
                    <span className="upload-hint">Поддерживаются JPG, PNG, WEBP до 10MB</span>
                  </div>
                </label>
              ) : (
                <div className="photo-grid">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="photo-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                      <div className="photo-order">{index + 1}</div>
                    </div>
                  ))}
                  
                  {files.length < 6 && (
                    <label htmlFor="photo-upload" className="photo-add">
                      <div className="add-icon">+</div>
                      <div className="add-text">Добавить</div>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="photo-tips">
              <h4>Советы для лучших фотографий:</h4>
              <ul>
                <li>📸 Сфотографируйте товар при хорошем освещении</li>
                <li>🖼️ Покажите товар с разных ракурсов</li>
                <li>🔍 Сделайте фото дефектов, если они есть</li>
                <li>📏 Добавьте фото с размерами или в использовании</li>
              </ul>
            </div>

            <div className="form-navigation">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setCurrentStep(1)}
              >
                ← Назад
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentStep(3)}
              >
                Далее
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          {/* ШАГ 3: Характеристики и план */}
          <div className="form-section" style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">⚙️</span>
                Характеристики {currentSchema.icon} {currentSchema.title}
              </h2>
              <span className="badge-secondary">необязательно</span>
            </div>

            {/* Динамические поля характеристик */}
            <div className="specs-section">
              <h3 className="subsection-title">Характеристики товара</h3>
              <div className="specs-grid">
                {currentSchema.fields.map((field) => (
                  <div key={field.name} className={`form-group ${field.fullWidth ? 'full-width' : ''}`}>
                    <label className="form-label">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        className="form-select"
                        value={specs[field.name] || ''}
                        onChange={(e) => handleSpecChange(field.name, e.target.value)}
                        disabled={saving}
                      >
                        <option value="">Выберите {field.label.toLowerCase()}</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        className="form-input"
                        value={specs[field.name] || ''}
                        onChange={(e) => handleSpecChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={saving}
                      />
                    ) : (
                      <input
                        type="text"
                        className="form-input"
                        value={specs[field.name] || ''}
                        onChange={(e) => handleSpecChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={saving}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* План размещения */}
            <div className="plan-section">
              <h3 className="subsection-title">Выберите план размещения</h3>
              <div className="plan-cards">
                {[
                  { 
                    id: "base", 
                    label: "Базовый", 
                    price: "Бесплатно",
                    features: ["Обычная видимость", "До 6 фото", "30 дней"],
                    gradient: "base",
                    icon: "📋"
                  },
                  { 
                    id: "vip", 
                    label: "VIP", 
                    price: "VIP",
                    features: ["✨ Топ объявлений", "Выделение цветом", "Больше просмотров"],
                    gradient: "vip",
                    icon: "⭐"
                  },
                  { 
                    id: "top", 
                    label: "TOP", 
                    price: "TOP",
                    features: ["🔥 На первом месте", "Спецотметка", "Максимум просмотров"],
                    gradient: "top",
                    icon: "🚀"
                  }
                ].map((p) => (
                  <label
                    key={p.id}
                    className={`plan-card ${plan === p.id ? "selected" : ""} ${p.gradient}`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={plan === p.id}
                      onChange={(e) => setPlan(e.target.value)}
                      disabled={saving}
                    />
                    <div className="plan-card-content">
                      <div className="plan-icon">{p.icon}</div>
                      <div className="plan-info">
                        <div className="plan-name">{p.label}</div>
                        <div className="plan-price">{p.price}</div>
                      </div>
                    </div>
                    <ul className="plan-features">
                      {p.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                    {plan === p.id && (
                      <div className="plan-selected">✓ Выбрано</div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-navigation">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setCurrentStep(2)}
              >
                ← Назад
              </button>
              <button
                type="submit"
                className="btn-primary btn-large"
                disabled={!canSubmit}
              >
                {saving ? (
                  <>
                    <span className="spinner" />
                    Публикация...
                  </>
                ) : (
                  <>
                    <span>📢 Опубликовать</span>
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Подсказка об обязательных полях */}
        {!canSubmit && !saving && currentStep === 3 && (
          <div className="required-hint">
            <span className="hint-icon">ℹ️</span>
            <span>Заполните обязательные поля: <strong>Название</strong>, <strong>Категория</strong>, <strong>Город</strong>, <strong>Цена</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}