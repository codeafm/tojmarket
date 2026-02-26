import React from "react";
import { Link } from "react-router-dom";

export default function Terms() {
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
          <span className="title-icon">📜</span>
          Условия использования
        </h1>
        
        <div className="legal-content">
          <p className="last-updated">Последнее обновление: 22 февраля 2026 г.</p>

          <section className="legal-section">
            <h2>1. Общие положения</h2>
            <p>
              Настоящие Условия использования (далее — Условия) регулируют отношения между 
              TojMarket (далее — Платформа) и пользователями (далее — Пользователь) при 
              использовании сервисов Платформы.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Регистрация и аккаунт</h2>
            <p>
              Для использования некоторых функций Платформы необходима регистрация. Пользователь 
              обязуется предоставлять достоверную информацию при регистрации и несет ответственность 
              за сохранность своих учетных данных.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Правила размещения объявлений</h2>
            <ul>
              <li>Запрещено размещать объявления, противоречащие законодательству РТ</li>
              <li>Запрещено размещать контрафактную продукцию</li>
              <li>Объявления должны соответствовать выбранной категории</li>
              <li>Фотографии должны быть реальными и соответствовать товару</li>
              <li>Цена должна быть указана в сомони (TJS)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Ответственность сторон</h2>
            <p>
              Платформа является лишь площадкой для размещения объявлений и не участвует в 
              сделках между пользователями. Вся ответственность за сделки лежит на самих 
              пользователях.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Безопасность сделок</h2>
            <p>
              Мы рекомендуем:
            </p>
            <ul>
              <li>Встречаться в публичных местах для совершения сделок</li>
              <li>Не переводить предоплату незнакомым лицам</li>
              <li>Проверять товар перед покупкой</li>
              <li>Использовать чат на платформе для общения</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Блокировка и удаление аккаунта</h2>
            <p>
              Платформа оставляет за собой право блокировать или удалять аккаунты пользователей 
              при нарушении настоящих Условий без предварительного уведомления.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Изменение условий</h2>
            <p>
              Мы можем изменять настоящие Условия в любое время. Изменения вступают в силу с 
              момента их публикации на данной странице.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Контакты для связи</h2>
            <div className="contact-info">
              <p>📧 Email: support@tojmarket.tj</p>
              <p>📞 Телефон: +992 111 14 20 22</p>
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