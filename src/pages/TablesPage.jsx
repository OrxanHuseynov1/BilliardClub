import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default function TablesPage() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [modalMessage, setModalMessage] = useState("");
  const [form, setForm] = useState({ tableName: "", type: 1 });
  const [editingId, setEditingId] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const tableTypes = [
    { label: "Sadə Oyunlu Masa", value: 1 },
    { label: "Kabinet Oyunlu Masa", value: 2 },
    { label: "Sadə Masa", value: 3 },
    { label: "Kabinet Masa", value: 4 },
  ];

  useEffect(() => {
    if (!user) return;
    fetchTables();
  }, [user]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Tables", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTables(res.data);
      setModalMessage("");
    } catch {
      setModalMessage("Masalar yüklənmədi.");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setForm({ tableName: "", type: 1 });
    setModalMessage("");
    setModalOpen(true);
  };

  const openEditModal = (table) => {
    setModalMode("edit");
    setForm({ tableName: table.tableName, type: table.type });
    setEditingId(table.id);
    setModalMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setModalMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "type" ? Number(value) : value,
    }));
    setModalMessage("");
  };

  const handleSubmit = async () => {
    if (!form.tableName.trim()) {
      setModalMessage("Masa adı daxil edin.");
      return;
    }

    try {
      if (modalMode === "edit") {
        await api.put(`/Tables/${editingId}`, form, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } else {
        await api.post("/Tables", form, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }
      closeModal();
      fetchTables();
    } catch {
      setModalMessage("Əməliyyat uğursuz oldu.");
    }
  };

  const confirmDeleteTable = (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/Tables/${deleteId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setConfirmDelete(false);
      setDeleteId(null);
      fetchTables();
    } catch {
      setModalMessage("Silinmədi.");
      setConfirmDelete(false);
    }
  };

  const sortedTables = [...tables].sort((a, b) => {
    const numA = parseInt((a.tableName || "").match(/\d+/)?.[0] || "0");
    const numB = parseInt((b.tableName || "").match(/\d+/)?.[0] || "0");
    return numA - numB;
  });
  return (
    <div className="p-4 max-w-full w-full">
      <h1 className="text-3xl font-bold mb-6 text-emerald-600">Masalar</h1>

      <button
        onClick={openAddModal}
        className="mb-4 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg transition"
      >
        Yeni Masa Əlavə et
      </button>

      {modalMessage && (
        <p className="mb-4 text-center text-red-600 font-medium select-none">
          {modalMessage}
        </p>
      )}

      {loading ? (
        <p className="text-center">Yüklənir...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-emerald-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Masa Adı
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Növ
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Əməliyyatlar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTables.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    Masalar tapılmadı.
                  </td>
                </tr>
              )}
              {sortedTables.map((table) => (
                <tr
                  key={table.id}
                  className="hover:bg-emerald-50 cursor-pointer transition"
                >
                  <td className="px-6 py-3 whitespace-nowrap">{table.tableName}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {tableTypes.find((t) => t.value === table.type)?.label || table.type}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap space-x-3 flex">
                    <button
                      onClick={() => openEditModal(table)}
                      className="px-3 py-1 rounded bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition"
                    >
                      Redaktə et
                    </button>
                    <button
                      onClick={() => confirmDeleteTable(table.id)}
                      className="px-3 py-1 rounded border border-red-500 text-red-600 text-sm font-medium hover:bg-red-600 hover:text-white transition"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4 text-emerald-700">
              {modalMode === "add" ? "Yeni Masa Əlavə et" : "Masa Redaktə et"}
            </h2>

            <label className="block mb-2 font-medium text-gray-700">Masa Adı</label>
            <input
              type="text"
              name="tableName"
              value={form.tableName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {modalMode === "add" && (
              <>
                <label className="block mb-2 font-medium text-gray-700">Növ</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {tableTypes.map(({ label, value }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </>
            )}

            {modalMessage && (
              <p className="mb-4 text-red-600 font-medium select-none">{modalMessage}</p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
              >
                İmtina
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                {modalMode === "add" ? "Əlavə et" : "Yenilə"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-red-600">Diqqət!</h3>
            <p className="mb-6">Masa silinsin? Əminsiniz?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
              >
                Xeyr
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Bəli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
