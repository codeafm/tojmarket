import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../firebase/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Перенаправляем, если пользователь уже авторизован
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/";
      nav(from, { replace: true });
    }
  }, [user, nav, location]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setErr("");
    setSuccess("");

    const e1 = email.trim();
    if (!e1) return setErr("Введите email");
    if (!password) return setErr("Введите пароль");

    setLoading(true);
    try {
      await loginUser({ email: e1, password });
      setSuccess("Успешный вход! Перенаправляем...");
      
      // Перенаправление на предыдущую страницу или на главную
      setTimeout(() => {
        const from = location.state?.from?.pathname || "/";
        nav(from, { replace: true });
      }, 1000);
    } catch (e2) {
      setErr(prettyAuthError(e2));
    } finally {
      setLoading(false);
    }
  }

  // Быстрые демо-аккаунты для тестирования
  const fillDemoAccount = (type) => {
    if (type === 'user') {
      setEmail('user@example.com');
      setPassword('password123');
    } else if (type === 'admin') {
      setEmail('admin@example.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Левая декоративная часть */}
        <div className="auth-hero">
          <div className="auth-hero-content">
            <div className="auth-logo">TM</div>
            <h1 className="auth-hero-title">Добро пожаловать!</h1>
            <p className="auth-hero-subtitle">
              Войдите в свой аккаунт, чтобы получить доступ ко всем возможностям TojMarket
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-icon">📱</span>
                <span>Публикуйте объявления</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">💬</span>
                <span>Общайтесь с продавцами</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">❤️</span>
                <span>Сохраняйте в избранное</span>
              </div>
            </div>
          </div>
        </div>

        {/* Правая часть с формой */}
        <div className="auth-form-container">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Вход в аккаунт</h2>
              <p className="auth-form-subtitle">
                Нет аккаунта?{" "}
                <Link to="/register" className="auth-link">
                  Зарегистрироваться
                </Link>
              </p>
            </div>

            {/* Демо-аккаунты (только для разработки) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="demo-accounts">
                <p className="demo-title">Демо-аккаунты:</p>
                <div className="demo-buttons">
                  <button 
                    type="button"
                    className="demo-btn"
                    onClick={() => fillDemoAccount('user')}
                  >
                    Пользователь
                  </button>
                  <button 
                    type="button"
                    className="demo-btn"
                    onClick={() => fillDemoAccount('admin')}
                  >
                    Админ
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="auth-form">
              {/* Поле Email */}
              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-icon">📧</span>
                  Email
                </label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={loading}
                />
              </div>

              {/* Поле Пароль */}
              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-icon">🔒</span>
                  Пароль
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-input password-input"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Дополнительные опции */}
              <div className="auth-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Запомнить меня</span>
                </label>
                <Link to="/forgot-password" className="auth-link forgot-link">
                  Забыли пароль?
                </Link>
              </div>

              {/* Сообщения об ошибках/успехе */}
              {err && (
                <div className="auth-message error">
                  <span className="message-icon">⚠️</span>
                  <span>{err}</span>
                </div>
              )}

              {success && (
                <div className="auth-message success">
                  <span className="message-icon">✅</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Кнопка входа */}
              <button 
                className="auth-submit-btn" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Вход...
                  </>
                ) : (
                  "Войти"
                )}
              </button>

              {/* Альтернативные способы входа */}
              <div className="auth-divider">
                <span className="divider-text">или войдите с помощью</span>
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
            </form>

            {/* Ссылка на главную */}
            <div className="auth-back-home">
              <Link to="/" className="back-home-link">
                ← Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function prettyAuthError(e) {
  const code = e?.code || "";

  const errorMap = {
    "auth/missing-email": "Введите email",
    "auth/invalid-email": "Неверный формат email",
    "auth/invalid-credential": "Неверный email или пароль",
    "auth/user-not-found": "Пользователь не найден",
    "auth/wrong-password": "Неверный пароль",
    "auth/too-many-requests": "Слишком много попыток. Попробуйте позже.",
    "auth/network-request-failed": "Проблема с интернетом. Проверьте соединение.",
    "auth/user-disabled": "Аккаунт отключен",
    "auth/email-already-in-use": "Email уже используется",
    "auth/weak-password": "Слишком простой пароль",
    "auth/operation-not-allowed": "Операция не разрешена",
    "auth/account-exists-with-different-credential": "Аккаунт уже существует с другими данными входа",
    "auth/invalid-verification-code": "Неверный код подтверждения",
    "auth/invalid-verification-id": "Неверный ID подтверждения",
  };

  return errorMap[code] || e?.message || "Ошибка входа. Попробуйте снова.";
}