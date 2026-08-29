import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const CheckoutLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link to="/cart" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg leading-none font-sans">i</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-black transition-colors group-hover:text-gray-600">Crowd</span>
          </Link>
          
          <div className="flex items-center gap-2 text-gray-500">
            <ShieldCheck size={20} className="text-green-600" />
            <span className="text-sm font-medium">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} iCrowd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CheckoutLayout;
