import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout' 
import TablesPage from './pages/TablesPage'
import PricingPage from './pages/PricingPage'
import ProductPage from './pages/ProductPage'
import EmployeesPage from './pages/EmployeesPage'
import TableList from './components/TableList'
import History from './pages/History'
import Reports from './pages/Reports'
import ExpensesPage from './pages/ExpensesPage'

import PrivateRoute from './routes/PrivateRoute'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route 
        path="/dashboard/*" 
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="tables" element={<TablesPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="reservations" element={<TableList />} />
        <Route path="history" element={<History />} />
        <Route path="reports" element={<Reports />} />
        <Route path="expenses" element={<ExpensesPage />} />
      </Route>
    </Routes>
  )
}
