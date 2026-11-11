import { useLocation, useNavigate } from 'react-router-dom';


export const useProductFilters = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const keyword = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const rawPage = searchParams.get('page') || '0';
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 0;
  const extra = Object.fromEntries(['minPrice','maxPrice','brand','inStock','minRating'].map(k => [k, searchParams.get(k) || '']));

  const updateFilters = (updates) => {
    const params = new URLSearchParams(location.search);
    
    Object.entries(updates).forEach(([key,value]) => { if (value) params.set(key,value); else params.delete(key); });
    // Apply updates
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q);
      else params.delete('q');
    }
    
    if (updates.category !== undefined) {
      if (updates.category && updates.category !== 'All') params.set('category', updates.category);
      else params.delete('category');
    }

    if (updates.sort !== undefined) {
      if (updates.sort) params.set('sort', updates.sort);
      else params.delete('sort');
    }

    // Always reset to page 0 if filters change (except when explicitly changing page)
    if (updates.page !== undefined) {
      params.set('page', updates.page.toString());
    } else {
      params.delete('page');
    }

    navigate(`/search?${params.toString()}`);
  };

  return {
    extra, updateFilters, clearFilters: () => navigate('/search'),
    keyword,
    category,
    sort,
    page,
    setKeyword: (q) => updateFilters({ q }),
    setCategory: (cat) => updateFilters({ category: cat }),
    setSort: (s) => updateFilters({ sort: s }),
    setPage: (p) => updateFilters({ page: p }) // Does not delete other filters
  };
};
