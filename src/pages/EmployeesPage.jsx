import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [modalMessage, setModalMessage] = useState("");
  const [form, setForm] = useState({ name: "", code: "" });
  const [editingId, setEditingId] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchEmployees();
  }, [user]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Users", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const sellersOnly = res.data.filter(emp => emp.role !== 0);
      setEmployees(sellersOnly);
      setModalMessage("");
    } catch {
      setModalMessage("İşçilər yüklənmədi.");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setForm({ name: "", code: "" }); 
    setModalMessage("");
    setModalOpen(true);
  };

  const openEditModal = (employee) => {
    setModalMode("edit");
    setForm({
      name: employee.name,
      code: employee.code,
    });
    setEditingId(employee.id);
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
      [name]: value,
    }));
    setModalMessage("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setModalMessage("Ad daxil edin.");
      return;
    }
    if (!form.code || isNaN(form.code)) {
      setModalMessage("Kod düzgün daxil edilməyib.");
      return;
    }

    try {
      if (modalMode === "edit") {
        await api.put(`/Users/${editingId}`, {
          id: editingId,
          name: form.name,
          code: Number(form.code),
          role: 1, 
        }, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } else {
        await api.post("/Users", {
          name: form.name,
          code: Number(form.code),
          role: 1,
        }, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }
      closeModal();
      fetchEmployees();
    } catch (err) {
      setModalMessage("Əməliyyat uğursuz oldu.");
    }
  };

  const confirmDeleteEmployee = (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/Users/${deleteId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setConfirmDelete(false);
      setDeleteId(null);
      fetchEmployees();
    } catch {
      alert("Silinmə zamanı xəta baş verdi.");
      setConfirmDelete(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    return (
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.code.toString().includes(searchTerm)
    );
  });

  return (
    <div className="p-4 max-w-full w-full">
      <h1 className="text-3xl font-bold mb-6 text-emerald-600">İşçilər</h1>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Ad və ya kod axtar..."
          className="border border-gray-300 rounded px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={openAddModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg transition"
        >
          Yeni İşçi Əlavə et
        </button>
      </div>

      {loading ? (
        <p className="text-center">Yüklənir...</p>
      ) : filteredEmployees.length === 0 ? (
        <p className="text-center text-gray-500">İşçi tapılmadı.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white shadow-md rounded-lg p-5 flex flex-col justify-between"
            >
              <div>
                <div className="mb-2 font-semibold text-lg">{employee.name}</div>
                <div className="mb-2 text-gray-600">Kod: {employee.code}</div>
                <div
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold bg-green-200 text-green-800`}
                >
                  Satıcı
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => openEditModal(employee)}
                  className="px-3 py-1 rounded border border-emerald-500 text-emerald-600 hover:bg-emerald-100 transition"
                >
                  Redaktə et
                </button>
                <button
                  onClick={() => confirmDeleteEmployee(employee.id)}
                  className="px-3 py-1 rounded border border-red-500 text-red-600 hover:bg-red-100 transition"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
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
              {modalMode === "add" ? "Yeni İşçi Əlavə et" : "İşçi Redaktə et"}
            </h2>

            <label className="block mb-2 font-medium text-gray-700">Ad</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />

            <label className="block mb-2 font-medium text-gray-700">Kod</label>
            <input
              type="number"
              name="code"
              value={form.code}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <p className="text-sm text-gray-500 mb-4 select-none">Vəzifə: <b>Satıcı</b></p>

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
            <p className="mb-6">İşçi silinsin? Əminsiniz?</p>
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
