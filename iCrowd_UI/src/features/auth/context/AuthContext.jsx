import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            localStorage.removeItem('checkoutData');
            localStorage.removeItem('iCrowd_cart');
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await getCurrentUser();
                    setUser(userData);
                } catch (err) {
                    console.error("Failed to fetch user:", err);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
            setInitializing(false);
        };
        initAuth();
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginUser(credentials);
            if (data.token) {
                sessionStorage.removeItem('checkoutData');
                localStorage.setItem('token', data.token);
                setUser(data.user);
                return data.user;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await registerUser(userData);
            return response;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('checkoutData');
        sessionStorage.removeItem('iCrowd_guest_cart');
        if (user) {
            sessionStorage.removeItem(`iCrowd_cart:${user.id || user.email}`);
            sessionStorage.removeItem(`iCrowd_promo:${user.id || user.email}`);
        }
        setUser(null);
    };

    const updateUser = (updatedUserData) => {
        setUser(prev => ({ ...prev, ...updatedUserData }));
    };

    const isAdmin = user?.role === 'ADMIN';
    const isAuthenticated = !!user;

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, loading, initializing, error, isAdmin, isAuthenticated, login, register, logout, updateUser, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);

