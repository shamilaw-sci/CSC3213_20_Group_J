import React from 'react';
import { useAnalyticsDashboard } from '../hooks/useAnalyticsDashboard';
import OverviewCards from '../component/OverviewCards';
import SalesForecastChart from '../component/SalesForecastChart';
import ProfitAnalysisChart from '../component/ProfitAnalysisChart';
import CategoryDistributionChart from '../component/CategoryDistributionChart';
import RestockPredictionTable from '../component/RestockPredictionTable';
import OpportunityInsightsCard from '../component/OpportunityInsightsCard';
import InventoryHealthCard from '../component/InventoryHealthCard';
import DateRangeFilter from '../component/DateRangeFilter';
import ExportMenu from '../component/ExportMenu';

const AnalyticsPage = () => {
  const {
    data,
    loading,
    error,
    range,
    setRange,
    customStartDate,
    customEndDate,
    applyCustomRange,
    refresh,
  } = useAnalyticsDashboard();

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 animate-spin blur-md opacity-70"></div>
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center absolute inset-0 font-black text-primary text-xl">
            i
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Aggregating Business Intelligence</h3>
          <p className="text-xs text-slate-400 mt-1">
            Crunching database sales records & running AI demand forecasting models...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl">
          ⚠️
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Backend Connection Error</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {error || 'Unable to connect to the Spring Boot analytics API. Please ensure your backend is running at http://localhost:8080.'}
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/25 transition-all"
        >
          <span>🔄 Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Printable Executive Report Header (Visible only when Printing / Saving as PDF) */}
      <div className="hidden print:block border-b-2 border-slate-700 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">iCrowd E-Commerce Platform</h1>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
              Executive Business Intelligence & Inventory Health Report
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-700 font-bold">Scope: {data?.overview?.dateRangeLabel || 'All Time'}</p>
            <p className="text-[11px] text-slate-500">Report Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Top Page Header (Screen UI) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Analytics & Business Intelligence
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live DB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-dimensional financial metrics, inventory risk monitoring, and AI predictive forecasts.
          </p>
        </div>

        {/* Action Controls: Refresh & Export */}
        <div className="flex items-center gap-3">
          <ExportMenu data={data} />

          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm disabled:opacity-50"
            title="Refresh database records"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar (Screen UI) */}
      <div className="print:hidden">
        <DateRangeFilter
          activeRange={range}
          onSelectRange={setRange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onApplyCustomRange={applyCustomRange}
          dateRangeLabel={data?.overview?.dateRangeLabel}
        />
      </div>

      {/* 1. Overview KPI Cards */}
      <OverviewCards overview={data?.overview} />

      {/* 2. Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesForecastChart data={data?.salesForecast || []} />
        </div>
        <div className="lg:col-span-1">
          <CategoryDistributionChart data={data?.inventoryDistribution || []} />
        </div>
      </div>

      {/* 3. Profitability & Financials Breakdown */}
      <div id="profit">
        <ProfitAnalysisChart data={data?.profitAnalysis || []} />
      </div>

      {/* 4. AI Strategic Opportunity & Restock Forecast */}
      <div id="insights" className="space-y-6">
        <OpportunityInsightsCard
          insights={data?.opportunityInsights}
          aiRecommendation={data?.aiRecommendation}
        />
        <RestockPredictionTable predictions={data?.restockPredictions || []} />
      </div>

      {/* 5. Inventory Stock Health & Top Products */}
      <div id="inventory">
        <InventoryHealthCard
          lowStockItems={data?.inventoryHealth?.lowStockItems || []}
          topProducts={data?.topProducts || []}
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;

