import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const tableTypes = [
  { label: "Sadə Oyunlu Masa", value: 1 },
  { label: "Kabinət Oyunlu Masa", value: 2 },
  { label: "Sadə Masa", value: 3 },
  { label: "Kabinet Masa", value: 4 },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tableType: null, hourlyPrice: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchPrices();
  }, [user]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/TablesPrices", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setPrices(res.data);
    } catch {
      setError("Qiymətlər yüklənmədi");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    const addedTypes = prices.map((p) => p.tableType);
    const firstAvailableType = tableTypes.find(t => !addedTypes.includes(t.value));
    setForm({ tableType: firstAvailableType?.value || null, hourlyPrice: "" });
    setEditingId(null);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (price) => {
    setForm({ tableType: price.tableType, hourlyPrice: price.hourlyPrice.toString() });
    setEditingId(price.id);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "tableType" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.tableType) {
      setError("Növ seçilməyib");
      return;
    }
    if (form.hourlyPrice === "" || isNaN(Number(form.hourlyPrice)) || Number(form.hourlyPrice) < 0) {
      setError("Düzgün saatlıq qiymət daxil edin");
      return;
    }

    const payload = { tableType: form.tableType, hourlyPrice: Number(form.hourlyPrice) };

    try {
      if (editingId) {
        await api.put(`/TablesPrices/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } else {
        await api.post("/TablesPrices", payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }
      fetchPrices();
      closeModal();
    } catch (err) {
      setError("Əməliyyat uğursuz oldu");
    }
  };

  const addedTypes = prices.map((p) => p.tableType);
  const availableTypes = tableTypes.filter(t => !addedTypes.includes(t.value) || (editingId && t.value === form.tableType));

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Qiymətləndirmə</h1>

      <button
        onClick={openAddModal}
        disabled={prices.length >= tableTypes.length}
        className={`mb-6 px-5 py-2 rounded-lg font-semibold text-white transition ${
          prices.length >= tableTypes.length ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        Yeni Qiymətləndirmə Əlavə Et
      </button>

      {error && (
        <div className="mb-4 text-red-700 bg-red-100 border border-red-400 p-3 rounded select-none">
          {error}
        </div>
      )}

      {loading ? (
        <p>Yüklənir...</p>
      ) : (
        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-emerald-100">
            <tr>
              <th className="p-3 text-left font-semibold">Növ</th>
              <th className="p-3 text-left font-semibold">Saatlıq Qiymət</th>
              <th className="p-3 text-left font-semibold">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <tr key={price.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="p-3">{tableTypes.find((t) => t.value === price.tableType)?.label || price.tableType}</td>
                <td className="p-3">{price.hourlyPrice} AZN</td>
                <td className="p-3 space-x-4">
                  <button
                    onClick={() => openEditModal(price)}
                    className="text-emerald-600 hover:text-emerald-800 font-semibold"
                  >
                    Redaktə et
                  </button>
                </td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center p-4 text-gray-500">
                  Qiymətləndirmə tapılmadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

    {modalOpen && (
    <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={closeModal}
    >
        <div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        >
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Qiymət Yenilə" : "Yeni Qiymətləndirmə"}</h2>

        <label className="block mb-2 font-medium">Növ</label>
        <select
            name="tableType"
            value={form.tableType || ""}
            onChange={handleChange}
            className="w-full border rounded p-2 mb-4"
            disabled={!!editingId}  
        >
            {availableTypes.map(({ label, value }) => (
            <option key={value} value={value}>
                {label}
            </option>
            ))}
        </select>

        <label className="block mb-2 font-medium">Saatlıq Qiymət (AZN)</label>
        <input
            type="number"
            name="hourlyPrice"
            value={form.hourlyPrice}
            onChange={handleChange}
            className="w-full border rounded p-2 mb-4"
            min="0"
        />

        {error && (
            <div className="text-red-600 mb-4 select-none">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
            <button
            onClick={closeModal}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
            type="button"
            >
            İmtina
            </button>
            <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition"
            type="button"
            >
            {editingId ? "Yenilə" : "Əlavə et"}
            </button>
        </div>
        </div>
    </div>
    )}
    </div>
  );
}
