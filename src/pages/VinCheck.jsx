import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { decodeVin } from "../firebase/vin.js";

export default function VinCheck() {
  const [sp] = useSearchParams();
  const [vin, setVin] = useState(sp.get("vin") || "");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Загрузка истории из localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vin_history");
    if (saved) {
      setHistory(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Автоматическая проверка из URL
  useEffect(() => {
    const v = sp.get("vin");
    if (v) onCheck(v);
  }, []);

  // Сохранение в историю
  const saveToHistory = (vin, result) => {
    const newHistory = [
      { 
        vin, 
        result: `${result.Make || ''} ${result.Model || ''}`.trim() || 'Неизвестно',
        date: new Date().toISOString()
      },
      ...history.filter(item => item.vin !== vin)
    ].slice(0, 5);
    
    setHistory(newHistory);
    localStorage.setItem("vin_history", JSON.stringify(newHistory));
  };

  async function onCheck(v) {
    if (!v || v.length !== 17) {
      setErr("VIN должен содержать 17 символов");
      return;
    }

    setErr("");
    setData(null);
    setLoading(true);

    try {
      const res = await decodeVin(v);
      setData(res);
      saveToHistory(v, res);
    } catch (e) {
      setErr(e.message || "Ошибка при проверке VIN");
    } finally {
      setLoading(false);
    }
  }

  // Форматирование VIN
  const formatVin = (v) => {
    return v.toUpperCase().replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="vin-page">
      {/* Герой секция */}
      <div className="vin-hero">
        <div className="vin-hero-content">
          <div className="vin-hero-icon">🔍</div>
          <h1 className="vin-hero-title">Проверка VIN-кода</h1>
          <p className="vin-hero-subtitle">
            Узнайте полную информацию об автомобиле по VIN-номеру
          </p>
        </div>
      </div>

      <div className="vin-container">
        {/* Основная карточка */}
        <div className="vin-card">
          <div className="vin-card-header">
            <h2 className="vin-card-title">Введите VIN</h2>
            <span className="vin-badge">Бесплатно</span>
          </div>

          <div className="vin-input-group">
            <div className="vin-input-wrapper">
              <input
                type="text"
                className="vin-input"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="1HGCM82633A004352"
                maxLength="17"
                disabled={loading}
              />
              <span className="vin-counter">{vin.length}/17</span>
            </div>

            <button 
              className="vin-check-btn"
              onClick={() => onCheck(vin)}
              disabled={loading || vin.length !== 17}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Проверка...
                </>
              ) : (
                <>
                  <span className="btn-icon">🔍</span>
                  Проверить VIN
                </>
              )}
            </button>
          </div>

          <div className="vin-disclaimer">
            <span className="disclaimer-icon">ℹ️</span>
            <p className="disclaimer-text">
              Бесплатная проверка показывает базовые характеристики автомобиля. 
              Для получения полной истории (аварии, пробег, залоги) требуется платная проверка.
            </p>
          </div>
        </div>

        {/* Результат проверки */}
        {loading && (
          <div className="vin-loading">
            <div className="vin-loading-spinner" />
            <p>Декодируем VIN-код...</p>
          </div>
        )}

        {err && (
          <div className="vin-error">
            <div className="vin-error-icon">⚠️</div>
            <div className="vin-error-content">
              <h3 className="vin-error-title">Ошибка проверки</h3>
              <p className="vin-error-message">{err}</p>
              <button 
                className="vin-error-retry"
                onClick={() => onCheck(vin)}
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}

        {data && !loading && (
          <div className="vin-result">
            <div className="vin-result-header">
              <h2 className="vin-result-title">
                <span className="result-icon">✅</span>
                Результат проверки
              </h2>
              <div className="vin-result-badge">
                VIN: {formatVin(data.VIN || vin)}
              </div>
            </div>

            <div className="vin-result-grid">
              {/* Основные характеристики */}
              <div className="vin-info-card">
                <div className="vin-info-header">
                  <span className="info-icon">🚗</span>
                  <h3>Основная информация</h3>
                </div>
                <div className="vin-info-content">
                  <VinInfoRow label="Марка" value={data.Make} />
                  <VinInfoRow label="Модель" value={data.Model} />
                  <VinInfoRow label="Год выпуска" value={data.ModelYear} />
                  <VinInfoRow label="Тип ТС" value={data.VehicleType} />
                  <VinInfoRow label="Тип кузова" value={data.BodyClass} />
                </div>
              </div>

              {/* Двигатель */}
              <div className="vin-info-card">
                <div className="vin-info-header">
                  <span className="info-icon">⚙️</span>
                  <h3>Двигатель</h3>
                </div>
                <div className="vin-info-content">
                  <VinInfoRow label="Модель" value={data.EngineModel} />
                  <VinInfoRow label="Объем (л)" value={data.DisplacementL} />
                  <VinInfoRow label="Мощность" value={data.EnginePower} />
                  <VinInfoRow label="Цилиндры" value={data.EngineCylinders} />
                  <VinInfoRow label="Конфигурация" value={data.EngineConfiguration} />
                </div>
              </div>

              {/* Трансмиссия */}
              <div className="vin-info-card">
                <div className="vin-info-header">
                  <span className="info-icon">🔧</span>
                  <h3>Трансмиссия</h3>
                </div>
                <div className="vin-info-content">
                  <VinInfoRow label="Коробка" value={data.TransmissionStyle} />
                  <VinInfoRow label="Привод" value={data.DriveType} />
                </div>
              </div>

              {/* Дополнительно */}
              <div className="vin-info-card">
                <div className="vin-info-header">
                  <span className="info-icon">📋</span>
                  <h3>Дополнительно</h3>
                </div>
                <div className="vin-info-content">
                  <VinInfoRow label="Страна" value={data.PlantCountry} />
                  <VinInfoRow label="Завод" value={data.PlantCity} />
                  <VinInfoRow label="Серия" value={data.Series} />
                  <VinInfoRow label="Класс" value={data.VehicleClass} />
                  <VinInfoRow label="Топливо" value={data.FuelTypePrimary} />
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="vin-result-actions">
              <button 
                className="vin-copy-btn"
                onClick={() => {
                  const result = Object.entries({
                    "Марка": data.Make,
                    "Модель": data.Model,
                    "Год": data.ModelYear,
                    "Кузов": data.BodyClass,
                    "Тип": data.VehicleType,
                    "Двигатель": data.EngineModel,
                    "Объем": data.DisplacementL,
                    "Привод": data.DriveType,
                    "Коробка": data.TransmissionStyle,
                    "Страна": data.PlantCountry
                  }).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
                  
                  navigator.clipboard.writeText(result);
                  alert('Результат скопирован в буфер обмена!');
                }}
              >
                <span className="btn-icon">📋</span>
                Копировать результат
              </button>
              
              <Link to="/listings?cat=auto" className="vin-search-btn">
                <span className="btn-icon">🔍</span>
                Искать авто
              </Link>
            </div>
          </div>
        )}

        {/* История проверок */}
        {history.length > 0 && !data && !loading && (
          <div className="vin-history">
            <h3 className="vin-history-title">Недавние проверки</h3>
            <div className="vin-history-list">
              {history.map((item, index) => (
                <button
                  key={index}
                  className="vin-history-item"
                  onClick={() => {
                    setVin(item.vin);
                    onCheck(item.vin);
                  }}
                >
                  <div className="history-vin">{formatVin(item.vin)}</div>
                  <div className="history-result">{item.result}</div>
                  <div className="history-date">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Примеры VIN */}
        <div className="vin-examples">
          <h3 className="vin-examples-title">Примеры VIN для теста</h3>
          <div className="vin-examples-grid">
            <ExampleCard 
              vin="1HGCM82633A004352"
              desc="Honda Accord 2003"
              onClick={() => onCheck("1HGCM82633A004352")}
            />
            <ExampleCard 
              vin="WBA3A9C52CF123456"
              desc="BMW 3 Series 2012"
              onClick={() => onCheck("WBA3A9C52CF123456")}
            />
            <ExampleCard 
              vin="WAUZZZ8K9AA123456"
              desc="Audi A4 2010"
              onClick={() => onCheck("WAUZZZ8K9AA123456")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент для отображения пары ключ-значение
function VinInfoRow({ label, value }) {
  if (!value) return null;
  
  return (
    <div className="vin-info-row">
      <span className="info-label">{label}:</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

// Компонент карточки примера
function ExampleCard({ vin, desc, onClick }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(vin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="example-card" onClick={onClick}>
      <div className="example-vin">{vin}</div>
      <div className="example-desc">{desc}</div>
      <button 
        className="example-copy"
        onClick={handleCopy}
        title="Копировать VIN"
      >
        {copied ? "✅" : "📋"}
      </button>
    </div>
  );
}