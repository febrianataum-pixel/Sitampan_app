
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
  Clock,
  Camera,
  Image as ImageIcon,
  ChevronRight,
  Download,
  Upload,
  FileText
} from 'lucide-react';
import { formatIndoDate, OutboundTransaction } from '../types';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();
  const [animate, setAnimate] = useState(false);
  
  const [selectedKecName, setSelectedKecName] = useState<string | null>(null);
  const [kecTransactions, setKecTransactions] = useState<OutboundTransaction[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
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

  const getKecamatanName = (alamat: string) => {
    if (!alamat) return 'WILAYAH LAIN';
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
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Dashboard Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic">Monitoring distribusi logistik kebencanaan secara realtime.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black bg-white dark:bg-surface-dark text-slate-400 dark:text-slate-500 px-4 py-2 rounded-full uppercase tracking-widest border border-slate-200 dark:border-white/5 shadow-sm">
            Update: {new Date().toLocaleTimeString('id-ID')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Jenis Logistik', val: products.length, icon: <Package size={22} />, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30' },
          { label: 'Total Unit Masuk', val: totalInboundCount, icon: <ArrowDownCircle size={22} />, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
          { label: 'Total Unit Keluar', val: totalOutboundCount, icon: <ArrowUpCircle size={22} />, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/30' },
          { label: 'Barang Kosong', val: outOfStock.length, icon: <XCircle size={22} />, color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-900/30' }
        ].map((item, i) => (
          <div key={i} className={`bg-white dark:bg-surface-dark p-6 rounded-[2.2rem] shadow-sm border ${item.border} hover:shadow-lg transition-all duration-300 group cursor-default theme-transition`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 ${item.color} rounded-2xl group-hover:rotate-6 transition-transform duration-300`}>{item.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{item.val.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 theme-transition">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase text-sm tracking-tight">
                <BarChart2 size={18} className="text-blue-500" /> Kapasitas Stok
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Status 10 Barang Terbanyak di Gudang</p>
            </div>
          </div>
          <div className="space-y-5">
            {stockLevels.length > 0 ? stockLevels.slice(0, 10).map((s, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center text-[11px] mb-1.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{s.name}</span>
                  <span className="font-black text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-white/5 px-2.5 py-0.5 rounded-lg border border-slate-100 dark:border-white/5">{s.stock.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-full bg-slate-50 dark:bg-white/5 h-3 rounded-full overflow-hidden border border-slate-100 dark:border-white/5 shadow-inner">
                  <div 
                    className="h-full transition-all duration-1000 ease-out rounded-full relative"
                    style={{ 
                      width: animate ? `${(s.stock / maxStock) * 100}%` : '0%',
                      backgroundColor: s.stock <= 0 ? '#ef4444' : settings.themeColor 
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              </div>
            )) : <div className="text-center py-20 text-slate-400 italic text-xs">Belum ada data barang.</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 theme-transition">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase text-sm tracking-tight">
                <MapPin size={18} className="text-orange-500" /> Distribusi Bantuan
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Klik grafik untuk rincian data per kecamatan</p>
            </div>
          </div>
          <div className="space-y-5">
            {districtStats.length > 0 ? districtStats.slice(0, 10).map((d, idx) => (
              <div 
                key={idx} 
                className="cursor-pointer group/bar active-touch" 
                onClick={() => handleKecClick(d.name)}
              >
                <div className="flex justify-between items-center text-[11px] mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 dark:text-slate-400 tracking-tight group-hover/bar:text-orange-600 dark:group-hover/bar:text-orange-400 transition-colors uppercase">{d.name}</span>
                    <ChevronRight size={10} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover/bar:opacity-100 group-hover/bar:translate-x-1 transition-all" />
                  </div>
                  <span className="font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-0.5 rounded-lg border border-orange-100 dark:border-orange-800/30">{d.count} <span className="text-[9px] text-orange-400 dark:text-orange-500">BAST</span></span>
                </div>
                <div className="w-full bg-slate-50 dark:bg-white/5 h-3.5 rounded-full overflow-hidden border border-slate-100 dark:border-white/5 group-hover/bar:border-orange-200 dark:group-hover/bar:border-orange-900/30 transition-all shadow-inner">
                  <div 
                    className="h-full transition-all duration-[1200ms] ease-out rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-sm relative group-hover/bar:brightness-110"
                    style={{ 
                      width: animate ? `${(d.count / maxDistrictCount) * 100}%` : '0%',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/30 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300 dark:text-slate-700">
                <MapPin size={48} className="opacity-10 mb-3"/>
                <p className="italic text-xs text-slate-400">Belum ada data pengeluaran dengan format "Kec. ..."</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Section */}
      <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 theme-transition">
        <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 text-red-600 dark:text-red-500 uppercase text-sm tracking-tight">
          <XCircle size={18}/> Alert: Persediaan Habis / Kritis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {outOfStock.length > 0 ? (
            outOfStock.map((s, idx) => (
              <div key={idx} className="flex flex-col p-5 bg-red-50/30 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 group hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 shadow-sm">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1.5 leading-none">Status: KOSONG</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{s.name}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-emerald-50/20 dark:bg-emerald-900/10 rounded-3xl border border-dashed border-emerald-100 dark:border-emerald-900/20">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle2 size={28}/>
              </div>
              <p className="text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">Gudang Aman</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1 font-medium italic">Seluruh jenis logistik masih tersedia dalam stok.</p>
            </div>
          )}
        </div>
      </div>

      {/* District Modal Details */}
      {selectedKecName && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-surface-dark w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border dark:border-white/10">
            <div className="p-8 border-b dark:border-white/5 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <MapPin size={24}/>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{selectedKecName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daftar Transaksi BAST Terkirim</p>
                  </div>
               </div>
               <button onClick={() => setSelectedKecName(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all text-slate-400 active-touch">
                  <X size={24}/>
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
               {kecTransactions.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {kecTransactions.map((tx) => (
                     <div key={tx.id} className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 group hover:border-orange-200 dark:hover:border-orange-900/30 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              <Calendar size={12}/> {formatIndoDate(tx.tanggal)}
                           </div>
                           <div className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${tx.images && tx.images.length > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100'} uppercase`}>
                             {tx.images && tx.images.length > 0 ? 'DOKUMENTASI LENGKAP' : 'PROSES'}
                           </div>
                        </div>
                        <h4 className="font-black text-slate-800 dark:text-slate-100 mb-1 italic">{tx.penerima}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-4 truncate">{tx.alamat}</p>
                        <div className="space-y-1 pt-4 border-t dark:border-white/5">
                           {tx.items.map((item, i) => {
                             const p = products.find(prod => prod.id === item.productId);
                             return (
                               <div key={i} className="flex justify-between text-[10px]">
                                 <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">{p?.namaBarang}</span>
                                 <span className="font-black text-slate-800 dark:text-slate-200">{item.jumlah} {p?.satuan}</span>
                               </div>
                             );
                           })}
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-20 text-center italic text-slate-400">Tidak ada data transaksi ditemukan.</div>
               )}
            </div>

            <div className="p-8 bg-slate-50 dark:bg-white/5 border-t dark:border-white/5 shrink-0 flex justify-end">
               <button onClick={() => setSelectedKecName(null)} className="px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
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
