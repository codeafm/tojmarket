// src/pages/Terms.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Terms.css";

export default function Terms() {
  return (
    <div className="terms-page">
      {/* Кнопка назад */}
      <div className="back-nav">
        <Link className="back-link" to="/">
          <span className="back-arrow">←</span>
          На главную
        </Link>
      </div>

      <div className="terms-card">
        <div className="terms-header">
          <div className="header-icon">📜</div>
          <h1 className="terms-title">Условия использования</h1>
          <p className="terms-subtitle">Правила и условия пользования платформой TojMarket</p>
        </div>
        
        <div className="terms-content">
          <div className="last-updated">
            <span className="updated-icon">📅</span>
            Последнее обновление: 22 февраля 2026 г.
          </div>

          {/* Секция 1 */}
          <section className="terms-section fade-in">
            <div className="section-icon">📋</div>
            <div className="section-content">
              <h2>Общие положения</h2>
              <p>
                Настоящие Условия использования регулируют отношения между 
                <strong> TojMarket </strong> 
                и пользователями при использовании сервисов Платформы.
              </p>
            </div>
          </section>

          {/* Секция 2 */}
          <section className="terms-section fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="section-icon">👤</div>
            <div className="section-content">
              <h2>Регистрация и аккаунт</h2>
              <p>
                Для использования некоторых функций Платформы необходима регистрация. Пользователь 
                обязуется предоставлять достоверную информацию при регистрации и несет ответственность 
                за сохранность своих учетных данных.
              </p>
            </div>
          </section>

          {/* Секция 3 */}
          <section className="terms-section fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="section-icon">📢</div>
            <div className="section-content">
              <h2>Правила размещения объявлений</h2>
              <ul className="rules-list">
                <li>🚫 Запрещено размещать объявления, противоречащие законодательству РТ</li>
                <li>🚫 Запрещено размещать контрафактную продукцию</li>
                <li>✅ Объявления должны соответствовать выбранной категории</li>
                <li>✅ Фотографии должны быть реальными и соответствовать товару</li>
                <li>💰 Цена должна быть указана в сомони (TJS)</li>
              </ul>
            </div>
          </section>

          {/* Секция 4 */}
          <section className="terms-section fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="section-icon">⚖️</div>
            <div className="section-content">
              <h2>Ответственность сторон</h2>
              <p>
                Платформа является лишь площадкой для размещения объявлений и не участвует в 
                сделках между пользователями. Вся ответственность за сделки лежит на самих 
                пользователях.
              </p>
            </div>
          </section>

          {/* Секция 5 */}
          <section className="terms-section fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="section-icon">🛡️</div>
            <div className="section-content">
              <h2>Безопасность сделок</h2>
              <p className="recommendation-text">Мы рекомендуем:</p>
              <div className="safety-grid">
                <div className="safety-item">
                  <span className="safety-icon">📍</span>
                  <span>Встречаться в публичных местах</span>
                </div>
                <div className="safety-item">
                  <span className="safety-icon">💰</span>
                  <span>Не переводить предоплату</span>
                </div>
                <div className="safety-item">
                  <span className="safety-icon">🔍</span>
                  <span>Проверять товар перед покупкой</span>
                </div>
                <div className="safety-item">
                  <span className="safety-icon">💬</span>
                  <span>Использовать чат на платформе</span>
                </div>
              </div>
            </div>
          </section>

          {/* Секция 6 */}
          <section className="terms-section fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="section-icon">🔒</div>
            <div className="section-content">
              <h2>Блокировка и удаление аккаунта</h2>
              <p>
                Платформа оставляет за собой право блокировать или удалять аккаунты пользователей 
                при нарушении настоящих Условий без предварительного уведомления.
              </p>
            </div>
          </section>

          {/* Секция 7 */}
          <section className="terms-section fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="section-icon">📝</div>
            <div className="section-content">
              <h2>Изменение условий</h2>
              <p>
                Мы можем изменять настоящие Условия в любое время. Изменения вступают в силу с 
                момента их публикации на данной странице.
              </p>
            </div>
          </section>

          {/* Секция 8 */}
          <section className="terms-section fade-in" style={{ animationDelay: "0.7s" }}>
            <div className="section-icon">📞</div>
            <div className="section-content">
              <h2>Контакты для связи</h2>
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div className="contact-details">
                    <span className="contact-label">Email:</span>
                    <a href="mailto:support@tojmarket.tj" className="contact-value">support@tojmarket.tj</a>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <div className="contact-details">
                    <span className="contact-label">Телефон:</span>
                    <a href="tel:+992111142022" className="contact-value">+992 111 14 20 22</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="terms-footer">
          <Link to="/" className="btn-primary">
            <span className="btn-icon">🏠</span>
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}