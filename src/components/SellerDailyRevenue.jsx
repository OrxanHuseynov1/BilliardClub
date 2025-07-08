import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

// Helper functions (re-used from AdminReportsDashboard or a shared utils file)
const calculateTableCost = (startTime, endTime, hourlyPrice) => {
    if (!startTime || !endTime || !hourlyPrice) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const totalHours = durationMs / (1000 * 60 * 60);
    return totalHours * hourlyPrice;
};

const calculateProductsCost = (sessionProducts) => {
    if (!sessionProducts || sessionProducts.length === 0) return 0;
    return sessionProducts.reduce((sum, sp) => {
        return sum + (sp.quantity * (sp.unitPrice || 0));
    }, 0);
};

function SellerDailyRevenue() {
    const [reportData, setReportData] = useState({
        totalCashRevenue: 0,
        totalCardRevenue: 0,
        overallTotalRevenue: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDailyRevenue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = today;
            const end = new Date(today);
            end.setHours(23, 59, 59, 999);

            let allSessions = [];
            let pageNumber = 1;
            let hasMore = true;
            const pageSize = 100;

            // Fetch all sessions (you might want to filter by date in the API if possible for performance)
            while (hasMore) {
                const sessionsChunk = await apiService.getPastSessions(
                    null,
                    null,
                    pageNumber,
                    pageSize
                );

                allSessions = [...allSessions, ...sessionsChunk];
                hasMore = sessionsChunk.length === pageSize;
                pageNumber++;
            }

            const filteredSessions = allSessions.filter(session => {
                if (!session.endTime) return false;
                const sessionEndDate = new Date(session.endTime);
                sessionEndDate.setHours(0, 0, 0, 0);

                const isToday = sessionEndDate >= start && sessionEndDate <= end;
                
                return isToday;
            });

            let totalCash = 0;
            let totalCard = 0;

            filteredSessions.forEach(session => {
                const tableCost = calculateTableCost(session.startTime, session.endTime, session.hourlyPrice);
                const productsCost = calculateProductsCost(session.sessionProducts);
                const totalSessionCost = tableCost + productsCost;

                if (session.paymentType === 0) { // Cash
                    totalCash += totalSessionCost;
                } else if (session.paymentType === 1) { // Card
                    totalCard += totalSessionCost;
                }
            });

            setReportData({
                totalCashRevenue: parseFloat(totalCash.toFixed(2)),
                totalCardRevenue: parseFloat(totalCard.toFixed(2)),
                overallTotalRevenue: parseFloat((totalCash + totalCard).toFixed(2)),
            });

        } catch (err) {
            console.error("Bugünkü gəlir məlumatları yüklənərkən xəta:", err);
            setError("Bugünkü gəlir məlumatları yüklənərkən xəta baş verdi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDailyRevenue();
    }, [fetchDailyRevenue]);

    return (
        <div className="p-4">
            {error && <div className="text-center p-4 text-red-500 mb-4">{error}</div>}

            {loading ? (
                <div className="text-center text-blue-500">Bugünkü gəlir məlumatları yüklənir...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-semibold">Bugünkü Ümumi Gəlir</h3>
                            <i className="fa-solid fa-money-bill-wave text-3xl opacity-75"></i>
                        </div>
                        <p className="text-4xl font-bold">{reportData.overallTotalRevenue} AZN</p>
                        <p className="text-sm mt-4 opacity-90">Bugünkü bütün gəlirlərin cəmi.</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-semibold">Bugünkü Nağd Gəlir</h3>
                            <i className="fa-solid fa-money-bill text-3xl opacity-75"></i>
                        </div>
                        <p className="text-4xl font-bold">{reportData.totalCashRevenue} AZN</p>
                        <p className="text-sm mt-4 opacity-90">Bugünkü nağd ödənişlərdən əldə edilən gəlir.</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-semibold">Bugünkü Kart Gəliri</h3>
                            <i className="fa-solid fa-credit-card text-3xl opacity-75"></i>
                        </div>
                        <p className="text-4xl font-bold">{reportData.totalCardRevenue} AZN</p>
                        <p className="text-sm mt-4 opacity-90">Bugünkü kart ödənişlərindən əldə edilən gəlir.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SellerDailyRevenue;
