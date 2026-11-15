import { useState, useEffect, useRef } from 'react';
import { fetchSuggestions } from '../api/fetchSuggestions';
import { useDebounce } from './useDebounce';
import { useNavigate } from 'react-router-dom';

export const useSearchAutocomplete = (initialKeyword, onSearch) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [suggestions, setSuggestions] = useState({ terms: [], categories: [], products: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const debouncedKeyword = useDebounce(keyword, 300);

  const [previousInitial,setPreviousInitial]=useState(initialKeyword);
  if(previousInitial!==initialKeyword) { setPreviousInitial(initialKeyword);setKeyword(initialKeyword || '');setShowSuggestions(false); }

  // Fetch suggestions when debouncedKeyword changes
  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    if (debouncedKeyword.trim().length > 1 && debouncedKeyword===keyword) {
      fetchSuggestions(debouncedKeyword, controller.signal).then(data => {
        if (!current) return;
        setSuggestions({...data, query:debouncedKeyword});
        const hasResults = data.terms.length > 0 || data.categories.length > 0 || data.products.length > 0;
        setShowSuggestions(hasResults);
      }).catch(() => {});
    }
    return () => { current = false; controller.abort(); };
  }, [debouncedKeyword, keyword]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    onSearch(keyword.trim());
  };

  const handleSuggestionClick = (suggestion) => {
    setKeyword(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleCategoryClick = (cat) => {
    setShowSuggestions(false);
    navigate(`/search?category=${encodeURIComponent(cat)}`);
  };

  return {
    keyword,
    setKeyword,
    suggestions,
    showSuggestions: showSuggestions && suggestions.query===keyword && keyword.trim().length>1,
    setShowSuggestions,
    wrapperRef,
    handleSearch,
    handleSuggestionClick,
    handleCategoryClick
  };
};
