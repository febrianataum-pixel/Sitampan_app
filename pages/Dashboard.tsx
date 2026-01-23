
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
  Upload
} from 'lucide-react';
import { formatIndoDate, OutboundTransaction } from '../types';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();
  const [animate, setAnimate] = useState(false);
  
  // State untuk Modal Detail Kecamatan
  const [selectedKecName, setSelectedKecName] = useState<string | null>(null);
  const [kecTransactions, setKecTransactions] = useState<OutboundTransaction[]>([]);
  
  // State untuk Viewer Dokumentasi
  const [viewingDocTx, setViewingDocTx] = useState<OutboundTransaction | null>(null);

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

  // Logika Ekstraksi Nama Kecamatan dari Alamat
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
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Dashboard Analytics</h2>
          <p className="text-slate-500 text-sm font-medium italic">Monitoring distribusi logistik kebencanaan secara realtime.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black bg-white text-slate-400 px-4 py-2 rounded-full uppercase tracking-widest border border-slate-200 shadow-sm">
            Update: {new Date().toLocaleTimeString('id-ID')}
          </div>
        </div>
      </div>

      {/* Ringkasan Kartu Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Jenis Logistik', val: products.length, icon: <Package size={22} />, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
          { label: 'Total Unit Masuk', val: totalInboundCount, icon: <ArrowDownCircle size={22} />, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
          { label: 'Total Unit Keluar', val: totalOutboundCount, icon: <ArrowUpCircle size={22} />, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
          { label: 'Barang Kosong', val: outOfStock.length, icon: <XCircle size={22} />, color: 'bg-red-50 text-red-600', border: 'border-red-100' }
        ].map((item, i) => (
          <div key={i} className={`bg-white p-6 rounded-[2.2rem] shadow-sm border ${item.border} hover:shadow-lg transition-all duration-300 group cursor-default`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 ${item.color} rounded-2xl group-hover:rotate-6 transition-transform duration-300`}>{item.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{item.val.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Stok Barang Terbanyak */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-tight">
                <BarChart2 size={18} className="text-blue-500" /> Kapasitas Stok
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Status 10 Barang Terbanyak di Gudang</p>
            </div>
          </div>
          <div className="space-y-5">
            {stockLevels.length > 0 ? stockLevels.slice(0, 10).map((s, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center text-[11px] mb-1.5">
                  <span className="font-bold text-slate-600 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{s.name}</span>
                  <span className="font-black text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">{s.stock.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
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

        {/* Chart Distribusi Kecamatan (Interaktif) */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-tight">
                <MapPin size={18} className="text-orange-500" /> Distribusi Bantuan
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Klik grafik untuk rincian data per kecamatan</p>
            </div>
          </div>
          <div className="space-y-5">
            {districtStats.length > 0 ? districtStats.slice(0, 10).map((d, idx) => (
              <div 
                key={idx} 
                className="cursor-pointer group/bar" 
                onClick={() => handleKecClick(d.name)}
              >
                <div className="flex justify-between items-center text-[11px] mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 tracking-tight group-hover/bar:text-orange-600 transition-colors uppercase">{d.name}</span>
                    <ChevronRight size={10} className="text-slate-300 opacity-0 group-hover/bar:opacity-100 group-hover/bar:translate-x-1 transition-all" />
                  </div>
                  <span className="font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100">{d.count} <span className="text-[9px] text-orange-400">BAST</span></span>
                </div>
                <div className="w-full bg-slate-50 h-3.5 rounded-full overflow-hidden border border-slate-100 group-hover/bar:border-orange-200 transition-all shadow-inner">
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
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <MapPin size={48} className="opacity-10 mb-3"/>
                <p className="italic text-xs text-slate-400">Belum ada data pengeluaran dengan format "Kec. ..."</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Detail Kecamatan */}
      {selectedKecName && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.8rem] w-full max-w-5xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-[1.5rem] shadow-inner">
                  <MapPin size={28}/>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">{selectedKecName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Ditemukan {kecTransactions.length} Log Transaksi Keluar</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedKecName(null)} 
                className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all"
              >
                <X size={24}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide bg-slate-50/30">
              <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 w-12 text-center">No.</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Nama Penerima</th>
                        <th className="px-6 py-4">Alamat Detail</th>
                        <th className="px-6 py-4 text-center">Dokumentasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {kecTransactions.map((tx, idx) => {
                        const hasPhotos = tx.images && tx.images.length > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 text-center text-xs font-bold text-slate-300">{idx + 1}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-400 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-slate-300"/>
                                {formatIndoDate(tx.tanggal)}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700 text-sm italic">{tx.penerima}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-medium max-w-[280px]">
                               <span className="line-clamp-2 leading-relaxed">{tx.alamat}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                {hasPhotos ? (
                                  <button 
                                    onClick={() => setViewingDocTx(tx)}
                                    className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                  >
                                    <Camera size={14}/>
                                    <span className="text-[10px] font-black uppercase tracking-tight">Lihat Foto ({tx.images?.length})</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 bg-slate-100 text-slate-400 px-4 py-2 rounded-xl border border-slate-200 cursor-not-allowed opacity-50">
                                    <Camera size={14}/>
                                    <span className="text-[10px] font-black uppercase tracking-tight">Tidak Ada</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedKecName(null)} 
                className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Tutup Jendela Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Dokumentasi (Nested Modal) */}
      {viewingDocTx && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
             <div className="p-8 border-b flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ImageIcon size={24}/></div>
                 <div>
                   <h4 className="font-black text-slate-800 uppercase tracking-tighter">Bukti Serah Terima Logistik</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic">{viewingDocTx.penerima} - {formatIndoDate(viewingDocTx.tanggal)}</p>
                 </div>
               </div>
               <button onClick={() => setViewingDocTx(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={24}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {viewingDocTx.images?.map((img, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 group relative">
                      <div className="aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-slate-100">
                         <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="absolute top-5 right-5 flex gap-2">
                        <a 
                          href={img} 
                          download={`BAST_${viewingDocTx.penerima}_${idx}.jpg`}
                          className="p-3 bg-white/90 backdrop-blur-sm text-slate-900 rounded-2xl shadow-xl hover:bg-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                        >
                          <Download size={18}/>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
             
             <div className="p-8 bg-white border-t border-slate-100 flex justify-center shrink-0">
                <button onClick={() => setViewingDocTx(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Kembali Ke Rincian</button>
             </div>
           </div>
        </div>
      )}

      {/* Alert Stok Kosong (Tetap) */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-red-600 uppercase text-sm tracking-tight">
          <XCircle size={18}/> Alert: Persediaan Habis / Kritis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {outOfStock.length > 0 ? (
            outOfStock.map((s, idx) => (
              <div key={idx} className="flex flex-col p-5 bg-red-50/30 rounded-3xl border border-red-100 group hover:bg-red-50 transition-all duration-300 shadow-sm">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1.5 leading-none">Status: KOSONG</span>
                <span className="text-xs font-black text-slate-700 truncate">{s.name}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-emerald-50/20 rounded-3xl border border-dashed border-emerald-100">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle2 size={28}/>
              </div>
              <p className="text-emerald-700 text-xs font-black uppercase tracking-widest">Gudang Aman</p>
              <p className="text-slate-400 text-[10px] mt-1 font-medium italic">Seluruh jenis logistik masih tersedia dalam stok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
