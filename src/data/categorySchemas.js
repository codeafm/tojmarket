export const CATEGORIES = [
  { id: "auto", title: "Авто" },
  { id: "phones", title: "Телефоны" },
  { id: "realty", title: "Недвижимость" },
  { id: "clothes", title: "Одежда" },
  { id: "services", title: "Услуги" },
  { id: "other", title: "Другое" },
];

const YEARS = Array.from({ length: 60 }, (_, i) => String(new Date().getFullYear() - i));

const AUTO_BRANDS = [
  "Toyota","Mercedes-Benz","BMW","Audi","Lexus","Honda","Hyundai","Kia","Nissan","Chevrolet","Volkswagen","Ford",
  "Mazda","Mitsubishi","Subaru","Suzuki","Renault","Peugeot","Opel","Skoda","Porsche","Land Rover","Jeep",
  "Chery","Geely","Haval","BYD","Tesla","Volvo","Infiniti","Dodge","GMC","Fiat","Jaguar","Mini","Lada (ВАЗ)",
  "UAZ","GAZ","SsangYong","Daewoo","Isuzu","Daihatsu","Citroen","Acura","Cadillac","Buick","Lincoln",
];

const AUTO_MODELS_BY_BRAND = {
  "Toyota": ["Camry","Corolla","Land Cruiser","Prado","RAV4","Highlander","Yaris","Hilux","Avalon","Crown"],
  "Mercedes-Benz": ["C-Class","E-Class","S-Class","GLA","GLB","GLC","GLE","GLS","A-Class","CLA"],
  "BMW": ["3 Series","5 Series","7 Series","X1","X3","X5","X6","X7","M3","M5"],
  "Audi": ["A3","A4","A6","A8","Q3","Q5","Q7","Q8"],
  "Lexus": ["ES","GS","LS","RX","NX","LX","IS","GX"],
  "Honda": ["Civic","Accord","CR-V","HR-V","Fit","Pilot"],
  "Hyundai": ["Elantra","Sonata","Tucson","Santa Fe","Accent","Palisade"],
  "Kia": ["Rio","Cerato","Optima","K5","Sportage","Sorento","Seltos"],
  "Volkswagen": ["Golf","Passat","Jetta","Tiguan","Touareg","Polo"],
  "Nissan": ["Altima","Teana","X-Trail","Qashqai","Patrol","Juke"],
  "Chevrolet": ["Cruze","Malibu","Captiva","Tahoe","Camaro"],
  "Ford": ["Focus","Fusion","Explorer","Escape","Mustang"],
  "Mazda": ["Mazda 3","Mazda 6","CX-5","CX-9"],
  "Mitsubishi": ["Lancer","Outlander","Pajero","ASX"],
  "Subaru": ["Forester","Impreza","Outback","Legacy"],
  "Renault": ["Logan","Duster","Sandero","Kaptur"],
  "Skoda": ["Octavia","Rapid","Superb","Kodiaq","Karoq"],
  "Lada (ВАЗ)": ["Priora","Granta","Vesta","Niva"],
  // остальные бренды можно добавлять по мере надобности
};

const COLORS = [
  "Белый","Черный","Серый","Серебристый","Синий","Красный","Зеленый","Желтый","Коричневый","Бежевый","Оранжевый","Фиолетовый",
];

const FUELS = ["Бензин","Дизель","Газ","Гибрид","Электро"];
const TRANSMISSIONS = ["Автомат","Механика","Вариатор","Робот"];
const DRIVES = ["Передний","Задний","Полный"];
const CONDITIONS = ["Новое","Отличное","Хорошее","Требует ремонта"];

const PHONE_BRANDS = [
  "Apple","Samsung","Xiaomi","Redmi","Poco","Huawei","Honor","Oppo","Vivo","Realme","OnePlus","Google",
  "Nokia","Motorola","Sony","ZTE","Tecno","Infinix","Itel","Meizu","ASUS","Lenovo","HTC","BlackBerry",
];

