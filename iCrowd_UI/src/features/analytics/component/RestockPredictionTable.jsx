import React from 'react';

/**
 * Table showing AI Restock Needs:
 * - Category
 * - Current Warehouse Stock
 * - Predicted Next Month Demand
 * - AI Recommended Restock Quantity
 * - Restock Urgency Tag
 */
const RestockPredictionTable = ({ predictions = [] }) => {
  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'moderate':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🎯</span> AI Restock & Inventory Demand Forecast
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            How much inventory is needed for next month based on machine learning trend extrapolation
          </p>
        </div>
        <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full w-fit">
          Includes +15% Safety Buffer
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
            <tr>
              <th className="px-4 py-3 rounded-l-xl font-semibold">Category Line</th>
              <th className="px-4 py-3 font-semibold text-center">Current Stock</th>
              <th className="px-4 py-3 font-semibold text-center">Predicted Demand</th>
              <th className="px-4 py-3 font-semibold text-center">Recommended Restock</th>
              <th className="px-4 py-3 rounded-r-xl font-semibold text-center">Urgency Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {predictions.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  {row.category}
                </td>
                <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-300">
                  {row.currentStock} units
                </td>
                <td className="px-4 py-3.5 text-center font-mono font-semibold text-indigo-300">
                  {row.predictedDemand || row.predictedUnits} units
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="font-mono font-bold text-sm text-white px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700/80">
                    +{row.neededUnits} units
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getUrgencyBadge(row.urgency)}`}>
                    {row.urgency || 'Adequate'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RestockPredictionTable;
