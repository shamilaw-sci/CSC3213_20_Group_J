import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import LandingPage from './features/products/pages/LandingPage.jsx';
import SearchPage from './features/products/pages/SearchPage.jsx';
import ProductDetailPage from './features/products/pages/ProductDetailPage.jsx';
import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';
import AdminRoute from './features/admin/components/AdminRoute.jsx';
import AdminDashboard from './features/admin/pages/AdminDashboard.jsx';
import AdminProducts from './features/admin/pages/AdminProducts.jsx';
import AdminCategories from './features/admin/pages/AdminCategories.jsx';
import AdminUsers from './features/admin/pages/AdminUsers.jsx';

// Wraps all customer-facing routes in the shared Navbar layout
const CustomerShell = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Customer-facing routes (Navbar + Footer) ─────────────────── */}
          <Route element={<CustomerShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

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
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
