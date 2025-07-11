import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { format } from 'date-fns';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-ddTHH:mm'),
        category: 'Ümumi',
        recordedBy: 'Sistem',
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchExpenses = async () => {
        setLoading(true);
        setError(null);
        try {
            const responseData = await apiService.getAllExpenses();
            if (responseData && Array.isArray(responseData) && responseData.length > 0) {
                setExpenses(responseData);
            } else {
                setExpenses([]);
            }
        } catch (err) {
            setError('Xərcləri gətirərkən xəta baş verdi: ' + (err.response?.data?.error || err.message));
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const amountValue = parseFloat(formData.amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setError('Məbləğ sıfırdan böyük bir ədəd olmalıdır.');
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                name: formData.name,
                description: formData.description,
                amount: amountValue,
                date: formData.date,
                category: formData.category,
                recordedBy: formData.recordedBy,
            };

            await apiService.addExpense(dataToSend);
            setMessage('Yeni xərc uğurla əlavə edildi!');

            setIsModalOpen(false);
            setFormData({
                name: '',
                description: '',
                amount: '',
                date: format(new Date(), 'yyyy-MM-ddTHH:mm'),
                category: 'Ümumi',
                recordedBy: 'Sistem',
            });
            fetchExpenses();
        } catch (err) {
            setError('Əməliyyat zamanı xəta baş verdi: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpenseClick = () => {
        setFormData({
            name: '',
            description: '',
            amount: '',
            date: format(new Date(), 'yyyy-MM-ddTHH:mm'),
            category: 'Ümumi',
            recordedBy: 'Sistem',
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setExpenseToDeleteId(id);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmModalOpen(false);
        if (!expenseToDeleteId) return;

        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            await apiService.deleteExpense(expenseToDeleteId);
            setMessage('Xərc uğurla silindi!');
            fetchExpenses();
        } catch (err) {
            setError('Xərci silərkən xəta baş verdi: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
            setExpenseToDeleteId(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmModalOpen(false);
        setExpenseToDeleteId(null);
    };

    return (
        <div className="container mx-auto mt-10 p-4">
            <h1 className="text-3xl font-bold mb-6 text-emerald-600 text-center">Xərclər</h1>

            <button
                onClick={handleAddExpenseClick}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-6 transition duration-200"
            >
                Yeni Xərc Əlavə Et
            </button>

            {loading && <p className="text-blue-500 text-center">Yüklənir...</p>}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Xəta!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}
            {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Uğurlu!</strong>
                    <span className="block sm:inline"> {message}</span>
                </div>
            )}

            {/* Cədvəl görünüşü - böyük ekranlar üçün */}
            <div className="bg-white p-4 rounded-lg shadow-md hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Təsvir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Məbləğ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarix</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses && expenses.length === 0 && !loading && !error ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    Heç bir xərc tapılmadı.
                                </td>
                            </tr>
                        ) : (
                            expenses && expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {expense.description || 'Qeyd olunmayıb'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.amount?.toFixed(2) || '0.00'} AZN</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {expense.createdAt ? format(new Date(expense.createdAt), 'dd.MM.yyyy HH:mm') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDeleteClick(expense.id)}
                                            className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 p-2 rounded-full transition duration-200"
                                            title="Xərci sil"
                                        >
                                            <i className="fas fa-trash-alt text-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobil görünüş - kartlar şəklində */}
            <div className="lg:hidden mt-6 space-y-4">
                {expenses && expenses.length === 0 && !loading && !error ? (
                    <p className="text-center text-gray-600">Heç bir xərc tapılmadı.</p>
                ) : (
                    expenses && expenses.map((expense) => (
                        <div key={expense.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                            <div className="font-semibold text-lg mb-2 text-emerald-700">{expense.name}</div>
                            <div className="text-gray-600 space-y-1">
                                <p>
                                    <span className="font-medium">Məbləğ:</span> {expense.amount?.toFixed(2) || '0.00'} AZN
                                </p>
                                <p>
                                    <span className="font-medium">Təsvir:</span> {expense.description || 'Qeyd olunmayıb'}
                                </p>
                                <p>
                                    <span className="font-medium">Tarix:</span> {expense.createdAt ? format(new Date(expense.createdAt), 'dd.MM.yyyy HH:mm') : '-'}
                                </p>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={() => handleDeleteClick(expense.id)}
                                    className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 p-2 rounded-full transition duration-200"
                                    title="Xərci sil"
                                >
                                    <i className="fas fa-trash-alt text-lg"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Yeni Xərc Əlavə Et Modalı */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Yeni Xərc Əlavə Et</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Ad</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Təsvir</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleFormChange}
                                    rows="3"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Məbləğ</label>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleFormChange}
                                    step="0.01"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                                >
                                    Ləğv Et
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                                >
                                    Əlavə Et
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Təsdiqləmə Modalı */}
            {confirmModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Təsdiqləyin</h2>
                        <p className="mb-6 text-gray-700">Bu xərci silmək istədiyinizə əminsinizmi?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleCancelDelete}
                                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                            >
                                Ləğv Et
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesPage;