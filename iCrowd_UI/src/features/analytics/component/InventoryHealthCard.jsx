import React from 'react';

/**
 * Component showing low-stock alert items and top-performing products.
 */
const InventoryHealthCard = ({ lowStockItems = [], topProducts = [] }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Low Stock Alert Table */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚨</span> Warehouse Stock Alerts
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live products with critical stock levels (&le; 20 units)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {lowStockItems.length} Needs Restock
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs bg-slate-800/30 rounded-xl border border-slate-800">
            All warehouse SKU stock levels are currently healthy and above minimum safety thresholds.
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-3 py-2.5 rounded-l-lg">Product / SKU</th>
                  <th className="px-3 py-2.5 text-center">Category</th>
                  <th className="px-3 py-2.5 text-center">Stock</th>
                  <th className="px-3 py-2.5 rounded-r-lg text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {lowStockItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-white truncate max-w-[180px]">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{item.sku}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-400">{item.category}</td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-400">
                      {item.stock} units
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.stock === 0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Top Performing Products */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🏆</span> Top Revenue Products
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Best selling SKUs ranked by total sales volume & revenue
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Top 5 SKUs
          </span>
        </div>

        <div className="space-y-2.5 flex-1">
          {topProducts.map((prod, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-700 font-bold text-xs text-slate-300 flex items-center justify-center font-mono">
                  #{idx + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">{prod.name}</p>
                  <p className="text-[10px] text-slate-400">{prod.category} · {prod.unitsSold} units sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold text-emerald-400">Rs {Number(prod.revenue || 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 font-mono">Profit: Rs {Number(prod.profit || 0).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryHealthCard;
