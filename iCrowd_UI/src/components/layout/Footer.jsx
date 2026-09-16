import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-black border border-slate-700 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-lg leading-none">i</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Crowd</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flagship Smartphones, premium audio gear, power accessories, and device protection curated for the modern digital life.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/search?category=Smartphone" className="hover:text-primary transition-colors">Smartphones & Flagships</Link></li>
              <li><Link to="/search?category=Headset" className="hover:text-primary transition-colors">Headsets & Audio</Link></li>
              <li><Link to="/search?category=PowerBank" className="hover:text-primary transition-colors">PowerBanks & Chargers</Link></li>
              <li><Link to="/search?category=Case" className="hover:text-primary transition-colors">Cases & Protection</Link></li>
              <li><Link to="/search" className="hover:text-primary transition-colors">All Products</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/profile" className="hover:text-primary transition-colors">Track Your Order</Link></li>
              <li><a href="#shipping" className="hover:text-primary transition-colors">Shipping Information</a></li>
              <li><a href="#warranty" className="hover:text-primary transition-colors">Warranty & Returns</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">Help Center & FAQ</a></li>
            </ul>
          </div>

          {/* Admin & Portal */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Store Admin</h4>
            <p className="text-xs text-slate-400 mb-3">
              Access the AI-powered sales forecasting and inventory intelligence suite.
            </p>
            <Link 
              to="/admin/analytics" 
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary/40 text-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <span>📊</span>
              <span>Admin Analytics Portal</span>
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 iCrowd Electronics Ltd. All rights reserved. CSC3213 Project.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              API Online
            </span>
            <span>•</span>
            <span>AI Forecasting Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
