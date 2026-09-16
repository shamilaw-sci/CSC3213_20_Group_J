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
import AdminRoute from './features/admin/components/AdminRoute.jsx';
import AdminDashboard from './features/admin/pages/AdminDashboard.jsx';
import AdminProducts from './features/admin/pages/AdminProducts.jsx';
import AdminCategories from './features/admin/pages/AdminCategories.jsx';
import AdminUsers from './features/admin/pages/AdminUsers.jsx';
import AnalyticsPage from './features/analytics/pages/AnalyticsPage.jsx';
import ProfilePage from './features/user/pages/ProfilePage.jsx';
import ProtectedRoute from './features/auth/component/ProtectedRoute.jsx';
import CartPage from './features/cart/pages/CartPage.jsx';

// Checkout Flow
import CheckoutLayout from './features/checkout/components/CheckoutLayout.jsx';
import ShippingPage from './features/checkout/pages/ShippingPage.jsx';
import PaymentPage from './features/checkout/pages/PaymentPage.jsx';
import CheckoutSuccessPage from './features/checkout/pages/CheckoutSuccessPage.jsx';
import CheckoutErrorPage from './features/checkout/pages/CheckoutErrorPage.jsx';

// Wraps all customer-facing routes in the shared Navbar layout
const CustomerShell = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* ── Customer-facing routes (Navbar + Footer) ─────────────────── */}
            <Route element={<CustomerShell />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/cart" element={<CartPage />} />

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

            {/* ── Checkout Routes (CheckoutLayout) ──────────────────────────── */}
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

            {/* ── Admin routes (sidebar layout, no Navbar) ──────────────────── */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="users" element={<AdminUsers />} />
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
