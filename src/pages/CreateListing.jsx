import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createListing } from "../firebase/listings.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase.js";

function onlyDigits(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

// ===== ПОЛНЫЕ СПИСКИ ДЛЯ ВСЕХ КАТЕГОРИЙ =====
const CATEGORIES = [
  { id: "auto", name: "Автомобили", icon: "🚗" },
  { id: "phones", name: "Телефоны", icon: "📱" },
  { id: "tablets", name: "Планшеты", icon: "📟" },
  { id: "laptops", name: "Ноутбуки", icon: "💻" },
  { id: "accessories", name: "Аксессуары", icon: "🎧" },
  { id: "audio", name: "Аудиотехника", icon: "🔊" },
  { id: "realty", name: "Недвижимость", icon: "🏠" },
  { id: "clothes", name: "Одежда", icon: "👕" },
  { id: "furniture", name: "Мебель", icon: "🪑" },
  { id: "pets", name: "Животные", icon: "🐕" },
  { id: "jobs", name: "Работа", icon: "💼" },
  { id: "services", name: "Услуги", icon: "🧰" },
  { id: "other", name: "Другое", icon: "✨" }
];

// ===== СПИСКИ ГОРОДОВ ТАДЖИКИСТАНА =====
const CITIES = [
  "Душанбе",
  "Худжанд",
  "Бохтар",
  "Куляб",
  "Истаравшан",
  "Канибадам",
  "Пенджикент",
  "Хорог",
  "Турсунзаде",
  "Гиссар",
  "Вахдат",
  "Рогун",
  "Нурек",
  "Левакант",
  "Сарбанд",
  "Дангара",
  "Файзабад",
  "Рашт",
  "Айни",
  "Мастчох"
].sort();

// ===== ПЛАНЫ РАЗМЕЩЕНИЯ =====
const PLANS = [
  { 
    id: "base", 
    name: "Базовый", 
    price: "Бесплатно",
    features: ["Обычная видимость", "До 6 фото", "30 дней"],
    icon: "📋",
    color: "base"
  },
  { 
    id: "vip", 
    name: "VIP", 
    price: "VIP",
    features: ["✨ Топ объявлений", "Выделение цветом", "Больше просмотров"],
    icon: "⭐",
    color: "vip"
  },
  { 
    id: "top", 
    name: "TOP", 
    price: "TOP",
    features: ["🔥 На первом месте", "Спецотметка", "Максимум просмотров"],
    icon: "🚀",
    color: "top"
  }
];

// ===== СОСТОЯНИЕ ТОВАРА =====
const CONDITIONS = [
  "Новый",
  "Как новый",
  "Отличное",
  "Хорошее",
  "Среднее",
  "На запчасти"
];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ АВТОМОБИЛЕЙ =====
const AUTO_BRANDS = [
  "Toyota", "Honda", "Nissan", "Mitsubishi", "Mazda", "Subaru", "Suzuki",
  "Lexus", "Infiniti", "Acura", "BMW", "Mercedes-Benz", "Audi", "Volkswagen",
  "Porsche", "Opel", "Ford", "Chevrolet", "Hyundai", "Kia", "Daewoo",
  "Lada", "UAZ", "GAZ", "Renault", "Peugeot", "Citroen", "Fiat",
  "Volvo", "Land Rover", "Jaguar", "Jeep", "Chrysler", "Dodge","BYD", "Китайский Электромобил"
].sort();

const AUTO_MODELS = {
  Toyota: ["Camry", "Corolla", "RAV4", "Land Cruiser", "Prado", "Highlander", "Fortuner", "Hilux", "Yaris", "Avensis", "Crown", "Mark X", "Alphard", "Harrier", "Vitz"],
  Honda: ["Accord", "Civic", "CR-V", "Pilot", "Odyssey", "Fit", "Jazz", "Stepwgn", "Freed", "Vezel", "HR-V"],
  Nissan: ["Sunny", "Almera", "Teana", "Maxima", "X-Trail", "Patrol", "Qashqai", "Juke", "Murano", "Navara", "Pathfinder"],
  "Mercedes-Benz": ["E-Class", "S-Class", "C-Class", "GLC", "GLE", "G-Class", "ML", "GL", "A-Class", "B-Class", "CLS", "SL", "AMG GT"],
  BMW: ["3 Series", "5 Series", "7 Series", "X3", "X5", "X6", "X7", "1 Series", "Z4", "M3", "M5"],
  // Добавьте остальные модели по аналогии
};

const AUTO_YEARS = Array.from({ length: 35 }, (_, i) => (new Date().getFullYear() - i).toString());

const AUTO_FUEL = ["Бензин", "Дизель", "Газ", "Гибрид", "Электро", "Газ/Бензин"];
const AUTO_TRANSMISSION = ["Механика", "Автомат", "Робот", "Вариатор"];
const AUTO_DRIVE = ["Передний", "Задний", "Полный"];
const AUTO_BODY = ["Седан", "Хэтчбек", "Универсал", "Кроссовер", "Внедорожник", "Купе", "Кабриолет", "Минивэн", "Пикап", "Лимузин"];
const AUTO_COLORS = ["Белый", "Черный", "Серебристый", "Серый", "Синий", "Красный", "Зеленый", "Желтый", "Оранжевый", "Коричневый", "Бежевый", "Золотой", "Фиолетовый", "Розовый"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ ТЕЛЕФОНОВ =====
const PHONE_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "Oppo", "Vivo", "Realme",
  "OnePlus", "Google", "Sony", "Nokia", "Motorola", "LG", "HTC", "Asus",
  "ZTE", "Meizu", "Lenovo", "Alcatel", "BlackBerry", "Nothing"
].sort();

const PHONE_MODELS = {
  Apple: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 12", "iPhone 11", "iPhone X", "iPhone SE"],
  Samsung: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S22", "Galaxy S21", "Galaxy A54", "Galaxy A34", "Galaxy A14", "Galaxy Z Fold5", "Galaxy Z Flip5", "Galaxy Note"],
  Xiaomi: ["Xiaomi 14", "Xiaomi 13T", "Xiaomi 13", "Xiaomi 12", "Redmi Note 13", "Redmi Note 12", "Redmi 13C", "Poco X6", "Poco F5", "Mi Mix"],
  // Добавьте остальные
};

const PHONE_MEMORY = ["8 ГБ", "16 ГБ", "32 ГБ", "64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"];
const PHONE_RAM = ["1 ГБ", "2 ГБ", "3 ГБ", "4 ГБ", "6 ГБ", "8 ГБ", "12 ГБ", "16 ГБ", "24 ГБ"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ НОУТБУКОВ =====
const LAPTOP_BRANDS = [
  "Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Razer",
  "Samsung", "LG", "Huawei", "Xiaomi", "Microsoft", "Alienware", "Gigabyte"
].sort();

const LAPTOP_PROCESSORS = [
  "Apple M3", "Apple M2", "Apple M1", "Intel Core i9", "Intel Core i7", "Intel Core i5", "Intel Core i3",
  "AMD Ryzen 9", "AMD Ryzen 7", "AMD Ryzen 5", "AMD Ryzen 3"
];

const LAPTOP_RAM = ["4 ГБ", "8 ГБ", "16 ГБ", "32 ГБ", "64 ГБ", "128 ГБ"];
const LAPTOP_STORAGE = ["128 ГБ SSD", "256 ГБ SSD", "512 ГБ SSD", "1 ТБ SSD", "2 ТБ SSD", "500 ГБ HDD", "1 ТБ HDD"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ НЕДВИЖИМОСТИ =====
const REALTY_TYPES = ["Квартира", "Дом", "Комната", "Участок", "Коммерческая", "Гараж"];
const REALTY_ROOMS = ["Студия", "1", "2", "3", "4", "5", "6+"];
const REALTY_REPAIR = ["Без ремонта", "Косметический", "Евроремонт", "Дизайнерский", "Требуется ремонт"];
const REALTY_FURNITURE = ["Есть", "Частично", "Нет"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ ОДЕЖДЫ =====
const CLOTHES_TYPES = ["Платье", "Рубашка", "Футболка", "Джинсы", "Брюки", "Юбка", "Куртка", "Пальто", "Костюм", "Спортивный костюм", "Обувь", "Аксессуары"];
const CLOTHES_BRANDS = ["Nike", "Adidas", "Zara", "H&M", "Gucci", "Prada", "Louis Vuitton", "Levi's", "Calvin Klein", "Tommy Hilfiger", "Ralph Lauren", "Puma", "Reebok", "New Balance"].sort();
const CLOTHES_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52"];
const CLOTHES_GENDER = ["Мужское", "Женское", "Детское", "Унисекс"];
const CLOTHES_MATERIALS = ["Хлопок", "Лен", "Шерсть", "Кожа", "Замша", "Шелк", "Полиэстер", "Нейлон", "Эластан", "Вискоза"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ МЕБЕЛИ =====
const FURNITURE_TYPES = ["Диван", "Кровать", "Шкаф", "Стол", "Стул", "Кресло", "Комод", "Тумба", "Полка", "Кухонный гарнитур", "Спальня", "Гостиная", "Прихожая"];
const FURNITURE_MATERIALS = ["Дерево", "Металл", "Пластик", "Стекло", "МДФ", "ЛДСП", "Ротанг", "Кожа", "Ткань"];
const FURNITURE_COLORS = ["Белый", "Черный", "Коричневый", "Бежевый", "Серый", "Дуб", "Орех", "Венге", "Ясень"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ ЖИВОТНЫХ =====
const PET_TYPES = ["Собака", "Кошка", "Птица", "Рыбки", "Грызуны", "Рептилии", "Другое"];
const PET_BREEDS = {
  Собака: ["Лабрадор", "Немецкая овчарка", "Чихуахуа", "Йоркширский терьер", "Французский бульдог", "Такса", "Хаски", "Мопс", "Шпиц", "Ретривер", "Доберман", "Ротвейлер", "Бульдог", "Пудель"],
  Кошка: ["Мейн-кун", "Сиамская", "Персидская", "Сфинкс", "Британская", "Шотландская", "Бенгальская", "Абиссинская", "Рэгдолл", "Русская голубая"]
};
const PET_GENDER = ["Мальчик", "Девочка"];
const PET_AGE_UNITS = ["лет", "месяцев", "год"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ РАБОТЫ =====
const JOB_TYPES = ["Полная занятость", "Частичная занятость", "Удаленная работа", "Стажировка", "Проектная работа", "Волонтерство"];
const JOB_EDUCATION = ["Высшее", "Неоконченное высшее", "Среднее специальное", "Среднее", "Не имеет значения"];

// ===== ХАРАКТЕРИСТИКИ ДЛЯ УСЛУГ =====
const SERVICE_TYPES = ["Ремонт и обслуживание", "Уборка", "Красота и здоровье", "Обучение и репетиторство", "Перевозки и доставка", "Строительство", "Юридические услуги", "Бухгалтерские услуги", "IT услуги", "Фото и видео", "Организация мероприятий"];

export default function CreateListing() {
  const nav = useNavigate();
  const { user } = useAuth();

  // ===== ОСНОВНЫЕ ПОЛЯ (ВВОДЯТСЯ ВРУЧНУЮ) =====
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  // ===== ПОЛЯ ИЗ СПИСКОВ =====
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [plan, setPlan] = useState("base");
  const [condition, setCondition] = useState("");

  // ===== ДИНАМИЧЕСКИЕ ХАРАКТЕРИСТИКИ =====
  // Для автомобилей
  const [autoBrand, setAutoBrand] = useState("");
  const [autoModel, setAutoModel] = useState("");
  const [autoYear, setAutoYear] = useState("");
  const [autoMileage, setAutoMileage] = useState("");
  const [autoFuel, setAutoFuel] = useState("");
  const [autoTransmission, setAutoTransmission] = useState("");
  const [autoDrive, setAutoDrive] = useState("");
  const [autoBody, setAutoBody] = useState("");
  const [autoColor, setAutoColor] = useState("");

  // Для телефонов
  const [phoneBrand, setPhoneBrand] = useState("");
  const [phoneModel, setPhoneModel] = useState("");
  const [phoneMemory, setPhoneMemory] = useState("");
  const [phoneRAM, setPhoneRAM] = useState("");
  const [phoneColor, setPhoneColor] = useState("");

  // Для ноутбуков
  const [laptopBrand, setLaptopBrand] = useState("");
  const [laptopModel, setLaptopModel] = useState("");
  const [laptopProcessor, setLaptopProcessor] = useState("");
  const [laptopRAM, setLaptopRAM] = useState("");
  const [laptopStorage, setLaptopStorage] = useState("");
  const [laptopScreen, setLaptopScreen] = useState("");

  // Для недвижимости
  const [realtyType, setRealtyType] = useState("");
  const [realtyRooms, setRealtyRooms] = useState("");
  const [realtyArea, setRealtyArea] = useState("");
  const [realtyFloor, setRealtyFloor] = useState("");
  const [realtyRepair, setRealtyRepair] = useState("");
  const [realtyFurniture, setRealtyFurniture] = useState("");

  // Для одежды
  const [clothesType, setClothesType] = useState("");
  const [clothesBrand, setClothesBrand] = useState("");
  const [clothesSize, setClothesSize] = useState("");
  const [clothesGender, setClothesGender] = useState("");
  const [clothesMaterial, setClothesMaterial] = useState("");
  const [clothesColor, setClothesColor] = useState("");

  // Для мебели
  const [furnitureType, setFurnitureType] = useState("");
  const [furnitureMaterial, setFurnitureMaterial] = useState("");
  const [furnitureColor, setFurnitureColor] = useState("");
  const [furnitureDimensions, setFurnitureDimensions] = useState("");

  // Для животных
  const [petType, setPetType] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petAgeUnit, setPetAgeUnit] = useState("");
  const [petGender, setPetGender] = useState("");
  const [petVaccinated, setPetVaccinated] = useState("");
  const [petDocuments, setPetDocuments] = useState("");

  // Для работы
  const [jobCompany, setJobCompany] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [jobEducation, setJobEducation] = useState("");
  const [jobSalary, setJobSalary] = useState("");

  // Для услуг
  const [serviceType, setServiceType] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceExperience, setServiceExperience] = useState("");
  const [serviceGuarantee, setServiceGuarantee] = useState("");

  // ===== ФОТО =====
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // ===== СОСТОЯНИЯ ФОРМЫ =====
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Получаем доступные модели для выбранной марки авто
  const availableAutoModels = autoBrand ? AUTO_MODELS[autoBrand] || [] : [];

  // Получаем доступные породы для выбранного типа животных
  const availablePetBreeds = petType ? PET_BREEDS[petType] || [] : [];

  // Проверка возможности отправки
  const canSubmit = useMemo(() => {
    if (!user?.uid) return false;
    if (saving) return false;
    if (!title.trim()) return false;
    if (!category) return false;
    if (!city) return false;
    const p = Number(onlyDigits(price));
    if (!Number.isFinite(p) || p <= 0) return false;
    return true;
  }, [user?.uid, saving, title, category, city, price]);

  // Обработка выбора файлов
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 6);
    setFiles(selectedFiles);
    
    const previews = selectedFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  // Удаление фото
  const removeFile = (index) => {
    const newFiles = [...files];
    const newPreviews = [...filePreviews];
    
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  // Очистка превью
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  // Загрузка фото
  async function uploadPhotos(uid, fileArr) {
    const out = [];
    const safe = (fileArr || []).slice(0, 6);

    for (let i = 0; i < safe.length; i++) {
      const f = safe[i];
      const path = `listings/${uid}/${Date.now()}_${i}_${f.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, f);
      const url = await getDownloadURL(r);
      out.push(url);
    }

    return out;
  }

  // Сбор всех характеристик в объект attrs
  const collectSpecs = () => {
    const attrs = {};

    // Общие характеристики
    if (condition) attrs.condition = condition;

    // Для автомобилей
    if (category === "auto") {
      if (autoBrand) attrs.brand = autoBrand;
      if (autoModel) attrs.model = autoModel;
      if (autoYear) attrs.year = autoYear;
      if (autoMileage) attrs.mileage = autoMileage;
      if (autoFuel) attrs.fuel = autoFuel;
      if (autoTransmission) attrs.transmission = autoTransmission;
      if (autoDrive) attrs.drive = autoDrive;
      if (autoBody) attrs.body = autoBody;
      if (autoColor) attrs.color = autoColor;
    }

    // Для телефонов
    if (category === "phones") {
      if (phoneBrand) attrs.brand = phoneBrand;
      if (phoneModel) attrs.model = phoneModel;
      if (phoneMemory) attrs.memory = phoneMemory;
      if (phoneRAM) attrs.ram = phoneRAM;
      if (phoneColor) attrs.color = phoneColor;
    }

    // Для ноутбуков
    if (category === "laptops") {
      if (laptopBrand) attrs.brand = laptopBrand;
      if (laptopModel) attrs.model = laptopModel;
      if (laptopProcessor) attrs.processor = laptopProcessor;
      if (laptopRAM) attrs.ram = laptopRAM;
      if (laptopStorage) attrs.storage = laptopStorage;
      if (laptopScreen) attrs.screen = laptopScreen;
    }

    // Для недвижимости
    if (category === "realty") {
      if (realtyType) attrs.type = realtyType;
      if (realtyRooms) attrs.rooms = realtyRooms;
      if (realtyArea) attrs.area = realtyArea;
      if (realtyFloor) attrs.floor = realtyFloor;
      if (realtyRepair) attrs.repair = realtyRepair;
      if (realtyFurniture) attrs.furniture = realtyFurniture;
    }

    // Для одежды
    if (category === "clothes") {
      if (clothesType) attrs.clothesType = clothesType;
      if (clothesBrand) attrs.brand = clothesBrand;
      if (clothesSize) attrs.size = clothesSize;
      if (clothesGender) attrs.gender = clothesGender;
      if (clothesMaterial) attrs.material = clothesMaterial;
      if (clothesColor) attrs.color = clothesColor;
    }

    // Для мебели
    if (category === "furniture") {
      if (furnitureType) attrs.type = furnitureType;
      if (furnitureMaterial) attrs.material = furnitureMaterial;
      if (furnitureColor) attrs.color = furnitureColor;
      if (furnitureDimensions) attrs.dimensions = furnitureDimensions;
    }

    // Для животных
    if (category === "pets") {
      if (petType) attrs.petType = petType;
      if (petBreed) attrs.breed = petBreed;
      if (petAge) attrs.age = petAgeUnit ? `${petAge} ${petAgeUnit}` : petAge;
      if (petGender) attrs.gender = petGender;
      if (petVaccinated) attrs.vaccinated = petVaccinated;
      if (petDocuments) attrs.documents = petDocuments;
    }

    // Для работы
    if (category === "jobs") {
      if (jobCompany) attrs.company = jobCompany;
      if (jobPosition) attrs.position = jobPosition;
      if (jobType) attrs.employment = jobType;
      if (jobExperience) attrs.experience = jobExperience;
      if (jobEducation) attrs.education = jobEducation;
      if (jobSalary) attrs.salary = jobSalary;
    }

    // Для услуг
    if (category === "services") {
      if (serviceType) attrs.serviceType = serviceType;
      if (servicePrice) attrs.servicePrice = servicePrice;
      if (serviceExperience) attrs.experience = serviceExperience;
      if (serviceGuarantee) attrs.guarantee = serviceGuarantee;
    }

    return attrs;
  };

  // Отправка формы
  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setErr("");

    try {
      const photoUrls = await uploadPhotos(user.uid, files);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(onlyDigits(price)),
        category,
        city,
        plan,
        photos: photoUrls,
        attrs: collectSpecs(),
        ownerName: user?.displayName || user?.email?.split('@')[0] || "Пользователь",
        ownerId: user.uid,
        ownerEmail: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const id = await createListing(payload);
      nav(`/listing/${id}`);
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || "Ошибка публикации");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="create-listing-page">
        <div className="auth-required">
          <div className="auth-icon">🔒</div>
          <h2>Необходима авторизация</h2>
          <p>Чтобы создать объявление, войдите в свой аккаунт</p>
          <div className="auth-buttons">
            <Link to="/login" className="btn-primary">Войти</Link>
            <Link to="/register" className="btn-outline">Регистрация</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing-page">
      {/* Шапка страницы */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📝</span>
            Создать объявление
          </h1>
          <p className="page-subtitle">
            {saving ? "Публикуем ваше объявление..." : "Заполните все поля и нажмите “Опубликовать”"}
          </p>
        </div>
        <div className="header-status">
          <span className={`status-badge ${saving ? "loading" : ""}`}>
            {saving ? (
              <>
                <span className="spinner-small" />
                Публикация
              </>
            ) : (
              <>
                <span className="status-dot" />
                Черновик
              </>
            )}
          </span>
        </div>
      </div>

      {/* Навигация назад */}
      <div className="back-nav">
        <Link className="back-link" to="/listings">
          <span className="back-arrow">←</span>
          Назад к объявлениям
        </Link>
      </div>

      {/* Прогресс бар */}
      <div className="progress-bar-container">
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Основное</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Фото</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Характеристики</div>
          </div>
        </div>
      </div>

      {/* Ошибка */}
      {err && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Ошибка при публикации</h4>
            <p>{err}</p>
          </div>
          <button className="error-close" onClick={() => setErr("")}>✕</button>
        </div>
      )}

      {/* Карточка с формой */}
      <div className="form-card">
        <form onSubmit={onSubmit}>
          {/* ШАГ 1: Основная информация (вводится вручную) */}
          <div className="form-section" style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📋</span>
                Основная информация
              </h2>
              <span className="required-badge">Обязательные поля</span>
            </div>

            <div className="form-grid">
              {/* Название - вводится вручную */}
              <div className="form-group full-width">
                <label className="form-label">
                  Название объявления <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${!title.trim() && title ? 'error' : ''}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: iPhone 15 Pro Max 256GB"
                  disabled={saving}
                />
                <div className="input-hint">
                  Хорошее название привлекает больше покупателей
                </div>
              </div>

              {/* Категория - из списка */}
              <div className="form-group">
                <label className="form-label">
                  Категория <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={saving}
                >
                  <option value="">Выберите категорию</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Город - из списка */}
              <div className="form-group">
                <label className="form-label">
                  Город <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={saving}
                >
                  <option value="">Выберите город</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Цена - вводится вручную */}
              <div className="form-group">
                <label className="form-label">
                  Цена (TJS) <span className="required-star">*</span>
                </label>
                <div className="price-input-wrapper">
                  <input
                    type="text"
                    className="form-input price-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="3400"
                    inputMode="numeric"
                    disabled={saving}
                  />
                  {price && (
                    <span className="price-preview">
                      {Number(onlyDigits(price)).toLocaleString()} TJS
                    </span>
                  )}
                </div>
              </div>

              {/* Описание - вводится вручную */}
              <div className="form-group full-width">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите товар подробнее: состояние, комплектация, особенности, возможность торга..."
                  rows={5}
                  disabled={saving}
                />
                <div className="textarea-counter">
                  {description.length} / 1000
                </div>
              </div>
            </div>

            <div className="form-navigation">
              <button
                type="button"
                className="btn-outline"
                onClick={() => nav("/listings")}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentStep(2)}
                disabled={!title.trim() || !category || !city || !price}
              >
                Далее
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          {/* ШАГ 2: Фотографии */}
          <div className="form-section" style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📸</span>
                Фотографии
              </h2>
              <span className="badge-secondary">до 6 шт.</span>
            </div>
            
            <div className="photo-upload-area">
              <input
                type="file"
                id="photo-upload"
                className="file-input"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={saving}
              />
              
              {filePreviews.length === 0 ? (
                <label htmlFor="photo-upload" className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">
                    <span className="upload-title">Нажмите для загрузки</span>
                    <span className="upload-hint">Поддерживаются JPG, PNG, WEBP до 10MB</span>
                  </div>
                </label>
              ) : (
                <div className="photo-grid">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="photo-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                      <div className="photo-order">{index + 1}</div>
                    </div>
                  ))}
                  
                  {files.length < 6 && (
                    <label htmlFor="photo-upload" className="photo-add">
                      <div className="add-icon">+</div>
                      <div className="add-text">Добавить</div>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="photo-tips">
              <h4>Советы для лучших фотографий:</h4>
              <ul>
                <li>📸 Сфотографируйте товар при хорошем освещении</li>
                <li>🖼️ Покажите товар с разных ракурсов</li>
                <li>🔍 Сделайте фото дефектов, если они есть</li>
                <li>📏 Добавьте фото с размерами или в использовании</li>
              </ul>
            </div>

            <div className="form-navigation">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setCurrentStep(1)}
              >
                ← Назад
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentStep(3)}
              >
                Далее
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          {/* ШАГ 3: Характеристики и план */}
          <div className="form-section" style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">⚙️</span>
                Характеристики
              </h2>
              <span className="badge-secondary">выберите из списков</span>
            </div>

            {/* Состояние товара - общее для всех категорий */}
            <div className="specs-section">
              <h3 className="subsection-title">Состояние товара</h3>
              <div className="specs-grid">
                <div className="form-group">
                  <label className="form-label">Состояние</label>
                  <select
                    className="form-select"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Выберите состояние</option>
                    {CONDITIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ДИНАМИЧЕСКИЕ ХАРАКТЕРИСТИКИ В ЗАВИСИМОСТИ ОТ КАТЕГОРИИ */}
            
            {/* АВТОМОБИЛИ */}
            {category === "auto" && (
              <div className="specs-section">
                <h3 className="subsection-title">🚗 Характеристики автомобиля</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Марка</label>
                    <select
                      className="form-select"
                      value={autoBrand}
                      onChange={(e) => {
                        setAutoBrand(e.target.value);
                        setAutoModel("");
                      }}
                      disabled={saving}
                    >
                      <option value="">Выберите марку</option>
                      {AUTO_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Модель</label>
                    <select
                      className="form-select"
                      value={autoModel}
                      onChange={(e) => setAutoModel(e.target.value)}
                      disabled={!autoBrand || saving}
                    >
                      <option value="">Выберите модель</option>
                      {availableAutoModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Год выпуска</label>
                    <select
                      className="form-select"
                      value={autoYear}
                      onChange={(e) => setAutoYear(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите год</option>
                      {AUTO_YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Пробег (км)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={autoMileage}
                      onChange={(e) => setAutoMileage(e.target.value)}
                      placeholder="50000"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Топливо</label>
                    <select
                      className="form-select"
                      value={autoFuel}
                      onChange={(e) => setAutoFuel(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите тип топлива</option>
                      {AUTO_FUEL.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Коробка передач</label>
                    <select
                      className="form-select"
                      value={autoTransmission}
                      onChange={(e) => setAutoTransmission(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите КПП</option>
                      {AUTO_TRANSMISSION.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Привод</label>
                    <select
                      className="form-select"
                      value={autoDrive}
                      onChange={(e) => setAutoDrive(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите привод</option>
                      {AUTO_DRIVE.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Тип кузова</label>
                    <select
                      className="form-select"
                      value={autoBody}
                      onChange={(e) => setAutoBody(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите кузов</option>
                      {AUTO_BODY.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цвет</label>
                    <select
                      className="form-select"
                      value={autoColor}
                      onChange={(e) => setAutoColor(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите цвет</option>
                      {AUTO_COLORS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ТЕЛЕФОНЫ */}
            {category === "phones" && (
              <div className="specs-section">
                <h3 className="subsection-title">📱 Характеристики телефона</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Бренд</label>
                    <select
                      className="form-select"
                      value={phoneBrand}
                      onChange={(e) => {
                        setPhoneBrand(e.target.value);
                        setPhoneModel("");
                      }}
                      disabled={saving}
                    >
                      <option value="">Выберите бренд</option>
                      {PHONE_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Модель</label>
                    <select
                      className="form-select"
                      value={phoneModel}
                      onChange={(e) => setPhoneModel(e.target.value)}
                      disabled={!phoneBrand || saving}
                    >
                      <option value="">Выберите модель</option>
                      {phoneBrand && PHONE_MODELS[phoneBrand]?.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Память</label>
                    <select
                      className="form-select"
                      value={phoneMemory}
                      onChange={(e) => setPhoneMemory(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите объем памяти</option>
                      {PHONE_MEMORY.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">RAM (оперативная память)</label>
                    <select
                      className="form-select"
                      value={phoneRAM}
                      onChange={(e) => setPhoneRAM(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите объем RAM</option>
                      {PHONE_RAM.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цвет</label>
                    <select
                      className="form-select"
                      value={phoneColor}
                      onChange={(e) => setPhoneColor(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите цвет</option>
                      {AUTO_COLORS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* НОУТБУКИ */}
            {category === "laptops" && (
              <div className="specs-section">
                <h3 className="subsection-title">💻 Характеристики ноутбука</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Бренд</label>
                    <select
                      className="form-select"
                      value={laptopBrand}
                      onChange={(e) => setLaptopBrand(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите бренд</option>
                      {LAPTOP_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Модель</label>
                    <input
                      type="text"
                      className="form-input"
                      value={laptopModel}
                      onChange={(e) => setLaptopModel(e.target.value)}
                      placeholder="MacBook Pro 16"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Процессор</label>
                    <select
                      className="form-select"
                      value={laptopProcessor}
                      onChange={(e) => setLaptopProcessor(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите процессор</option>
                      {LAPTOP_PROCESSORS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">RAM</label>
                    <select
                      className="form-select"
                      value={laptopRAM}
                      onChange={(e) => setLaptopRAM(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите RAM</option>
                      {LAPTOP_RAM.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Накопитель</label>
                    <select
                      className="form-select"
                      value={laptopStorage}
                      onChange={(e) => setLaptopStorage(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите накопитель</option>
                      {LAPTOP_STORAGE.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Экран</label>
                    <input
                      type="text"
                      className="form-input"
                      value={laptopScreen}
                      onChange={(e) => setLaptopScreen(e.target.value)}
                      placeholder='16" Retina'
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* НЕДВИЖИМОСТЬ */}
            {category === "realty" && (
              <div className="specs-section">
                <h3 className="subsection-title">🏠 Характеристики недвижимости</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Тип</label>
                    <select
                      className="form-select"
                      value={realtyType}
                      onChange={(e) => setRealtyType(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите тип</option>
                      {REALTY_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Комнат</label>
                    <select
                      className="form-select"
                      value={realtyRooms}
                      onChange={(e) => setRealtyRooms(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите количество</option>
                      {REALTY_ROOMS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Площадь (м²)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={realtyArea}
                      onChange={(e) => setRealtyArea(e.target.value)}
                      placeholder="65"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Этаж</label>
                    <input
                      type="text"
                      className="form-input"
                      value={realtyFloor}
                      onChange={(e) => setRealtyFloor(e.target.value)}
                      placeholder="5 из 9"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ремонт</label>
                    <select
                      className="form-select"
                      value={realtyRepair}
                      onChange={(e) => setRealtyRepair(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите ремонт</option>
                      {REALTY_REPAIR.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Мебель</label>
                    <select
                      className="form-select"
                      value={realtyFurniture}
                      onChange={(e) => setRealtyFurniture(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите наличие мебели</option>
                      {REALTY_FURNITURE.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ОДЕЖДА */}
            {category === "clothes" && (
              <div className="specs-section">
                <h3 className="subsection-title">👕 Характеристики одежды</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Тип</label>
                    <select
                      className="form-select"
                      value={clothesType}
                      onChange={(e) => setClothesType(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите тип</option>
                      {CLOTHES_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Бренд</label>
                    <select
                      className="form-select"
                      value={clothesBrand}
                      onChange={(e) => setClothesBrand(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите бренд</option>
                      {CLOTHES_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Размер</label>
                    <select
                      className="form-select"
                      value={clothesSize}
                      onChange={(e) => setClothesSize(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите размер</option>
                      {CLOTHES_SIZES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Для кого</label>
                    <select
                      className="form-select"
                      value={clothesGender}
                      onChange={(e) => setClothesGender(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите пол</option>
                      {CLOTHES_GENDER.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Материал</label>
                    <select
                      className="form-select"
                      value={clothesMaterial}
                      onChange={(e) => setClothesMaterial(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите материал</option>
                      {CLOTHES_MATERIALS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цвет</label>
                    <select
                      className="form-select"
                      value={clothesColor}
                      onChange={(e) => setClothesColor(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите цвет</option>
                      {AUTO_COLORS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* МЕБЕЛЬ */}
            {category === "furniture" && (
              <div className="specs-section">
                <h3 className="subsection-title">🪑 Характеристики мебели</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Тип</label>
                    <select
                      className="form-select"
                      value={furnitureType}
                      onChange={(e) => setFurnitureType(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите тип</option>
                      {FURNITURE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Материал</label>
                    <select
                      className="form-select"
                      value={furnitureMaterial}
                      onChange={(e) => setFurnitureMaterial(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите материал</option>
                      {FURNITURE_MATERIALS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цвет</label>
                    <select
                      className="form-select"
                      value={furnitureColor}
                      onChange={(e) => setFurnitureColor(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите цвет</option>
                      {FURNITURE_COLORS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Размеры</label>
                    <input
                      type="text"
                      className="form-input"
                      value={furnitureDimensions}
                      onChange={(e) => setFurnitureDimensions(e.target.value)}
                      placeholder="200x90x80 см"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ЖИВОТНЫЕ */}
            {category === "pets" && (
              <div className="specs-section">
                <h3 className="subsection-title">🐕 Характеристики животного</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Вид</label>
                    <select
                      className="form-select"
                      value={petType}
                      onChange={(e) => {
                        setPetType(e.target.value);
                        setPetBreed("");
                      }}
                      disabled={saving}
                    >
                      <option value="">Выберите вид</option>
                      {PET_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Порода</label>
                    <select
                      className="form-select"
                      value={petBreed}
                      onChange={(e) => setPetBreed(e.target.value)}
                      disabled={!petType || saving}
                    >
                      <option value="">Выберите породу</option>
                      {availablePetBreeds.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Возраст</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ flex: 2 }}
                        value={petAge}
                        onChange={(e) => setPetAge(e.target.value)}
                        placeholder="2"
                        disabled={saving}
                      />
                      <select
                        className="form-select"
                        style={{ flex: 1 }}
                        value={petAgeUnit}
                        onChange={(e) => setPetAgeUnit(e.target.value)}
                        disabled={saving}
                      >
                        <option value="">ед.</option>
                        {PET_AGE_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Пол</label>
                    <select
                      className="form-select"
                      value={petGender}
                      onChange={(e) => setPetGender(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите пол</option>
                      {PET_GENDER.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Прививки</label>
                    <select
                      className="form-select"
                      value={petVaccinated}
                      onChange={(e) => setPetVaccinated(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите</option>
                      <option value="Да">Да</option>
                      <option value="Нет">Нет</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Документы</label>
                    <select
                      className="form-select"
                      value={petDocuments}
                      onChange={(e) => setPetDocuments(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите</option>
                      <option value="Есть">Есть</option>
                      <option value="Нет">Нет</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* РАБОТА */}
            {category === "jobs" && (
              <div className="specs-section">
                <h3 className="subsection-title">💼 Характеристики работы</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Компания</label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      placeholder="Название компании"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Должность</label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                      placeholder="Программист, Водитель..."
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Тип занятости</label>
                    <select
                      className="form-select"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите тип</option>
                      {JOB_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Опыт</label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobExperience}
                      onChange={(e) => setJobExperience(e.target.value)}
                      placeholder="1-3 года"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Образование</label>
                    <select
                      className="form-select"
                      value={jobEducation}
                      onChange={(e) => setJobEducation(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите образование</option>
                      {JOB_EDUCATION.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Зарплата</label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      placeholder="от 5000 TJS"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* УСЛУГИ */}
            {category === "services" && (
              <div className="specs-section">
                <h3 className="subsection-title">🧰 Характеристики услуги</h3>
                <div className="specs-grid">
                  <div className="form-group">
                    <label className="form-label">Тип услуги</label>
                    <select
                      className="form-select"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите тип</option>
                      {SERVICE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цена</label>
                    <input
                      type="text"
                      className="form-input"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="от 100 TJS/час"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Опыт</label>
                    <input
                      type="text"
                      className="form-input"
                      value={serviceExperience}
                      onChange={(e) => setServiceExperience(e.target.value)}
                      placeholder="5 лет"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Гарантия</label>
                    <select
                      className="form-select"
                      value={serviceGuarantee}
                      onChange={(e) => setServiceGuarantee(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Выберите</option>
                      <option value="Есть">Есть</option>
                      <option value="Нет">Нет</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* План размещения */}
            <div className="plan-section">
              <h3 className="subsection-title">Выберите план размещения</h3>
              <div className="plan-cards">
                {PLANS.map((p) => (
                  <label
                    key={p.id}
                    className={`plan-card ${plan === p.id ? "selected" : ""} ${p.color}`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={plan === p.id}
                      onChange={(e) => setPlan(e.target.value)}
                      disabled={saving}
                    />
                    <div className="plan-card-content">
                      <div className="plan-icon">{p.icon}</div>
                      <div className="plan-info">
                        <div className="plan-name">{p.name}</div>
                        <div className="plan-price">{p.price}</div>
                      </div>
                    </div>
                    <ul className="plan-features">
                      {p.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                    {plan === p.id && (
                      <div className="plan-selected">✓ Выбрано</div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-navigation">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setCurrentStep(2)}
              >
                ← Назад
              </button>
              <button
                type="submit"
                className="btn-primary btn-large"
                disabled={!canSubmit}
              >
                {saving ? (
                  <>
                    <span className="spinner" />
                    Публикация...
                  </>
                ) : (
                  <>
                    <span>📢 Опубликовать</span>
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Подсказка об обязательных полях */}
        {!canSubmit && !saving && currentStep === 3 && (
          <div className="required-hint">
            <span className="hint-icon">ℹ️</span>
            <span>Заполните обязательные поля: <strong>Название</strong>, <strong>Категория</strong>, <strong>Город</strong>, <strong>Цена</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}