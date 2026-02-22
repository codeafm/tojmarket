import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Обработка движения мыши для параллакс-эффекта
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Таймер обратного отсчета
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Случайные числа для 404 анимации
  const randomNumbers = Array.from({ length: 20 }, () => 
    Math.floor(Math.random() * 10)
  );

  return (
    <div className="not-found-page">
      {/* Фоновый шум */}
      <div className="not-found-noise" />
      
      {/* Анимированный фон с числами */}
      <div className="not-found-background">
        {randomNumbers.map((num, i) => (
          <span 
            key={i} 
            className="floating-number"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          >
            {num}
          </span>
        ))}
      </div>

      {/* Основной контент с параллаксом */}
      <div 
        className="not-found-content"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
        }}
      >
        {/* Большая цифра 404 с эффектом */}
        <div className="not-found-404">
          <span className="digit">4</span>
          <span 
            className="digit zero"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            0
            <div className={`zero-glow ${isHovering ? 'active' : ''}`} />
          </span>
          <span className="digit">4</span>
        </div>

        {/* Текст ошибки */}
        <h1 className="not-found-title">
          Страница не найдена
        </h1>
        
        <p className="not-found-description">
          Возможно, она была перемещена, удалена или никогда не существовала.
          <br />
          Но не волнуйтесь, у нас есть много других интересных страниц!
        </p>

        {/* Статус-бар */}
        <div className="not-found-status">
          <div className="status-item">
            <span className="status-label">Код ошибки</span>
            <span className="status-value">404</span>
          </div>
          <div className="status-item">
            <span className="status-label">Перенаправление через</span>
            <span className="status-value countdown">{countdown}с</span>
          </div>
          <div className="status-item">
            <span className="status-label">Состояние</span>
            <span className="status-value lost">Потеряно</span>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="not-found-actions">
          <Link to="/" className="action-btn primary">
            <span className="btn-icon">🏠</span>
            На главную
          </Link>
          
          <Link to="/listings" className="action-btn secondary">
            <span className="btn-icon">📱</span>
            К объявлениям
          </Link>
          
          <button 
            onClick={() => navigate(-1)} 
            className="action-btn ghost"
          >
            <span className="btn-icon">←</span>
            Назад
          </button>
        </div>

        {/* Поисковая подсказка */}
        <div className="not-found-search-hint">
          <span className="hint-icon">🔍</span>
          <span className="hint-text">
            Ищете что-то конкретное? 
            <Link to="/listings" className="hint-link">Перейдите к поиску</Link>
          </span>
        </div>

        {/* Забавные ссылки */}
        <div className="not-found-fun-links">
          <p className="fun-links-title">А пока вы здесь:</p>
          <div className="fun-links-grid">
            <Link to="/" className="fun-link">
              <span className="fun-emoji">🏠</span>
              <span>Домой</span>
            </Link>
            <Link to="/listings" className="fun-link">
              <span className="fun-emoji">📦</span>
              <span>Товары</span>
            </Link>
            <Link to="/vin" className="fun-link">
              <span className="fun-emoji">🚗</span>
              <span>VIN</span>
            </Link>
            <Link to="/profile" className="fun-link">
              <span className="fun-emoji">👤</span>
              <span>Профиль</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Декоративные элементы */}
      <div className="not-found-decoration">
        <div className="decoration-circle circle1" />
        <div className="decoration-circle circle2" />
        <div className="decoration-circle circle3" />
      </div>
    </div>
  );
}