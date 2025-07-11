import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SellerSidebar from '../components/SellerSidebar';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function MainLayout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const isSeller = user?.role === 'Seller';

  const sidebarWidth = isSidebarOpen ? 'ml-64' : 'ml-[30px]';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdmin && <Sidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} />}
      {isSeller && <SellerSidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} />}
      <main
        className={`flex-1 ${
          isAdmin || isSeller ? sidebarWidth : ''
        } py-6 pr-6 transition-all`}
      >
        <Outlet />
      </main>
    </div>
  );
}