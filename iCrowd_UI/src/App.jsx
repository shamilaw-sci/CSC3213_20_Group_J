import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import LandingPage from './features/products/pages/LandingPage.jsx';
import SearchPage from './features/products/pages/SearchPage.jsx';
import ProductDetailPage from './features/products/pages/ProductDetailPage.jsx'
import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import { CartProvider } from './features/cart/hooks/CartContext.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';
import ProfilePage from './features/user/pages/ProfilePage.jsx';
import ProtectedRoute from './features/auth/component/ProtectedRoute.jsx';
import CartPage from './features/cart/pages/CartPage.jsx';

// Checkout 
import CheckoutLayout from './features/checkout/components/CheckoutLayout.jsx';
import ShippingPage from './features/checkout/pages/ShippingPage.jsx';
import PaymentPage from './features/checkout/pages/PaymentPage.jsx';
import CheckoutSuccessPage from './features/checkout/pages/CheckoutSuccessPage.jsx';
import CheckoutErrorPage from './features/checkout/pages/CheckoutErrorPage.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* 
              Standard Routes (With MainLayout Navbar/Footer)
            */}
            <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
            <Route path="/search" element={<MainLayout><SearchPage /></MainLayout>} />
            <Route path="/product/:id" element={<MainLayout><ProductDetailPage /></MainLayout>} />
            <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
            
            {/* Auth Pages */}
            <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
            <Route path="/register" element={<MainLayout><RegisterPage /></MainLayout>} />

            {/* Protected User Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <MainLayout><ProfilePage /></MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <MainLayout>
                <div className="min-h-[80vh] flex items-center justify-center">
                  <h1 className="text-4xl font-bold text-black">Admin Dashboard</h1>
                </div>
              </MainLayout>
            } />

            {/* 
              Checkout Routes (With CheckoutLayout)
            */}
            <Route path="/checkout/shipping" element={
              <ProtectedRoute>
                <CheckoutLayout><ShippingPage /></CheckoutLayout>
              </ProtectedRoute>
            } />
            <Route path="/checkout/payment" element={
              <ProtectedRoute>
                <CheckoutLayout><PaymentPage /></CheckoutLayout>
              </ProtectedRoute>
            } />
            <Route path="/checkout/success" element={
              <ProtectedRoute>
                <CheckoutLayout><CheckoutSuccessPage /></CheckoutLayout>
              </ProtectedRoute>
            } />
            <Route path="/checkout/error" element={
              <ProtectedRoute>
                <CheckoutLayout><CheckoutErrorPage /></CheckoutLayout>
              </ProtectedRoute>
            } />

          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
