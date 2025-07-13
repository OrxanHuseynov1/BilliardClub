// App.jsx
// Marşrutları və rol əsaslı giriş nəzarətini təyin edir.
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import TablesPage from './pages/TablesPage';
import PricingPage from './pages/PricingPage';
import ProductPage from './pages/ProductPage';
import EmployeesPage from './pages/EmployeesPage';
import TableList from './components/TableList'; // TableList adını olduğu kimi saxlayırıq
import History from './pages/History';
import Reports from './pages/Reports';
import ExpensesPage from './pages/ExpensesPage';
import ForbiddenPage from './pages/ForbiddenPage'; // ForbiddenPage-i import edin

import PrivateRoute from './routes/PrivateRoute';
import { AuthProvider } from './context/AuthContext'; // AuthProvider-ı import edin

export default function App() {
  return (
    <AuthProvider> {/* Tətbiqi AuthProvider ilə əhatə edin */}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} /> {/* Forbidden səhifəsi üçün marşrut */}

        <Route
          path="/dashboard/*"
          element={
            // MainLayout-u göstərmək üçün istifadəçinin daxil olması kifayətdir.
            // Daxili marşrutlar üçün xüsusi rol yoxlamaları aparılır.
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          {/* Admin üçün marşrutlar */}
          {/* /products səhifəsinə yalnız 'admin' rolu olanlar daxil ola bilər */}
          <Route
            path="tables"
            element={<PrivateRoute allowedRoles={['Admin']}><TablesPage /></PrivateRoute>}
          />
          <Route
            path="pricing"
            element={<PrivateRoute allowedRoles={['Admin']}><PricingPage /></PrivateRoute>}
          />
          <Route
            path="products"
            element={<PrivateRoute allowedRoles={['Admin']}><ProductPage /></PrivateRoute>}
          />
          <Route
            path="employees"
            element={<PrivateRoute allowedRoles={['Admin']}><EmployeesPage /></PrivateRoute>}
          />
          <Route
            path="expenses"
            element={<PrivateRoute allowedRoles={['Admin']}><ExpensesPage /></PrivateRoute>}
          />

          {/* Həm admin, həm də seller üçün ortaq marşrutlar */}
          {/* /reservations, /history, /reports səhifələrinə həm 'admin', həm də 'seller' daxil ola bilər */}
          <Route
            path="reservations"
            element={<PrivateRoute allowedRoles={['Admin', 'Seller']}><TableList /></PrivateRoute>}
          />
          <Route
            path="history"
            element={<PrivateRoute allowedRoles={['Admin', 'Seller']}><History /></PrivateRoute>}
          />
          <Route
            path="reports"
            element={<PrivateRoute allowedRoles={['Admin', 'Seller']}><Reports /></PrivateRoute>}
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
