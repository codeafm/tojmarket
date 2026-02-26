// src/pages/Listings.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CATEGORIES } from "../data/categorySchemas.js";
import { listListings } from "../firebase/listings.js";

/** ======= Fallback справочники (если в базе пока мало данных) ======= */
const PHONE_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "Realme", "OPPO", "Vivo",
  "OnePlus", "Google", "Nokia", "Sony", "ASUS", "Tecno", "Infinix", "ZTE",
  "Motorola", "Lenovo", "Meizu", "LG", "HTC", "BlackBerry", "Другой бренд",
];

const PHONE_MEMORY = ["16", "32", "64", "128", "256", "512", "1024"];
const PHONE_RAM = ["1", "2", "3", "4", "6", "8", "12", "16", "18", "24"];
const COLORS = [
  "Черный", "Белый", "Синий", "Красный", "Зеленый", "Желтый", "Золотой",
  "Серебро", "Серый", "Фиолетовый", "Розовый", "Оранжевый", "Коричневый",
  "Другое",
];
const CONDITIONS = ["Новый", "Как новый", "Б/у", "На запчасти"];

const AUTO_BRANDS = [
  "Toyota", "Mercedes-Benz", "BMW", "Audi", "Volkswagen", "Lexus", "Honda",
  "Hyundai", "Kia", "Nissan", "Ford", "Chevrolet", "Mazda", "Mitsubishi",
  "Subaru", "Renault", "Opel", "Peugeot", "Lada (ВАЗ)", "Tesla", "Geely",
  "Chery", "Haval", "BYD", "Suzuki", "Skoda", "Volvo", "Land Rover",
  "Porsche", "Другая марка",
];

const FUEL = ["Бензин", "Дизель", "Газ", "Газ/Бензин", "Гибрид", "Электро", "Другое"];
const TRANSMISSION = ["Механика", "Автомат", "Робот", "Вариатор", "Другое"];
const DRIVE = ["Передний", "Задний", "Полный", "Другое"];
const BODY = ["Седан", "Хэтчбек", "Универсал", "Кроссовер", "Внедорожник", "Купе", "Минивэн", "Пикап", "Другое"];

const REALTY_TYPES = ["Квартира", "Дом", "Комната", "Участок", "Коммерческая", "Другое"];
const REPAIR = ["Без ремонта", "Косметический", "Евроремонт", "Дизайнерский", "Другое"];

