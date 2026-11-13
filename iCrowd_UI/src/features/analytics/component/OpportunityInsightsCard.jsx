import React from 'react';

/**
 * Component showing Strategic Opportunity Insights:
 * "What are the areas we must be looking for more"
 * - High Growth Product Lines
 * - Profit & Margin Optimization
 * - Restock Demand Alerts
 */
const OpportunityInsightsCard = ({ insights = {}, aiRecommendation = '' }) => {
  const {
    topGrowthArea = '',
    restockAlert = '',
    profitOptimization = '',
    generalSummary = '',
    dataSource = '',
  } = insights;

  const strategicPoints = [
    {
      title: 'Top Growth & Expansion Focus',
      description: topGrowthArea || 'Awaiting qualifying sales data to determine leading volume and revenue trajectories.',
      icon: '🚀',
      border: 'border-blue-500/30',
      badge: 'High Growth Area',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      bg: 'from-blue-600/10 to-indigo-600/5',
    },
    {
      title: 'Profit Optimization & Margins',
      description: profitOptimization || 'Gross margin optimizations will calibrate dynamically from purchase-time costs as orders are placed.',
      icon: '💡',
      border: 'border-emerald-500/30',
      badge: 'Margin Analysis',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      bg: 'from-emerald-600/10 to-teal-600/5',
    },
    {
      title: 'Restock Urgency & Supply Chain',
      description: restockAlert || 'Warehouse stock levels are tracked against lead-time demand and statistical safety stock.',
      icon: '⚠️',
      border: 'border-amber-500/30',
      badge: 'Supply Action',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      bg: 'from-amber-600/10 to-orange-600/5',
    },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🧠</span> Strategic Focus & Growth Opportunities
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AI generated intelligence on market growth hotspots and profitability levers
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Live AI Strategy Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {strategicPoints.map((point, idx) => (
          <div
            key={idx}
            className={`rounded-xl bg-gradient-to-br ${point.bg} border ${point.border} p-4.5 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{point.icon}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${point.badgeColor}`}>
                  {point.badge}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">{point.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{point.description}</p>
            </div>
          </div>
        ))}
      </div>

      {(aiRecommendation || generalSummary) && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-start gap-3">
          <span className="text-lg">🤖</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white uppercase tracking-wider">AI Executive Summary</p>
              {dataSource && (
                <span className="text-[10px] text-slate-400 font-mono">Source: {dataSource}</span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{aiRecommendation || generalSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityInsightsCard;
