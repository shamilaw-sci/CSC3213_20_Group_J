import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../features/admin/components/AdminSidebar';

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
