// src/pages/Privacy.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Privacy.css";

export default function Privacy() {
  return (
    <div className="privacy-page">
      {/* Кнопка назад */}
      <div className="back-nav">
        <Link className="back-link" to="/">
          <span className="back-arrow">←</span>
          На главную
        </Link>
      </div>

      <div className="privacy-card">
        <div className="privacy-header">
          <div className="header-icon">🔒</div>
          <h1 className="privacy-title">Политика конфиденциальности</h1>
          <p className="privacy-subtitle">Мы заботимся о безопасности ваших данных</p>
        </div>
        
        <div className="privacy-content">
          <div className="last-updated">
            <span className="updated-icon">📅</span>
            Последнее обновление: 22 февраля 2026 г.
          </div>

          {/* Секция 1 */}
          <section className="privacy-section fade-in">
            <div className="section-icon">📋</div>
            <div className="section-content">
              <h2>Общие положения</h2>
              <p>
                Настоящая Политика конфиденциальности действует в отношении всей информации, 
                которую <strong>TojMarket</strong> может получить о пользователе во время использования 
                сайта, программ и продуктов Платформы.
              </p>
            </div>
          </section>

          {/* Секция 2 */}
          <section className="privacy-section fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="section-icon">📊</div>
            <div className="section-content">
              <h2>Какие данные мы собираем</h2>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-icon">📧</span>
                  <span>Адрес электронной почты</span>
                </div>
                <div className="data-item">
                  <span className="data-icon">📱</span>
                  <span>Номер телефона</span>
                </div>
                <div className="data-item">
                  <span className="data-icon">👤</span>
                  <span>Имя и фамилия</span>
                </div>
                <div className="data-item">
                  <span className="data-icon">📍</span>
                  <span>Город проживания</span>
                </div>
                <div className="data-item">
                  <span className="data-icon">📸</span>
                  <span>Фотографии объявлений</span>
                </div>
                <div className="data-item">
                  <span className="data-icon">💬</span>
                  <span>История переписки</span>
                </div>
              </div>
            </div>
          </section>

          {/* Секция 3 */}
          <section className="privacy-section fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="section-icon">⚙️</div>
            <div className="section-content">
              <h2>Как мы используем ваши данные</h2>
              <ul className="usage-list">
                <li>✅ Создания и управления аккаунтом</li>
                <li>✅ Публикации объявлений</li>
                <li>✅ Связи между покупателями и продавцами</li>
                <li>✅ Улучшения работы платформы</li>
                <li>✅ Безопасности и предотвращения мошенничества</li>
              </ul>
            </div>
          </section>

          {/* Секция 4 */}
          <section className="privacy-section fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="section-icon">🛡️</div>
            <div className="section-content">
              <h2>Защита данных</h2>
              <p>
                Мы принимаем все необходимые меры для защиты ваших персональных данных от 
                несанкционированного доступа, изменения, раскрытия или уничтожения. Ваши данные 
                хранятся на защищенных серверах с использованием современных технологий шифрования.
              </p>
            </div>
          </section>

          {/* Секция 5 */}
          <section className="privacy-section fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="section-icon">🚫</div>
            <div className="section-content">
              <h2>Передача данных третьим лицам</h2>
              <p>
                Мы не передаем ваши персональные данные третьим лицам, за исключением случаев, 
                предусмотренных законодательством Республики Таджикистан.
              </p>
            </div>
          </section>

          {/* Секция 6 */}
          <section className="privacy-section fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="section-icon">🍪</div>
            <div className="section-content">
              <h2>Файлы cookie</h2>
              <p>
                Наш сайт использует файлы cookie для улучшения работы и анализа посещаемости. 
                Вы можете отключить использование cookie в настройках браузера.
              </p>
            </div>
          </section>

          {/* Секция 7 */}
          <section className="privacy-section fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="section-icon">📝</div>
            <div className="section-content">
              <h2>Изменения в политике</h2>
              <p>
                Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. 
                Все изменения будут опубликованы на этой странице.
              </p>
            </div>
          </section>

          {/* Секция 8 */}
          <section className="privacy-section fade-in" style={{ animationDelay: "0.7s" }}>
            <div className="section-icon">📞</div>
            <div className="section-content">
              <h2>Контакты</h2>
              <div className="contact-info">
                <p>📧 Email: privacy@tojmarket.tj</p>
                <p>📞 Телефон: +992 111 14 20 22</p>
                <p>📍 Адрес: г. Душанбе, ул. Рудаки 123</p>
              </div>
            </div>
          </section>
        </div>

        <div className="privacy-footer">
          <Link to="/" className="btn-primary">
            <span className="btn-icon">🏠</span>
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}