// components/SearchWithVisuals.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchWithVisuals.css';

const POPULAR_CATEGORIES = [
  { id: 'electronics', name: 'Электроника', icon: '📱', color: '#3b82f6', count: '2,345' },
  { id: 'cars', name: 'Автомобили', icon: '🚗', color: '#ef4444', count: '1,234' },
  { id: 'scooters', name: 'Скутеры', icon: '🛵', color: '#f59e0b', count: '567' },
  { id: 'furniture', name: 'Мебель', icon: '🪑', color: '#8b5cf6', count: '892' },
  { id: 'clothes', name: 'Одежда', icon: '👕', color: '#ec4899', count: '1,567' },
  { id: 'sports', name: 'Спорт', icon: '⚽', color: '#10b981', count: '423' },
];

const TRENDING_SEARCHES = [
  { id: 1, query: 'iPhone 15 Pro', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&h=100&fit=crop', price: '999' },
  { id: 2, query: 'Toyota Camry 2024', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=100&h=100&fit=crop', price: '35,000' },
  { id: 3, query: 'Samsung S24 Ultra', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100&h=100&fit=crop', price: '1,199' },
  { id: 4, query: 'Honda Scooter', image: 'https://images.unsplash.com/photo-1606144042614-2413e99c5e60?w=100&h=100&fit=crop', price: '2,500' },
  { id: 5, query: 'BMW X5', image: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=100&h=100&fit=crop', price: '65,000' },
  { id: 6, query: 'Nike Air Max', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop', price: '150' },
];

export default function SearchWithVisuals() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Сохраняем в недавние поиски
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    navigate(`/listings?q=${encodeURIComponent(searchQuery)}`);
    setShowDropdown(false);
  };

  const handleCategoryClick = (category) => {
    navigate(`/listings?category=${category.id}`);
  };

  const handleSuggestionClick = (query) => {
    setSearchQuery(query);
    setTimeout(() => {
      navigate(`/listings?q=${encodeURIComponent(query)}`);
    }, 100);
  };

  return (
    <div className="visualSearchContainer">
      {/* Основной поиск */}
      <form className="visualSearchForm" onSubmit={handleSearch}>
        <div className="visualSearchWrapper">
          <span className="visualSearchIcon">🔍</span>
          <input
            type="text"
            className="visualSearchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Поиск товаров и услуг..."
            autoComplete="off"
          />
          {searchQuery && (
            <button type="button" className="visualClearBtn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
          <button type="submit" className="visualSearchBtn">
            Найти
          </button>
        </div>
      </form>

      {/* Популярные категории */}
      <div className="popularCategories">
        <h3 className="sectionTitle">Популярные категории</h3>
        <div className="categoriesGrid">
          {POPULAR_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="categoryCard"
              onClick={() => handleCategoryClick(cat)}
              style={{ '--cat-color': cat.color }}
            >
              <span className="categoryIcon">{cat.icon}</span>
              <div className="categoryInfo">
                <span className="categoryName">{cat.name}</span>
                <span className="categoryCount">{cat.count} объявлений</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Трендовые поиски с картинками */}
      <div className="trendingSection">
        <h3 className="sectionTitle">Сейчас популярно 🔥</h3>
        <div className="trendingGrid">
          {TRENDING_SEARCHES.map(item => (
            <div
              key={item.id}
              className="trendingCard"
              onClick={() => handleSuggestionClick(item.query)}
            >
              <div className="trendingImageWrapper">
                <img src={item.image} alt={item.query} className="trendingImage" />
              </div>
              <div className="trendingInfo">
                <span className="trendingName">{item.query}</span>
                <span className="trendingPrice">от {item.price} TJS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Недавние поиски */}
      {showDropdown && recentSearches.length > 0 && (
        <div className="recentDropdown">
          <h4 className="dropdownTitle">Недавние запросы</h4>
          {recentSearches.map((search, idx) => (
            <div
              key={idx}
              className="recentItem"
              onClick={() => handleSuggestionClick(search)}
            >
              <span className="recentIcon">🕒</span>
              <span className="recentText">{search}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}