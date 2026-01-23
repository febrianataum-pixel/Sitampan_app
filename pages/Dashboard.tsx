
import React, { useEffect, useState } from 'react';
import { useInventory } from '../App';
import { 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  XCircle, 
  BarChart2, 
  MapPin, 
  X, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatIndoDate, OutboundTransaction } from '../types';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();
  const [animate, setAnimate] = useState(false);
  
  // State untuk Modal Detail Kecamatan
  const [selectedKecName, setSelectedKecName] = useState<string | null>(null);
  const [kecTransactions, setKecTransactions] = useState<OutboundTransaction[]>([]);

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
  const getKecamatanName = (alamat: string) => {
    const match = alamat.match(/(?:Kec\.|Kecamatan)\s+([a-zA-Z\s]+?)(?:,|$|\d)/i);
    return match ? `KEC. ${match[1].trim().toUpperCase()}` : 'WILAYAH LAIN';
  };

  const getKecamatanStats = () => {
    const counts: Record<string, number> = {};
    outbound.forEach(tx => {
      const kecName = getKecamatanName(tx.alamat);
      counts[kecName] = (counts[kecName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const districtStats = getKecamatanStats();
  const maxDistrictCount = Math.max(...districtStats.map(d => d.count), 1);

  const handleKecClick = (name: string) => {
    const filtered = outbound.filter(tx => getKecamatanName(tx.alamat) === name)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    setKecTransactions(filtered);
    setSelectedKecName(name);
  };

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

        {/* Chart Distribusi Kecamatan (Interaktif) */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-tight">
                <MapPin size={18} className="text-orange-500" /> Distribusi Bantuan
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Klik grafik untuk rincian per kecamatan</p>
            </div>
          </div>
          <div className="space-y-6">
            {districtStats.length > 0 ? districtStats.slice(0, 10).map((d, idx) => (
              <div 
                key={idx} 
                className="space-y-1.5 cursor-pointer group/bar" 
                onClick={() => handleKecClick(d.name)}
              >
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600 tracking-tight group-hover/bar:text-orange-600 transition-colors">{d.name}</span>
                  <span className="font-black text-orange-600">{d.count} <span className="text-[9px] text-slate-300">BAST</span></span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 group-hover/bar:border-orange-200 transition-all">
                  <div 
                    className="h-full transition-all duration-[1200ms] ease-out rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-sm relative group-hover/bar:brightness-110"
                    style={{ 
                      width: animate ? `${(d.count / maxDistrictCount) * 100}%` : '0%',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                  </div>
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

      {/* Modal Detail Kecamatan */}
      {selectedKecName && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <MapPin size={24}/>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Detail Distribusi: {selectedKecName}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total {kecTransactions.length} Transaksi Terdeteksi</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedKecName(null)} 
                className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={24}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
              <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 w-12 text-center">No.</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Penerima</th>
                        <th className="px-6 py-4">Alamat Lengkap</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {kecTransactions.map((tx, idx) => {
                        const isTuntas = tx.images && tx.images.length > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-orange-50/30 transition-colors">
                            <td className="px-6 py-4 text-center text-xs font-bold text-slate-300">{idx + 1}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-400 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar size={12}/>
                                {formatIndoDate(tx.tanggal)}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                              <div className="flex items-center gap-2">
                                <User size={12} className="text-slate-300"/>
                                {tx.penerima}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-medium max-w-[300px]">
                              <div className="flex items-start gap-1.5">
                                <MapPin size={12} className="text-slate-300 shrink-0 mt-0.5"/>
                                <span className="line-clamp-2 leading-relaxed">{tx.alamat}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isTuntas ? (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg w-fit border border-emerald-100">
                                  <CheckCircle2 size={12}/>
                                  <span className="text-[9px] font-black uppercase tracking-tight">Tuntas</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-slate-50 text-slate-400 px-3 py-1 rounded-lg w-fit border border-slate-100">
                                  <Clock size={12}/>
                                  <span className="text-[9px] font-black uppercase tracking-tight">Proses</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {kecTransactions.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Tidak ada rincian data.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedKecName(null)} 
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
