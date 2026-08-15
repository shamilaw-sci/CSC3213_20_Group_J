import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import LandingPage from './features/products/pages/LandingPage.jsx';
import SearchPage from './features/products/pages/SearchPage.jsx';
import ProductDetailPage from './features/products/pages/ProductDetailPage.jsx'
import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';
import ProfilePage from './features/user/pages/ProfilePage.jsx';
import ProtectedRoute from './features/auth/component/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            {/* 1. Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* 2. Search / Category Browse Page */}
            <Route path="/search" element={<SearchPage />} />

            {/* 3. Single Product Detail Page */}
            <Route path="/product/:id" element={<ProductDetailPage />} />

            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* User Profile (Protected) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin Placeholder */}
            <Route path="/admin" element={
              <div className="min-h-[80vh] flex items-center justify-center">
                <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
              </div>
            } />


          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
