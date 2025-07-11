import React from 'react';

const getPaymentTypeName = (paymentType) => {
    switch (paymentType) {
        case 0:
            return 'Nağd';
        case 1:
            return 'Kart';
        case 2:
            return 'Köçürmə';
        default:
            return 'Qeyd olunmayıb';
    }
};

function SessionDetailsModal({ isOpen, onClose, sessionDetails }) {
    if (!isOpen || !sessionDetails) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Sessiya Detalları - {sessionDetails.tableName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl font-light">
                        &times;
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    <p><strong>Masa Adı:</strong> {sessionDetails.tableName}</p>
                    <p><strong>Başlama Vaxtı:</strong> {new Date(sessionDetails.startTime).toLocaleString('az-AZ')}</p>
                    <p><strong>Bitmə Vaxtı:</strong> {sessionDetails.endTime ? new Date(sessionDetails.endTime).toLocaleString('az-AZ') : 'Aktiv'}</p>
                    <p><strong>Aktivlik Müddəti:</strong> {sessionDetails.duration}</p>
                    <p><strong>Saatlıq Qiymət:</strong> {sessionDetails.hourlyPrice?.toFixed(2) || '0.00'} AZN</p>
                    
                    <p className="text-lg font-semibold text-blue-700">
                        Masa Xərci: {sessionDetails.tableCost} AZN
                    </p>
                </div>

                <hr className="my-6 border-gray-300" />

                {sessionDetails.sessionProducts && sessionDetails.sessionProducts.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-bold mb-3 text-gray-700">Sifariş Olunan Məhsullar:</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {sessionDetails.sessionProducts.map(product => (
                                <li key={product.id} className="text-gray-700">
                                    {product.productName} - {product.quantity} ədəd x {(parseFloat(product.unitPrice) || 0).toFixed(2)} AZN = {(product.quantity * parseFloat(product.unitPrice || 0)).toFixed(2)} AZN
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    <p className="text-lg font-semibold text-green-700">
                        Məhsul Xərci: {sessionDetails.productsCost} AZN
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                        Ümumi Məbləğ: {sessionDetails.totalCost} AZN
                    </p>
                    <p className="text-lg font-semibold text-purple-700">
                        Ödəniş Növü: {getPaymentTypeName(sessionDetails.paymentType)}
                    </p>
                </div>

                <div className="flex justify-end">
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

export default SessionDetailsModal;