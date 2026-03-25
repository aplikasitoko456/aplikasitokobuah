import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings, 
  FileText, 
  TrendingUp,
  Plus,
  ArrowRightLeft,
  Store,
  MapPin,
  ChevronRight,
  Wallet,
  Building2,
  History,
  Edit2,
  Trash2,
  X,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Fruit, InventoryItem, JournalEntry, Expense, ProfitLossReport, BalanceSheetReport } from "./types";
import { format } from "date-fns";

type Menu = "kasir" | "kinerja" | "persediaan" | "pengaturan" | "laporan";

export default function App() {
  const [activeMenu, setActiveMenu] = useState<Menu>("kasir");
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFruits();
  }, []);

  const fetchFruits = async () => {
    try {
      const res = await fetch("/api/fruits");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFruits(data);
      } else {
        console.error("Expected array of fruits, got:", data);
        setFruits([]);
      }
    } catch (err) {
      console.error(err);
      setFruits([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Header with Fruit Background */}
      <header className="relative h-48 w-full overflow-hidden flex items-end p-12">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2070&auto=format&fit=crop" 
            alt="Fruit Background" 
            className="w-full h-full object-cover brightness-50"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Store size={24} className="text-yellow-400" />
            <h2 className="text-4xl font-black tracking-tight uppercase">Toko Buah Sumber</h2>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <MapPin size={16} />
            <p className="text-sm font-medium italic">Jalan Andi Toro, Kabupaten Gowa</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-12 pb-32 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeMenu === "kasir" && <KasirModule fruits={fruits} />}
            {activeMenu === "kinerja" && <KinerjaModule />}
            {activeMenu === "persediaan" && <PersediaanModule />}
            {activeMenu === "pengaturan" && <PengaturanModule fruits={fruits} onUpdate={fetchFruits} />}
            {activeMenu === "laporan" && <LaporanModule />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Full Width */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-[#E9ECEF] flex items-stretch shadow-[0_-10px_40px_rgba(0,0,0,0.05)] h-20">
        <NavButton 
          active={activeMenu === "kasir"} 
          onClick={() => setActiveMenu("kasir")} 
          icon={<ShoppingCart size={20} />} 
          label="Kasir" 
        />
        <NavButton 
          active={activeMenu === "kinerja"} 
          onClick={() => setActiveMenu("kinerja")} 
          icon={<TrendingUp size={20} />} 
          label="Kinerja" 
        />
        <NavButton 
          active={activeMenu === "persediaan"} 
          onClick={() => setActiveMenu("persediaan")} 
          icon={<Package size={20} />} 
          label="Persediaan" 
        />
        <NavButton 
          active={activeMenu === "laporan"} 
          onClick={() => setActiveMenu("laporan")} 
          icon={<FileText size={20} />} 
          label="Laporan" 
        />
        <NavButton 
          active={activeMenu === "pengaturan"} 
          onClick={() => setActiveMenu("pengaturan")} 
          icon={<Settings size={20} />} 
          label="Pengaturan" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all duration-300 border-t-2",
        active 
          ? "border-[#1A1A1A] text-[#1A1A1A] bg-[#F8F9FA]" 
          : "border-transparent text-[#ADB5BD] hover:text-[#6C757D] hover:bg-[#F8F9FA]/50"
      )}
    >
      <div className={cn("p-1 rounded-lg transition-colors", active ? "bg-[#1A1A1A] text-white" : "")}>
        {icon}
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-tighter", active ? "opacity-100" : "opacity-70")}>
        {label}
      </span>
    </button>
  );
}

// --- Modules ---

