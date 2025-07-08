import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminReportsDashboard from '../components/AdminReportsDashboard';
import SellerDailyRevenue from '../components/SellerDailyRevenue';

function Reports() {
    const { user, loading: authLoading } = useAuth();

    if (authLoading) {
        return <div className="text-center p-4">Yüklənir...</div>;
    }

    if (!user) {
        return <div className="text-center p-4 text-gray-600">Hesabatları görmək üçün daxil olun.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Hesabatlar</h1>
            {user.role === 'Admin' ? (
                <AdminReportsDashboard />
            ) : user.role === 'Seller' ? (
                <SellerDailyRevenue />
            ) : (
                <div className="text-center p-4 text-red-500">Hesabatlara giriş icazəniz yoxdur.</div>
            )}
        </div>
    );
}

export default Reports;