const PHONE_MODELS_BY_BRAND = {
  "Apple": ["iPhone 17 Pro Max","iPhone 17 Pro","iPhone 17","iPhone 16 Pro Max","iPhone 16 Pro","iPhone 16","iPhone 15 Pro Max","iPhone 15 Pro","iPhone 15","iPhone 14 Pro Max","iPhone 14 Pro","iPhone 14","iPhone 13","iPhone 12","iPhone 11","iPhone X"],
  "Samsung": ["Galaxy S24 Ultra","Galaxy S24","Galaxy S23 Ultra","Galaxy S23","Galaxy A55","Galaxy A35","Galaxy A25","Galaxy A15"],
  "Xiaomi": ["Xiaomi 14","Xiaomi 13","Xiaomi 12","Xiaomi 11"],
  "Redmi": ["Note 13 Pro","Note 13","Note 12 Pro","Note 12","Note 11"],
  "Poco": ["F6","F5","X6 Pro","X6","M6 Pro"],
  "Huawei": ["P60 Pro","P50 Pro","Nova 11","Nova 10"],
  "Honor": ["Magic 6 Pro","Magic 5 Pro","X9","X8"],
  "Oppo": ["Reno 11","Reno 10","A78","A58"],
  "Vivo": ["V29","V27","Y36","Y22"],
  "Realme": ["11 Pro+","11 Pro","C55","C53"],
  "Tecno": ["Camon 20","Camon 19","Spark 20","Spark 10","Pova 5"],
  "Infinix": ["Note 30","Note 12","Hot 40","Hot 30","Zero 30"],
  // дополняй при необходимости
};

const MEMORY_GB = ["16","32","64","128","256","512","1024"];
const RAM_GB = ["2","3","4","6","8","12","16"];
const BATTERY_PCT = ["100","95","90","85","80","75","70","60"];

export const categorySchemas = {
  auto: {
    title: "Авто: доп. фильтры",
    fields: [
      { key: "brand", label: "Марка", kind: "datalist", options: AUTO_BRANDS },
      { key: "model", label: "Модель", kind: "datalistBy", dependsOn: "brand", map: AUTO_MODELS_BY_BRAND, placeholder: "Сначала выберите марку (или напишите)" },
      { key: "year", label: "Год", kind: "select", options: YEARS },
      { key: "mileage", label: "Пробег (км)", kind: "number", placeholder: "Напр. 120000" },
      { key: "color", label: "Цвет", kind: "select", options: COLORS },
      { key: "fuel", label: "Топливо", kind: "select", options: FUELS },
      { key: "transmission", label: "Коробка", kind: "select", options: TRANSMISSIONS },
      { key: "drive", label: "Привод", kind: "select", options: DRIVES },
      { key: "condition", label: "Состояние", kind: "select", options: CONDITIONS },
      { key: "vin", label: "VIN", kind: "text", placeholder: "Необязательно" },
    ],
  },

  phones: {
    title: "Телефоны: доп. фильтры",
    fields: [
      { key: "brand", label: "Бренд", kind: "datalist", options: PHONE_BRANDS },
      { key: "model", label: "Модель", kind: "datalistBy", dependsOn: "brand", map: PHONE_MODELS_BY_BRAND, placeholder: "Сначала выберите бренд (или напишите)" },
      { key: "memory", label: "Память (GB)", kind: "select", options: MEMORY_GB },
      { key: "ram", label: "RAM (GB)", kind: "select", options: RAM_GB },
      { key: "color", label: "Цвет", kind: "select", options: COLORS },
      { key: "condition", label: "Состояние", kind: "select", options: CONDITIONS },
      { key: "battery", label: "Батарея %", kind: "select", options: BATTERY_PCT },
    ],
  },

  realty: {
    title: "Недвижимость: доп. фильтры",
    fields: [
      { key: "type", label: "Тип", kind: "select", options: ["Квартира","Дом","Участок","Коммерческая","Аренда"] },
      { key: "rooms", label: "Комнат", kind: "select", options: ["1","2","3","4","5+"] },
      { key: "area", label: "Площадь (м²)", kind: "number", placeholder: "Напр. 68" },
      { key: "floor", label: "Этаж", kind: "text", placeholder: "Напр. 5/9" },
      { key: "condition", label: "Состояние", kind: "select", options: ["Новостройка","Вторичка","Ремонт","Без ремонта"] },
    ],
  },

  clothes: {
    title: "Одежда: доп. фильтры",
    fields: [
      { key: "type", label: "Тип", kind: "select", options: ["Куртка","Платье","Футболка","Джинсы","Обувь","Другое"] },
      { key: "size", label: "Размер", kind: "select", options: ["XS","S","M","L","XL","XXL"] },
      { key: "color", label: "Цвет", kind: "select", options: COLORS },
      { key: "condition", label: "Состояние", kind: "select", options: CONDITIONS },
    ],
  },

  services: {
    title: "Услуги: доп. фильтры",
    fields: [
      { key: "type", label: "Тип услуги", kind: "text", placeholder: "Напр. ремонт, доставка..." },
      { key: "experience", label: "Стаж (лет)", kind: "number", placeholder: "Напр. 3" },
    ],
  },

  other: {
    title: "Другое: доп. фильтры",
    fields: [{ key: "note", label: "Примечание", kind: "text", placeholder: "Доп. информация" }],
  },
};
