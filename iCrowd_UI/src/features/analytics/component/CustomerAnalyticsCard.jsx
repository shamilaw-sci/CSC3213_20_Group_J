import React from 'react';
import { Users, UserCheck, CreditCard, Award, ArrowUpRight } from 'lucide-react';

const CustomerAnalyticsCard = ({ customerAnalytics }) => {
  if (!customerAnalytics) return null;

  const {
    totalCustomers = 0,
    repeatCustomerCount = 0,
    repeatPurchaseRate = 0,
    averageOrderValue = 0,
    customerLifetimeValue = 0,
    topCustomers = [],
  } = customerAnalytics;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Customer Intelligence (RFM / Retention)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
            Customer Purchase Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Key retention benchmarks, average basket value, and high-value customer lifetime value.
          </p>
        </div>
      </div>

      {/* 4 KPI Sub-cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Total Customers</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalCustomers}</p>
          <span className="text-[11px] text-slate-400 font-medium">Distinct buyer accounts</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Repeat Buyers</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{repeatPurchaseRate}%</p>
          <span className="text-[11px] text-emerald-400 font-medium">{repeatCustomerCount} customers (≥ 2 orders)</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Avg Order Value (AOV)</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">
            Rs {Number(averageOrderValue || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Mean spend per checkout</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Customer LTV (CLV)</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">
            Rs {Number(customerLifetimeValue || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">AOV × Orders per Customer</span>
        </div>
      </div>

      {/* Top Value Customers Table */}
      {topCustomers.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            Top Value Customer Accounts
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3 text-center">Qualifying Orders</th>
                  <th className="px-4 py-3 text-right">Total Lifetime Spend</th>
                  <th className="px-4 py-3 text-right">Last Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topCustomers.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                        {cust.name?.charAt(0) || 'C'}
                      </span>
                      {cust.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{cust.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold text-[11px] border border-slate-700">
                        {cust.orderCount} orders
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-400">
                      Rs {Number(cust.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-[11px]">
                      {cust.lastOrderDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAnalyticsCard;

