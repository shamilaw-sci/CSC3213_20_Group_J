import React, { useState } from "react";
import "./SearchBar.css";

function SearchBar({ onSearch, resultCount }) {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) onSearch(val);
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) onSearch("");
  };

  return (
    <div className="search-wrapper">
      <div className="search-box">
        <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={handleChange}
        />
        {query && (
          <button className="clear-btn" onClick={handleClear}>✕</button>
        )}
      </div>

      {query && resultCount === 0 && (
        <div className="empty-state">
          <p className="empty-icon">🔍</p>
          <p>No products found for "<strong>{query}</strong>"</p>
          <button className="empty-clear-btn" onClick={handleClear}>
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchBar;