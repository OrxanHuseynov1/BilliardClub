import { useState } from "react";

export default function AddProductModal({ modalOpen, closeModal, handleSubmit, form, handleChange, message }) {
  return (
    modalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={closeModal}>
        <div className="bg-white p-6 rounded-lg shadow max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4 text-emerald-700">Yeni Məhsul Əlavə et</h2>
          <label className="block mb-2 font-medium">Ad</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 mb-4 rounded"
          />
          <label className="block mb-2 font-medium">Qiymət</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border p-2 mb-4 rounded"
          />
          {message && <p className="text-red-600 mb-4">{message}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="border px-4 py-2 rounded">İmtina</button>
            <button onClick={handleSubmit} className="bg-emerald-600 text-white px-4 py-2 rounded">Əlavə et</button>
          </div>
        </div>
      </div>
    )
  );
}
