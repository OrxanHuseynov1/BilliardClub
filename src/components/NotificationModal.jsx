// src/components/NotificationModal.jsx
import React from 'react';

export default function NotificationModal({ isOpen, onClose, title, message, type = 'info' }) {
  if (!isOpen) return null;

  let bgColor = 'bg-blue-100';
  let borderColor = 'border-blue-500';
  let textColor = 'text-blue-700';

  if (type === 'success') {
    bgColor = 'bg-green-100';
    borderColor = 'border-green-500';
    textColor = 'text-green-700';
  } else if (type === 'error') {
    bgColor = 'bg-red-100';
    borderColor = 'border-red-500';
    textColor = 'text-red-700';
  } else if (type === 'warning') {
    bgColor = 'bg-yellow-100';
    borderColor = 'border-yellow-500';
    textColor = 'text-yellow-700';
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-auto ${bgColor} border-l-4 ${borderColor}`}>
        <h2 className={`text-xl font-semibold mb-4 ${textColor}`}>{title}</h2>
        <p className={`text-gray-700 mb-6 ${textColor}`}>{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`bg-${type}-600 hover:bg-${type}-700 text-black font-bold py-2 px-4 rounded transition-colors duration-200`}
          >
            Bağla
          </button>
        </div>
      </div>
    </div>
  );
}