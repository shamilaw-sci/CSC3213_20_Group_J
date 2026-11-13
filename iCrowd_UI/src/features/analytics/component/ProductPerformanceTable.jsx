import React, { useState } from 'react';
import { Trophy, AlertOctagon, TrendingUp, AlertTriangle } from 'lucide-react';

const ProductPerformanceTable = ({ topProducts = [], worstProducts = [] }) => {
  const [activeTab, setActiveTab] = useState('top'); // 'top' or 'worst'

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              SKU Performance Evaluation
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
            Best & Worst Performing Products
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify top grossing catalog drivers versus dormant dead inventory tying up capital.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('top')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'top'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Top Drivers ({topProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('worst')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'worst'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Dead Stock / Slow Moving ({worstProducts.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Top Performing SKUs */}
      {activeTab === 'top' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Rank / Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Units Sold</th>
                <th className="px-4 py-3 text-right">Revenue Generated</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No qualifying purchase transactions recorded in this period.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                        idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-200">
                      {p.unitsSold} units
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-400">
                      Rs {Number(p.revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-teal-300">
                      Rs {Number(p.profit || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Worst Performing / Dead Stock */}
      {activeTab === 'worst' && (
        <div>
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Inventory Warning:</strong> The items below have zero or low sales. Capital is tied up in stock. Consider clearance promotions or halting replenishment orders.
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Product Name & SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Units Sold</th>
                  <th className="px-4 py-3 text-center">Unsold Stock</th>
                  <th className="px-4 py-3 text-right">Tied-Up Capital (Cost)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {worstProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No slow-moving inventory detected.
                    </td>
                  </tr>
                ) : (
                  worstProducts.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          w.status === 'Dead Stock'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{w.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{w.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{w.category}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-300">
                        {w.unitsSold} units
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-300">
                        {w.stock} units
                      </td>
                      <td className="px-4 py-3 text-right font-black text-rose-300">
                        Rs {Number(w.tiedUpCapital || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPerformanceTable;

