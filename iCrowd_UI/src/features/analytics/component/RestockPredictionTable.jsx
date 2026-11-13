import React, { useState } from 'react';
import { PackageSearch, DollarSign, Layers, Box } from 'lucide-react';

/**
 * Enhanced AI Restock & Inventory Replenishment Forecast Table:
 * - Statistical baseline demand forecasting
 * - Lead-time demand & 95% service level safety stock
 * - Transparent data sufficiency & prediction intervals
 * - Category level & SKU level restock drilldown
 * - Total Restock Capital Budget calculation
 */
const RestockPredictionTable = ({
  predictions = [],
  skuPredictions = [],
  totalBudget = 0,
  metrics = null,
}) => {
  const [viewMode, setViewMode] = useState('category'); // 'category' or 'sku'

  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'stockout / critical':
      case 'critical':
      case 'high':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'moderate':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const getSufficiencyBadge = (sufficiency) => {
    switch (sufficiency) {
      case 'INSUFFICIENT_DATA':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'LIMITED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SUFFICIENT':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/20 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs">
              <PackageSearch className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Statistical Replenishment Engine
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
            Inventory Demand & Restock Forecast
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Replenishment calculated from lead-time demand, empirical safety stock (95% service level), and current on-hand stock.
          </p>
        </div>

        {/* View Switcher & Budget Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {Number(totalBudget || 0) > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Required Restock Budget</p>
                <p className="text-sm font-black text-emerald-300">
                  Rs {Number(totalBudget || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode('category')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'category'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sku')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'sku'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>SKU Restock Drilldown ({skuPredictions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Model accuracy validation bar */}
      {metrics && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-2xl w-fit">
          <span className="text-purple-400 font-semibold">{metrics.modelName || '7-Day Moving Average'}:</span>
          <span>MAE: {metrics.mae != null ? `${metrics.mae} u` : '—'}</span>
          <span>|</span>
          <span>WAPE: {metrics.wape != null ? `${metrics.wape}%` : '—'}</span>
          <span>|</span>
          <span>Bias: {metrics.forecastBias != null ? `${metrics.forecastBias > 0 ? '+' : ''}${metrics.forecastBias}%` : '—'}</span>
        </div>
      )}

      {/* Mode 1: Category Level Table */}
      {viewMode === 'category' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Category Line</th>
                <th className="px-4 py-3 font-semibold text-center">Current Stock</th>
                <th className="px-4 py-3 font-semibold text-center">Lead Time (LTD + SS)</th>
                <th className="px-4 py-3 font-semibold text-center">Predicted Demand (95% CI)</th>
                <th className="px-4 py-3 font-semibold text-center">Data Sufficiency</th>
                <th className="px-4 py-3 font-semibold text-center">Recommended Restock</th>
                <th className="px-4 py-3 font-semibold text-center">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                predictions.map((row, idx) => {
                  const isInsufficient = row.dataSufficiency === 'INSUFFICIENT_DATA';
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          {row.category}
                        </div>
                        {row.notes && (
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5 max-w-xs">{row.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-300">
                        {row.currentStock} units
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                        <div>{row.leadTimeDays || 7} days</div>
                        <div className="text-[10px] text-slate-500">
                          SS: +{row.safetyStock || 0} u | ROP: {row.reorderPoint || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        {isInsufficient ? (
                          <span className="text-slate-500 italic text-[11px]">Insufficient history</span>
                        ) : (
                          <div>
                            <span className="font-semibold text-indigo-300">{row.predictedDemand || 0} units</span>
                            {row.confidenceLower != null && (
                              <div className="text-[10px] text-slate-500">
                                [{row.confidenceLower} – {row.confidenceUpper}]
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSufficiencyBadge(row.dataSufficiency)}`}>
                          {row.dataSufficiency === 'INSUFFICIENT_DATA' ? 'Insufficient Data' : (row.dataSufficiency || 'Sufficient')}
                        </span>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mode 2: SKU Level Restock Drilldown */}
      {viewMode === 'sku' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU / Product Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-center">Stock</th>
                <th className="px-4 py-3 font-semibold text-center">Reorder Point (ROP)</th>
                <th className="px-4 py-3 font-semibold text-center">Restock Needed</th>
                <th className="px-4 py-3 font-semibold text-right">Unit Cost</th>
                <th className="px-4 py-3 font-semibold text-right">Required Budget</th>
                <th className="px-4 py-3 font-semibold text-center">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {skuPredictions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-slate-500">
                    No critical restock triggers detected. All items are above reorder thresholds.
                  </td>
                </tr>
              ) : (
                skuPredictions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">
                      <p>{item.name}</p>
                      <span className="text-[10px] font-mono text-slate-500">{item.sku}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{item.category}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-300">
                      {item.currentStock} units
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-400">
                      {item.reorderPoint} u (SS: +{item.safetyStock})
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                        item.neededUnits > 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        +{item.neededUnits} units
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      Rs {Number(item.unitCost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-400 font-mono">
                      Rs {Number(item.totalRestockCost || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getUrgencyBadge(item.urgency)}`}>
                        {item.urgency}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RestockPredictionTable;
