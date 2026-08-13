import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../../features/products/components/SearchBar';
import { useProductFilters } from '../../features/products/hooks/useProductFilters';

const Navbar = () => {
  const { keyword, setKeyword } = useProductFilters();

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100 py-3 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 mr-4 group">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-xl leading-none font-sans">i</span>
            </div>
            <span className="font-bold text-2xl tracking-tight text-black transition-colors group-hover:text-gray-600">Crowd</span>
          </Link>

          {/* Global Search Bar (Smart Container connects to Dumb UI) */}
          <div className="w-full max-w-xl flex-grow">
            <SearchBar 
              initialKeyword={keyword} 
              onSearch={setKeyword} 
              placeholder="Search products..."
            />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-6 ml-4">
            <button className="text-sm font-semibold text-gray-500 hover:text-black transition-colors">
              Login
            </button>
            <button className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg active:scale-95 text-sm">
              Cart (0)
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
