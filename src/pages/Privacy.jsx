import React from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
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
          <span className="title-icon">🔒</span>
          Политика конфиденциальности
        </h1>
        
        <div className="legal-content">
          <p className="last-updated">Последнее обновление: 22 февраля 2026 г.</p>

          <section className="legal-section">
            <h2>1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности (далее — Политика) действует в отношении всей информации, 
              которую TojMarket (далее — Платформа) может получить о пользователе во время использования сайта, 
              программ и продуктов Платформы.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Какие данные мы собираем</h2>
            <ul>
              <li>📧 Адрес электронной почты</li>
              <li>📱 Номер телефона</li>
              <li>👤 Имя и фамилия</li>
              <li>📍 Город проживания</li>
              <li>📸 Фотографии объявлений</li>
              <li>💬 История переписки в чатах</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Как мы используем ваши данные</h2>
            <p>Ваши данные используются для:</p>
            <ul>
              <li>✅ Создания и управления аккаунтом</li>
              <li>✅ Публикации объявлений</li>
              <li>✅ Связи между покупателями и продавцами</li>
              <li>✅ Улучшения работы платформы</li>
              <li>✅ Безопасности и предотвращения мошенничества</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Защита данных</h2>
            <p>
              Мы принимаем все необходимые меры для защиты ваших персональных данных от 
              несанкционированного доступа, изменения, раскрытия или уничтожения. Ваши данные 
              хранятся на защищенных серверах с использованием современных технологий шифрования.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Передача данных третьим лицам</h2>
            <p>
              Мы не передаем ваши персональные данные третьим лицам, за исключением случаев, 
              предусмотренных законодательством Республики Таджикистан.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Файлы cookie</h2>
            <p>
              Наш сайт использует файлы cookie для улучшения работы и анализа посещаемости. 
              Вы можете отключить использование cookie в настройках браузера.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Изменения в политике конфиденциальности</h2>
            <p>
              Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. 
              Все изменения будут опубликованы на этой странице.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Контактная информация</h2>
            <p>
              По вопросам, связанным с конфиденциальностью, вы можете связаться с нами:
            </p>
            <div className="contact-info">
              <p>📧 Email: privacy@tojmarket.tj</p>
              <p>📞 Телефон: +992 111 14 20 22</p>
              <p>📍 Адрес: г. Душанбе, ул. Рудаки 123</p>
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