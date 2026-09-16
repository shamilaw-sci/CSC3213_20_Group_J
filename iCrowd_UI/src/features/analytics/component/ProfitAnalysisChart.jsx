import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CustomProfitTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const revenue = payload.find(p => p.dataKey === 'revenue')?.value || 0;
    const profit = payload.find(p => p.dataKey === 'profit')?.value || 0;
    const cost = payload.find(p => p.dataKey === 'cost')?.value || 0;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <p className="font-bold text-white text-sm">{label} Financials</p>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {margin}% Margin
          </span>
        </div>
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-indigo-400 font-medium">Revenue:</span>
            <span className="font-bold text-white font-mono">Rs {revenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400 font-medium">Net Profit:</span>
            <span className="font-bold text-white font-mono">Rs {profit.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 font-medium">Product Cost:</span>
            <span className="font-bold text-slate-300 font-mono">Rs {cost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ProfitAnalysisChart = ({ data = [] }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>💰</span> Monthly Financials: Revenue vs. Profit
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gross revenue generated vs. Realized net profit after product cost
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Revenue
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Profit
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 5 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.5} />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `Rs ${v >= 1000 ? `${v / 1000}k` : v}`}
            />
            <Tooltip content={<CustomProfitTooltip />} />
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="profit"
              name="Profit"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfitAnalysisChart;
