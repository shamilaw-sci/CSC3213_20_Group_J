import React, { useState } from 'react';

const PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'this_month', label: 'This Month' },
];

/**
 * Interactive Date Range Filter Toolbar with Quick Presets & Custom Date Picker
 */
const DateRangeFilter = ({
  activeRange = 'all',
  onSelectRange,
  customStartDate = '',
  customEndDate = '',
  onApplyCustomRange,
  dateRangeLabel = '',
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [startDate, setStartDate] = useState(customStartDate || '');
  const [endDate, setEndDate] = useState(customEndDate || '');
  const [validationError, setValidationError] = useState('');

  const handlePresetClick = (presetId) => {
    setShowCustomModal(false);
    setValidationError('');
    onSelectRange(presetId);
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setValidationError('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setValidationError('Start date cannot be after end date.');
      return;
    }
    setValidationError('');
    setShowCustomModal(false);
    onApplyCustomRange(startDate, endDate);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-lg shadow-black/20 relative">
      {/* Calendar Icon Indicator */}
      <div className="flex items-center gap-1.5 px-3 py-1 text-slate-400 text-xs font-semibold">
        <span className="text-base">📅</span>
        <span className="hidden sm:inline">Period:</span>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map((preset) => {
          const isActive = activeRange === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        {/* Custom Range Button */}
        <button
          onClick={() => setShowCustomModal(!showCustomModal)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeRange === 'custom'
              ? 'bg-primary text-white shadow-md shadow-primary/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>Custom</span>
          <span className="text-[10px] opacity-70">⚙️</span>
        </button>
      </div>

      {/* Active Range Scope Tag (Mobile/Desktop friendly) */}
      {dateRangeLabel && (
        <div className="hidden lg:flex items-center ml-2 pl-3 border-l border-slate-800 text-[11px] text-slate-400 font-medium">
          Active: <span className="ml-1 text-emerald-400 font-semibold">{dateRangeLabel}</span>
        </div>
      )}

      {/* Custom Date Range Popover */}
      {showCustomModal && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Select Custom Range
            </h4>
            <button
              onClick={() => setShowCustomModal(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCustomApply} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {validationError && (
              <p className="text-[11px] text-rose-400 font-medium">{validationError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shadow-primary/20 transition-all"
              >
                Apply Range
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
