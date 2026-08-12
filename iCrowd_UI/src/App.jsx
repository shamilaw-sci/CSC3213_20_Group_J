import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import LandingPage from './features/product/pages/LandingPage.jsx';
import SearchPage from './features/product/pages/SearchPage.jsx';
import ProductDetailPage from './features/product/pages/ProductDetailPage.jsx';
import AnalyticsDashboard from './features/analytics/AnalyticsDashboard.jsx';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* 1. Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 2. Search / Category Browse Page */}
          <Route path="/search" element={<SearchPage />} />
          
          {/* 3. Single Product Detail Page */}
          <Route path="/product/:id" element={<ProductDetailPage />} />
          
          {/* 4. Analytics Dashboard (Admin) */}
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
