import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
        <p className="font-bold text-white text-sm border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}:
            </span>
            <span className="font-bold text-white font-mono">
              {entry.value !== null && entry.value !== undefined ? `${entry.value} units` : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SalesForecastChart = ({ data = [], grain = 'monthly', onSelectGrain }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📈</span> {grain.charAt(0).toUpperCase() + grain.slice(1)} Sales vs. AI Demand Forecast
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Actual historic volume vs. Next-period AI projected trajectory (2026)
          </p>
        </div>

        {/* Time Granularity Selector & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {onSelectGrain && (
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80">
              {['daily', 'weekly', 'monthly'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onSelectGrain(g)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                    grain === g
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Actual Sales
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> AI Forecast
            </span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.5} />
            <XAxis
              dataKey="name"
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="sales"
              name="Actual Sales"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366f1', stroke: '#1e1b4b', strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="AI Predicted"
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#34d399', strokeWidth: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesForecastChart;
