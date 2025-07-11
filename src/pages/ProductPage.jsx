import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default function ProductPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [form, setForm] = useState({ name: "", price: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockCount, setStockCount] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Products", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setProducts(res.data);
    } catch {
      setMessage("Məhsullar yüklənmədi.");
    }
    setLoading(false);
  };

  const sortedProducts = () => {
    let sortableProducts = [...products];
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (typeof aValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      });
    }
    return sortableProducts;
  };

  const filteredProducts = sortedProducts().filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const requestSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const openAddModal = () => {
    setForm({ name: "", price: "" });
    setModalMode("add");
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setForm({ name: product.name, price: product.price });
    setModalMode("edit");
    setEditingId(product.id);
    setModalOpen(true);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockCount("");
    setStockModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setMessage("");
  };

  const closeStockModal = () => {
    setStockModalOpen(false);
    setSelectedProduct(null);
    setMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || isNaN(+form.price)) {
      setMessage("Ad və qiymət düzgün doldurulmalıdır.");
      return;
    }

    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      count: 0,
    };

    try {
      if (modalMode === "edit") {
        const originalProduct = products.find((p) => p.id === editingId);
        await api.put(`/Products/${editingId}`, {
          ...originalProduct,
          ...payload,
        }, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } else {
        await api.post("/Products", payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }

      fetchProducts();
      closeModal();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMessage(`Server Xətası: ${err.response.data}`);
      } else {
        setMessage("Əməliyyat uğursuz oldu.");
      }
    }
  };

  const handleStockSubmit = async () => {
    if (!selectedProduct || isNaN(+stockCount) || +stockCount < 1) {
      setMessage("Say düzgün daxil edilməlidir.");
      return;
    }
    try {
      const updated = {
        ...selectedProduct,
        count: selectedProduct.count + parseInt(stockCount),
        id: selectedProduct.id,
      };
      await api.put(`/Products/${selectedProduct.id}`, updated, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchProducts();
      closeStockModal();
    } catch {
      setMessage("Say artırıla bilmədi.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/Products/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchProducts();
      setDeleteConfirmId(null);
    } catch {
      setMessage("Silinmə uğursuz oldu.");
    }
  };

  return (
    <div className="container mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-6 text-emerald-600 text-center">
        Məhsullar
      </h1>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Axtarış..."
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={openAddModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg transition w-full sm:w-auto"
        >
          Yeni Məhsul
        </button>
      </div>

      {message && <p className="mb-4 text-red-600 font-medium text-center">{message}</p>}

      {loading ? (
        <p className="text-center">Yüklənir...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500">Məhsul tapılmadı.</p>
      ) : (
        <>
          {/* Desktop üçün cədvəl görünüşü */}
          <div className="overflow-x-auto bg-white rounded-lg shadow hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">№</th>
                  <th
                    onClick={() => requestSort("name")}
                    className="cursor-pointer px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    Ad
                  </th>
                  <th
                    onClick={() => requestSort("price")}
                    className="cursor-pointer px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    Qiymət
                  </th>
                  <th
                    onClick={() => requestSort("count")}
                    className="cursor-pointer px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    Say
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Əməliyyatlar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p, i) => (
                  <tr key={p.id} className="hover:bg-emerald-50 transition">
                    <td className="px-6 py-3">{i + 1}</td>
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3">{p.price} ₼</td>
                    <td className="px-6 py-3">{p.count}</td>
                    <td className="px-6 py-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => openStockModal(p)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                      >
                        Stoka əlavə et
                      </button>
                      {(user.role === 'Admin') && (
                        <>
                          <button
                            onClick={() => openEditModal(p)}
                            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 transition"
                          >
                            Redaktə et
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="px-3 py-1 border border-red-500 text-red-600 rounded text-sm hover:bg-red-600 hover:text-white transition"
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobil və Tablet üçün kart görünüşü */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white shadow-md rounded-lg p-5 flex flex-col justify-between border border-gray-200">
                <div>
                  <div className="mb-2 font-semibold text-lg text-emerald-700">{p.name}</div>
                  <div className="mb-2 text-gray-600">Qiymət: {p.price} ₼</div>
                  <div className="mb-2 text-gray-600">Say: {p.count}</div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => openStockModal(p)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                  >
                    Stoka əlavə et
                  </button>
                  {(user.role === 'Admin') && (
                    <>
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 transition"
                      >
                        Redaktə et
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="px-3 py-1 border border-red-500 text-red-600 rounded text-sm hover:bg-red-600 hover:text-white transition"
                      >
                        Sil
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white p-6 rounded-lg shadow max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4 text-emerald-700 text-center">
              {modalMode === "add" ? "Yeni Məhsul Əlavə et" : "Məhsulu Redaktə et"}
            </h2>
            <label className="block mb-2 font-medium text-gray-700">Ad</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border p-2 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <label className="block mb-2 font-medium text-gray-700">Qiymət</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full border p-2 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {message && <p className="text-red-600 mb-4 text-center">{message}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition">İmtina</button>
              <button onClick={handleSubmit} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition">
                {modalMode === "add" ? "Əlavə et" : "Yenilə"}
              </button>
            </div>
          </div>
        </div>
      )}

      {stockModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={closeStockModal}>
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-blue-700 text-center">Stoka əlavə et: {selectedProduct.name}</h2>
            <input
              type="number"
              placeholder="Say daxil edin"
              className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stockCount}
              onChange={(e) => setStockCount(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={closeStockModal} className="border px-4 py-2 rounded hover:bg-gray-100 transition">İmtina</button>
              <button onClick={handleStockSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Əlavə et</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-red-600">Diqqət!</h3>
            <p className="mb-6">Bu məhsulu silmək istədiyinizə əminsiniz?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition">Xeyr</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">Bəli</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}