import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { apiClient } from '../../lib/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DUMMY_SUMMARY = {
  totalSalesPredicted: 28800,
  topCategory: "Phones",
  aiRecommendation: "Restock 'Accessories' for upcoming month based on trends.",
  salesForecast: [
    { name: 'Jan', sales: 4000, predicted: 4200 },
    { name: 'Feb', sales: 3000, predicted: 3100 },
    { name: 'Mar', sales: 5000, predicted: 4800 },
    { name: 'Apr', sales: 4500, predicted: 4700 },
    { name: 'May', sales: 6000, predicted: 6200 },
    { name: 'Jun', sales: 5500, predicted: 5800 }
  ],
  inventoryDistribution: [
    { name: 'Phones', value: 400 },
    { name: 'Accessories', value: 300 },
    { name: 'Wearables', value: 150 },
    { name: 'Spare Parts', value: 50 }
  ]
};

const AnalyticsDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using dummy data (no backend needed)
    setTimeout(() => {
      setSummary(DUMMY_SUMMARY);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-blue-600 animate-pulse">Loading AI Analytics...</div>
      </div>
    );
  }

  if (!summary) {
    return <div className="p-6 text-center text-red-500">Failed to load data. Please ensure backend is running.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">AI Analytics & Graphic Representation</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Predicted Sales (H1)</h3>
          <p className="text-3xl font-bold text-blue-600">
            Rs {summary.totalSalesPredicted.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Top Selling Category</h3>
          <p className="text-3xl font-bold text-green-600">{summary.topCategory}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">AI Recommendation</h3>
          <p className="text-sm font-medium text-purple-600 mt-2">
            {summary.aiRecommendation}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart (Sales Forecast) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Sales vs AI Prediction (Monthly)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.salesForecast} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" name="Actual Sales" stroke="#8884d8" strokeWidth={3} />
                <Line type="monotone" dataKey="predicted" name="AI Predicted" stroke="#82ca9d" strokeDasharray="5 5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Inventory Categories) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Inventory Distribution</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.inventoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {summary.inventoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
