import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';
import SessionDetailsModal from '../components/SessionDetailsModal'; 
import { useAuth } from '../context/AuthContext'; 

// Enum dəyərlərini mətnə çevirmək üçün funksiya (0: Nağd, 1: Kart, 2: Köçürmə)
const getPaymentTypeName = (paymentType) => {
    switch (paymentType) {
        case 0: // Cash
            return 'Nağd';
        case 1: // Card
            return 'Kart';
        case 2: // Transfer (əgər back-enddə varsa)
            return 'Köçürmə';
        default:
            return 'Qeyd olunmayıb';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
};

function History() {
    const { user, loading: authLoading } = useAuth(); 

    const [pastSessions, setPastSessions] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSessionDetails, setSelectedSessionDetails] = useState(null);

    const [filterDate, setFilterDate] = useState(''); 
    const [searchTableName, setSearchTableName] = useState(''); 
    
    // Pagination state-ləri
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true); // Daha çox məlumatın olub-olmadığını göstərir
    const sessionsPerPage = 10; // Hər səhifədə göstəriləcək sessiya sayı

    const searchTimerRef = useRef(null);

    const formatDuration = useCallback((startTimeString, endTimeString) => {
        if (!startTimeString || !endTimeString) return '00:00:00';

        const startTime = new Date(startTimeString); 
        const endTime = new Date(endTimeString); 
        const durationMs = endTime.getTime() - startTime.getTime();

        if (isNaN(durationMs) || durationMs < 0) return '00:00:00';

        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const hours = Math.floor((durationMs / (1000 * 60 * 60)));

        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, []); 

    const calculateCosts = useCallback((session) => {
        let tableCost = 0;
        if (session.startTime && session.endTime && session.hourlyPrice > 0) {
            const startTime = new Date(session.startTime);
            const endTime = new Date(session.endTime);
            const durationMs = endTime.getTime() - startTime.getTime();
            const totalHours = durationMs / (1000 * 60 * 60); 
            tableCost = totalHours * session.hourlyPrice;
        }

        let productsCost = 0;
        if (session.sessionProducts && session.sessionProducts.length > 0) {
            productsCost = session.sessionProducts.reduce((sum, sp) => {
                return sum + (sp.quantity * (sp.unitPrice || 0)); 
            }, 0);
        }

        const totalCost = tableCost + productsCost;

        return {
            tableCost: parseFloat(tableCost).toFixed(2),
            productsCost: parseFloat(productsCost).toFixed(2),
            totalCost: parseFloat(totalCost).toFixed(2)
        };
    }, []); 

    const fetchPastSessions = useCallback(async (dateFilterArg, nameSearchArg, pageNum, append = false) => {
        if (authLoading || !user) {
            setLoading(false); 
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const actualDateFilter = user.role === 'Seller' 
                                            ? (new Date()).toISOString().split('T')[0] 
                                            : dateFilterArg;

            const sessions = await apiService.getPastSessions(actualDateFilter, nameSearchArg, pageNum, sessionsPerPage); 
            
            const sessionsWithCalculatedData = sessions.map(session => {
                const costs = calculateCosts(session);
                return {
                    ...session,
                    duration: formatDuration(session.startTime, session.endTime),
                    ...costs 
                };
            });

            setPastSessions(prevSessions => (append ? [...prevSessions, ...sessionsWithCalculatedData] : sessionsWithCalculatedData));
            setHasMore(sessions.length === sessionsPerPage); 

        } catch (err) {
            console.error("Keçmiş sessiyalar yüklənərkən xəta:", err);
            setError("Keçmiş sessiyalar yüklənərkən xəta baş verdi.");
        } finally {
            setLoading(false);
        }
    }, [authLoading, user, calculateCosts, formatDuration, sessionsPerPage]); 

    useEffect(() => {
        if (!authLoading && user) {
            setCurrentPage(1); 
            fetchPastSessions(filterDate, searchTableName, 1, false); 
        }
    }, [authLoading, user, filterDate]); 

    useEffect(() => {
        if (authLoading || !user) return;

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1); 
            fetchPastSessions(filterDate, searchTableName, 1, false); 
        }, 500); 

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [searchTableName, authLoading, user, filterDate, fetchPastSessions]);

    const handleLoadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchPastSessions(filterDate, searchTableName, nextPage, true); 
    };

    const handleViewDetails = async (sessionId) => {
        setLoading(true); 
        setError(null);
        try {
            const details = await apiService.getSessionDetails(sessionId);
            const costs = calculateCosts(details);
            setSelectedSessionDetails({
                ...details,
                duration: formatDuration(details.startTime, details.endTime),
                ...costs, 
                sessionProducts: details.sessionProducts.map(sp => ({
                    ...sp,
                    unitPrice: parseFloat(sp.unitPrice || 0).toFixed(2), 
                    totalProductPrice: (sp.quantity * parseFloat(sp.unitPrice || 0)).toFixed(2) 
                }))
            });
            setShowDetailsModal(true);
        } catch (err) {
            console.error("Sessiya detalları yüklənərkən xəta:", err);
            setError("Sessiya detalları yüklənərkən xəta baş verdi.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) return <div className="text-center p-4">Tarixçə yüklənir...</div>;
    if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

    if (!user && !authLoading) {
        return <div className="text-center p-4 text-gray-600">Sessiya məlumatlarını görmək üçün daxil olun.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Sessiya Tarixçəsi</h1>
            
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                {user.role === 'Admin' && (
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => {
                            setFilterDate(e.target.value);
                        }}
                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                )}
                <input
                    type="text"
                    placeholder="Masa adına görə axtar..."
                    value={searchTableName}
                    onChange={(e) => setSearchTableName(e.target.value)} 
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow" 
                />
            </div>

            {pastSessions.length === 0 ? (
                <p className="text-center text-gray-600">Heç bir bitmiş sessiya tapılmadı.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                        <thead className="bg-gray-200 text-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-left">Tarix</th>
                                <th className="py-3 px-4 text-left">Masa Adı</th>
                                <th className="py-3 px-4 text-left">Aktivlik Müddəti</th>
                                <th className="py-3 px-4 text-left">Masa Xərci</th>
                                <th className="py-3 px-4 text-left">Məhsul Xərci</th>
                                <th className="py-3 px-4 text-left">Cəm Məbləğ</th>
                                <th className="py-3 px-4 text-left">Ödəniş Növü</th>
                                <th className="py-3 px-4 text-center">Ətraflı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pastSessions.map((session) => (
                                <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        {session.endTime ? formatDate(session.endTime) : 'Aktiv'}
                                    </td>
                                    <td className="py-3 px-4">{session.tableName}</td>
                                    <td className="py-3 px-4">{session.duration}</td>
                                    <td className="py-3 px-4">{session.tableCost} AZN</td>
                                    <td className="py-3 px-4">{session.productsCost} AZN</td>
                                    <td className="py-3 px-4 font-semibold">{session.totalCost} AZN</td>
                                    <td className="py-3 px-4">{getPaymentTypeName(session.paymentType)}</td> 
                                    <td className="py-3 px-4 text-center">
                                        <button 
                                            onClick={() => handleViewDetails(session.id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-full text-sm transition duration-300"
                                        >
                                            Ətraflı
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {hasMore && (
                        <div className="text-center mt-4">
                            <button
                                onClick={handleLoadMore}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                                disabled={loading} 
                            >
                                {loading ? 'Yüklənir...' : 'Daha çox yüklə'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showDetailsModal && selectedSessionDetails && (
                <SessionDetailsModal 
                    isOpen={showDetailsModal} 
                    onClose={() => setShowDetailsModal(false)} 
                    sessionDetails={selectedSessionDetails} 
                />
            )}
        </div>
    );
}

export default History;