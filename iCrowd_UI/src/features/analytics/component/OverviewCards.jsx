import React from 'react';

/**
 * Overview KPI cards for the Admin Analytics Dashboard.
 */
const OverviewCards = ({ overview = {} }) => {
  const {
    totalRevenue = 0,
    totalCost = 0,
    grossProfit = 0,
    totalProfit = 0,
    profitMargin = 0,
    totalUnitsSold = 0,
    qualifyingOrderCount = 0,
    inventoryValuation = 0,
    predictedNextMonthRevenue = 0,
    lowStockCount = 0,
    topCategory = 'None',
    dateRangeLabel = 'All Time',
    isDemoData = false,
  } = overview;

  const cards = [
    {
      title: `Revenue (${dateRangeLabel})`,
      value: `Rs ${Number(totalRevenue || 0).toLocaleString()}`,
      subtext: `${totalUnitsSold?.toLocaleString() || 0} units sold (${qualifyingOrderCount} qualifying orders)`,
      icon: '💵',
      badge: isDemoData ? 'Sample Data' : `${qualifyingOrderCount} Orders`,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      gradient: 'from-blue-600/20 to-indigo-600/5',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Gross / Net Profit',
      value: `Rs ${Number(totalProfit || grossProfit || 0).toLocaleString()}`,
      subtext: `Cost of goods: Rs ${Number(totalCost || 0).toLocaleString()} (Purchase-time cost)`,
      icon: '📈',
      badge: `${profitMargin}% Margin`,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      gradient: 'from-emerald-600/20 to-teal-600/5',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Projected Next Month',
      value: `Rs ${Number(predictedNextMonthRevenue || 0).toLocaleString()}`,
      subtext: 'Calculated from statistical daily run-rate × 30 days',
      icon: '🔮',
      badge: 'Demand Forecast',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      gradient: 'from-purple-600/20 to-pink-600/5',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Inventory Valuation & Alerts',
      value: `Rs ${Number(inventoryValuation || 0).toLocaleString()}`,
      subtext: `${lowStockCount} items low/out of stock · Top: ${topCategory}`,
      icon: '📦',
      badge: lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'Stock Healthy',
      badgeColor: lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      gradient: 'from-amber-600/20 to-orange-600/5',
      borderColor: 'border-amber-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} bg-slate-900/80 backdrop-blur-xl border ${card.borderColor} p-5 shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-inner">
              {card.icon}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {card.title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-white mb-1">
            {card.value}
          </p>
          <p className="text-xs text-slate-400 font-medium truncate">
            {card.subtext}
          </p>
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;
