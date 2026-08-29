import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

import LandingPage from './features/products/pages/LandingPage.jsx';
import SearchPage from './features/products/pages/SearchPage.jsx';
import ProductDetailPage from './features/products/pages/ProductDetailPage.jsx';
import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import { CartProvider } from './features/cart/hooks/CartContext.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';
import ProfilePage from './features/user/pages/ProfilePage.jsx';
import ProtectedRoute from './features/auth/component/ProtectedRoute.jsx';
import CartPage from './features/cart/pages/CartPage.jsx';

// Checkout Flow
import CheckoutLayout from './features/checkout/components/CheckoutLayout.jsx';
import ShippingPage from './features/checkout/pages/ShippingPage.jsx';
import PaymentPage from './features/checkout/pages/PaymentPage.jsx';
import CheckoutSuccessPage from './features/checkout/pages/CheckoutSuccessPage.jsx';
import CheckoutErrorPage from './features/checkout/pages/CheckoutErrorPage.jsx';

// Analytics & Admin Portal
import AnalyticsPage from './features/analytics/pages/AnalyticsPage.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* ── Storefront Customer Routes (MainLayout with Nav, Footer, Chatbot) ── */}
            <Route
              element={
                <MainLayout>
                  <Outlet />
                </MainLayout>
              }
            >
              <Route path="/" element={<LandingPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              
              {/* Auth Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected User Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ── Checkout Flow (CheckoutLayout) ── */}
            <Route
              path="/checkout/shipping"
              element={
                <ProtectedRoute>
                  <CheckoutLayout>
                    <ShippingPage />
                  </CheckoutLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/payment"
              element={
                <ProtectedRoute>
                  <CheckoutLayout>
                    <PaymentPage />
                  </CheckoutLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute>
                  <CheckoutLayout>
                    <CheckoutSuccessPage />
                  </CheckoutLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/error"
              element={
                <ProtectedRoute>
                  <CheckoutLayout>
                    <CheckoutErrorPage />
                  </CheckoutLayout>
                </ProtectedRoute>
              }
            />

            {/* ── Admin Intelligence Portal (AdminLayout with Dark Sidebar & Topbar) ── */}
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              }
            >
              <Route index element={<AnalyticsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
