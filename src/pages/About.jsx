// src/pages/About.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./About.css"; // Подключаем CSS файл

export default function About() {
  return (
    <div className="about-page">
      {/* Кнопка назад */}
      <div className="back-nav">
        <Link className="back-link" to="/">
          <span className="back-arrow">←</span>
          На главную
        </Link>
      </div>

      <div className="about-card">
        <div className="about-header">
          <div className="header-icon">ℹ️</div>
          <h1 className="about-title">О нас</h1>
          <p className="about-subtitle">TojMarket — ваш надежный помощник в мире покупок и продаж</p>
        </div>
        
        <div className="about-content">
          {/* Кто мы */}
          <section className="about-section fade-in">
            <div className="section-icon">👋</div>
            <div className="section-content">
              <h2>Кто мы</h2>
              <p>
                <strong>TojMarket</strong> — это крупнейшая онлайн-платформа для купли-продажи товаров 
                и услуг в Таджикистане. Мы соединяем миллионы покупателей и продавцов, делая процесс 
                покупки и продажи простым, безопасным и удобным.
              </p>
            </div>
          </section>

          {/* Наша миссия */}
          <section className="about-section fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="section-icon">🎯</div>
            <div className="section-content">
              <h2>Наша миссия</h2>
              <p>
                Наша миссия — создать самую надежную и удобную площадку для торговли в Таджикистане, 
                где каждый может легко и безопасно продать ненужные вещи или найти товар своей мечты.
              </p>
            </div>
          </section>

          {/* Наши ценности */}
          <section className="about-section fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="section-icon">💎</div>
            <div className="section-content">
              <h2>Наши ценности</h2>
              <div className="values-grid">
                <div className="value-card">
                  <div className="value-icon">🛡️</div>
                  <h3>Безопасность</h3>
                  <p>Мы защищаем наших пользователей от мошенников</p>
                </div>
                <div className="value-card">
                  <div className="value-icon">⚡</div>
                  <h3>Скорость</h3>
                  <p>Мгновенная публикация и быстрый поиск</p>
                </div>
                <div className="value-card">
                  <div className="value-icon">🤝</div>
                  <h3>Доверие</h3>
                  <p>Прозрачные условия и честные сделки</p>
                </div>
                <div className="value-card">
                  <div className="value-icon">🌍</div>
                  <h3>Доступность</h3>
                  <p>Сервис доступен каждому жителю Таджикистана</p>
                </div>
              </div>
            </div>
          </section>

          {/* Наша история */}
          <section className="about-section fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="section-icon">📜</div>
            <div className="section-content">
              <h2>Наша история</h2>
              <p>
                TojMarket был основан в 2024 году группой энтузиастов, которые хотели создать 
                современную площадку для торговли в Таджикистане. За короткое время мы выросли 
                в крупнейший сервис объявлений в стране.
              </p>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-number">500K+</span>
                  <span className="stat-label">пользователей</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">50K+</span>
                  <span className="stat-label">объявлений</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">поддержка</span>
                </div>
              </div>
            </div>
          </section>

          {/* Наша команда */}
          <section className="about-section fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="section-icon">👥</div>
            <div className="section-content">
              <h2>Наша команда</h2>
              <p>
                Мы — команда профессионалов, которые любят то, что делают. В нашей команде 
                разработчики, дизайнеры, маркетологи и специалисты поддержки, которые каждый день 
                работают над улучшением сервиса.
              </p>
            </div>
          </section>

          {/* Контакты */}
          <section className="about-section fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="section-icon">📞</div>
            <div className="section-content">
              <h2>Контакты</h2>
              <div className="contact-grid">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div className="contact-details">
                    <span className="contact-label">Email:</span>
                    <a href="mailto:info@tojmarket.tj" className="contact-value">info@tojmarket.tj</a>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <div className="contact-details">
                    <span className="contact-label">Телефон:</span>
                    <a href="tel:+992111142022" className="contact-value">+992 111 14 20 22</a>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <div className="contact-details">
                    <span className="contact-label">Адрес:</span>
                    <span className="contact-value">г. Душанбе, ул. Рудаки 123</span>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🕒</span>
                  <div className="contact-details">
                    <span className="contact-label">Время работы:</span>
                    <span className="contact-value">круглосуточно</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="about-footer">
          <Link to="/" className="btn-primary">
            <span className="btn-icon">🏠</span>
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}