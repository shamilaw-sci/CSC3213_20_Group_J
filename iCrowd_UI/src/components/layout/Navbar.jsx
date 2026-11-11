import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../../features/products/components/SearchBar';
import { useProductFilters } from '../../features/products/hooks/useProductFilters';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCart } from '../../features/cart/hooks/CartContext';
import { ShoppingBag } from 'lucide-react';

const Navbar = () => {
  const { keyword, setKeyword } = useProductFilters();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U';

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
          {isAdmin && <Link to="/admin" className="text-sm font-semibold text-slate-700">Manage store</Link>}
          <div className="flex items-center gap-4 ml-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-semibold text-gray-800"
                >
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {userInitial}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.firstName || 'Profile'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-black transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-900 px-3.5 py-2 rounded-full transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            <Link 
              to="/cart"
              className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              aria-label="View Cart"
            >
              <ShoppingBag size={18} />
              {getItemCount() > 0 && (
                <span className="bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full -ml-1">
                  {getItemCount()}
                </span>
              )}
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
