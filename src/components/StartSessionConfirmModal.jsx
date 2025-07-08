import React from 'react';

export default function StartSessionConfirmModal({ isOpen, onClose, table, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center">Sessiyanı Başlat</h2>
        <p className="text-gray-700 text-center mb-6">
          "{table.tableName}" Açmaq istəyirsinizmi?
        </p>
        <div className="flex justify-around gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Bəli
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Xeyr
          </button>
        </div>
      </div>
    </div>
  );
}