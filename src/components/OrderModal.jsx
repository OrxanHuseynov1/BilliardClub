import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

function OrderModal({ isOpen, onClose, table, currentSession, onOrderSuccess }) {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [orderQuantities, setOrderQuantities] = useState({});
    const [inModalMessage, setInModalMessage] = useState(null);

    const showInModalMessage = useCallback((message, type = 'info') => {
        setInModalMessage({ message, type });
        const timer = setTimeout(() => {
            setInModalMessage(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const fetchProducts = async () => {
                setLoadingProducts(true);
                try {
                    const data = await apiService.getProducts();
                    setProducts(data);
                    const initialQuantities = {};
                    if (currentSession && currentSession.sessionProducts) {
                        currentSession.sessionProducts.forEach(sp => {
                            initialQuantities[sp.productId] = parseInt(sp.quantity, 10) || 0;
                        });
                    }
                    data.forEach(product => {
                        if (initialQuantities[product.id] === undefined) {
                            initialQuantities[product.id] = 0;
                        }
                    });
                    setOrderQuantities(initialQuantities);
                } catch (err) {
                    console.error("Məhsullar yüklənərkən xəta:", err);
                    const errorMessage = err.response?.data?.message || err.message || 'Naməlum xəta';
                    showInModalMessage(`Məhsullar yüklənərkən xəta baş verdi: ${errorMessage}`, 'error');
                } finally {
                    setLoadingProducts(false);
                }
            };
            fetchProducts();
        } else {
            setProducts([]);
            setOrderQuantities({});
            setLoadingProducts(true);
            setInModalMessage(null);
        }
    }, [isOpen, currentSession, showInModalMessage]);

    const handleProductClick = useCallback(async (product) => {
        if (!currentSession || !currentSession.id) {
            showInModalMessage('Aktiv sessiya tapılmadı. Sifariş əlavə etmək mümkün deyil.', 'error');
            return;
        }

        const currentQuantity = parseInt(orderQuantities[product.id], 10) || 0;
        const newQuantity = currentQuantity + 1;
        const unitPrice = parseFloat(product.price) || 0;

        setOrderQuantities(prevQuantities => ({
            ...prevQuantities,
            [product.id]: newQuantity
        }));

        try {
            const response = await apiService.addOrUpdateSessionProduct({
                tableSessionId: currentSession.id,
                productId: product.id,
                quantity: newQuantity,
                unitPrice
            });
            showInModalMessage(`${response.productName} (${response.quantity} ədəd) sessiyaya əlavə edildi.`, 'success');
            onOrderSuccess();
        } catch (err) {
            console.error("Sifariş əlavə edilərkən xəta:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Naməlum xəta';
            showInModalMessage(`Sifariş əlavə edilərkən xəta baş verdi: ${errorMessage}`, 'error');
            
            setOrderQuantities(prevQuantities => ({
                ...prevQuantities,
                [product.id]: currentQuantity
            }));
        }
    }, [currentSession, orderQuantities, showInModalMessage, onOrderSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative"> {/* relative əlavə edildi */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{table.tableName} üçün Sifariş</h2>
                    {/* Yeni X düyməsi */}
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-3xl font-light absolute top-4 right-4" // Mövqeləndirmə əlavə edildi
                        aria-label="Modali bağla"
                    >
                        &times;
                    </button>
                </div>

                {inModalMessage && (
                    <div className={`p-3 mb-4 rounded-md text-white font-semibold text-center
                        ${inModalMessage.type === 'success' ? 'bg-green-500' :
                           inModalMessage.type === 'error' ? 'bg-red-500' :
                           'bg-blue-500'}`}>
                        {inModalMessage.message}
                    </div>
                )}

                {loadingProducts ? (
                    <div className="text-center text-blue-500">Məhsullar yüklənir...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {products.length === 0 ? (
                            <p className="col-span-full text-center text-gray-500">Heç bir məhsul tapılmadı.</p>
                        ) : (
                            products.map((product) => (
                                <div
                                    key={product.id}
                                    className="border p-4 rounded-lg shadow-sm flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow duration-200"
                                    onClick={() => handleProductClick(product)}
                                >
                                    <h3 className="font-semibold text-2xl text-gray-800">{product.name}</h3>
                                    <p className="text-gray-600 text-center">{product.description}</p>
                                    <p className="text-lg font-bold text-blue-600 mt-1">{(parseFloat(product.price) || 0).toFixed(2)} AZN</p>
                                    <div className="flex items-center mt-3">
                                        <span className="text-sm font-bold text-purple-700">Sifariş sayi : {orderQuantities[product.id] || 0}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full transition duration-300"
                    >
                        Bağla
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OrderModal;