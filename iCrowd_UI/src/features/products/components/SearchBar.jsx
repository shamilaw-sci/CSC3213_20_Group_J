import React from 'react';
import { Link } from 'react-router-dom';
import { useSearchAutocomplete} from '../hooks/useSearchAutocomplete';

const SearchBar = ({ initialKeyword, onSearch, placeholder = "Search headsets, powerbanks, cases..." }) => {
  const {
    keyword,
    setKeyword,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    wrapperRef,
    handleSearch,
    handleSuggestionClick,
    handleCategoryClick
  } = useSearchAutocomplete(initialKeyword, onSearch);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto z-50">
      <form onSubmit={handleSearch}>
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          type="search" 
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.terms?.length > 0 || suggestions.products?.length > 0) setShowSuggestions(true);
          }}
          className="block w-full p-4 pl-12 text-sm text-black bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium" 
          placeholder={placeholder} 
        />
        <button 
          type="submit" 
          className="text-white absolute right-2.5 bottom-2.5 bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-full text-sm px-6 py-2 transition-all shadow-md active:scale-95"
        >
          Search
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {showSuggestions && (
        <div className="absolute w-full mt-3 bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col divide-y divide-gray-100">
          
          {/* Section 1: Predictive Terms */}
          {suggestions.terms?.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Searches</div>
              <ul>
                {suggestions.terms.map((term, index) => (
                  <li key={`term-${index}`}>
                    <button
                      onClick={() => handleSuggestionClick(term)}
                      className="w-full text-left px-6 py-2 text-gray-700 hover:bg-gray-50 hover:text-black transition-all flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 2: Categories */}
          {suggestions.categories?.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</div>
              <div className="px-4 py-2 flex flex-wrap gap-2">
                {suggestions.categories.map((cat, index) => (
                  <button
                    key={`cat-${index}`}
                    onClick={() => handleCategoryClick(cat)}
                    className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-black hover:text-white transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Product Hits */}
          {suggestions.products?.length > 0 && (
            <div className="py-2 bg-gray-50">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</div>
              <ul>
                {suggestions.products.map((product) => (
                  <li key={`prod-${product.id}`}>
                    <Link
                      to={`/product/${product.id}`}
                      onClick={() => setShowSuggestions(false)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-white hover:text-black transition-all flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-white flex-shrink-0 border border-gray-200">
                        <img src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : ''} alt={product.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <span className="font-medium text-sm line-clamp-1">{product.name}</span>
                        <span className="text-black font-bold text-sm ml-4">LKR {Number(product.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};

export default SearchBar;