function KasirModule({ fruits }: { fruits: Fruit[] }) {
  const [tab, setTab] = useState<"penjualan" | "pembelian">("penjualan");
  const [items, setItems] = useState([{ fruitId: "", quantity: "", totalPrice: "" }]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const safeFruits = Array.isArray(fruits) ? fruits : [];

  const addItem = () => {
    setItems([...items, { fruitId: "", quantity: "", totalPrice: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total price for sales if fruit and quantity are selected
    if (tab === "penjualan" && (field === "fruitId" || field === "quantity")) {
      const fruitId = field === "fruitId" ? value : newItems[index].fruitId;
      const qty = field === "quantity" ? value : newItems[index].quantity;
      const fruit = safeFruits.find(f => f.id.toString() === fruitId);
      if (fruit && qty) {
        newItems[index].totalPrice = Math.round(fruit.price_per_kg * parseFloat(qty)).toString();
      }
    }

    setItems(newItems);
  };

  const grandTotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = tab === "penjualan" ? "/api/sales" : "/api/purchases";
    
    // Filter out empty items
    const validItems = items.filter(item => item.fruitId && item.quantity && item.totalPrice);
    if (validItems.length === 0) {
      setMessage({ type: "error", text: "Mohon isi setidaknya satu baris buah" });
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validItems.map(item => ({
            fruit_id: parseInt(item.fruitId),
            quantity: parseFloat(item.quantity),
            total_price: parseFloat(item.totalPrice)
          })),
          payment_method: paymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `${tab === "penjualan" ? "Penjualan" : "Pembelian"} berhasil!` });
        setItems([{ fruitId: "", quantity: "", totalPrice: "" }]);
      } else {
        setMessage({ type: "error", text: data.error || "Terjadi kesalahan" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Gagal menghubungi server" });
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => {
            setTab("penjualan");
            setItems([{ fruitId: "", quantity: "", totalPrice: "" }]);
          }}
          className={cn("px-8 py-2 rounded-lg font-bold transition-all", tab === "penjualan" ? "bg-[#1A1A1A] text-white" : "bg-[#E9ECEF] text-[#6C757D]")}
        >
          Penjualan
        </button>
        <button 
          onClick={() => {
            setTab("pembelian");
            setItems([{ fruitId: "", quantity: "", totalPrice: "" }]);
          }}
          className={cn("px-8 py-2 rounded-lg font-bold transition-all", tab === "pembelian" ? "bg-[#1A1A1A] text-white" : "bg-[#E9ECEF] text-[#6C757D]")}
        >
          Pembelian
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-2xl border border-[#E9ECEF]">
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_40px] gap-4 px-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#ADB5BD]">Pilih Buah</label>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#ADB5BD]">Berat (kg)</label>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#ADB5BD]">Total Harga</label>
            <div></div>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[2fr_1fr_1.5fr_40px] gap-4 items-center">
              <select 
                value={item.fruitId}
                onChange={(e) => updateItem(index, "fruitId", e.target.value)}
                className="w-full p-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#1A1A1A] outline-none transition-all text-sm"
                required
              >
                <option value="">-- Pilih --</option>
                {safeFruits.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({formatCurrency(f.price_per_kg)}/kg)</option>
                ))}
              </select>

              <input 
                type="text" 
                value={item.quantity.replace('.', ',')}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    updateItem(index, "quantity", val);
                  }
                }}
                className="w-full p-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#1A1A1A] outline-none transition-all text-sm"
                placeholder="0,00"
                required
              />

              <CurrencyInput 
                value={item.totalPrice}
                onChange={(val) => updateItem(index, "totalPrice", val)}
                readOnly={tab === "penjualan"}
                className={cn(
                  "w-full p-3 border-none rounded-xl focus:ring-2 focus:ring-[#1A1A1A] outline-none transition-all text-sm",
                  tab === "penjualan" ? "bg-[#E9ECEF] cursor-not-allowed" : "bg-[#F8F9FA]"
                )}
                placeholder="0"
                required
              />

              <button 
                type="button" 
                onClick={() => removeItem(index)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors disabled:opacity-30"
                disabled={items.length === 1}
              >
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
          ))}

          <button 
            type="button" 
            onClick={addItem}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6C757D] hover:text-[#1A1A1A] transition-colors px-2 py-2"
          >
            <Plus size={16} /> Tambah Baris
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 pt-8 border-t border-[#F8F9FA]">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#ADB5BD]">Metode Pembayaran</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-4 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#1A1A1A] outline-none transition-all"
              required
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              {tab === "penjualan" ? <option value="receivable">Piutang</option> : <option value="debt">Hutang</option>}
            </select>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-xs font-bold uppercase tracking-widest text-[#ADB5BD]">Grand Total</label>
            <p className="text-4xl font-black tracking-tighter">{formatCurrency(grandTotal)}</p>
          </div>
        </div>

        {message && (
          <div className={cn("mb-6 p-4 rounded-xl text-sm font-medium", message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            {message.text}
          </div>
        )}

        <button 
          type="submit"
          className="w-full py-5 bg-[#1A1A1A] text-white rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          {tab === "penjualan" ? <ArrowRightLeft size={24} /> : <Plus size={24} />}
          Proses {tab === "penjualan" ? "Penjualan" : "Pembelian"}
        </button>
      </form>
    </div>
  );
}

function KinerjaModule() {
  const [period, setPeriod] = useState<string>("day");
  const [data, setData] = useState<{ total_sales: string }>({ total_sales: "0" });
  const [details, setDetails] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch(`/api/performance?period=${period}`)
      .then(res => res.json())
      .then(setData);
    
    if (showDetails) {
      fetch(`/api/performance/details?period=${period}`)
        .then(res => res.json())
        .then(setDetails);
    }
  }, [period, showDetails]);

  return (
    <div className="max-w-4xl">
      <div className="flex gap-4 mb-8">
        {[
          { id: "day", label: "Hari Ini" },
          { id: "week", label: "Minggu Ini" },
          { id: "month", label: "Bulan Ini" },
          { id: "year", label: "Tahun Ini" }
        ].map(p => (
          <button 
            key={p.id}
            onClick={() => {
              setPeriod(p.id);
              setShowDetails(false);
            }}
            className={cn("px-6 py-2 rounded-lg font-bold transition-all capitalize", period === p.id ? "bg-[#1A1A1A] text-white" : "bg-[#E9ECEF] text-[#6C757D]")}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div 
        onClick={() => setShowDetails(!showDetails)}
        className="bg-white p-12 rounded-3xl shadow-2xl border border-[#E9ECEF] flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#1A1A1A] transition-all group"
      >
        <p className="text-[#ADB5BD] font-bold uppercase tracking-[0.2em] mb-4 group-hover:text-[#1A1A1A] transition-colors">Total Penjualan</p>
        <h3 className="text-7xl font-black tracking-tighter mb-4">
          {formatCurrency(parseFloat(data.total_sales || "0"))}
        </h3>
        <div className="h-1 w-24 bg-[#1A1A1A] rounded-full"></div>
        <p className="mt-4 text-xs text-[#ADB5BD] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Klik untuk rincian</p>
      </div>

      {showDetails && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-3xl shadow-xl border border-[#E9ECEF] overflow-hidden"
        >
          <div className="p-6 border-b border-[#F8F9FA] flex justify-between items-center">
            <h4 className="font-bold text-lg">Rincian Penjualan - {
              period === "day" ? "Hari Ini" : 
              period === "week" ? "Minggu Ini" : 
              period === "month" ? "Bulan Ini" : "Tahun Ini"
            }</h4>
            <button onClick={() => setShowDetails(false)} className="text-[#ADB5BD] hover:text-[#1A1A1A]"><X size={20} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8F9FA] text-[10px] font-black uppercase tracking-widest text-[#ADB5BD]">
                  {period === 'day' ? (
                    <>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Keterangan</th>
                      <th className="px-6 py-4 text-right">Nominal</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">{
                        period === 'week' ? 'Hari' : 
                        period === 'month' ? 'Tanggal' : 'Bulan'
                      }</th>
                      <th className="px-6 py-4 text-right">Total Penjualan</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F9FA]">
                {details.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F9FA]/50 transition-colors">
                    {period === 'day' ? (
                      <>
                        <td className="px-6 py-4 text-sm font-medium">{new Date(item.date).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-sm">{item.description}</td>
                        <td className="px-6 py-4 text-sm font-bold text-right">{formatCurrency(parseFloat(item.nominal))}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm font-medium">{item.day_name || item.date || item.month_name}</td>
                        <td className="px-6 py-4 text-sm font-bold text-right">{formatCurrency(parseFloat(item.total))}</td>
                      </>
                    )}
                  </tr>
                ))}
                {details.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-[#ADB5BD] italic text-sm">Tidak ada data penjualan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PersediaanModule() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);
  const [flow, setFlow] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/inventory")
      .then(res => res.json())
      .then(setInventory);
  }, []);

  useEffect(() => {
    if (selectedFruit) {
      fetch(`/api/inventory/${encodeURIComponent(selectedFruit)}/flow`)
        .then(res => res.json())
        .then(setFlow);
    }
  }, [selectedFruit]);

  return (
    <div className="max-w-5xl">
      <div className="grid grid-cols-3 gap-8 mb-8">
        {inventory.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedFruit(item.name)}
            className={cn(
              "bg-white p-8 rounded-3xl shadow-xl border transition-all group cursor-pointer",
              selectedFruit === item.name ? "border-[#1A1A1A] ring-2 ring-[#1A1A1A]/10" : "border-[#E9ECEF] hover:border-[#1A1A1A]"
            )}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "p-3 rounded-2xl transition-all",
                selectedFruit === item.name ? "bg-[#1A1A1A] text-white" : "bg-[#F8F9FA] group-hover:bg-[#1A1A1A] group-hover:text-white"
              )}>
                <Package size={24} />
              </div>
              <span className="text-xs font-black text-[#ADB5BD] uppercase tracking-widest">In Stock</span>
            </div>
            <h4 className="text-2xl font-bold mb-1">{item.name}</h4>
            <p className="text-4xl font-black text-[#1A1A1A]">{formatNumber(item.total_stock || 0)} <span className="text-sm font-medium text-[#6C757D]">kg</span></p>
          </div>
        ))}
      </div>

      {selectedFruit && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-3xl shadow-xl border border-[#E9ECEF]"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold">Arus Stok: {selectedFruit}</h3>
            <button onClick={() => setSelectedFruit(null)} className="text-[#ADB5BD] hover:text-[#1A1A1A]"><X size={24} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#F8F9FA]">
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Tanggal</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Keterangan</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD] text-right">Masuk (Beli)</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD] text-right">Keluar (Jual)</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD] text-right">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F9FA]">
                {flow.map((f, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F9FA] transition-all">
                    <td className="py-4 text-sm">{format(new Date(f.date), "dd/MM/yyyy HH:mm")}</td>
                    <td className="py-4 text-sm font-medium">{f.keterangan}</td>
                    <td className="py-4 text-sm text-right font-bold text-green-600">{f.masuk > 0 ? `+${formatNumber(f.masuk)} kg` : "-"}</td>
                    <td className="py-4 text-sm text-right font-bold text-red-600">{f.keluar > 0 ? `-${formatNumber(f.keluar)} kg` : "-"}</td>
                    <td className="py-4 text-sm text-right font-black">{formatNumber(f.sisa)} kg</td>
                  </tr>
                ))}
                {flow.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#ADB5BD] italic text-sm">Tidak ada arus stok untuk tahun ini</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PengaturanModule({ fruits, onUpdate }: { fruits: Fruit[], onUpdate: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const safeFruits = Array.isArray(fruits) ? fruits : [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/fruits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price_per_kg: parseFloat(price) })
    });
    setName("");
    setPrice("");
    onUpdate();
  };

  return (
    <div className="grid grid-cols-2 gap-12 max-w-6xl">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#E9ECEF]">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Plus className="text-[#1A1A1A]" />
          Tambah Buah Baru
        </h3>
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#ADB5BD]">Nama Buah</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#1A1A1A] outline-none transition-all"
              placeholder="Misal: Melon Madu"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#ADB5BD]">Harga per kg</label>
            <CurrencyInput 
              value={price}
              onChange={setPrice}
              className="w-full p-4 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#1A1A1A] outline-none transition-all"
              placeholder="0"
              required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg">
            Simpan Data Buah
          </button>
        </form>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#E9ECEF]">
        <h3 className="text-2xl font-bold mb-8">Daftar Buah & Harga</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
          {safeFruits.map(f => (
            <div key={f.id} className="flex justify-between items-center p-4 bg-[#F8F9FA] rounded-xl">
              <span className="font-bold">{f.name}</span>
              <span className="text-[#6C757D] font-medium">{formatCurrency(f.price_per_kg)}/kg</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BalanceRow({ label, value, isNegative = false }: { label: string, value: number, isNegative?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-[#495057]">{label}</span>
      <span className={cn("font-medium", isNegative && value !== 0 ? "text-red-500" : "")}>
        {isNegative && value !== 0 ? "(" : ""}{formatCurrency(Math.abs(value))}{isNegative && value !== 0 ? ")" : ""}
      </span>
    </div>
  );
}

function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  className 
}: { 
  options: string[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string,
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none cursor-pointer flex justify-between items-center"
      >
        <span className={cn("text-sm", !value ? "text-[#ADB5BD]" : "text-[#1A1A1A]")}>
          {value || placeholder}
        </span>
        <ChevronRight size={16} className={cn("transition-transform text-[#ADB5BD]", isOpen ? "rotate-90" : "")} />
      </div>
      
      {isOpen && (
        <div className="absolute z-[110] top-full left-0 right-0 mt-2 bg-white border border-[#E9ECEF] rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
          <div className="p-2 border-b border-[#F8F9FA]">
            <input 
              autoFocus
              placeholder="Cari akun..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 text-sm bg-[#F8F9FA] rounded-lg outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "p-3 text-sm hover:bg-[#F8F9FA] cursor-pointer transition-colors",
                    value === opt ? "bg-[#F8F9FA] font-bold" : ""
                  )}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-[#ADB5BD] text-center italic">
                Tidak ada akun ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LaporanModule() {
  const [tab, setTab] = useState<"jurnal" | "rugilaba" | "neraca" | "akun">("jurnal");
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<{id: number, category: string, sub_category: string, account_name: string}[]>([]);
  
  // Add Journal State
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [newJournal, setNewJournal] = useState({ description: "", debit_account: "", credit_account: "", amount: "" });

  // Add Account State
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ category: "Aktiva", sub_category: "Aktiva Lancar", account_name: "" });
  const [accountSearch, setAccountSearch] = useState("");

  // Add Expense State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "Biaya Gaji", amount: "", description: "" });

  // Edit/Delete Journal State
  const [editingJournal, setEditingJournal] = useState<{
    id: number;
    description: string;
    debit_account: string;
    credit_account: string;
    amount: string;
    transaction_id?: number;
    is_single?: boolean;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetch("/api/accounts").then(res => res.json()).then(setAccounts);
  }, []);

  useEffect(() => {
    if (tab === "jurnal") {
      fetch("/api/journals").then(res => res.json()).then(setJournals);
    } else if (tab === "rugilaba") {
      fetch("/api/reports/profit-loss").then(res => res.json()).then(setReport);
      fetch("/api/expenses").then(res => res.json()).then(setExpenses);
    } else if (tab === "neraca") {
      fetch("/api/reports/balance-sheet").then(res => res.json()).then(setBalanceSheet);
    }
  }, [tab]);

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newJournal,
        amount: parseFloat(newJournal.amount || "0")
      })
    });
    setShowAddJournal(false);
    setNewJournal({ description: "", debit_account: "", credit_account: "", amount: "" });
    fetch("/api/journals").then(res => res.json()).then(setJournals);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newExpense,
        amount: parseFloat(newExpense.amount || "0")
      })
    });
    setShowAddExpense(false);
    setNewExpense({ category: "gaji", amount: "", description: "" });
    fetch("/api/reports/profit-loss").then(res => res.json()).then(setReport);
    fetch("/api/expenses").then(res => res.json()).then(setExpenses);
  };

  const handleUpdateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournal) return;
    await fetch(`/api/journals/${editingJournal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editingJournal,
        amount: parseFloat(editingJournal.amount || "0")
      })
    });
    setEditingJournal(null);
    fetch("/api/journals").then(res => res.json()).then(setJournals);
  };

  const startEditing = (j: JournalEntry) => {
    const jDebit = parseFloat(j.debit as any || "0");
    const jCredit = parseFloat(j.credit as any || "0");
    
    if (j.transaction_id) {
      const partner = journals.find(other => other.transaction_id === j.transaction_id && other.id !== j.id);
      const pDebit = parseFloat(partner?.debit as any || "0");
      const pCredit = parseFloat(partner?.credit as any || "0");
      
      setEditingJournal({
        id: j.id,
        description: j.description,
        debit_account: jDebit > 0 ? j.account_name : (partner?.account_name || ""),
        credit_account: jCredit > 0 ? j.account_name : (partner?.account_name || ""),
        amount: (jDebit || jCredit || pDebit || pCredit || 0).toString(),
        transaction_id: j.transaction_id
      });
    } else {
      setEditingJournal({
        id: j.id,
        description: j.description,
        debit_account: jDebit > 0 ? j.account_name : "",
        credit_account: jCredit > 0 ? j.account_name : "",
        amount: (jDebit || jCredit).toString(),
        is_single: true
      });
    }
  };

  const handleDeleteJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showDeleteConfirm === null) return;
    const res = await fetch(`/api/journals/${showDeleteConfirm}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword })
    });
    if (res.ok) {
      setShowDeleteConfirm(null);
      setDeletePassword("");
      setDeleteError("");
      fetch("/api/journals").then(res => res.json()).then(setJournals);
    } else {
      setDeleteError("Password salah!");
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAccount)
    });
    setShowAddAccount(false);
    setNewAccount({ category: "Aktiva", sub_category: "Aktiva Lancar", account_name: "" });
    fetch("/api/accounts").then(res => res.json()).then(setAccounts);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.account_name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl">
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          onClick={() => setTab("jurnal")}
          className={cn("px-8 py-2 rounded-lg font-bold transition-all whitespace-nowrap", tab === "jurnal" ? "bg-[#1A1A1A] text-white" : "bg-[#E9ECEF] text-[#6C757D]")}
        >
          Jurnal Umum
        </button>
        <button 
          onClick={() => setTab("rugilaba")}
          className={cn("px-8 py-2 rounded-lg font-bold transition-all whitespace-nowrap", tab === "rugilaba" ? "bg-[#1A1A1A] text-white" : "bg-[#E9ECEF] text-[#6C757D]")}
        >
          Laporan Rugi Laba
        </button>
        <button 
          onClick={() => setTab("neraca")}
          className={cn("px-8 py-2 rounded-lg font-bold transition-all whitespace-nowrap", tab === "neraca" ? "bg-[#1A1A1A] text-white" : "bg-[#E9ECEF] text-[#6C757D]")}
        >
          Neraca
        </button>
        <button 
          onClick={() => setTab("akun")}
          className={cn("px-8 py-2 rounded-lg font-bold transition-all whitespace-nowrap", tab === "akun" ? "bg-[#1A1A1A] text-white" : "bg-[#E9ECEF] text-[#6C757D]")}
        >
          Daftar Akun
        </button>
      </div>

      {tab === "jurnal" ? (
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#E9ECEF]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold">Jurnal Umum</h3>
            <button 
              onClick={() => setShowAddJournal(true)}
              className="px-6 py-2 bg-[#1A1A1A] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all"
            >
              <Plus size={18} /> Tambah Jurnal
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#F8F9FA]">
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Tanggal</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Keterangan</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Akun</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD] text-right">Debit</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD] text-right">Kredit</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {journals.map(j => (
                  <tr key={j.id} className="border-b border-[#F8F9FA] hover:bg-[#F8F9FA] transition-all">
                    <td className="py-4 text-sm">{format(new Date(j.date), "dd/MM/yyyy HH:mm")}</td>
                    <td className="py-4 text-sm font-medium">{j.description}</td>
                    <td className="py-4 text-sm">{j.account_name}</td>
                    <td className="py-4 text-sm text-right font-mono">{j.debit > 0 ? formatCurrency(j.debit) : "-"}</td>
                    <td className="py-4 text-sm text-right font-mono">{j.credit > 0 ? formatCurrency(j.credit) : "-"}</td>
                    <td className="py-4 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => startEditing(j)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(j.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "rugilaba" ? (
        <div className="flex flex-col gap-8">
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#E9ECEF] max-w-3xl mx-auto w-full">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold uppercase tracking-widest">Laporan Rugi Laba</h3>
              <p className="text-[#ADB5BD] text-sm">Periode Berjalan</p>
            </div>
            
            {report && (
              <div className="space-y-4">
                {/* Pendapatan */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase text-[#ADB5BD] border-b pb-1">Pendapatan</h4>
                  <div className="flex justify-between items-center px-4">
                    <span>Penjualan</span>
                    <span className="font-bold">{formatCurrency(report.sales)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 bg-[#F8F9FA] py-2 rounded-lg">
                    <span className="font-bold">Total Pendapatan</span>
                    <span className="font-black">{formatCurrency(report.sales)}</span>
                  </div>
                </div>

                {/* HPP */}
                <div className="space-y-2 pt-4">
                  <h4 className="text-sm font-black uppercase text-[#ADB5BD] border-b pb-1">Beban Pokok Penjualan</h4>
                  <div className="flex justify-between items-center px-4 text-sm">
                    <span>Persediaan Awal</span>
                    <span className="font-medium">{formatCurrency(report.beginningInventory)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 text-sm">
                    <span>Pembelian</span>
                    <span className="font-medium underline underline-offset-4 decoration-dotted">{formatCurrency(report.purchases)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 text-sm">
                    <span>Persediaan Akhir</span>
                    <span className="font-medium text-red-500">({formatCurrency(report.endingInventory)})</span>
                  </div>
                  <div className="flex justify-between items-center px-4 bg-[#F8F9FA] py-2 rounded-lg">
                    <span className="font-bold">Total HPP</span>
                    <span className="font-black text-red-500">({formatCurrency(report.hpp)})</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-[#1A1A1A] text-white rounded-xl">
                  <span className="font-bold">Laba Kotor</span>
                  <span className="text-xl font-black">{formatCurrency(report.grossProfit)}</span>
                </div>

                {/* Biaya */}
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between items-center border-b pb-1">
                    <h4 className="text-sm font-black uppercase text-[#ADB5BD]">Beban Umum dan Administrasi</h4>
                    <button 
                      onClick={() => setShowAddExpense(true)}
                      className="text-[#1A1A1A] hover:scale-110 transition-transform"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-1 px-4">
                    <BalanceRow label="Biaya Gaji" value={report.expenses.biayaGaji} isNegative />
                    <BalanceRow label="Biaya ATK" value={report.expenses.biayaATK} isNegative />
                    <BalanceRow label="Biaya Konsumsi" value={report.expenses.biayaKonsumsi} isNegative />
                    <BalanceRow label="Biaya BPJS" value={report.expenses.biayaBPJS} isNegative />
                    <BalanceRow label="Biaya Sewa" value={report.expenses.biayaSewa} isNegative />
                    <BalanceRow label="Biaya Jasa" value={report.expenses.biayaJasa} isNegative />
                    <BalanceRow label="Biaya Listrik, air dan kebersihan" value={report.expenses.biayaListrikAirKebersihan} isNegative />
                    <BalanceRow label="Biaya Pajak" value={report.expenses.biayaPajak} isNegative />
                    <BalanceRow label="Biaya Perijinan" value={report.expenses.biayaPerijinan} isNegative />
                    <BalanceRow label="Biaya Asuransi" value={report.expenses.biayaAsuransi} isNegative />
                    <BalanceRow label="Biaya Penyusutan" value={report.expenses.biayaPenyusutan} isNegative />
                    <BalanceRow label="Biaya Lainnya" value={report.expenses.biayaLainnya} isNegative />
                  </div>
                  <div className="flex justify-between items-center px-4 bg-[#F8F9FA] py-2 rounded-lg">
                    <span className="font-bold">Total Beban Operasional</span>
                    <span className="font-black text-red-500">({formatCurrency(report.expenses.total)})</span>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex justify-between items-center p-6 bg-green-600 text-white rounded-2xl shadow-lg">
                    <span className="text-lg font-bold">Laba Bersih</span>
                    <span className="text-3xl font-black">{formatCurrency(report.netProfit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : tab === "neraca" ? (
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#E9ECEF] max-w-4xl mx-auto w-full">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold uppercase tracking-widest">Neraca</h3>
            <p className="text-[#ADB5BD] text-sm">Posisi Keuangan</p>
          </div>

          {balanceSheet && (
            <div className="grid grid-cols-2 gap-12">
              {/* Kolom Aktiva */}
              <div className="space-y-8">
                <h4 className="text-sm font-black uppercase text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-1">Aktiva (Aset)</h4>
                
                {/* Aktiva Lancar */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-tighter">Aktiva Lancar</p>
                  <div className="space-y-1 px-2">
                    <BalanceRow label="1. Kas" value={balanceSheet.aktivaLancar.kas} />
                    <BalanceRow label="2. Bank" value={balanceSheet.aktivaLancar.bank} />
                    <BalanceRow label="3. Piutang Dagang" value={balanceSheet.aktivaLancar.piutangDagang} />
                    <BalanceRow label="4. Piutang Lainnya" value={balanceSheet.aktivaLancar.piutangLainnya} />
                    <BalanceRow label="5. Persediaan Barang" value={balanceSheet.aktivaLancar.persediaanBarang} />
                    <BalanceRow label="6. Pajak dibayar dimuka" value={balanceSheet.aktivaLancar.pajakDibayarDimuka} />
                    <BalanceRow label="7. Aktiva Lancar Lainnya" value={balanceSheet.aktivaLancar.aktivaLancarLainnya} />
                  </div>
                  <div className="flex justify-between items-center px-2 pt-1 font-bold text-sm border-t border-dashed border-[#E9ECEF]">
                    <span>Total Aktiva Lancar</span>
                    <span>{formatCurrency(balanceSheet.aktivaLancar.total)}</span>
                  </div>
                </div>

                {/* Aktiva Tetap */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-tighter">Aktiva Tetap</p>
                  <div className="space-y-1 px-2">
                    <BalanceRow label="1. Tanah dan/atau Bangunan" value={balanceSheet.aktivaTetap.tanahBangunan} />
                    <BalanceRow label="2. Kendaraan" value={balanceSheet.aktivaTetap.kendaraan} />
                    <BalanceRow label="3. Inventaris" value={balanceSheet.aktivaTetap.inventaris} />
                    <BalanceRow label="4. Akumulasi Penyusutan" value={balanceSheet.aktivaTetap.akumulasiPenyusutan} isNegative />
                  </div>
                  <div className="flex justify-between items-center px-2 pt-1 font-bold text-sm border-t border-dashed border-[#E9ECEF]">
                    <span>Total Aktiva Tetap</span>
                    <span>{formatCurrency(balanceSheet.aktivaTetap.total)}</span>
                  </div>
                </div>

                {/* Aktiva Tidak Lancar Lainnya */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-tighter">Aktiva Tidak Lancar Lainnya</p>
                  <div className="space-y-1 px-2">
                    <BalanceRow label="1. Piutang Jangka Panjang" value={balanceSheet.aktivaTidakLancarLainnya.piutangJangkaPanjang} />
                    <BalanceRow label="2. Biaya Ditangguhkan" value={balanceSheet.aktivaTidakLancarLainnya.biayaDitangguhkan} />
                  </div>
                  <div className="flex justify-between items-center px-2 pt-1 font-bold text-sm border-t border-dashed border-[#E9ECEF]">
                    <span>Total Aktiva Tidak Lancar Lainnya</span>
                    <span>{formatCurrency(balanceSheet.aktivaTidakLancarLainnya.total)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-[#1A1A1A] text-white rounded-xl">
                  <span className="font-bold">TOTAL AKTIVA</span>
                  <span className="text-xl font-black">{formatCurrency(balanceSheet.totalAktiva)}</span>
                </div>
              </div>

              {/* Kolom Pasiva */}
              <div className="space-y-8">
                <h4 className="text-sm font-black uppercase text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-1">Pasiva (Kewajiban & Modal)</h4>

                {/* Pasiva Lancar */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-tighter">Pasiva Lancar (Jangka Pendek)</p>
                  <div className="space-y-1 px-2">
                    <BalanceRow label="1. Utang Dagang" value={balanceSheet.pasivaLancar.utangDagang} />
                    <BalanceRow label="2. Utang Gaji" value={balanceSheet.pasivaLancar.utangGaji} />
                    <BalanceRow label="3. Utang Sewa" value={balanceSheet.pasivaLancar.utangSewa} />
                    <BalanceRow label="4. Utang PPh 21" value={balanceSheet.pasivaLancar.utangPPh21} />
                    <BalanceRow label="5. Utang PPh 23" value={balanceSheet.pasivaLancar.utangPPh23} />
                    <BalanceRow label="6. Utang PPh 4(2)" value={balanceSheet.pasivaLancar.utangPPh4_2} />
                    <BalanceRow label="7. Utang PPN" value={balanceSheet.pasivaLancar.utangPPN} />
                    <BalanceRow label="8. Pendapatan Diterima di Muka" value={balanceSheet.pasivaLancar.pendapatanDiterimaDimuka} />
                    <BalanceRow label="9. Utang Lancar Lainnya" value={balanceSheet.pasivaLancar.utangLancarLainnya} />
                  </div>
                  <div className="flex justify-between items-center px-2 pt-1 font-bold text-sm border-t border-dashed border-[#E9ECEF]">
                    <span>Total Pasiva Lancar</span>
                    <span>{formatCurrency(balanceSheet.pasivaLancar.total)}</span>
                  </div>
                </div>

                {/* Pasiva Jangka Panjang */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-tighter">Pasiva Jangka Panjang</p>
                  <div className="space-y-1 px-2">
                    <BalanceRow label="1. Utang Bank/Kredit Investasi" value={balanceSheet.pasivaJangkaPanjang.utangBank} />
                    <BalanceRow label="2. Utang jangka panjang lainnya" value={balanceSheet.pasivaJangkaPanjang.utangJangkaPanjangLainnya} />
                  </div>
                  <div className="flex justify-between items-center px-2 pt-1 font-bold text-sm border-t border-dashed border-[#E9ECEF]">
                    <span>Total Pasiva Jangka Panjang</span>
                    <span>{formatCurrency(balanceSheet.pasivaJangkaPanjang.total)}</span>
                  </div>
                </div>

                {/* Ekuitas */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#ADB5BD] uppercase tracking-tighter">Ekuitas</p>
                  <div className="space-y-1 px-2">
                    <BalanceRow label="1. Modal" value={balanceSheet.ekuitas.modal} />
                    <BalanceRow label="2. Laba Ditahan" value={balanceSheet.ekuitas.labaDitahan} />
                    <BalanceRow label="3. Laba Tahun Berjalan" value={balanceSheet.ekuitas.labaTahunBerjalan} />
                  </div>
                  <div className="flex justify-between items-center px-2 pt-1 font-bold text-sm border-t border-dashed border-[#E9ECEF]">
                    <span>Total Ekuitas</span>
                    <span>{formatCurrency(balanceSheet.ekuitas.total)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-[#1A1A1A] text-white rounded-xl">
                  <span className="font-bold">TOTAL PASIVA</span>
                  <span className="text-xl font-black">{formatCurrency(balanceSheet.totalPasiva)}</span>
                </div>
              </div>
            </div>
          )}

          {balanceSheet && (
            <div className={cn(
              "mt-8 p-4 rounded-xl text-center font-bold text-xs uppercase tracking-widest",
              Math.abs(balanceSheet.totalAktiva - balanceSheet.totalPasiva) < 1
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}>
              {Math.abs(balanceSheet.totalAktiva - balanceSheet.totalPasiva) < 1 
                ? "Neraca Seimbang (Balanced)" 
                : "Neraca Tidak Seimbang"}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-[#E9ECEF]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <h3 className="text-2xl font-bold whitespace-nowrap">Daftar Akun</h3>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADB5BD]" size={16} />
                <input 
                  placeholder="Cari nama akun..." 
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] rounded-xl outline-none text-sm border border-transparent focus:border-[#1A1A1A] transition-all"
                />
              </div>
            </div>
            <button 
              onClick={() => setShowAddAccount(true)}
              className="px-6 py-2 bg-[#1A1A1A] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all"
            >
              <Plus size={18} /> Tambah Akun
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#F8F9FA]">
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Kategori</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Sub-Kategori</th>
                  <th className="py-4 text-xs font-black uppercase tracking-widest text-[#ADB5BD]">Nama Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F9FA]">
                {filteredAccounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-[#F8F9FA] transition-all">
                    <td className="py-4 text-sm font-medium">{acc.category}</td>
                    <td className="py-4 text-sm text-[#6C757D]">{acc.sub_category || "-"}</td>
                    <td className="py-4 text-sm font-bold">{acc.account_name}</td>
                  </tr>
                ))}
                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-[#ADB5BD] italic text-sm">Tidak ada akun ditemukan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddJournal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Tambah Jurnal Manual</h3>
            <form onSubmit={handleAddJournal} className="space-y-4">
              <input placeholder="Keterangan (misal: Modal Awal)" value={newJournal.description} onChange={e => setNewJournal({...newJournal, description: e.target.value})} className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" required />
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect 
                  options={accounts.map(a => a.account_name)}
                  value={newJournal.debit_account}
                  onChange={(val) => setNewJournal({...newJournal, debit_account: val})}
                  placeholder="Pilih Akun Debit"
                />
                <SearchableSelect 
                  options={accounts.map(a => a.account_name)}
                  value={newJournal.credit_account}
                  onChange={(val) => setNewJournal({...newJournal, credit_account: val})}
                  placeholder="Pilih Akun Kredit"
                />
              </div>
              <CurrencyInput placeholder="Nominal (Rp)" value={newJournal.amount} onChange={val => setNewJournal({...newJournal, amount: val})} className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" required />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddJournal(false)} className="flex-1 py-4 font-bold text-[#6C757D]">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-xl font-bold">Simpan Jurnal</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Tambah Akun Baru</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ADB5BD] ml-1">Kategori Utama</label>
                <select 
                  value={newAccount.category} 
                  onChange={e => setNewAccount({...newAccount, category: e.target.value})}
                  className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none text-sm appearance-none"
                >
                  <option value="Aktiva">Aktiva</option>
                  <option value="Pasiva">Pasiva</option>
                  <option value="Ekuitas">Ekuitas</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="HPP">HPP</option>
                  <option value="Biaya">Biaya</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ADB5BD] ml-1">Sub-Kategori</label>
                <input 
                  placeholder="Contoh: Aktiva Lancar, Pasiva Lancar" 
                  value={newAccount.sub_category} 
                  onChange={e => setNewAccount({...newAccount, sub_category: e.target.value})} 
                  className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ADB5BD] ml-1">Nama Akun</label>
                <input 
                  placeholder="Contoh: Kas Kecil, Piutang Karyawan" 
                  value={newAccount.account_name} 
                  onChange={e => setNewAccount({...newAccount, account_name: e.target.value})} 
                  className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" 
                  required 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddAccount(false)} className="flex-1 py-4 font-bold text-[#6C757D]">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-xl font-bold">Tambah Akun</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Tambah Biaya</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <SearchableSelect 
                options={accounts.filter(acc => acc.category === 'Biaya').map(acc => acc.account_name)}
                value={newExpense.category}
                onChange={(val) => setNewExpense({...newExpense, category: val})}
                placeholder="Pilih Kategori Biaya"
              />
              <input placeholder="Keterangan" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" required />
              <CurrencyInput placeholder="Jumlah (Rp)" value={newExpense.amount} onChange={val => setNewExpense({...newExpense, amount: val})} className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" required />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-4 font-bold text-[#6C757D]">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-xl font-bold">Simpan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Journal Modal */}
      {editingJournal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Ubah Jurnal</h3>
            <form onSubmit={handleUpdateJournal} className="space-y-4">
              <input 
                placeholder="Keterangan" 
                value={editingJournal.description} 
                onChange={e => setEditingJournal({...editingJournal, description: e.target.value})} 
                className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" 
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect 
                  options={accounts.map(a => a.account_name)}
                  value={editingJournal.debit_account}
                  onChange={(val) => setEditingJournal({...editingJournal, debit_account: val})}
                  placeholder="Pilih Akun Debit"
                />
                <SearchableSelect 
                  options={accounts.map(a => a.account_name)}
                  value={editingJournal.credit_account}
                  onChange={(val) => setEditingJournal({...editingJournal, credit_account: val})}
                  placeholder="Pilih Akun Kredit"
                />
              </div>
              <CurrencyInput 
                placeholder="Nominal (Rp)" 
                value={editingJournal.amount} 
                onChange={val => setEditingJournal({...editingJournal, amount: val})} 
                className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none" 
                required 
              />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingJournal(null)} className="flex-1 py-4 font-bold text-[#6C757D]">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-xl font-bold">Simpan Perubahan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Journal Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-red-600">Hapus Jurnal?</h3>
            <p className="text-[#6C757D] mb-8">Tindakan ini tidak dapat dibatalkan. Masukkan password untuk konfirmasi.</p>
            <form onSubmit={handleDeleteJournal} className="space-y-4">
              <input 
                type="password"
                placeholder="Password" 
                value={deletePassword} 
                onChange={e => setDeletePassword(e.target.value)} 
                className="w-full p-4 bg-[#F8F9FA] rounded-xl outline-none border border-transparent focus:border-red-500" 
                required 
                autoFocus
              />
              {deleteError && <p className="text-red-500 text-sm font-bold">{deleteError}</p>}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowDeleteConfirm(null); setDeletePassword(""); setDeleteError(""); }} className="flex-1 py-4 font-bold text-[#6C757D]">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold">Hapus Sekarang</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2
  }).format(value);
}

function CurrencyInput({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  required, 
  readOnly 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  placeholder?: string, 
  className?: string, 
  required?: boolean, 
  readOnly?: boolean 
}) {
  const format = (val: string) => {
    if (!val) return "";
    // Handle both string and number, and remove decimals for display in IDR
    const num = Math.round(parseFloat(val.toString().replace(/[^0-9.]/g, "")));
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    onChange(rawValue);
  };

  return (
    <input
      type="text"
      value={format(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      required={required}
      readOnly={readOnly}
    />
  );
}
