import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import LandingPage from './features/products/pages/LandingPage.jsx';
import SearchPage from './features/products/pages/SearchPage.jsx';
import ProductDetailPage from './features/products/pages/ProductDetailPage.jsx'

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
          
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
