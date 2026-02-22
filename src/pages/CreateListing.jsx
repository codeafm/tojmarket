import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createListing } from "../firebase/listings.js";
import { useAuth } from "../context/AuthContext.jsx";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase.js";

function onlyDigits(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

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

  // spec fields
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [memory, setMemory] = useState("");
  const [ram, setRam] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [battery, setBattery] = useState("");

  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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
    
    // Создаем превью для выбранных файлов
    const previews = selectedFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  // Очистка превью при размонтировании
  React.useEffect(() => {
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

      const spec = {};
      if (brand.trim()) spec.brand = brand.trim();
      if (model.trim()) spec.model = model.trim();
      if (memory.trim()) spec.memory = memory.trim();
      if (ram.trim()) spec.ram = ram.trim();
      if (color.trim()) spec.color = color.trim();
      if (condition.trim()) spec.condition = condition.trim();
      if (battery.trim()) spec.battery = battery.trim();

      const payload = {
        title: title.trim(),
        category: category.trim(),
        city: city.trim(),
        description: description.trim(),
        plan,
        price: Number(onlyDigits(price)),
        photos: photoUrls,
        spec,
        ownerName: user?.displayName || "—",
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

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Необходима авторизация</h3>
        <p>Чтобы создать объявление, войдите в свой аккаунт</p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link to="/login" className="btnPrimary">Войти</Link>
          <Link to="/register" className="btnGhost">Регистрация</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing-page">
      {/* Шапка страницы */}
      <div className="pageHead">
        <div className="pageHead-left">
          <h1 className="pageTitle">Создать объявление</h1>
          <p className="pageSubtitle">
            {saving ? "Публикуем ваше объявление..." : "Заполните все поля и нажмите “Опубликовать”"}
          </p>
        </div>
        <div className="profile-status">
          <span className={`status-badge ${saving ? "loading" : ""}`}>
            {saving ? "⏳ Публикация" : "📝 Новое"}
          </span>
        </div>
      </div>

      {/* Кнопка назад */}
      <div style={{ marginBottom: "24px" }}>
        <Link className="btnGhost" to="/listings">
          ← Назад к объявлениям
        </Link>
      </div>

      {/* Карточка с формой */}
      <div className="card" style={{ padding: "32px" }}>
        {err && (
          <div className="empty-state" style={{ marginBottom: "24px", padding: "20px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)" }}>
            <div className="empty-icon" style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Ошибка</h3>
            <p style={{ color: "var(--danger)" }}>{err}</p>
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Основные поля */}
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">
                Название <span className="form-label-required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: iPhone 15 Pro Max"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Категория <span className="form-label-required">*</span>
              </label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
              >
                <option value="phones">Телефоны</option>
                <option value="tablets">Планшеты</option>
                <option value="laptops">Ноутбуки</option>
                <option value="accessories">Аксессуары</option>
                <option value="audio">Аудио</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Город <span className="form-label-required">*</span>
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
                Цена (TJS) <span className="form-label-required">*</span>
              </label>
              <div className="price-input-wrapper">
                <input
                  type="text"
                  className="form-input"
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
          </div>

          {/* Выбор плана */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Выберите план</h3>
              <span className="badge badge-secondary">Влияет на видимость</span>
            </div>
            <div className="plan-selector">
              {[
                { id: "base", label: "Базовый", gradient: "base" },
                { id: "vip", label: "VIP", gradient: "vip" },
                { id: "top", label: "TOP", gradient: "top" }
              ].map((p) => (
                <label
                  key={p.id}
                  className={`plan-option ${plan === p.id ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={plan === p.id}
                    onChange={(e) => setPlan(e.target.value)}
                    disabled={saving}
                  />
                  <span className={`plan-badge ${p.gradient}`}>
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Загрузка фото */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Фотографии</h3>
              <span className="badge badge-secondary">до 6 шт.</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Выберите фото</label>
              <input
                type="file"
                className="form-input"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={saving}
              />
              <p className="form-hint muted small" style={{ marginTop: "8px" }}>
                {files.length ? `Выбрано файлов: ${files.length}` : "Можно выбрать до 6 фотографий"}
              </p>
            </div>

            {/* Превью фото */}
            {filePreviews.length > 0 && (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: "12px",
                marginTop: "16px"
              }}>
                {filePreviews.map((preview, index) => (
                  <div key={index} style={{
                    aspectRatio: "1",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid var(--border)"
                  }}>
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Описание */}
          <div className="form-section">
            <h3 className="section-title">Описание</h3>
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите товар: состояние, комплектация, возможность торга и т.д."
                rows={5}
                disabled={saving}
              />
            </div>
          </div>

          {/* Характеристики */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Характеристики</h3>
              <span className="badge badge-secondary">необязательно</span>
            </div>
            
            <div className="specs-grid">
              <div className="form-group">
                <label className="form-label">Бренд</label>
                <input
                  type="text"
                  className="form-input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Apple"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Модель</label>
                <input
                  type="text"
                  className="form-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="iPhone 15 Pro Max"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Память</label>
                <input
                  type="text"
                  className="form-input"
                  value={memory}
                  onChange={(e) => setMemory(e.target.value)}
                  placeholder="256 ГБ"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">RAM</label>
                <input
                  type="text"
                  className="form-input"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="8 ГБ"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Цвет</label>
                <input
                  type="text"
                  className="form-input"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Черный"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Состояние</label>
                <input
                  type="text"
                  className="form-input"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="Новое"
                  disabled={saving}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Батарея (%)</label>
                <input
                  type="text"
                  className="form-input"
                  value={battery}
                  onChange={(e) => setBattery(e.target.value)}
                  placeholder="100"
                  inputMode="numeric"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="modal-footer" style={{ padding: "24px 0 0", marginTop: "24px" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => nav("/listings")}
              disabled={saving}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!canSubmit}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  Публикация...
                </>
              ) : (
                "Опубликовать"
              )}
            </button>
          </div>

          {/* Подсказка об обязательных полях */}
          {!canSubmit && !saving && (
            <div className="muted small" style={{ marginTop: "16px", textAlign: "center" }}>
              Заполните обязательные поля: <strong>Название</strong>, <strong>Категория</strong>, <strong>Город</strong>, <strong>Цена</strong>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}