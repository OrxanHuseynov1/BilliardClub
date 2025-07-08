import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import RevenueLineChart from './RevenueLineChart'; // Ensure path is correct

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

function AdminReportsDashboard() {
    const { user } = useAuth(); // User role check already done in Reports.jsx
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [specificDate, setSpecificDate] = useState(null);
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);

    const [reportData, setReportData] = useState({
        totalCashRevenue: 0,
        totalCardRevenue: 0,
        overallTotalRevenue: 0,
        totalExpenses: 0, // Yeni əlavə olundu
        topSellingProducts: [],
        tableRevenues: [],
        dailyRevenues: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [dailyRevenueSortColumn, setDailyRevenueSortColumn] = useState('date');
    const [dailyRevenueSortDirection, setDailyRevenueSortDirection] = useState('asc');

    const [topProductsSortColumn, setTopProductsSortColumn] = useState('totalQuantitySold');
    const [topProductsSortDirection, setTopProductsSortDirection] = useState('desc');

    const calculateDateRange = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let start = null;
        let end = null;

        switch (selectedPeriod) {
            case 'today':
                start = today;
                end = new Date(today);
                end.setHours(23, 59, 59, 999);
                break;
            case 'thisWeek':
                const firstDayOfWeek = new Date(today);
                firstDayOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Pazartesi ilk gün
                firstDayOfWeek.setHours(0, 0, 0, 0);
                start = firstDayOfWeek;

                const lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                lastDayOfWeek.setHours(23, 59, 59, 999);
                end = lastDayOfWeek;
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'specificDate':
                start = specificDate ? new Date(specificDate) : null;
                if (start) {
                    start.setHours(0, 0, 0, 0);
                    end = new Date(start);
                    end.setHours(23, 59, 59, 999);
                } else {
                    end = null;
                }
                break;
            case 'dateRange':
                start = customStartDate ? new Date(customStartDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                end = customEndDate ? new Date(customEndDate) : null;
                if (end) end.setHours(23, 59, 59, 999);
                break;
            default:
                start = null;
                end = null;
        }
        return { start, end };
    }, [selectedPeriod, specificDate, customStartDate, customEndDate]);

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { start, end } = calculateDateRange();

            if ((selectedPeriod === 'specificDate' && !start) || (selectedPeriod === 'dateRange' && (!start || !end))) {
                setError("Zəhmət olmasa, hesabat üçün tarix(lər)i seçin.");
                setLoading(false);
                return;
            }
            if (start && end && start > end) {
                setError("Başlanğıc tarixi bitmə tarixindən böyük ola bilməz.");
                setLoading(false);
                return;
            }

            let allSessions = [];
            let pageNumber = 1;
            let hasMore = true;
            const pageSize = 100;

            // Fetch all sessions (paginated)
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

            // Fetch expenses for the period
            let fetchedExpenses = [];
            if (start && end) {
                fetchedExpenses = await apiService.getExpensesForReport(start, end);
            }
            
            const totalExpenses = fetchedExpenses.reduce((sum, expense) => sum + expense.amount, 0);


            const filteredSessions = allSessions.filter(session => {
                if (!session.endTime) return false;
                const sessionEndDate = new Date(session.endTime);
                sessionEndDate.setHours(0, 0, 0, 0); // Consider only date part for filtering

                const isAfterStart = start ? sessionEndDate >= start : true;
                const isBeforeEnd = end ? sessionEndDate <= end : true;
                
                return isAfterStart && isBeforeEnd;
            });

            let totalCash = 0;
            let totalCard = 0;
            const tableRevenueMap = new Map();
            const dailyRevenueMap = new Map();
            const productSalesMap = new Map(); // Still collecting for top selling products table

            filteredSessions.forEach(session => {
                const tableCost = calculateTableCost(session.startTime, session.endTime, session.hourlyPrice);
                const productsCost = calculateProductsCost(session.sessionProducts);
                const totalSessionCost = tableCost + productsCost;

                if (session.paymentType === 0) { // Assuming 0 for Cash
                    totalCash += totalSessionCost;
                } else if (session.paymentType === 1) { // Assuming 1 for Card
                    totalCard += totalSessionCost;
                }

                session.sessionProducts.forEach(sp => {
                    const productName = sp.productName;
                    const productRevenue = sp.quantity * (sp.unitPrice || 0);

                    if (productSalesMap.has(productName)) {
                        const existing = productSalesMap.get(productName);
                        productSalesMap.set(productName, {
                            totalQuantitySold: existing.totalQuantitySold + sp.quantity,
                            totalRevenue: existing.totalRevenue + productRevenue
                        });
                    } else {
                        productSalesMap.set(productName, {
                            totalQuantitySold: sp.quantity,
                            totalRevenue: productRevenue
                        });
                    }
                });

                const currentTableRevenue = tableRevenueMap.get(session.tableName) || 0;
                tableRevenueMap.set(session.tableName, currentTableRevenue + totalSessionCost);

                const sessionDateKey = session.endTime.split('T')[0]; // YYYY-MM-DD
                const currentDailyRevenue = dailyRevenueMap.get(sessionDateKey) || 0;
                dailyRevenueMap.set(sessionDateKey, currentDailyRevenue + totalSessionCost);
            });

            const sortedTableRevenues = Array.from(tableRevenueMap.entries())
                .map(([tableName, revenue]) => ({
                    tableName,
                    revenue: parseFloat(revenue.toFixed(2))
                }))
                .sort((a, b) => b.revenue - a.revenue);

            const sortedDailyRevenues = Array.from(dailyRevenueMap.entries())
                .map(([date, revenue]) => ({
                    date,
                    revenue: parseFloat(revenue.toFixed(2))
                }))
                .sort((a, b) => {
                    if (dailyRevenueSortColumn === 'date') {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        return dailyRevenueSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                    } else if (dailyRevenueSortColumn === 'revenue') {
                        return dailyRevenueSortDirection === 'asc' ? a.revenue - b.revenue : b.revenue - a.revenue;
                    }
                    return 0;
                });

            const topSellingProducts = Array.from(productSalesMap.entries())
                .map(([productName, data]) => ({
                    productName,
                    totalQuantitySold: data.totalQuantitySold,
                    totalRevenue: parseFloat(data.totalRevenue.toFixed(2))
                }))
                .sort((a, b) => {
                    if (topProductsSortColumn === 'productName') {
                        return topProductsSortDirection === 'asc' ? a.productName.localeCompare(b.productName) : b.productName.localeCompare(a.productName);
                    } else if (topProductsSortColumn === 'totalQuantitySold') {
                        return topProductsSortDirection === 'asc' ? a.totalQuantitySold - b.totalQuantitySold : b.totalQuantitySold - a.totalQuantitySold;
                    } else if (topProductsSortColumn === 'totalRevenue') {
                        return topProductsSortDirection === 'asc' ? a.totalRevenue - b.totalRevenue : b.totalRevenue - a.totalRevenue;
                    }
                    return 0;
                });

            setReportData({
                totalCashRevenue: parseFloat(totalCash.toFixed(2)),
                totalCardRevenue: parseFloat(totalCard.toFixed(2)),
                overallTotalRevenue: parseFloat((totalCash + totalCard).toFixed(2)),
                totalExpenses: parseFloat(totalExpenses.toFixed(2)), // Set total expenses
                topSellingProducts: topSellingProducts,
                tableRevenues: sortedTableRevenues,
                dailyRevenues: sortedDailyRevenues
            });

        } catch (err) {
            console.error("Hesabat məlumatları yüklənərkən xəta:", err);
            setError("Hesabat məlumatları yüklənərkən xəta baş verdi.");
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, specificDate, customStartDate, customEndDate, calculateDateRange, dailyRevenueSortColumn, dailyRevenueSortDirection, topProductsSortColumn, topProductsSortDirection]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleDailyRevenueSort = (column) => {
        if (dailyRevenueSortColumn === column) {
            setDailyRevenueSortDirection(dailyRevenueSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setDailyRevenueSortColumn(column);
            setDailyRevenueSortDirection('asc');
        }
    };

    const handleTopProductsSort = (column) => {
        if (topProductsSortColumn === column) {
            setTopProductsSortDirection(topProductsSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setTopProductsSortColumn(column);
            setTopProductsSortDirection('desc');
        }
    };

    return (
        <>
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-4 bg-white p-4 rounded-lg shadow-md">
                <label htmlFor="periodSelect" className="font-semibold text-gray-700">Dövr Seçimi:</label>
                <select
                    id="periodSelect"
                    value={selectedPeriod}
                    onChange={(e) => {
                        setSelectedPeriod(e.target.value);
                        setSpecificDate(null);
                        setCustomStartDate(null);
                        setCustomEndDate(null);
                    }}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                >
                    <option value="today">Bu gün</option>
                    <option value="thisWeek">Bu həftə</option>
                    <option value="thisMonth">Bu ay</option>
                    <option value="specificDate">İstənilən tarix</option>
                    <option value="dateRange">Tarix aralığı</option>
                </select>

                {(selectedPeriod === 'specificDate' || selectedPeriod === 'dateRange') && (
                    <>
                        {selectedPeriod === 'specificDate' && (
                            <>
                                <label htmlFor="specificDate" className="font-semibold text-gray-700">Tarix:</label>
                                <DatePicker
                                    id="specificDate"
                                    selected={specificDate}
                                    onChange={(date) => setSpecificDate(date)}
                                    dateFormat="dd.MM.yyyy"
                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    placeholderText="Tarix seçin"
                                    isClearable
                                />
                            </>
                        )}

                        {selectedPeriod === 'dateRange' && (
                            <>
                                <label htmlFor="customStartDate" className="font-semibold text-gray-700">Başlanğıc Tarix:</label>
                                <DatePicker
                                    id="customStartDate"
                                    selected={customStartDate}
                                    onChange={(date) => setCustomStartDate(date)}
                                    selectsStart
                                    startDate={customStartDate}
                                    endDate={customEndDate}
                                    dateFormat="dd.MM.yyyy"
                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    placeholderText="Başlanğıc seçin"
                                    isClearable
                                />
                                <label htmlFor="customEndDate" className="font-semibold text-gray-700">Bitmə Tarix:</label>
                                <DatePicker
                                    id="customEndDate"
                                    selected={customEndDate}
                                    onChange={(date) => setCustomEndDate(date)}
                                    selectsEnd
                                    startDate={customStartDate}
                                    endDate={customEndDate}
                                    minDate={customStartDate}
                                    dateFormat="dd.MM.yyyy"
                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    placeholderText="Bitmə seçin"
                                    isClearable
                                />
                            </>
                        )}
                    </>
                )}
                
                <button
                    onClick={fetchReportData}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex-shrink-0"
                    disabled={loading}
                >
                    {loading ? 'Yüklənir...' : 'Hesabatı Yenilə'}
                </button>
            </div>

            {error && <div className="text-center p-4 text-red-500 mb-4">{error}</div>}

            {loading ? (
                <div className="text-center text-blue-500">Hesabat məlumatları yüklənir...</div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-semibold">Ümumi Gəlir</h3>
                                <i className="fa-solid fa-money-bill-wave text-3xl opacity-75"></i>
                            </div>
                            <p className="text-4xl font-bold">{reportData.overallTotalRevenue} AZN</p>
                            <p className="text-sm mt-4 opacity-90">Bu, seçilmiş dövr ərzindəki bütün gəlirlərin cəmidir. Xərclər aid deyil</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-semibold">Nağd Gəlir</h3>
                                <i className="fa-solid fa-money-bill text-3xl opacity-75"></i>
                            </div>
                            <p className="text-4xl font-bold">{reportData.totalCashRevenue} AZN</p>
                            <p className="text-sm mt-4 opacity-90">Nağd ödənişlərdən əldə edilən ümumi gəlir.</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-semibold">Kart Gəliri</h3>
                                <i className="fa-solid fa-credit-card text-3xl opacity-75"></i>
                            </div>
                            <p className="text-4xl font-bold">{reportData.totalCardRevenue} AZN</p>
                            <p className="text-sm mt-4 opacity-90">Kart ödənişlərindən əldə edilən ümumi gəlir.</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-semibold">Ümumi Xərclər</h3>
                                <i className="fa-solid fa-receipt text-3xl opacity-75"></i>
                            </div>
                            <p className="text-4xl font-bold">{reportData.totalExpenses} AZN</p>
                            <p className="text-sm mt-4 opacity-90">Seçilmiş dövrdəki bütün xərclərin cəmi.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 mt-6">

                        <div className="bg-white p-6 rounded-lg shadow-lg col-span-full">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                                <i className="fa-solid fa-chart-line mr-2 text-green-600"></i> Gəlir Statistikası (Tarixə Görə)
                            </h3>
                            {reportData.dailyRevenues.length === 0 ? (
                                <p className="text-gray-600">Seçilmiş dövrdə gəlir qeydə alınmayıb.</p>
                            ) : (
                                <div className="overflow-x-auto mb-4">
                                    {reportData.dailyRevenues.length > 0 && (
                                    <RevenueLineChart data={reportData.dailyRevenues} />
                                )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 col-span-full">
                            <div className="bg-white p-6 rounded-lg shadow-lg col-span-full lg:col-span-1">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                                    <i className="fa-solid fa-table-tennis-paddle-ball mr-2 text-blue-600"></i> Masaların Gəlirləri (Çoxdan Aza)
                                </h3>
                                {reportData.tableRevenues.length === 0 ? (
                                    <p className="text-gray-600">Seçilmiş dövrdə masalardan gəlir qeydə alınmayıb.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                            <thead>
                                                <tr className="bg-gray-100 text-gray-700">
                                                    <th className="py-2 px-4 border-b text-left">Masa Adı</th>
                                                    <th className="py-2 px-4 border-b text-right">Gəlir (AZN)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.tableRevenues.map((table, index) => (
                                                    <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                                                        <td className="py-2 px-4 text-gray-700">{table.tableName}</td>
                                                        <td className="py-2 px-4 text-right font-semibold text-blue-600">{table.revenue}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-lg col-span-full lg:col-span-1">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                                    <i className="fa-solid fa-trophy mr-2 text-teal-600"></i> Ən Çox Satılan Məhsullar
                                </h3>
                                {reportData.topSellingProducts.length === 0 ? (
                                    <p className="text-gray-600">Seçilmiş dövrdə heç bir məhsul satılmayıb.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                            <thead>
                                                <tr className="bg-gray-100 text-gray-700">
                                                    <th className="py-2 px-4 border-b text-left cursor-pointer" onClick={() => handleTopProductsSort('productName')}>
                                                        Məhsul Adı
                                                        {topProductsSortColumn === 'productName' && (
                                                            <i className={`ml-2 fa-solid fa-arrow-${topProductsSortDirection === 'asc' ? 'up' : 'down'}`}></i>
                                                        )}
                                                    </th>
                                                    <th className="py-2 px-4 border-b text-right cursor-pointer" onClick={() => handleTopProductsSort('totalQuantitySold')}>
                                                        Satış Sayı
                                                        {topProductsSortColumn === 'totalQuantitySold' && (
                                                            <i className={`ml-2 fa-solid fa-arrow-${topProductsSortDirection === 'asc' ? 'up' : 'down'}`}></i>
                                                        )}
                                                    </th>
                                                    <th className="py-2 px-4 border-b text-right cursor-pointer" onClick={() => handleTopProductsSort('totalRevenue')}>
                                                        Gəlir (AZN)
                                                        {topProductsSortColumn === 'totalRevenue' && (
                                                            <i className={`ml-2 fa-solid fa-arrow-${topProductsSortDirection === 'asc' ? 'up' : 'down'}`}></i>
                                                        )}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.topSellingProducts.map((product, index) => (
                                                    <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                                                        <td className="py-2 px-4 text-gray-700">{product.productName}</td>
                                                        <td className="py-2 px-4 text-right font-semibold text-blue-600">{product.totalQuantitySold}</td>
                                                        <td className="py-2 px-4 text-right font-semibold text-green-600">{product.totalRevenue}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminReportsDashboard;