// src/pages/About.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      {/* Кнопка назад */}
      <div className="back-nav">
        <Link className="back-link" to="/">
          <span className="back-arrow">←</span>
          <span>На главную</span>
        </Link>
      </div>

      <div className="about-card">
        {/* Заголовок */}
        <div className="about-header">
          <div className="header-icon">🚀</div>
          <h1 className="about-title">О проекте TojMarket</h1>
          <p className="about-subtitle">
            Новый современный сервис объявлений в Таджикистане
          </p>
        </div>
        
        {/* Контент */}
        <div className="about-content">
          {/* Кто мы */}
          <section className="about-section fade-in">
            <div className="section-icon">👋</div>
            <div className="section-content">
              <h2>Приветствуем вас!</h2>
              <p>
                <strong>TojMarket</strong> — это новый, современный сервис 
                для размещения объявлений в Таджикистане. Мы только начинаем 
                свой путь и хотим сделать процесс купли-продажи максимально 
                простым и удобным для всех жителей страны.
              </p>
            </div>
          </section>

          {/* Почему мы */}
          <section className="about-section fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="section-icon">✨</div>
            <div className="section-content">
              <h2>Почему мы?</h2>
              <p>
                Мы создали TojMarket, потому что видим потребность в современной, 
                быстрой и удобной платформе для объявлений. Наш подход — это:
              </p>
              <ul className="feature-list">
                <li>✅ Простой и понятный интерфейс</li>
                <li>✅ Быстрая загрузка и публикация</li>
                <li>✅ Удобный поиск и фильтры</li>
                <li>✅ Современный дизайн</li>
                <li>✅ Адаптация под мобильные устройства</li>
              </ul>
            </div>
          </section>

          {/* Что мы предлагаем */}
          <section className="about-section fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="section-icon">🎁</div>
            <div className="section-content">
              <h2>Что мы предлагаем</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📱</div>
                  <h3>Для покупателей</h3>
                  <p>Удобный поиск, категории, фильтры и избранное</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💼</div>
                  <h3>Для продавцов</h3>
                  <p>Быстрое размещение объявлений с фотографиями</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💬</div>
                  <h3>Общение</h3>
                  <p>Встроенный чат для связи между покупателями и продавцами</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🌓</div>
                  <h3>Темная тема</h3>
                  <p>Комфортное использование днём и ночью</p>
                </div>
              </div>
            </div>
          </section>

          {/* Наши планы */}
          <section className="about-section fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="section-icon">📈</div>
            <div className="section-content">
              <h2>Наши планы</h2>
              <p>
                Мы только в начале пути! В ближайшее время мы планируем:
              </p>
              <ul className="plan-list">
                <li>🔜 Добавить мобильное приложение</li>
                <li>🔜 Расширить категории товаров</li>
                <li>🔜 Внедрить систему рейтингов и отзывов</li>
                <li>🔜 Добавить возможность оплаты онлайн</li>
                <li>🔜 Сделать сервис доступным во всех регионах Таджикистана</li>
              </ul>
            </div>
          </section>

          {/* Приглашение */}
          <section className="about-section fade-in highlight" style={{ animationDelay: "0.4s" }}>
            <div className="section-icon">🤝</div>
            <div className="section-content">
              <h2>Присоединяйтесь!</h2>
              <p>
                TojMarket — это молодой и амбициозный проект. Мы будем рады 
                каждому пользователю, который решит разместить объявление или 
                найти что-то нужное на нашей платформе. Вместе мы сделаем сервис 
                лучше!
              </p>
              <div className="cta-buttons">
                <Link to="/listings" className="btn-primary">
                  <span className="btn-icon">🔍</span>
                  <span>Смотреть объявления</span>
                </Link>
                <Link to="/create" className="btn-secondary">
                  <span className="btn-icon">📝</span>
                  <span>Разместить объявление</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Контакты */}
          <section className="about-section fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="section-icon">📞</div>
            <div className="section-content">
              <h2>Обратная связь</h2>
              <p>
                Мы открыты к диалогу и всегда рады вашим предложениям по улучшению сервиса!
              </p>
              <div className="contact-grid">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div className="contact-details">
                    <span className="contact-label">Email:</span>
                    <a href="mailto:info@tojmarket.tj" className="contact-value">
                      info@tojmarket.tj
                    </a>
                  </div>
                </div>
                
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <div className="contact-details">
                    <span className="contact-label">Telegram:</span>
                    <a href="https://t.me/tojmarket" className="contact-value" target="_blank" rel="noopener noreferrer">
                      @tojmarket
                    </a>
                  </div>
                </div>
                
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <div className="contact-details">
                    <span className="contact-label">Instagram:</span>
                    <a href="https://instagram.com/tojmarket" className="contact-value" target="_blank" rel="noopener noreferrer">
                      @tojmarket
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Футер */}
        <div className="about-footer">
          <p className="footer-note">
            TojMarket — новый современный сервис объявлений в Таджикистане
          </p>
          <div className="footer-links">
            <Link to="/terms" className="footer-link">Условия использования</Link>
            <span className="footer-separator">•</span>
            <Link to="/privacy" className="footer-link">Конфиденциальность</Link>
          </div>
          <p className="footer-copyright">
            © {new Date().getFullYear()} TojMarket. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}