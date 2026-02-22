import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../firebase/auth.js";

export default function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    city: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку для этого поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Введите имя пользователя";
    } else if (formData.username.length < 3) {
      newErrors.username = "Минимум 3 символа";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Введите email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Неверный формат email";
    }

    if (!formData.password) {
      newErrors.password = "Введите пароль";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен быть минимум 6 символов";
    }

    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Неверный формат телефона";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccess("");

    try {
      await registerUser(formData);
      setSuccess("Аккаунт успешно создан!");
      setTimeout(() => nav("/profile"), 2000);
    } catch (err) {
      setErrors({ form: err?.message || "Ошибка регистрации" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Левая декоративная часть */}
        <div className="auth-hero">
          <div className="auth-hero-content">
            <div className="auth-logo">TM</div>
            <h1 className="auth-hero-title">Присоединяйтесь к TojMarket!</h1>
            <p className="auth-hero-subtitle">
              Создайте аккаунт и начните продавать или покупать товары в Таджикистане
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-icon">📱</span>
                <span>Публикуйте объявления бесплатно</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">💬</span>
                <span>Общайтесь с покупателями</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">❤️</span>
                <span>Сохраняйте избранное</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">📊</span>
                <span>Отслеживайте статистику</span>
              </div>
            </div>
          </div>
        </div>

        {/* Правая часть с формой */}
        <div className="auth-form-container">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Создать аккаунт</h2>
              <p className="auth-form-subtitle">
                Уже есть аккаунт?{" "}
                <Link to="/login" className="auth-link">
                  Войти
                </Link>
              </p>
            </div>

            {/* Прогресс бар */}
            <div className="register-progress">
              <div className="progress-step active">
                <span className="step-number">1</span>
                <span className="step-label">Данные</span>
              </div>
              <div className="progress-line" />
              <div className="progress-step">
                <span className="step-number">2</span>
                <span className="step-label">Контакты</span>
              </div>
            </div>

            {/* Ошибка формы */}
            {errors.form && (
              <div className="auth-message error">
                <span className="message-icon">⚠️</span>
                <span>{errors.form}</span>
              </div>
            )}

            {/* Успех */}
            {success && (
              <div className="auth-message success">
                <span className="message-icon">✅</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="auth-form">
              {/* Блок 1: Основные данные */}
              <div className="form-section">
                <h3 className="form-section-title">Основные данные</h3>
                
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    name="username"
                    className={`form-input ${errors.username ? 'error' : ''}`}
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Например: john_doe"
                    disabled={loading}
                  />
                  {errors.username && (
                    <span className="form-error">{errors.username}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📧</span>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <span className="form-error">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🔒</span>
                    Пароль
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={`form-input ${errors.password ? 'error' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Минимум 6 символов"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="form-error">{errors.password}</span>
                  )}
                  <div className="password-strength">
                    <div className={`strength-bar ${formData.password.length >= 6 ? 'strong' : formData.password.length >= 3 ? 'medium' : ''}`} />
                    <span className="strength-text">
                      {formData.password.length === 0 && "Введите пароль"}
                      {formData.password.length > 0 && formData.password.length < 3 && "Слишком короткий"}
                      {formData.password.length >= 3 && formData.password.length < 6 && "Средний"}
                      {formData.password.length >= 6 && "Надёжный"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Блок 2: Контактная информация */}
              <div className="form-section">
                <h3 className="form-section-title">Контактная информация</h3>
                <p className="form-section-subtitle">Необязательно, но поможет покупателям связаться с вами</p>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📱</span>
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+992 900 000 000"
                      disabled={loading}
                    />
                    {errors.phone && (
                      <span className="form-error">{errors.phone}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">💬</span>
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      className="form-input"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="+992 900 000 000"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📍</span>
                    Город
                  </label>
                  <input
                    type="text"
                    name="city"
                    className="form-input"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Душанбе, Худжанд, Бохтар..."
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Согласие */}
              <div className="form-group terms-group">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span>
                    Я соглашаюсь с <Link to="/terms" className="terms-link">условиями использования</Link> и{" "}
                    <Link to="/privacy" className="terms-link">политикой конфиденциальности</Link>
                  </span>
                </label>
              </div>

              {/* Кнопки */}
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary submit-btn" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Создание аккаунта...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">✨</span>
                      Создать аккаунт
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="btn-ghost" 
                  onClick={() => nav("/")}
                  disabled={loading}
                >
                  Вернуться на главную
                </button>
              </div>
            </form>

            {/* Альтернативный вход */}
            <div className="auth-divider">
              <span className="divider-text">или зарегистрируйтесь через</span>
            </div>

            <div className="social-auth">
              <button type="button" className="social-btn google" disabled={loading}>
                <span className="social-icon">G</span>
                <span>Google</span>
              </button>
              <button type="button" className="social-btn facebook" disabled={loading}>
                <span className="social-icon">f</span>
                <span>Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}