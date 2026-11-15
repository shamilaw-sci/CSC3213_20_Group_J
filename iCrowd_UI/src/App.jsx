import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
const LandingPage = lazy(() => import('./features/products/pages/LandingPage.jsx'));
const SearchPage = lazy(() => import('./features/products/pages/SearchPage.jsx'));
const ProductDetailPage = lazy(() => import('./features/products/pages/ProductDetailPage.jsx'));
import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import { CartProvider } from './features/cart/hooks/CartContext.jsx';
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage.jsx'));
import AdminRoute from './features/admin/components/AdminRoute.jsx';
const AdminStorefront = lazy(() => import('./features/admin/pages/AdminStorefront.jsx'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard.jsx'));
const AdminOrders = lazy(() => import('./features/admin/pages/AdminOrders.jsx'));
const AdminProducts = lazy(() => import('./features/admin/pages/AdminProducts.jsx'));
const AdminCategories = lazy(() => import('./features/admin/pages/AdminCategories.jsx'));
const AdminUsers = lazy(() => import('./features/admin/pages/AdminUsers.jsx'));
const AdminPromoCodes = lazy(() => import('./features/admin/pages/AdminPromoCodes.jsx'));
const AnalyticsPage = lazy(() => import('./features/analytics/pages/AnalyticsPage.jsx'));
const ProfilePage = lazy(() => import('./features/user/pages/ProfilePage.jsx'));
import ProtectedRoute from './features/auth/component/ProtectedRoute.jsx';
const CartPage = lazy(() => import('./features/cart/pages/CartPage.jsx'));

const AdminPayments = lazy(() => import('./features/admin/pages/AdminPayments.jsx'));
// Checkout Flow
import CheckoutLayout from './features/checkout/components/CheckoutLayout.jsx';
const ShippingPage = lazy(() => import('./features/checkout/pages/ShippingPage.jsx'));
const PaymentPage = lazy(() => import('./features/checkout/pages/PaymentPage.jsx'));
const CheckoutSuccessPage = lazy(() => import('./features/checkout/pages/CheckoutSuccessPage.jsx'));
const CheckoutErrorPage = lazy(() => import('./features/checkout/pages/CheckoutErrorPage.jsx'));

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
          <Suspense fallback={<p role="status" className="p-8">Loading page…</p>}>
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
              <Route path="orders" element={<AdminRoute roles={["ADMIN"]}><AdminOrders /></AdminRoute>} />
              <Route path="payments" element={<AdminRoute roles={["ADMIN"]}><AdminPayments /></AdminRoute>} />
              <Route path="analytics" element={<AdminRoute roles={["ADMIN"]}><AnalyticsPage /></AdminRoute>} />
              <Route path="storefront" element={<AdminRoute roles={["ADMIN"]}><AdminStorefront /></AdminRoute>} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="users" element={<AdminRoute roles={["ADMIN"]}><AdminUsers /></AdminRoute>} />
              <Route path="promo-codes" element={<AdminRoute roles={["ADMIN"]}><AdminPromoCodes /></AdminRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
