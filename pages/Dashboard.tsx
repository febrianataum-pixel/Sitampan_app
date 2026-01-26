
import React, { useMemo, useState } from 'react';
import { useInventory } from '../App';
import { 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlertOctagon,
  BarChart3,
  MapPin,
  Box,
  Inbox,
  TrendingUp,
  X,
  History,
  Smartphone,
  Info,
  ChevronRight
} from 'lucide-react';
import { formatIndoDate } from '../types';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();
  const [selectedKecName, setSelectedKecName] = useState<string | null>(null);

  // 1. Statistik Utama
  const stats = useMemo(() => {
    const jenisLogistik = products.length;
    const totalMasuk = inbound.reduce((acc, i) => acc + i.jumlah, 0);
    const totalKeluar = outbound.reduce((acc, tx) => 
      acc + tx.items.reduce((sum, item) => sum + item.jumlah, 0), 0
    );
    const barangKosong = products.filter(p => calculateStock(p.id) <= 0).length;

    return [
      { label: 'Jenis Logistik', value: jenisLogistik, icon: <Package size={18}/>, color: 'blue' },
      { label: 'Total Unit Masuk', value: totalMasuk, icon: <ArrowDownCircle size={18}/>, color: 'emerald' },
      { label: 'Total Unit Keluar', value: totalKeluar, icon: <ArrowUpCircle size={18}/>, color: 'orange' },
      { label: 'Barang Kosong', value: barangKosong, icon: <AlertOctagon size={18}/>, color: 'red' },
    ];
  }, [products, inbound, outbound, calculateStock]);

  // 2. Data Grafik Ketersediaan Stok (UTAMA & BESAR)
  const stockAvailabilityData = useMemo(() => {
    return products
      .map(p => ({ 
        id: p.id,
        name: p.namaBarang, 
        stock: calculateStock(p.id),
        code: p.kodeBarang,
        satuan: p.satuan
      }))
      .sort((a, b) => b.stock - a.stock);
  }, [products, calculateStock]);

  // 3. Data Grafik Distribusi Per Kecamatan (Tampilkan SEMUA - Orange)
  const distributionByKecamatan = useMemo(() => {
    const map = new Map<string, number>();
    
    outbound.forEach(tx => {
      const match = tx.alamat?.match(/(Kec\.\s+|Kecamatan\s+)([A-Za-z\s]+)/i);
      const kecName = match ? match[0].trim() : 'Lainnya';
      // Menghitung FREKUENSI (berapa kali pengiriman dilakukan)
      map.set(kecName, (map.get(kecName) || 0) + 1);
    });

    // Mengambil semua tanpa .slice()
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [outbound]);

  const maxDist = Math.max(...distributionByKecamatan.map(d => d.value), 1);

  // 4. Barang Stok Habis (Format Grid Card)
  const outOfStockItems = useMemo(() => {
    return products.filter(p => calculateStock(p.id) <= 0);
  }, [products, calculateStock]);

  // 5. Rincian Per Kecamatan
  const kecamatanDetails = useMemo(() => {
    if (!selectedKecName) return [];
    return outbound.filter(tx => {
      const match = tx.alamat?.match(/(Kec\.\s+|Kecamatan\s+)([A-Za-z\s]+)/i);
      const name = match ? match[0].trim() : 'Lainnya';
      return name === selectedKecName;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [selectedKecName, outbound]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-24 md:pb-10">
      
      {/* PWA Mobile Standing Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="md:hidden p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
              <Smartphone size={16}/>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
              Monitoring Realtime
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-widest">
            {settings.warehouseName} <span className="mx-2 opacity-30">|</span> Standalone PWA
          </p>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative active:scale-95 touch-manipulation">
            <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${s.color}-500/5 rounded-full`}></div>
            <div className="flex flex-col md:flex-row md:items-center gap-3 relative z-10">
              <div className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 shrink-0`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 truncate">
                  {s.label}
                </p>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
                  {s.value.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Layout Charts Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* GRAFIK KETERSEDIAAN STOK (LEBIH BESAR) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-500"/> Sisa Stok Logistik Utama
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 md:p-10 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[500px]">
            <div className="space-y-8">
              {stockAvailabilityData.slice(0, 10).map((item) => {
                const maxVal = stockAvailabilityData[0].stock || 1;
                const percent = (item.stock / maxVal) * 100;
                const isLow = item.stock < 10 && item.stock > 0;
                const isEmpty = item.stock <= 0;

                return (
                  <div key={item.id} className="space-y-3 group">
                    <div className="flex justify-between items-end">
                      <div className="min-w-0">
                        <p className="text-sm md:text-lg font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight group-hover:text-blue-500 transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm md:text-xl font-black ${isEmpty ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {item.stock} <span className="text-[10px] opacity-60 uppercase font-bold">{item.satuan}</span>
                        </p>
                      </div>
                    </div>
                    <div className="h-4 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden border border-slate-100 dark:border-white/10 p-1">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isEmpty ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]'}`}
                        style={{ width: `${Math.max(percent, isEmpty ? 0 : 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 text-center">
               <button className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] hover:opacity-70 active:scale-95 transition-all">Monitoring Database Lengkap</button>
            </div>
          </div>
        </div>

        {/* GRAFIK DISTRIBUSI PER KECAMATAN (ORANGE - SEMUA KECAMATAN) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <MapPin size={14} className="text-orange-500"/> Distribusi per Kecamatan
            </h3>
          </div>
          <div className="bg-orange-500 p-8 md:p-10 rounded-[3rem] text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group min-h-[500px] flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col h-full flex-1">
               <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Penyaluran</p>
                  <p className="text-4xl font-black uppercase tracking-tighter">{outbound.length} <span className="text-xs">Kali</span></p>
               </div>

               {/* Container Scrollable agar semua kecamatan bisa tampil tanpa merusak layout */}
               <div className="flex-1 space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {distributionByKecamatan.length > 0 ? distributionByKecamatan.map((d, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedKecName(d.name)}
                      className="w-full flex flex-col gap-2 group text-left active:scale-95 transition-all hover:bg-white/10 p-2 rounded-2xl"
                    >
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                        <span className="truncate max-w-[180px]">{d.name.replace('Kec. ', '')}</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">{d.value} Kali</span>
                      </div>
                      <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                          style={{ width: `${(d.value / maxDist) * 100}%` }}
                        ></div>
                      </div>
                    </button>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                      <MapPin size={48} className="mb-4" />
                      <p className="text-xs font-black uppercase tracking-[0.2em]">Belum Ada Data</p>
                    </div>
                  )}
               </div>

               <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80 animate-pulse">
                    <Info size={12}/> Klik baris untuk riwayat detail
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* STOK HABIS (MODERN CARD GRID) */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] px-4 flex items-center gap-2">
          <AlertOctagon size={16}/> Logistik Kosong (Peringatan Sistem)
        </h3>
        {outOfStockItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {outOfStockItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] border border-red-100 dark:border-red-900/10 shadow-sm hover:shadow-xl transition-all group active:scale-95 overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 text-red-500 opacity-5 group-hover:scale-125 transition-transform duration-700">
                  <Inbox size={120}/>
                </div>
                <div className="relative z-10 flex flex-col gap-5">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                      <Inbox size={24}/>
                    </div>
                    <div className="bg-red-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase shadow-lg shadow-red-500/20">
                      STOK HABIS
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase truncate tracking-tight">
                      {item.namaBarang}
                    </h4>
                    <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-1">
                      {item.code}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-slate-400">Status</span>
                    <span className="text-red-500">SEGERA ISI ULANG</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-500 p-12 rounded-[3rem] text-white text-center space-y-4 shadow-xl shadow-emerald-500/20">
             <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                <Package size={36}/>
             </div>
             <div>
                <p className="text-lg font-black uppercase tracking-widest">Logistik Tercukupi</p>
                <p className="text-[10px] font-medium opacity-70">Seluruh item inventaris tersedia di gudang penyimpanan.</p>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER DASHBOARD */}
      <div className="bg-slate-900 dark:bg-blue-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Sistem Monitoring Terpadu</h4>
            </div>
            <p className="text-xs opacity-60 font-medium max-w-sm mx-auto md:mx-0 leading-relaxed text-slate-300">
              Sinkronisasi data dilakukan secara otomatis. Laporan divalidasi oleh petugas gudang pada {new Date().toLocaleTimeString('id-ID')} WIB.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/10 px-8 py-6 rounded-[2rem] backdrop-blur-2xl border border-white/10 text-center min-w-[160px] shadow-2xl">
                <p className="text-[9px] font-black uppercase opacity-60 mb-1 tracking-widest">Total Sisa Unit</p>
                <p className="text-4xl font-black">
                  {stockAvailabilityData.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString('id-ID')}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* MODAL KECAMATAN */}
      {selectedKecName && (
        <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/90 backdrop-blur-xl z-[200] flex items-end md:items-center justify-center p-0 md:p-6 animate-in slide-in-from-bottom duration-300">
          <div className="bg-white dark:bg-surface-dark w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-[3rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border dark:border-white/5">
            <div className="p-8 border-b dark:border-white/5 flex items-center justify-between bg-orange-500 text-white shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                  <MapPin size={28}/>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedKecName}</h3>
                  <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Detail Penyaluran Logistik</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedKecName(null)}
                className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all active:scale-90"
              >
                <X size={28}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-10">
              {kecamatanDetails.length > 0 ? (
                <div className="space-y-8">
                  {kecamatanDetails.map((tx) => (
                    <div key={tx.id} className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-white/10 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History size={12}/> Waktu Transaksi
                          </p>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatIndoDate(tx.tanggal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penerima Bantuan</p>
                          <p className="text-sm font-black text-orange-600 italic uppercase truncate max-w-[200px]">{tx.penerima}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-white/10">
                            <tr>
                              <th className="pb-4">Nama Logistik</th>
                              <th className="pb-4 text-right">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {tx.items.map((item, idx) => {
                              const p = products.find(prod => prod.id === item.productId);
                              return (
                                <tr key={idx}>
                                  <td className="py-4">
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{p?.namaBarang || '-'}</p>
                                    <p className="text-[10px] font-mono text-slate-400 uppercase">{p?.kodeBarang || '-'}</p>
                                  </td>
                                  <td className="py-4 text-right">
                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{item.jumlah}</span>
                                    <span className="text-[10px] text-slate-400 ml-1 uppercase">{p?.satuan || 'Unit'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center opacity-20">
                  <p className="text-xl font-black uppercase tracking-[0.5em]">NIHIL</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 dark:bg-black/20 border-t dark:border-white/5 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedKecName(null)}
                className="w-full md:w-auto px-12 py-5 bg-slate-900 dark:bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
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
