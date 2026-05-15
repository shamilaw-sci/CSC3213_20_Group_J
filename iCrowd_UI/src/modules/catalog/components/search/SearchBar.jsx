import React, { useState } from "react";

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
    <div className="w-full flex justify-end">
      <div className="relative flex items-center w-full max-w-[420px] group">

        <div className="absolute left-4">
          <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>

        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={handleChange}
          className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm text-gray-700 placeholder:text-gray-400"
        />

        {query && (
          <button 
            className="absolute right-4 text-gray-400 hover:text-red-500 transition-colors" 
            onClick={handleClear}
          >
            ✕
          </button>
        )}
      </div>

      {query && resultCount === 0 && (
        <div className="fixed inset-x-0 top-60 text-center pointer-events-none">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500">No products found for "<span className="font-bold">{query}</span>"</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;