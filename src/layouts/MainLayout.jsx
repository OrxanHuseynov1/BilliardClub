import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SellerSidebar from '../components/SellerSidebar';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'Admin';
  const isSeller = user?.role === 'Seller';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdmin && <Sidebar />}
      {isSeller && <SellerSidebar />}
      <main
        className={`flex-1 ${
          isAdmin || isSeller ? 'md:ml-64' : ''
        } p-6 transition-all`}
      >
        <Outlet />
      </main>
    </div>
  );
}
