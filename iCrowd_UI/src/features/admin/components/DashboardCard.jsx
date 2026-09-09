import React from 'react';

const DashboardCard = ({ label, value, icon, trend, trendLabel, color = 'slate' }) => {
    const colorMap = {
        slate: { bg: 'bg-slate-50', icon: 'bg-slate-900 text-white', trend: 'text-slate-500' },
        green: { bg: 'bg-green-50', icon: 'bg-green-600 text-white', trend: 'text-green-600' },
        amber: { bg: 'bg-amber-50', icon: 'bg-amber-500 text-white', trend: 'text-amber-600' },
        red: { bg: 'bg-red-50', icon: 'bg-red-500 text-white', trend: 'text-red-600' },
        blue: { bg: 'bg-blue-50', icon: 'bg-blue-600 text-white', trend: 'text-blue-600' },
    };
    const colors = colorMap[color] || colorMap.slate;

    return (
        <div className={`${colors.bg} rounded-2xl p-6 flex flex-col gap-4 shadow-none border border-gray-100 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.icon} shadow-sm`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white ${colors.trend}`}>
                        {trend > 0 ? `+${trend}` : trend} {trendLabel}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-0.5">{label}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{value ?? '—'}</p>
            </div>
        </div>
    );
};

export default DashboardCard;
