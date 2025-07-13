import React from 'react';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-5xl font-extrabold text-red-600 mb-4 animate-bounce">403</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Giriş Qadağandır</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Bu səhifəyə daxil olmaq üçün icazəniz yoxdur. Xahiş edirik, icazə verilən səhifələrdən birinə qayıdın.
        </p>
        <Link
          to="/dashboard"
          className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-full shadow-md hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
        >
          Geriyə Qayıt
        </Link>
      </div>
    </div>
  );
}
