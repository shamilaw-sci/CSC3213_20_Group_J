import React from 'react';
import { Layers, PieChart } from 'lucide-react';

const CategoryFinancialTable = ({ categories = [] }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Department & Line Performance
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
            Category Financial Performance Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Profitability, margin efficiency, and capital asset allocation across active catalog lines.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Category Line</th>
              <th className="px-4 py-3 text-center">Active SKUs</th>
              <th className="px-4 py-3 text-center">Units Sold</th>
              <th className="px-4 py-3 text-right">Revenue (LKR)</th>
              <th className="px-4 py-3 text-right">COGS (LKR)</th>
              <th className="px-4 py-3 text-right">Gross Profit (LKR)</th>
              <th className="px-4 py-3 text-center">Gross Margin</th>
              <th className="px-4 py-3 text-right">Inventory Valuation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {categories.map((cat, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                  {cat.category}
                </td>
                <td className="px-4 py-3 text-center text-slate-300 font-medium">
                  {cat.activeProductsCount}
                </td>
                <td className="px-4 py-3 text-center font-bold text-white">
                  {cat.unitsSold}
                </td>
                <td className="px-4 py-3 text-right font-black text-slate-200">
                  Rs {Number(cat.revenue || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">
                  Rs {Number(cat.costOfGoods || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-black text-emerald-400">
                  Rs {Number(cat.grossProfit || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${
                    (cat.grossMargin || 0) >= 40
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : (cat.grossMargin || 0) > 0
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {Number(cat.grossMargin || 0).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-300">
                  Rs {Number(cat.inventoryValuation || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryFinancialTable;

