import React, { useState, useRef, useEffect } from 'react';
import {
  exportFullAnalyticsCSV,
  exportTopProductsCSV,
  exportInventoryHealthCSV,
  triggerPrintReport,
} from '../utils/analyticsExportUtils';

/**
 * Export Menu Component supporting CSV Datasets and Printable PDF Reports
 */
const ExportMenu = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleExportFullCSV = () => {
    exportFullAnalyticsCSV(data);
    setIsOpen(false);
  };

  const handleExportTopProductsCSV = () => {
    exportTopProductsCSV(data?.topProducts || [], data?.overview?.dateRangeLabel);
    setIsOpen(false);
  };

  const handleExportInventoryCSV = () => {
    exportInventoryHealthCSV(data);
    setIsOpen(false);
  };

  const handlePrintPDF = () => {
    setIsOpen(false);
    triggerPrintReport();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all border border-emerald-400/20"
      >
        <span>📥</span>
        <span>Export</span>
        <span className="text-[10px]">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Export Business Intelligence
            </p>
          </div>

          <div className="space-y-1 mt-1">
            {/* Print / PDF Report */}
            <button
              onClick={handlePrintPDF}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left group"
            >
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20 text-sm">
                📄
              </span>
              <div>
                <p className="font-semibold text-white">Save as PDF / Print</p>
                <p className="text-[10px] text-slate-400">Executive printable layout</p>
              </div>
            </button>

            {/* Full CSV Report */}
            <button
              onClick={handleExportFullCSV}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left group"
            >
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 text-sm">
                📊
              </span>
              <div>
                <p className="font-semibold text-white">Full Analytics (CSV)</p>
                <p className="text-[10px] text-slate-400">KPIs, products & restock data</p>
              </div>
            </button>

            {/* Top Products CSV */}
            <button
              onClick={handleExportTopProductsCSV}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left group"
            >
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 text-sm">
                🏆
              </span>
              <div>
                <p className="font-semibold text-white">Top Products (CSV)</p>
                <p className="text-[10px] text-slate-400">Sales volume & profit breakdown</p>
              </div>
            </button>

            {/* Inventory & Restock CSV */}
            <button
              onClick={handleExportInventoryCSV}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left group"
            >
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 text-sm">
                📦
              </span>
              <div>
                <p className="font-semibold text-white">Inventory & Restock (CSV)</p>
                <p className="text-[10px] text-slate-400">Reorder thresholds & stock alerts</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
