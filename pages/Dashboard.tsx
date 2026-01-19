
import React from 'react';
import { useInventory } from '../App';
import { Package, ArrowDownCircle, ArrowUpCircle, XCircle, BarChart2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();

  const totalInboundCount = inbound.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalOutboundCount = outbound.reduce((acc, tx) => acc + tx.items.reduce((s, i) => s + i.jumlah, 0), 0);
  
  const stockLevels = products.map(p => ({
    name: p.namaBarang,
    stock: calculateStock(p.id)
  })).sort((a, b) => b.stock - a.stock);

  const outOfStock = stockLevels.filter(s => s.stock <= 0);
  const maxStock = Math.max(...stockLevels.map(s => s.stock), 1);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tighter">Dashboard Inventaris</h2>
        <p className="text-slate-500 text-sm">Ringkasan status gudang Anda secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Jenis Barang</p>
              <p className="text-2xl font-black text-slate-800">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowDownCircle size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Unit Masuk</p>
              <p className="text-2xl font-black text-slate-800">{totalInboundCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><ArrowUpCircle size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Unit Keluar</p>
              <p className="text-2xl font-black text-slate-800">{totalOutboundCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><XCircle size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Barang Habis</p>
              <p className="text-2xl font-black text-slate-800">{outOfStock.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Horizontal Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><BarChart2 size={20} /> Monitoring Stok (Horizontal)</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status 15 Barang Terbanyak</span>
          </div>
          <div className="space-y-5">
            {stockLevels.length > 0 ? stockLevels.slice(0, 15).map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 truncate max-w-[200px]">{s.name}</span>
                  <span className="font-black text-slate-900">{s.stock} Unit</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out rounded-full"
                    style={{ 
                      width: `${Math.max((s.stock / maxStock) * 100, 2)}%`,
                      backgroundColor: s.stock <= 0 ? '#ef4444' : settings.themeColor 
                    }}
                  ></div>
                </div>
              </div>
            )) : <div className="text-center py-20 text-slate-400 italic">Data belum tersedia.</div>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-red-600"><XCircle size={18}/> Alert: Stok Kosong</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {outOfStock.length > 0 ? (
              outOfStock.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <span className="text-sm font-bold text-red-900 truncate pr-2">{s.name}</span>
                  <span className="text-[10px] font-black bg-red-600 text-white px-2.5 py-1 rounded-lg">KOSONG</span>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <Package className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 text-sm italic">Gudang aman, stok tersedia.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
