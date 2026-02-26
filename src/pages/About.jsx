import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="legal-page">
      {/* Кнопка назад */}
      <div className="back-nav">
        <Link className="back-link" to="/">
          <span className="back-arrow">←</span>
          На главную
        </Link>
      </div>

      <div className="legal-card">
        <h1 className="legal-title">
          <span className="title-icon">ℹ️</span>
          О нас
        </h1>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>Кто мы</h2>
            <p>
              <strong>TojMarket</strong> — это крупнейшая онлайн-платформа для купли-продажи товаров и услуг в Таджикистане. 
              Мы соединяем миллионы покупателей и продавцов, делая процесс покупки и продажи простым, безопасным и удобным.
            </p>
          </section>

          <section className="legal-section">
            <h2>Наша миссия</h2>
            <p>
              Наша миссия — создать самую надежную и удобную площадку для торговли в Таджикистане, 
              где каждый может легко и безопасно продать ненужные вещи или найти товар своей мечты.
            </p>
          </section>

          <section className="legal-section">
            <h2>Наши ценности</h2>
            <div className="values-grid">
              <div className="value-card">
                <span className="value-icon">🛡️</span>
                <h3>Безопасность</h3>
                <p>Мы защищаем наших пользователей от мошенников</p>
              </div>
              <div className="value-card">
                <span className="value-icon">⚡</span>
                <h3>Скорость</h3>
                <p>Мгновенная публикация и быстрый поиск</p>
              </div>
              <div className="value-card">
                <span className="value-icon">🤝</span>
                <h3>Доверие</h3>
                <p>Прозрачные условия и честные сделки</p>
              </div>
              <div className="value-card">
                <span className="value-icon">🌍</span>
                <h3>Доступность</h3>
                <p>Сервис доступен каждому жителю Таджикистана</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>Наша история</h2>
            <p>
              TojMarket был основан в 2024 году группой энтузиастов, которые хотели создать 
              современную площадку для торговли в Таджикистане. За короткое время мы выросли 
              в крупнейший сервис объявлений в стране.
            </p>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">500K+</span>
                <span className="stat-label">пользователей</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50K+</span>
                <span className="stat-label">объявлений</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">поддержка</span>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>Наша команда</h2>
            <p>
              Мы — команда профессионалов, которые любят то, что делают. В нашей команде 
              разработчики, дизайнеры, маркетологи и специалисты поддержки, которые каждый день 
              работают над улучшением сервиса.
            </p>
          </section>

          <section className="legal-section">
            <h2>Контакты</h2>
            <div className="contact-info">
              <p>📧 Email: info@tojmarket.tj</p>
              <p>📞 Телефон: +992 111 14 20 22</p>
              <p>📍 Адрес: г. Душанбе, ул. Рудаки 123</p>
              <p>🕒 Время работы: круглосуточно</p>
            </div>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/" className="btn-primary">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}