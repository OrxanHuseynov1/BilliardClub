import axios from 'axios';

const API_BASE_URL = 'https://localhost:7199/api'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const apiService = {
    getTables: async (filterBySessionDate = null) => {
        let url = '/Tables';
        if (filterBySessionDate === 'todayHistory') { 
            url += '?sessionHistoryDate=today'; 
        }
        const response = await api.get(url);
        return response.data;
    },

    getTableById: async (id) => {
        const response = await api.get(`/Tables/${id}`);
        return response.data;
    },

    createTable: async (tableData) => {
        const response = await api.post('/Tables', tableData);
        return response.data;
    },

    startSession: async (sessionData) => {
        const response = await api.post('/TableSession/start', sessionData);
        return response.data;
    },

    endSession: async (sessionId, data) => {
        const response = await api.put(`/TableSession/end/${sessionId}`, data);
        return response.data;
    },

    getCurrentSessionForTable: async (tableId) => {
        try {
            const response = await api.get(`/TableSession/table/${tableId}/current`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    },

    getProducts: async () => {
        const response = await api.get('/Products');
        return response.data;
    },

    addOrUpdateSessionProduct: async (sessionProductData) => {
        try {
            const response = await api.post('/TableSession/product/add-or-update', sessionProductData); 
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteSessionProduct: async (sessionProductId) => {
        try {
            const response = await api.delete(`/TableSession/product/delete/${sessionProductId}`);
            if (response.status === 204) {
                return { success: true, message: "Məhsul uğurla silindi." };
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getSessionProducts: async (tableSessionId) => {
        try {
            const response = await api.get(`/TableSession/products/${tableSessionId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getPastSessions: async (filterByDate = null, tableName = null, pageNumber = 1, pageSize = 10) => {
        let url = '/TableSession/past-sessions'; 
        const params = new URLSearchParams();
        
        params.append('pageNumber', pageNumber);
        params.append('pageSize', pageSize);

        if (filterByDate) {
            params.append('filterByDate', filterByDate instanceof Date ? filterByDate.toISOString() : filterByDate);
        }

        if (tableName) {
            params.append('tableName', tableName);
        }
        
        const response = await api.get(`${url}?${params.toString()}`); 
        return response.data;
    },

    getSessionDetails: async (sessionId) => {
        const response = await api.get(`/TableSession/${sessionId}`);
        return response.data;
    },

    getAllExpenses: async (startDate = '', endDate = '') => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const response = await api.get(`/Expenses?${params.toString()}`);
        
        return response.data;
    },
    getExpenseById: async (id) => {
        const response = await api.get(`/Expenses/${id}`);
        return response.data;
    },
    addExpense: async (expenseData) => {
        const response = await api.post(`/Expenses`, expenseData);
        return response.data;
    },
    updateExpense: async (id, expenseData) => {
        const response = await api.put(`/Expenses/${id}`, expenseData);
        return response.data;
    },
    deleteExpense: async (id) => {
        const response = await api.delete(`/Expenses/${id}`);
        return response.data;
    },
    // Yeni əlavə olunan funksiya
    getExpensesForReport: async (startDate, endDate) => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const response = await api.get('/Expenses', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default apiService;
