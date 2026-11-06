import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-white text-sm flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
          {item.name}
        </p>
        <p className="text-slate-300">
          Units Sold: <strong className="text-white font-mono">{item.value}</strong> ({item.percentage}%)
        </p>
        <p className="text-slate-400">
          Current Stock: <strong className="text-slate-200 font-mono">{item.currentStock || 0} units</strong>
        </p>
      </div>
    );
  }
  return null;
};

const CategoryDistributionChart = ({ data = [] }) => {
  const totalUnits = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <span>📊</span> Category Sales Share
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Proportion of units sold across product catalog lines
        </p>
      </div>

      <div className="h-56 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              stroke="#0f172a"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sold</span>
          <span className="text-xl font-bold text-white font-mono">{totalUnits.toLocaleString()}</span>
        </div>
      </div>

      {/* Category breakdown pills */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80">
        {data.map((item, idx) => (
          <div key={item.name} className="bg-slate-800/50 rounded-xl p-2 text-center border border-slate-700/40">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}></span>
              <span className="text-[11px] font-semibold text-slate-300 truncate">{item.name}</span>
            </div>
            <p className="text-xs font-bold text-white font-mono">{item.percentage}%</p>
            <p className="text-[10px] text-slate-400">{item.value} units</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryDistributionChart;
