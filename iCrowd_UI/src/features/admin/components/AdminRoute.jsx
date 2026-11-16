import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../auth/context/authState';

/**
 * Wraps admin routes.
 * - If loading: show a neutral spinner so we don't flash a redirect before auth resolves.
 * - If user is missing or not ADMIN: redirect to /login.
 * - Otherwise: render children.
 */
const AdminRoute = ({ children, roles = ['ADMIN', 'INVENTORY_MANAGER'] }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">Verifying access…</p>
                </div>
            </div>
        );
    }

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;
