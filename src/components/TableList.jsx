// src/components/TableList.js
import React, { useEffect, useState, useCallback } from 'react';
import apiService from '../services/apiService';
import StartSessionConfirmModal from './StartSessionConfirmModal'; 
import OrderModal from './OrderModal';
import EndSessionConfirmModal from './EndSessionConfirmModal';

function TableList() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showStartSessionConfirmModal, setShowStartSessionConfirmModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false); 
    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [currentSession, setCurrentSession] = useState(null); 
    const [finalCalculation, setFinalCalculation] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');

    const [activeTableDisplayData, setActiveTableDisplayData] = useState({});

    const [globalNotification, setGlobalNotification] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showGlobalNotification = useCallback((title, message, type = 'info') => {
        setGlobalNotification({ isOpen: true, title, message, type });
        const timer = setTimeout(() => {
            setGlobalNotification(prev => ({ ...prev, isOpen: false }));
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const calculateActiveDuration = useCallback((startTimeString) => {
        if (!startTimeString) return '00:00:00';
        
        const startTime = new Date(startTimeString); 
        const now = new Date(); 

        const durationMs = now.getTime() - startTime.getTime();

        if (durationMs < 0) return '00:00:00';

        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const hours = Math.floor((durationMs / (1000 * 60 * 60)));

        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, []);

    const calculateSessionCostFrontEnd = useCallback((sessionDetails, tableHourlyPrice) => {
        if (!sessionDetails || !sessionDetails.startTime || tableHourlyPrice === undefined || tableHourlyPrice === null) {
            console.warn("Hesablama üçün lazım olan sessiya məlumatları tam deyil (startTime və ya hourlyPrice yoxdur):", sessionDetails, "Table Hourly Price:", tableHourlyPrice);
            return null;
        }
        
        const actualEndTime = sessionDetails.endTime ? new Date(sessionDetails.endTime) : new Date();
        const startTime = new Date(sessionDetails.startTime);
        
        const durationMs = actualEndTime.getTime() - startTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        const durationHours = durationMinutes / 60;

        const tableCost = durationHours * tableHourlyPrice; 

        let productsCost = 0;
        if (sessionDetails.sessionProducts && Array.isArray(sessionDetails.sessionProducts)) {
            productsCost = sessionDetails.sessionProducts.reduce((sum, sp) => {
                const price = sp.unitPrice !== undefined ? sp.unitPrice : 0; 
                return sum + (sp.quantity * price); 
            }, 0);
        }

        const totalCost = tableCost + productsCost;

        return {
            sessionId: sessionDetails.id,
            tableCost: parseFloat(tableCost.toFixed(2)),
            productsCost: parseFloat(productsCost.toFixed(2)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            durationInMinutes: durationMinutes,
            endTime: actualEndTime.toISOString() 
        };
    }, []);

    const fetchTables = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getTables();
            const sortedTables = data.sort((a, b) => {
                const numA = parseInt(a.tableName.replace('Masa ', ''), 10);
                const numB = parseInt(b.tableName.replace('Masa ', ''), 10);
                return numA - numB;
            });
            setTables(sortedTables);

            const initialActiveDurations = {};
            for (const table of sortedTables) {
                if (table.isActive) {
                    try {
                        const session = await apiService.getCurrentSessionForTable(table.id);
                        if (session && session.startTime) {
                            initialActiveDurations[table.id] = {
                                startTime: session.startTime,
                                duration: calculateActiveDuration(session.startTime),
                            };
                        }
                    } catch (err) {
                        console.warn(`${table.tableName} (${table.id}) üçün aktiv sessiya tapılmadı və ya xəta oldu:`, err);
                    }
                }
            }
            setActiveTableDisplayData(initialActiveDurations);

        } catch (err) {
            console.error("Masalar yüklənərkən xəta baş verdi:", err);
            const errorMessage = err.response?.data?.message || err.message || "Bilinməyən xəta.";
            setError(`Masalar yüklənərkən xəta baş verdi: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [calculateActiveDuration]);

    const refreshCurrentSessionData = useCallback(async () => {
        if (selectedTable && selectedTable.isActive) {
            try {
                const session = await apiService.getCurrentSessionForTable(selectedTable.id);
                if (session) {
                    setCurrentSession(session);
                    const updatedCalculation = calculateSessionCostFrontEnd(session, selectedTable.currentHourlyPrice);
                    setFinalCalculation(updatedCalculation);
                } else {
                    setCurrentSession(null);
                    setFinalCalculation(null);
                    fetchTables(); 
                }
            } catch (err) {
                console.error("Cari sessiya məlumatları yenilənərkən xəta:", err);
                showGlobalNotification('Xəta', 'Cari sessiya məlumatları yenilənərkən xəta baş verdi.', 'error');
            }
        }
    }, [selectedTable, calculateSessionCostFrontEnd, fetchTables, showGlobalNotification]);

    useEffect(() => {
        fetchTables();

        const intervalId = setInterval(() => {
            setActiveTableDisplayData(prevData => {
                const newData = { ...prevData };
                for (const tableId in newData) {
                    if (newData[tableId].startTime) {
                        newData[tableId].duration = calculateActiveDuration(newData[tableId].startTime);
                    }
                }
                return newData;
            });
        }, 1000); 

        return () => clearInterval(intervalId);
    }, [fetchTables, calculateActiveDuration]);

    const handleStartSession = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        if (table && table.isActive) {
            showGlobalNotification('Masa Aktivdir', 'Bu masa artıq aktivdir.', 'warning');
            return;
        }
        setSelectedTable(table);
        setShowStartSessionConfirmModal(true);
    };

    const confirmStartSession = async () => {
        if (!selectedTable) return;

        const tableId = selectedTable.id;
        const hourlyPrice = selectedTable.currentHourlyPrice; 

        try {
            const newSession = await apiService.startSession({ tableId, hourlyPrice }); 
            if (newSession && newSession.id && newSession.startTime) {
                showGlobalNotification('Sessiya Başlatıldı', `${selectedTable.tableName} üçün sessiya uğurla başlatıldı.`, 'success');
                
                setTables(prevTables => prevTables.map(t => 
                    t.id === tableId ? { ...t, isActive: true } : t
                ));

                setActiveTableDisplayData(prev => ({
                    ...prev,
                    [tableId]: {
                        startTime: newSession.startTime, 
                        duration: calculateActiveDuration(newSession.startTime),
                    }
                }));
                setCurrentSession(newSession); 

            } else {
                showGlobalNotification('Xəta', 'Sessiya başlamaq mümkün olmadı. (API-dən gələn cavab boş və ya natamamdır)', 'error');
            }
        } catch (err) {
            console.error("Sessiya başlarkən xəta:", err);
            showGlobalNotification('Xəta', `Sessiya başlarkən xəta baş verdi: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setShowStartSessionConfirmModal(false);
        }
    };

    const handleEndSession = async (tableId) => {
        const table = tables.find(t => t.id === tableId);
        setSelectedTable(table);
        setFinalCalculation(null); 

        let fetchedSession = null;
        try {
            fetchedSession = await apiService.getCurrentSessionForTable(tableId);
            if (fetchedSession && fetchedSession.id) {
                setCurrentSession(fetchedSession);
                const initialCalculation = calculateSessionCostFrontEnd(fetchedSession, table.currentHourlyPrice);
                setFinalCalculation(initialCalculation);
                setShowEndSessionModal(true);
                setShowOrderModal(false); 
            } else {
                showGlobalNotification('Məlumat', 'Bu masa üçün aktiv sessiya tapılmadı.', 'info');
            }
        } catch (err) {
            console.error("Sessiya bitirmə məlumatları gətirilərkən xəta:", err);
            showGlobalNotification('Xəta', `Sessiyanın detalları yüklənərkən xəta baş verdi: ${err.response?.data?.message || err.message}`, 'error');
        }
    };

    // confirmEndSession funksiyasına paymentType parametrini əlavə edirik
    const confirmEndSession = async (paymentType) => { 
        if (!selectedTable || !currentSession || !currentSession.id) return;

        const sessionIdToUse = currentSession.id;
        const tableId = selectedTable.id;

        try {
            // apiService.endSession çağırışına paymentType dəyərini əlavə edirik
            const endedSessionDetails = await apiService.endSession(sessionIdToUse, { paymentType }); 

            if (endedSessionDetails) { 
                showGlobalNotification('Sessiya Bitirildi', 'Sessiya uğurla bitirildi!', 'success');
            } else {
                showGlobalNotification('Xəta', 'Sessiyanın məlumatları tam deyil, hesablamanı aparmaq mümkün olmadı. Zəhmət olmasa, adminə müraciət edin.', 'error');
            }

            setCurrentSession(null);
            setShowEndSessionModal(false); 
            
            setTables(prevTables => prevTables.map(t => 
                t.id === tableId ? { ...t, isActive: false } : t
            ));
            setActiveTableDisplayData(prev => {
                const newDurations = { ...prev };
                delete newDurations[tableId];
                return newDurations;
            });

        } catch (err) {
            console.error("Sessiya bitərkən xəta:", err);
            showGlobalNotification('Xəta', `Sessiya bitərkən xəta baş verdi: ${err.response?.data?.message || err.message}`, 'error');
        }
    };

    const handleTableClick = async (table) => {
        setSelectedTable(table);
        setFinalCalculation(null); 

        if (table.isActive) {
            try {
                const session = await apiService.getCurrentSessionForTable(table.id);
                if (session) {
                    setCurrentSession(session);
                    setShowOrderModal(true); 
                    setShowEndSessionModal(false); 
                } else {
                    showGlobalNotification('Məlumat', 'Bu masa aktivdir, lakin cari sessiya tapılmadı. Zəhmət olmasa API-nizin /TableSessions/table/{tableId}/current endpointini yoxlayın.', 'warning');
                    setCurrentSession(null);
                }
            } catch (err) {
                console.error("Cari sessiya gətirilərkən xəta:", err);
                showGlobalNotification('Xəta', 'Cari sessiya yüklənərkən xəta baş verdi.', 'error');
                setCurrentSession(null);
            }
        } else {
            setCurrentSession(null);
            setShowOrderModal(false); 
            setShowEndSessionModal(false); 
        }
    };

    const handleOrderClick = async (table) => {
        setSelectedTable(table);
        try {
            const session = await apiService.getCurrentSessionForTable(table.id);
            if (session) {
                setCurrentSession(session);
                setShowOrderModal(true);
                setShowEndSessionModal(false); 
            } else {
                showGlobalNotification('Xəta', 'Bu masa üçün aktiv sessiya tapılmadı. Sifariş əlavə etmək mümkün deyil.', 'error');
            }
        } catch (err) {
            console.error("Sifariş üçün aktiv sessiya çəkilərkən xəta:", err);
            showGlobalNotification('Xəta', 'Aktiv sessiya məlumatları yüklənərkən xəta baş verdi. Sifariş verə bilməzsiniz.', 'error');
        }
    };

    const handleOrderSuccess = async () => {
        await refreshCurrentSessionData(); 
        showGlobalNotification('Sifariş uğurlu', 'Məhsullar uğurla əlavə edildi/yeniləndi.', 'success');
    };

    const filteredTables = tables.filter(table =>
        table.tableName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center p-4">Yüklənir...</div>;
    if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Bilardo Masaları</h1>

            <div className="mb-6 flex justify-center">
                <input
                    type="text"
                    placeholder="Masa adı ilə axtar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-3 border border-gray-300 rounded-xl w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {globalNotification.isOpen && (
                <div className={`p-3 mb-4 rounded-md text-white font-semibold text-center
                    ${globalNotification.type === 'success' ? 'bg-green-500' :
                        globalNotification.type === 'error' ? 'bg-red-500' :
                        'bg-blue-500'}`}>
                    {globalNotification.title}: {globalNotification.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTables.map((table) => (
                    <div
                        key={table.id}
                        className={`
                            p-6 rounded-lg shadow-lg cursor-pointer transform transition duration-300 hover:scale-105
                            ${table.isActive ? 'bg-red-200 border-l-4 border-red-500' : 'bg-green-200 border-l-4 border-green-500'}
                        `}
                        onClick={() => handleTableClick(table)}
                    >
                        <h2 className="text-2xl font-semibold mb-2">{table.tableName}</h2>
                        {table.isActive && activeTableDisplayData[table.id] && (
                            <div className="text-gray-700 mb-2">
                                <p>Aktivlik Müddəti: {activeTableDisplayData[table.id].duration || '00:00:00'}</p>
                            </div>
                        )}
                        <p className={`font-bold ${table.isActive ? 'text-red-700' : 'text-green-700'}`}>
                            Status: {table.isActive ? 'Dolu' : 'Boş'}
                        </p>

                        <div className="mt-4 flex gap-2">
                            {!table.isActive ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartSession(table.id);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                                >
                                    Masanı Aç
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOrderClick(table);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                                    >
                                        Sifariş et
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEndSession(table.id);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                                    >
                                        Masanı Bağla
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showStartSessionConfirmModal && selectedTable && (
                <StartSessionConfirmModal
                    isOpen={showStartSessionConfirmModal}
                    onClose={() => setShowStartSessionConfirmModal(false)}
                    table={selectedTable}
                    onConfirm={confirmStartSession}
                />
            )}

            {showOrderModal && selectedTable && currentSession && (
                <OrderModal
                    isOpen={showOrderModal}
                    onClose={() => setShowOrderModal(false)}
                    table={selectedTable}
                    currentSession={currentSession}
                    onOrderSuccess={handleOrderSuccess}
                />
            )}

            {showEndSessionModal && selectedTable && currentSession && finalCalculation && (
                <EndSessionConfirmModal
                    isOpen={showEndSessionModal}
                    onClose={() => {
                        setShowEndSessionModal(false);
                        setFinalCalculation(null); 
                    }}
                    table={selectedTable}
                    session={currentSession}
                    finalCalculation={finalCalculation}
                    // onConfirmEndSession funksiyasına paymentType-ı ötürmək üçün dəyişirik
                    onConfirmEndSession={(paymentType) => confirmEndSession(paymentType)} 
                    onRefreshSessionData={refreshCurrentSessionData} 
                />
            )}
        </div>
    );
}

export default TableList;