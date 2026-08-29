import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Analytics & Forecasts', path: '/admin/analytics', icon: '📊', active: location.pathname === '/admin/analytics' || location.pathname === '/admin' },
    { name: 'Inventory & Stock', path: '/admin/analytics#inventory', icon: '📦', active: false },
    { name: 'Sales & Profits', path: '/admin/analytics#profit', icon: '💰', active: false },
    { name: 'AI Opportunity Insights', path: '/admin/analytics#insights', icon: '🧠', active: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-primary/30 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md">
            i
          </div>
          <span className="font-bold text-lg text-white">iCrowd <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-mono">ADMIN</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-white font-black text-xl leading-none">i</span>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white block">iCrowd</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Admin Console
              </span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Intelligence & Management
          </div>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                item.active
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}

          <div className="pt-6 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Quick Actions
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all"
          >
            <span className="text-lg">🛍️</span>
            <span>Customer Storefront</span>
          </Link>
          <Link
            to="/search"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all"
          >
            <span className="text-lg">🔍</span>
            <span>Product Catalog</span>
          </Link>
        </nav>

        {/* Bottom User / Server Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Administrator</p>
              <p className="text-[11px] text-slate-400 truncate">admin@icrowd.lk</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Backend API Live
            </span>
            <span className="font-mono text-slate-500">v1.2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Topbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/70 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">Overview</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-primary font-medium">AI Analytics & Business Intelligence</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/70 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <span>📅</span>
              <span>Year: <strong>2026</strong></span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <span>← Go to Store</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
