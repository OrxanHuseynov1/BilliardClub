import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import {
  FaTable,
  FaMoneyBillWave,
  FaBoxes,
  FaHistory,
  FaCalendarCheck,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaChartLine
} from 'react-icons/fa';

export default function SellerSidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const menu = [
    { name: 'Rezervasiya', path: '/dashboard/reservations', icon: <FaCalendarCheck /> },
    { name: 'Məhsullar', path: '/dashboard/products', icon: <FaBoxes /> },
    { name: 'Tarixçə', path: '/dashboard/history', icon: <FaHistory /> },
    { name: 'Hesabat', path: '/dashboard/reports', icon: <FaChartLine /> },
  ];

  useEffect(() => {
    if (pathname === '/dashboard') {
      navigate('/dashboard/reservations');
    }
  }, [pathname, navigate]);

  if (!user?.token) return null;

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-30 bg-emerald-500 text-white p-2 rounded-full shadow-md hover:bg-emerald-600 transition"
        onClick={() => setOpen(!open)}
      >
        {open ? <FaTimes /> : <FaBars />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-20 transition-transform duration-300 w-64
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <div className="text-3xl font-bold text-emerald-600 text-center py-6 border-b select-none">
          NextOne
        </div>

        <nav className="p-4 space-y-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition font-medium
                ${
                  pathname === item.path
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}

          <button
            onClick={logout}
            className="flex items-center gap-2 w-full mt-6 p-3 rounded-xl text-red-600 hover:bg-red-100 transition text-left"
          >
            <FaSignOutAlt />
            Çıxış
          </button>
        </nav>
      </div>
    </>
  );
}
