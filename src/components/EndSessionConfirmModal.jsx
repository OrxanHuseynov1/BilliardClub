// src/components/EndSessionConfirmModal.js
import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

// Ödəniş növləri enum-u (Back-end-dəki Domain.Enums.PaymentType ilə uyğun olmalıdır)
const PaymentTypes = {
    Cash: 0,
    Card: 1,
};

function EndSessionConfirmModal({ isOpen, onClose, table, session, finalCalculation, onConfirmEndSession, onRefreshSessionData }) {
    const [currentSessionProducts, setCurrentSessionProducts] = useState([]);
    const [calculatedCost, setCalculatedCost] = useState(null); 
    const [loadingUpdate, setLoadingUpdate] = useState(false); 
    const [inModalMessage, setInModalMessage] = useState(null);
    const [selectedPaymentType, setSelectedPaymentType] = useState(PaymentTypes.Cash); 

    const showInModalMessage = useCallback((title, message, type = 'info') => {
        setInModalMessage({ title, message, type });
        const timer = setTimeout(() => {
            setInModalMessage(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isOpen && session && finalCalculation) {
            const safeSessionProducts = (session.sessionProducts || []).map(sp => ({
                ...sp,
                quantity: parseInt(sp.quantity, 10) || 0,
                unitPrice: parseFloat(sp.unitPrice) || 0,
                productName: sp.product?.productName || sp.productName || 'Naməlum Məhsul',
                productId: sp.productId || sp.product?.id
            })).filter(sp => sp.quantity > 0);
            setCurrentSessionProducts(safeSessionProducts);

            setCalculatedCost({
                ...finalCalculation,
                tableCost: parseFloat(finalCalculation.tableCost) || 0,
                productsCost: parseFloat(finalCalculation.productsCost) || 0,
                totalCost: parseFloat(finalCalculation.totalCost) || 0,
            });
            setSelectedPaymentType(PaymentTypes.Cash); // Modal açıldıqda ödəniş növünü sıfırla
        } else if (!isOpen) {
            setCurrentSessionProducts([]);
            setCalculatedCost(null);
            setInModalMessage(null);
            setSelectedPaymentType(PaymentTypes.Cash); // Modal bağlandıqda da sıfırla
        }
    }, [isOpen, session, finalCalculation]);

    const recalculateCosts = useCallback(() => {
        const productsCost = currentSessionProducts.reduce((sum, sp) => {
            const quantity = parseInt(sp.quantity, 10) || 0; 
            const price = parseFloat(sp.unitPrice) || 0; 
            return sum + (quantity * price); 
        }, 0);

        const tableCost = calculatedCost ? parseFloat(calculatedCost.tableCost) || 0 : 0; 

        setCalculatedCost(prev => ({
            ...prev,
            productsCost: parseFloat(productsCost.toFixed(2)),
            totalCost: parseFloat((tableCost + productsCost).toFixed(2)),
        }));
    }, [currentSessionProducts, calculatedCost?.tableCost]); 

    useEffect(() => {
        if (isOpen) {
            recalculateCosts();
        }
    }, [currentSessionProducts, isOpen, recalculateCosts]);

    const formatDuration = (startTimeString, endTimeString) => {
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
    };

    const currentDuration = session?.startTime && calculatedCost?.endTime 
                                ? formatDuration(session.startTime, calculatedCost.endTime) 
                                : 'Hesablanır...';

    const handleQuantityChange = useCallback(async (sessionProductId, productId, currentQuantity, unitPrice, change) => {
        setLoadingUpdate(true);
        try {
            let newQuantity = currentQuantity + change;

            const addUpdatePayload = { 
                tableSessionId: session.id, 
                productId: productId, 
                quantity: newQuantity, 
                unitPrice: parseFloat(unitPrice) || 0 
            };

            await apiService.addOrUpdateSessionProduct(addUpdatePayload);

            if (newQuantity <= 0) {
                setCurrentSessionProducts(prevProducts => prevProducts.filter(sp => sp.id !== sessionProductId));
                showInModalMessage('Uğurlu', 'Məhsul sessiyadan silindi.', 'success');
            } else {
                setCurrentSessionProducts(prevProducts =>
                    prevProducts.map(sp =>
                        sp.id === sessionProductId 
                            ? { 
                                ...sp, 
                                quantity: newQuantity,
                            } 
                            : sp
                    )
                );
                showInModalMessage('Uğurlu', 'Məhsul miqdarı yeniləndi.', 'success');
            }
        } catch (error) {
            console.error("Məhsul miqdarı yenilənərkən xəta:", error);
            const errorMessage = error.response?.data?.message || error.message || 'Naməlum xəta';
            showInModalMessage('Xəta', `Məhsul miqdarını yeniləmək mümkün olmadı: ${errorMessage}`, 'error');
        } finally {
            setLoadingUpdate(false);
            if (onRefreshSessionData) {
                onRefreshSessionData(); 
            }
        }
    }, [session, showInModalMessage, onRefreshSessionData]); 

    const handleRemoveProduct = useCallback(async (sessionProductId) => {
        setLoadingUpdate(true);
        try {
            await apiService.deleteSessionProduct(sessionProductId);

            setCurrentSessionProducts(prevProducts =>
                prevProducts.filter(sp => sp.id !== sessionProductId)
            );
            showInModalMessage('Uğurlu', 'Məhsul sessiyadan silindi.', 'success');
        } catch (error) {
            console.error("Məhsul silinərkən xəta:", error);
            const errorMessage = error.response?.data?.message || error.message || 'Naməlum xəta';
            showInModalMessage('Xəta', `Məhsulu silmək mümkün olmadı: ${errorMessage}`, 'error');
        } finally {
            setLoadingUpdate(false);
            if (onRefreshSessionData) {
                onRefreshSessionData();
            }
        }
    }, [showInModalMessage, onRefreshSessionData]);

    // Masanı bağlamaq üçün yeni funksiya
    const handleConfirmEndSession = () => {
        // onConfirmEndSession funksiyasına selectedPaymentType dəyərini göndəririk
        onConfirmEndSession(selectedPaymentType); 
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Sessiyanı Bitirməyi Təsdiqlə</h2>
                <p className="text-lg font-semibold text-gray-700 mb-2">Masa: {table.tableName}</p>

                {inModalMessage && (
                    <div className={`p-3 mb-4 rounded-md text-white font-semibold text-center
                        ${inModalMessage.type === 'success' ? 'bg-green-500' :
                           inModalMessage.type === 'error' ? 'bg-red-500' :
                           'bg-blue-500'}`}>
                        {inModalMessage.title}: {inModalMessage.message}
                    </div>
                )}

                {calculatedCost ? (
                    <>
                        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-3 mb-4 rounded">
                            <p className="font-semibold">Aktivlik Müddəti: {currentDuration}</p>
                            <p className="font-semibold">Masanın Xərci: {(parseFloat(calculatedCost.tableCost) || 0).toFixed(2)} AZN</p>
                        </div>

                        <h3 className="text-xl font-semibold mb-3 text-gray-700">Sifariş Detalları:</h3>
                        {loadingUpdate && <p className="text-blue-500 mb-2">Məhsullar yenilənir...</p>}
                        {currentSessionProducts && currentSessionProducts.length > 0 ? (
                            <ul className="mb-4 space-y-2">
                                {currentSessionProducts.map((sp) => (
                                    <li key={sp.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                        <span className="font-medium flex-1 mr-2">{sp.productName}</span>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleQuantityChange(sp.id, sp.productId, sp.quantity, sp.unitPrice, -1)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                                                disabled={loadingUpdate}
                                            >
                                                -
                                            </button>
                                            <span className="font-semibold w-8 text-center">{(parseInt(sp.quantity, 10) || 0)}</span>
                                            <button
                                                onClick={() => handleQuantityChange(sp.id, sp.productId, sp.quantity, sp.unitPrice, 1)}
                                                className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                                                disabled={loadingUpdate}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="mx-2">x {(parseFloat(sp.unitPrice) || 0).toFixed(2)} AZN</span>
                                        <span className="font-semibold w-20 text-right">{(parseFloat(sp.quantity) * parseFloat(sp.unitPrice) || 0).toFixed(2)} AZN</span>
                                        <button
                                            onClick={() => handleRemoveProduct(sp.id)} 
                                            className="ml-2 bg-gray-500 hover:bg-gray-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                                            disabled={loadingUpdate}
                                        >
                                            X
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 mb-4">Bu sessiyada heç bir sifariş yoxdur.</p>
                        )}

                        <div className="border-t pt-4 mt-4">
                            <p className="text-lg font-bold flex justify-between">
                                <span>Ümumi Məhsul Qiyməti:</span>
                                <span>{(parseFloat(calculatedCost.productsCost) || 0).toFixed(2)} AZN</span>
                            </p>
                            <p className="text-2xl font-bold flex justify-between text-green-700 mt-2">
                                <span>Ümumi Məbləğ:</span>
                                <span>{(parseFloat(calculatedCost.totalCost) || 0).toFixed(2)} AZN</span>
                            </p>
                        </div>
                        
                        {/* Ödəniş Növü Seçimi */}
                        <div className="mt-4 mb-6">
                            <label htmlFor="paymentType" className="block text-lg font-semibold text-gray-700 mb-2">
                                Ödəniş Növü:
                            </label>
                            <select
                                id="paymentType"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                value={selectedPaymentType}
                                onChange={(e) => setSelectedPaymentType(parseInt(e.target.value, 10))}
                                disabled={loadingUpdate}
                            >
                                <option value={PaymentTypes.Cash}>Nağd</option>
                                <option value={PaymentTypes.Card}>Kart</option>
                            </select>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-600">Hesablamalar yüklənir...</p>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full transition duration-300"
                        disabled={loadingUpdate}
                    >
                        Geri qayıt
                    </button>
                    <button
                        onClick={handleConfirmEndSession} 
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                        disabled={!calculatedCost || loadingUpdate} 
                    >
                        Masanı Bağla (Təsdiq Et)
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EndSessionConfirmModal;