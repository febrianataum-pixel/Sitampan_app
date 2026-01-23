
import React, { useEffect, useState } from 'react';
import { useInventory } from '../App';
import { Package, ArrowDownCircle, ArrowUpCircle, XCircle, BarChart2, MapPin } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Memicu animasi setelah komponen dimuat
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalInboundCount = inbound.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalOutboundCount = outbound.reduce((acc, tx) => acc + tx.items.reduce((s, i) => s + i.jumlah, 0), 0);
  
  const stockLevels = products.map(p => ({
    name: p.namaBarang,
    stock: calculateStock(p.id)
  })).sort((a, b) => b.stock - a.stock);

  const outOfStock = stockLevels.filter(s => s.stock <= 0);
  const maxStock = Math.max(...stockLevels.map(s => s.stock), 1);

  // Logika Ekstraksi Kecamatan
  const getKecamatanStats = () => {
    const counts: Record<string, number> = {};
    outbound.forEach(tx => {
      // Mencari pola "Kec. [Nama]" atau "Kecamatan [Nama]"
      const match = tx.alamat.match(/(?:Kec\.|Kecamatan)\s+([a-zA-Z\s]+?)(?:,|$|\d)/i);
      const kecName = match ? `Kec. ${match[1].trim().toUpperCase()}` : 'WILAYAH LAIN';
      counts[kecName] = (counts[kecName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const districtStats = getKecamatanStats();
  const maxDistrictCount = Math.max(...districtStats.map(d => d.count), 1);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Dashboard Real-Time</h2>
          <p className="text-slate-500 text-sm font-medium italic">Monitoring stok dan persebaran bantuan logistik.</p>
        </div>
        <div className="text-[10px] font-black bg-slate-100 text-slate-400 px-4 py-2 rounded-full uppercase tracking-widest border border-slate-200">
          Last Update: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Ringkasan Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Jenis Barang', val: products.length, icon: <Package size={22} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Unit Masuk', val: totalInboundCount, icon: <ArrowDownCircle size={22} />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Unit Keluar', val: totalOutboundCount, icon: <ArrowUpCircle size={22} />, color: 'bg-orange-50 text-orange-600' },
          { label: 'Stok Kosong', val: outOfStock.length, icon: <XCircle size={22} />, color: 'bg-red-50 text-red-600' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4">
              <div className={`p-4 ${item.color} rounded-2xl group-hover:scale-110 transition-transform`}>{item.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{item.val.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Stok Barang */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-tight">
                <BarChart2 size={18} className="text-blue-500" /> Kapasitas Stok
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Status 10 Barang Terbanyak</p>
            </div>
          </div>
          <div className="space-y-6">
            {stockLevels.length > 0 ? stockLevels.slice(0, 10).map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600 uppercase tracking-tight">{s.name}</span>
                  <span className="font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{s.stock}</span>
                </div>
                <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.05)]"
                    style={{ 
                      width: animate ? `${(s.stock / maxStock) * 100}%` : '0%',
                      backgroundColor: s.stock <= 0 ? '#ef4444' : settings.themeColor 
                    }}
                  ></div>
                </div>
              </div>
            )) : <div className="text-center py-20 text-slate-400 italic text-xs">Data belum tersedia.</div>}
          </div>
        </div>

        {/* Chart Distribusi Kecamatan */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-tight">
                <MapPin size={18} className="text-orange-500" /> Distribusi Bantuan
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Persebaran per Kecamatan</p>
            </div>
          </div>
          <div className="space-y-6">
            {districtStats.length > 0 ? districtStats.slice(0, 10).map((d, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600 tracking-tight">{d.name}</span>
                  <span className="font-black text-orange-600">{d.count} <span className="text-[9px] text-slate-300">BAST</span></span>
                </div>
                <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className="h-full transition-all duration-[1200ms] ease-out rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-sm"
                    style={{ 
                      width: animate ? `${(d.count / maxDistrictCount) * 100}%` : '0%',
                    }}
                  ></div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <MapPin size={48} className="opacity-10 mb-2"/>
                <p className="italic text-xs">Gunakan "Kec. [Nama]" pada alamat barang keluar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Stok Kosong */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-red-600 uppercase text-sm tracking-tight">
          <XCircle size={18}/> Alert: Stok Menipis / Kosong
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {outOfStock.length > 0 ? (
            outOfStock.map((s, idx) => (
              <div key={idx} className="flex flex-col p-4 bg-red-50/30 rounded-2xl border border-red-100 group hover:bg-red-50 transition-colors">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Out of Stock</span>
                <span className="text-xs font-bold text-slate-700 truncate">{s.name}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <Package size={24}/>
              </div>
              <p className="text-slate-400 text-xs italic font-medium">Seluruh stok barang masih tersedia di gudang.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
