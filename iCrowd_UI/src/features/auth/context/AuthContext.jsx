import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
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
        };
        initAuth();
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginUser(credentials);
            if (data.token) {
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

    const logout = async () => {
        try {
            await logoutUser();
        } catch (e) {
            // Ignore failure on logout call
        } finally {
            localStorage.removeItem('token');
            // Remove sensitive cached data on logout and reset state when accounts change
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (
                    key && (
                        key.startsWith('user_addresses_') ||
                        key === 'user_addresses_default' ||
                        key.startsWith('user_profile_') ||
                        key === 'iCrowd_cart' ||
                        key.startsWith('completed-order-') ||
                        key.startsWith('iCrowd_')
                    )
                ) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            try {
                sessionStorage.clear();
            } catch (e) {}
            setUser(null);
        }
    };

    const updateUser = (updatedUserData) => {
        setUser(prev => ({ ...prev, ...updatedUserData }));
    };

    const isAdmin = user?.role === 'ADMIN';
    const isAuthenticated = !!user;

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, loading, error, isAdmin, isAuthenticated, login, register, logout, updateUser, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);