/** ======= helpers ======= */
function norm(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function uniq(arr) {
  const s = new Set();
  const out = [];
  for (const x of arr) {
    const t = String(x ?? "").trim();
    if (!t) continue;
    const k = norm(t);
    if (s.has(k)) continue;
    s.add(k);
    out.push(t);
  }
  return out;
}

function getExtraObj(item) {
  return item?.extra || item?.attrs || item?.details || item?.meta || {};
}

function getExtraVal(item, key) {
  const ex = getExtraObj(item);
  return ex?.[key] ?? item?.[key] ?? "";
}

function toNum(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", ".").replace(/\s+/g, ""));
  return Number.isFinite(n) ? n : null;
}

function includesText(haystack, needle) {
  if (!needle) return true;
  return norm(haystack).includes(norm(needle));
}

function readExtraFromSP(sp) {
  const obj = {};
  for (const [k, v] of sp.entries()) {
    if (!k.startsWith("f_")) continue;
    obj[k.slice(2)] = v;
  }
  return obj;
}

function writeExtraToSP(extra) {
  const out = {};
  Object.entries(extra || {}).forEach(([k, v]) => {
    const vv = String(v ?? "").trim();
    if (!vv) return;
    out[`f_${k}`] = vv;
  });
  return out;
}

// Форматирование цены
const formatPrice = (price) => {
  if (!price) return "—";
  return new Intl.NumberFormat("ru-RU").format(price) + " TJS";
};

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp?.seconds) return "недавно";
  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} дн назад`;
  
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

/** ======= UI components с современным дизайном и анимациями ======= */
function FilterSection({ title, children }) {
  return (
    <div className="filter-section fade-in">
      <h4 className="filter-section-title">{title}</h4>
      <div className="filter-section-content">
        {children}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Все" }) {
  const opts = options && options.length ? options : [];
  return (
    <div className="filter-field">
      <label className="filter-label">{label}</label>
      <select 
        className="filter-select hover-lift" 
        value={value || ""} 
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function DatalistField({ label, value, onChange, options, placeholder }) {
  const listId = useMemo(
    () => `dl_${label.replace(/\s+/g, "_")}_${Math.random().toString(16).slice(2)}`,
    [label]
  );
  const opts = options && options.length ? options : [];
  return (
    <div className="filter-field">
      <label className="filter-label">{label}</label>
      <input
        className="filter-input hover-lift"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        placeholder={placeholder || "Все"}
      />
      <datalist id={listId}>
        {opts.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}

function RangeField({ label, from, to, onFrom, onTo, phFrom = "от", phTo = "до" }) {
  return (
    <div className="filter-range">
      <label className="filter-label">{label}</label>
      <div className="range-inputs">
        <input
          className="filter-input hover-lift"
          value={from || ""}
          onChange={(e) => onFrom(e.target.value)}
          placeholder={phFrom}
        />
        <span className="range-separator">—</span>
        <input
          className="filter-input hover-lift"
          value={to || ""}
          onChange={(e) => onTo(e.target.value)}
          placeholder={phTo}
        />
      </div>
    </div>
  );
}

/** ======= Category filter definitions с улучшенным UI ======= */
function buildCategoryFilters({ category, extra, setExtra, itemsForOptions }) {
  const set = (k, v) => setExtra((prev) => ({ ...prev, [k]: v }));

  const phonesItems = itemsForOptions.filter((x) => (x.category || "") === "phones");
  const autoItems = itemsForOptions.filter((x) => (x.category || "") === "auto");
  const realtyItems = itemsForOptions.filter((x) => (x.category || "") === "realty");

  const phoneBrandsFromDb = uniq(phonesItems.map((x) => getExtraVal(x, "brand")));
  const autoBrandsFromDb = uniq(autoItems.map((x) => getExtraVal(x, "brand")));

  const selectedBrand = extra.brand || "";

  const phoneModelsFromDb = uniq(
    phonesItems
      .filter((x) => !selectedBrand || norm(getExtraVal(x, "brand")) === norm(selectedBrand))
      .map((x) => getExtraVal(x, "model"))
  );

  const autoModelsFromDb = uniq(
    autoItems
      .filter((x) => !selectedBrand || norm(getExtraVal(x, "brand")) === norm(selectedBrand))
      .map((x) => getExtraVal(x, "model"))
  );

  const phonesBrandOptions = uniq([...phoneBrandsFromDb, ...PHONE_BRANDS]);
  const autoBrandOptions = uniq([...autoBrandsFromDb, ...AUTO_BRANDS]);

  const phoneModelOptions = phoneModelsFromDb;
  const autoModelOptions = autoModelsFromDb;

  if (category === "phones") {
    return (
      <FilterSection title="Телефоны">
        <DatalistField
          label="Бренд"
          value={extra.brand || ""}
          onChange={(v) => set("brand", v)}
          options={phonesBrandOptions}
          placeholder="Все бренды"
        />

        <DatalistField
          label="Модель"
          value={extra.model || ""}
          onChange={(v) => set("model", v)}
          options={phoneModelOptions.length ? phoneModelOptions : []}
          placeholder={extra.brand ? "Модели по бренду" : "Выберите бренд"}
        />

        <SelectField
          label="Память (GB)"
          value={extra.memory || ""}
          onChange={(v) => set("memory", v)}
          options={PHONE_MEMORY.map((x) => `${x}`)}
          placeholder="Все"
        />

        <SelectField
          label="RAM (GB)"
          value={extra.ram || ""}
          onChange={(v) => set("ram", v)}
          options={PHONE_RAM.map((x) => `${x}`)}
          placeholder="Все"
        />

        <SelectField
          label="Цвет"
          value={extra.color || ""}
          onChange={(v) => set("color", v)}
          options={COLORS}
          placeholder="Все"
        />

        <SelectField
          label="Состояние"
          value={extra.condition || ""}
          onChange={(v) => set("condition", v)}
          options={CONDITIONS}
          placeholder="Все"
        />

        <RangeField
          label="Батарея %"
          from={extra.batteryFrom || ""}
          to={extra.batteryTo || ""}
          onFrom={(v) => set("batteryFrom", v)}
          onTo={(v) => set("batteryTo", v)}
        />
      </FilterSection>
    );
  }

  if (category === "auto") {
    return (
      <FilterSection title="Автомобили">
        <DatalistField
          label="Марка"
          value={extra.brand || ""}
          onChange={(v) => set("brand", v)}
          options={autoBrandOptions}
          placeholder="Все марки"
        />

        <DatalistField
          label="Модель"
          value={extra.model || ""}
          onChange={(v) => set("model", v)}
          options={autoModelOptions.length ? autoModelOptions : []}
          placeholder={extra.brand ? "Модели по марке" : "Выберите марку"}
        />

        <RangeField
          label="Год"
          from={extra.yearFrom || ""}
          to={extra.yearTo || ""}
          onFrom={(v) => set("yearFrom", v)}
          onTo={(v) => set("yearTo", v)}
          phFrom="от 2000"
          phTo="до 2024"
        />

        <RangeField
          label="Пробег (км)"
          from={extra.mileageFrom || ""}
          to={extra.mileageTo || ""}
          onFrom={(v) => set("mileageFrom", v)}
          onTo={(v) => set("mileageTo", v)}
          phFrom="от 0"
          phTo="до 200000"
        />

        <SelectField
          label="Топливо"
          value={extra.fuel || ""}
          onChange={(v) => set("fuel", v)}
          options={FUEL}
          placeholder="Все"
        />

        <SelectField
          label="Коробка"
          value={extra.transmission || ""}
          onChange={(v) => set("transmission", v)}
          options={TRANSMISSION}
          placeholder="Все"
        />

        <SelectField
          label="Привод"
          value={extra.drive || ""}
          onChange={(v) => set("drive", v)}
          options={DRIVE}
          placeholder="Все"
        />

        <SelectField
          label="Кузов"
          value={extra.body || ""}
          onChange={(v) => set("body", v)}
          options={BODY}
          placeholder="Все"
        />

        <SelectField
          label="Цвет"
          value={extra.color || ""}
          onChange={(v) => set("color", v)}
          options={COLORS}
          placeholder="Все"
        />
      </FilterSection>
    );
  }

  if (category === "realty") {
    const roomsFromDb = uniq(realtyItems.map((x) => getExtraVal(x, "rooms"))).filter(Boolean);
    const floorsFromDb = uniq(realtyItems.map((x) => getExtraVal(x, "floor"))).filter(Boolean);

    return (
      <FilterSection title="Недвижимость">
        <SelectField
          label="Тип"
          value={extra.type || ""}
          onChange={(v) => set("type", v)}
          options={REALTY_TYPES}
          placeholder="Все"
        />

        <SelectField
          label="Комнат"
          value={extra.rooms || ""}
          onChange={(v) => set("rooms", v)}
          options={roomsFromDb.length ? roomsFromDb : ["1", "2", "3", "4", "5+"]}
          placeholder="Все"
        />

        <RangeField
          label="Площадь (м²)"
          from={extra.areaFrom || ""}
          to={extra.areaTo || ""}
          onFrom={(v) => set("areaFrom", v)}
          onTo={(v) => set("areaTo", v)}
          phFrom="от 20"
          phTo="до 200"
        />

        <SelectField
          label="Ремонт"
          value={extra.repair || ""}
          onChange={(v) => set("repair", v)}
          options={REPAIR}
          placeholder="Все"
        />

        <SelectField
          label="Этаж"
          value={extra.floor || ""}
          onChange={(v) => set("floor", v)}
          options={floorsFromDb.length ? floorsFromDb : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"]}
          placeholder="Все"
        />
      </FilterSection>
    );
  }

  return null;
}

/** ======= client-side extra filtering ======= */
function passExtraFilters(item, category, extra) {
  if (!category || category === "all") return true;
  if ((item.category || "") !== category) return false;

  const ex = getExtraObj(item);

  const textEqOrContains = (field, expected) => {
    if (!expected) return true;
    const v = String(ex?.[field] ?? item?.[field] ?? "");
    return includesText(v, expected);
  };

  const numBetween = (field, from, to) => {
    const v = toNum(ex?.[field] ?? item?.[field]);
    const f = toNum(from);
    const t = toNum(to);
    if (f === null && t === null) return true;
    if (v === null) return false;
    if (f !== null && v < f) return false;
    if (t !== null && v > t) return false;
    return true;
  };

  if (category === "phones") {
    if (!textEqOrContains("brand", extra.brand)) return false;
    if (!textEqOrContains("model", extra.model)) return false;
    if (extra.memory) {
      const m = String(ex?.memory ?? "").replace(/\D/g, "");
      if (m !== String(extra.memory).replace(/\D/g, "")) return false;
    }
    if (extra.ram) {
      const r = String(ex?.ram ?? "").replace(/\D/g, "");
      if (r !== String(extra.ram).replace(/\D/g, "")) return false;
    }
    if (extra.color && !textEqOrContains("color", extra.color)) return false;
    if (extra.condition && !textEqOrContains("condition", extra.condition)) return false;
    if (!numBetween("battery", extra.batteryFrom, extra.batteryTo)) return false;
    return true;
  }

  if (category === "auto") {
    if (!textEqOrContains("brand", extra.brand)) return false;
    if (!textEqOrContains("model", extra.model)) return false;
    if (!numBetween("year", extra.yearFrom, extra.yearTo)) return false;
    if (!numBetween("mileage", extra.mileageFrom, extra.mileageTo)) return false;
    if (extra.fuel && !textEqOrContains("fuel", extra.fuel)) return false;
    if (extra.transmission && !textEqOrContains("transmission", extra.transmission)) return false;
    if (extra.drive && !textEqOrContains("drive", extra.drive)) return false;
    if (extra.body && !textEqOrContains("body", extra.body)) return false;
    if (extra.color && !textEqOrContains("color", extra.color)) return false;
    return true;
  }

  if (category === "realty") {
    if (extra.type && !textEqOrContains("type", extra.type)) return false;
    if (extra.rooms && String(ex?.rooms ?? "") !== String(extra.rooms)) return false;
    if (!numBetween("area", extra.areaFrom, extra.areaTo)) return false;
    if (extra.repair && !textEqOrContains("repair", extra.repair)) return false;
    if (extra.floor && String(ex?.floor ?? "") !== String(extra.rooms)) return false;
    return true;
  }

  return true;
}

// Компонент красивой карточки
const ModernListingCard = ({ item, index }) => {
  const plan = String(item.plan || "base").toLowerCase();
  const itemViews = item?.stats?.views ?? item?.views ?? 0;
  
  return (
    <Link 
      to={`/listing/${item.id}`} 
      className="modern-listing-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="card-image-wrapper">
        {item.photos?.[0] ? (
          <img 
            src={item.photos[0]} 
            alt={item.title} 
            className="card-image"
            loading="lazy"
          />
        ) : (
          <div className="no-image-modern">
            <span className="no-image-icon">📷</span>
            <span className="no-image-text">Нет фото</span>
          </div>
        )}
        
        {plan !== "base" && (
          <span className={`card-badge-modern ${plan}`}>
            {plan === "vip" ? "⭐ VIP" : "🔥 TOP"}
          </span>
        )}
        
        <div className="card-price-modern">
          {formatPrice(item.price)}
        </div>
      </div>
      
      <div className="card-content-modern">
        <h3 className="card-title-modern">{item.title || "Без названия"}</h3>
        
        <div className="card-location-modern">
          <span className="location-icon">📍</span>
          <span className="location-text">{item.city || "Город не указан"}</span>
        </div>
        
        <div className="card-footer-modern">
          <div className="card-time">
            <span className="time-icon">⏱️</span>
            <span className="time-text">{formatDate(item.createdAt)}</span>
          </div>
          <div className="card-views">
            <span className="views-icon">👁</span>
            <span className="views-text">{itemViews}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Скелетон для загрузки
const SkeletonCard = () => (
  <div className="skeleton-card-modern">
    <div className="skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton-title"></div>
      <div className="skeleton-price"></div>
      <div className="skeleton-meta">
        <div className="skeleton-location"></div>
        <div className="skeleton-time"></div>
      </div>
    </div>
  </div>
);

export default function Listings() {
  const [sp, setSp] = useSearchParams();

  const [qText, setQText] = useState(sp.get("q") || "");
  const [category, setCategory] = useState(sp.get("cat") || "all");
  const [city, setCity] = useState(sp.get("city") || "");
  const [priceFrom, setPriceFrom] = useState(sp.get("from") || "");
  const [priceTo, setPriceTo] = useState(sp.get("to") || "");
  const [status, setStatus] = useState(sp.get("status") || "all");
  const [sort, setSort] = useState(sp.get("sort") || "new");
  const [extra, setExtra] = useState(() => readExtraFromSP(sp));

  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  // Функция для показа уведомлений
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  }, []);

  useEffect(() => {
    setQText(sp.get("q") || "");
    setCategory(sp.get("cat") || "all");
    setCity(sp.get("city") || "");
    setPriceFrom(sp.get("from") || "");
    setPriceTo(sp.get("to") || "");
    setStatus(sp.get("status") || "all");
    setSort(sp.get("sort") || "new");
    setExtra(readExtraFromSP(sp));
  }, [sp]);

  const baseParams = useMemo(() => {
    return {
      qText,
      category,
      city,
      sort,
      priceFrom: priceFrom ? Number(priceFrom) : 0,
      priceTo: priceTo ? Number(priceTo) : 9999999,
      limit: 400,
      status,
    };
  }, [qText, category, city, sort, priceFrom, priceTo, status]);

  async function load(p = baseParams) {
    setLoading(true);
    try {
      const res = await listListings(p);
      setRawItems(res || []);
      showNotification("success", `Загружено ${res?.length || 0} объявлений`);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      showNotification("error", "Ошибка загрузки объявлений");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => {
    const arr = rawItems || [];

    const byStatus = (it) => {
      if (!status || status === "all") return true;
      const plan = String(it.plan || "base").toLowerCase();
      return plan === status;
    };

    const filtered = arr.filter(byStatus).filter((it) => passExtraFilters(it, category, extra));
    
    // Сортировка
    return [...filtered].sort((a, b) => {
      if (sort === "cheap") return (a.price || 0) - (b.price || 0);
      if (sort === "expensive") return (b.price || 0) - (a.price || 0);
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [rawItems, status, category, extra, sort]);

  useEffect(() => {
    const categoryHandlers = {
      phones: () => setExtra((p) => ({
        brand: p.brand || "",
        model: p.model || "",
        memory: p.memory || "",
        ram: p.ram || "",
        color: p.color || "",
        condition: p.condition || "",
        batteryFrom: p.batteryFrom || "",
        batteryTo: p.batteryTo || "",
      })),
      auto: () => setExtra((p) => ({
        brand: p.brand || "",
        model: p.model || "",
        yearFrom: p.yearFrom || "",
        yearTo: p.yearTo || "",
        mileageFrom: p.mileageFrom || "",
        mileageTo: p.mileageTo || "",
        fuel: p.fuel || "",
        transmission: p.transmission || "",
        drive: p.drive || "",
        body: p.body || "",
        color: p.color || "",
      })),
      realty: () => setExtra((p) => ({
        type: p.type || "",
        rooms: p.rooms || "",
        areaFrom: p.areaFrom || "",
        areaTo: p.areaTo || "",
        repair: p.repair || "",
        floor: p.floor || "",
      })),
    };

    const handler = categoryHandlers[category];
    if (handler) {
      handler();
    } else {
      setExtra({});
    }
  }, [category]);

  const applyFilters = useCallback(() => {
    const p = {};
    if (qText.trim()) p.q = qText.trim();
    if (category !== "all") p.cat = category;
    if (city.trim()) p.city = city.trim();
    if (priceFrom) p.from = priceFrom;
    if (priceTo) p.to = priceTo;
    if (status && status !== "all") p.status = status;
    p.sort = sort || "new";
    Object.assign(p, writeExtraToSP(extra));

    setSp(p);
    load(baseParams);
    setShowMobileFilters(false);
    showNotification("success", "Фильтры применены");
  }, [qText, category, city, priceFrom, priceTo, status, sort, extra, baseParams, setSp, showNotification]);

  const resetFilters = useCallback(() => {
    setQText("");
    setCategory("all");
    setCity("");
    setPriceFrom("");
    setPriceTo("");
    setStatus("all");
    setSort("new");
    setExtra({});
    setSp({});
    load({ sort: "new", limit: 400 });
    showNotification("info", "Фильтры сброшены");
  }, [setSp, showNotification]);

  return (
    <div className="listings-page fade-in">
      {/* Уведомления */}
      {notification.show && (
        <div className={`notification ${notification.type} slide-in-right`}>
          <span className="notification-icon">
            {notification.type === "success" ? "✅" : 
             notification.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      {/* Шапка страницы */}
      <div className="pageHead slide-in-right">
        <div className="pageHead-left">
          <h1 className="pageTitle gradient-text">Объявления</h1>
          <p className="pageSubtitle">
            {loading ? "Загрузка..." : `Найдено ${items.length} объявлений`}
          </p>
        </div>
        <button 
          className="btnSecondary mobile-filter-btn hover-lift"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <span className="filter-icon">🔍</span>
          <span>Фильтры</span>
          {Object.keys(extra).length > 0 && (
            <span className="filter-badge pulse">{Object.keys(extra).length}</span>
          )}
        </button>
      </div>

      <div className="listings-layout">
        {/* Фильтры - десктоп */}
        <aside className={`filters-sidebar ${showMobileFilters ? 'mobile-show' : ''}`}>
          <div className="filters-card card slide-in-left">
            <div className="filters-header">
              <h3 className="filters-title">Фильтры</h3>
              {(Object.keys(extra).length > 0 || qText || city || priceFrom || priceTo || status !== "all") && (
                <button className="btnGhost btn-sm hover-lift" onClick={resetFilters}>
                  Сбросить все
                </button>
              )}
            </div>

            <div className="filters-content">
              {/* Поиск */}
              <FilterSection title="Поиск">
                <div className="filter-field">
                  <label className="filter-label">Ключевое слово</label>
                  <input
                    className="filter-input hover-lift"
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="iPhone, Toyota..."
                  />
                </div>
              </FilterSection>

              {/* Категория */}
              <FilterSection title="Категория">
                <div className="filter-field">
                  <select 
                    className="filter-select hover-lift"
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">Все категории</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </FilterSection>

              {/* Город */}
              <FilterSection title="Город">
                <div className="filter-field">
                  <input
                    className="filter-input hover-lift"
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    placeholder="Душанбе, Худжанд..."
                  />
                </div>
              </FilterSection>

              {/* Цена */}
              <FilterSection title="Цена (TJS)">
                <div className="filter-range">
                  <div className="range-inputs">
                    <input
                      className="filter-input hover-lift"
                      value={priceFrom} 
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="от"
                    />
                    <span className="range-separator">—</span>
                    <input
                      className="filter-input hover-lift"
                      value={priceTo} 
                      onChange={(e) => setPriceTo(e.target.value)}
                      placeholder="до"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* Статус */}
              <FilterSection title="Статус">
                <div className="filter-field">
                  <select 
                    className="filter-select hover-lift"
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">Все</option>
                    <option value="base">Базовые</option>
                    <option value="vip">VIP</option>
                    <option value="top">TOP</option>
                  </select>
                </div>
              </FilterSection>

              {/* Сортировка */}
              <FilterSection title="Сортировка">
                <div className="filter-field">
                  <select 
                    className="filter-select hover-lift"
                    value={sort} 
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="new">Сначала новые</option>
                    <option value="cheap">Сначала дешевле</option>
                    <option value="expensive">Сначала дороже</option>
                  </select>
                </div>
              </FilterSection>

              {/* Категорийные фильтры */}
              {buildCategoryFilters({
                category,
                extra,
                setExtra,
                itemsForOptions: rawItems,
              })}

              {/* Кнопки действий */}
              <div className="filters-actions">
                <button className="btnPrimary hover-lift" onClick={applyFilters}>
                  <span className="btn-icon">✓</span>
                  Применить
                </button>
                <button className="btnGhost hover-lift" onClick={resetFilters}>
                  <span className="btn-icon">↺</span>
                  Сбросить
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Список объявлений */}
        <div className="listings-content">
          {loading ? (
            <div className="loading-grid">
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state fade-in">
              <div className="empty-icon bounce">🔍</div>
              <h3 className="slide-up">Ничего не найдено</h3>
              <p className="slide-up">Попробуйте изменить параметры поиска</p>
              <button className="btnPrimary hover-lift slide-up" onClick={resetFilters}>
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="results-info slide-in-right">
                <span className="results-count">
                  Показано {items.length} из {rawItems.length} объявлений
                </span>
                <div className="results-views">
                  <button className="view-btn active hover-scale">🔲</button>
                  <button className="view-btn hover-scale">🔳</button>
                </div>
              </div>
              <div className="modern-listings-grid">
                {items.map((item, index) => (
                  <ModernListingCard key={item.id} item={item} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}