
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
  LayoutGrid,
  X,
  ChevronRight,
  Search,
  History
} from 'lucide-react';
import { formatIndoDate } from '../types';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();
  const [selectedKecName, setSelectedKecName] = useState<string | null>(null);

  // 1. Kalkulasi Statistik Utama
  const stats = useMemo(() => {
    const jenisLogistik = products.length;
    const totalMasuk = inbound.reduce((acc, i) => acc + i.jumlah, 0);
    const totalKeluar = outbound.reduce((acc, tx) => 
      acc + tx.items.reduce((sum, item) => sum + item.jumlah, 0), 0
    );
    const barangKosong = products.filter(p => calculateStock(p.id) <= 0).length;

    return [
      { label: 'Jenis Logistik', value: jenisLogistik, icon: <Package size={20}/>, color: 'blue' },
      { label: 'Total Unit Masuk', value: totalMasuk, icon: <ArrowDownCircle size={20}/>, color: 'emerald' },
      { label: 'Total Unit Keluar', value: totalKeluar, icon: <ArrowUpCircle size={20}/>, color: 'orange' },
      { label: 'Barang Kosong', value: barangKosong, icon: <AlertOctagon size={20}/>, color: 'red' },
    ];
  }, [products, inbound, outbound, calculateStock]);

  // 2. Data Grafik Ketersediaan Stok (Utama - Lebih Besar)
  const stockAvailabilityData = useMemo(() => {
    return products
      .map(p => ({ 
        id: p.id,
        name: p.namaBarang, 
        stock: calculateStock(p.id),
        code: p.kodeBarang,
        satuan: p.satuan,
        harga: p.harga
      }))
      .sort((a, b) => b.stock - a.stock);
  }, [products, calculateStock]);

  // 3. Data Grafik Distribusi Per Kecamatan (Eksitrak "Kec. ")
  const distributionByKecamatan = useMemo(() => {
    const map = new Map<string, number>();
    
    outbound.forEach(tx => {
      const match = tx.alamat?.match(/(Kec\.\s+|Kecamatan\s+)([A-Za-z\s]+)/i);
      const kecName = match ? match[0].trim() : 'Lainnya';
      const totalQty = tx.items.reduce((sum, item) => sum + item.jumlah, 0);
      map.set(kecName, (map.get(kecName) || 0) + totalQty);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [outbound]);

  const maxDist = Math.max(...distributionByKecamatan.map(d => d.value), 1);

  // 4. Barang Stok Habis (Untuk Card)
  const outOfStockItems = useMemo(() => {
    return products.filter(p => calculateStock(p.id) <= 0);
  }, [products, calculateStock]);

  // 5. Data Transaksi Per Kecamatan (Untuk Modal Table)
  const kecamatanDetails = useMemo(() => {
    if (!selectedKecName) return [];
    return outbound.filter(tx => {
      const match = tx.alamat?.match(/(Kec\.\s+|Kecamatan\s+)([A-Za-z\s]+)/i);
      const name = match ? match[0].trim() : 'Lainnya';
      return name === selectedKecName;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [selectedKecName, outbound]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-24 md:pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
            Dashboard Utama
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">
            Sistem Pemantauan Logistik <span className="text-blue-600 dark:text-blue-400 font-bold">{settings.warehouseName}</span>.
          </p>
        </div>
        <div className="hidden md:flex bg-white dark:bg-white/5 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standalone Mode</span>
        </div>
      </div>

      {/* 4 Card Statistik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative active:scale-95 touch-manipulation">
            <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${s.color}-500/5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 relative z-10">
              <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 shrink-0`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1 truncate">
                  {s.label}
                </p>
                <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100">
                  {s.value.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRAFIK KETERSEDIAAN STOK (UTAMA - 8 Kolom) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={14}/> Grafik Ketersediaan Stok (Terbesar)
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="space-y-6">
              {stockAvailabilityData.slice(0, 8).map((item, i) => {
                const maxVal = stockAvailabilityData[0].stock || 1;
                const percent = (item.stock / maxVal) * 100;
                const isLow = item.stock < 10 && item.stock > 0;
                const isEmpty = item.stock <= 0;

                return (
                  <div key={item.id} className="space-y-2 group">
                    <div className="flex justify-between items-end">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight group-hover:text-blue-500 transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black ${isEmpty ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {item.stock} <span className="text-[10px] opacity-60 uppercase">{item.satuan}</span>
                        </p>
                        <p className="text-[9px] font-bold text-slate-400">Rp {(item.harga * item.stock).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden border border-slate-100 dark:border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isEmpty ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.max(percent, isEmpty ? 0 : 1)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            {stockAvailabilityData.length > 8 && (
              <div className="mt-8 text-center pt-4 border-t border-slate-50 dark:border-white/5">
                <button className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
                  Lihat Selengkapnya di Menu Stok
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GRAFIK DISTRIBUSI PER KECAMATAN (Kecil - 4 Kolom) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14}/> Distribusi (Kecamatan)
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm h-full min-h-[400px] flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-4 right-4 text-blue-500 opacity-20 pointer-events-none">
              <TrendingUp size={64}/>
            </div>
            {distributionByKecamatan.length > 0 ? (
              <div className="flex-1 flex flex-col gap-5 pt-4">
                {distributionByKecamatan.map((d, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedKecName(d.name)}
                    className="flex flex-col gap-1.5 group text-left active:scale-95 transition-all"
                  >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                      <span className="text-slate-500 group-hover:text-blue-600 transition-colors">{d.name}</span>
                      <span className="text-blue-500">{d.value} Unit</span>
                    </div>
                    <div className="h-4 w-full bg-slate-50 dark:bg-white/5 rounded-lg overflow-hidden border border-slate-100 dark:border-white/5 p-0.5">
                      <div 
                        className="h-full bg-blue-500 rounded-md transition-all duration-1000 group-hover:bg-blue-400"
                        style={{ width: `${(d.value / maxDist) * 100}%` }}
                      ></div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 italic gap-2 py-20">
                <p className="text-sm font-bold uppercase tracking-widest">Belum Ada Data</p>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-white/5 text-center">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-relaxed">
                Klik pada baris untuk<br/>lihat rincian bantuan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STOK HABIS (CARD GRID) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest px-2 flex items-center gap-2">
          <AlertOctagon size={16}/> Peringatan: Logistik Kosong
        </h3>
        {outOfStockItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {outOfStockItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-red-100 dark:border-red-900/10 shadow-sm hover:shadow-md transition-all group active:scale-95 overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 text-red-500/5 group-hover:scale-125 transition-transform duration-700">
                  <Inbox size={100}/>
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shadow-sm">
                      <Inbox size={24}/>
                    </div>
                    <div className="bg-red-500 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase shadow-lg shadow-red-500/20">
                      RESTOCK
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase truncate leading-tight">
                      {item.namaBarang}
                    </h4>
                    <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-1">
                      {item.kodeBarang}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Status Unit</span>
                    <span className="text-xs font-black text-red-500">KOSONG</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-900/10 rounded-[2.5rem] p-12 text-center space-y-3">
             <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <Package size={32}/>
             </div>
             <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Seluruh Logistik Aman Terkendali</p>
          </div>
        )}
      </div>

      {/* FOOTER OPERASIONAL */}
      <div className="bg-slate-900 dark:bg-blue-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Status Sistem Aktif</h4>
            </div>
            <p className="text-[11px] opacity-60 font-medium max-w-sm">Data sinkronisasi: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/10 dark:bg-black/20 px-6 py-4 rounded-3xl backdrop-blur-xl border border-white/10 text-center min-w-[150px]">
                <p className="text-[9px] font-black uppercase opacity-60 mb-1 tracking-widest">Aset Logistik</p>
                <p className="text-3xl font-black">
                  {stockAvailabilityData.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString('id-ID')}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL KECAMATAN (Table View) */}
      {selectedKecName && (
        <div className="fixed inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border dark:border-white/5 animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <MapPin size={24}/>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{selectedKecName}</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Rincian Distribusi Bantuan</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedKecName(null)}
                className="p-3 bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 rounded-2xl hover:bg-slate-200 transition-all active:scale-90"
              >
                <X size={24}/>
              </button>
            </div>

            {/* Modal Body (Table) */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8">
              {kecamatanDetails.length > 0 ? (
                <div className="space-y-6">
                  {kecamatanDetails.map((tx) => (
                    <div key={tx.id} className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <History size={10}/> Tanggal Penyerahan
                          </p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatIndoDate(tx.tanggal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Penerima</p>
                          <p className="text-xs font-black text-blue-600 dark:text-blue-400 italic uppercase truncate max-w-[150px]">{tx.penerima}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                            <tr>
                              <th className="pb-3 pr-4">Nama Barang</th>
                              <th className="pb-3 text-right">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {tx.items.map((item, idx) => {
                              const p = products.find(prod => prod.id === item.productId);
                              return (
                                <tr key={idx}>
                                  <td className="py-3 pr-4">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{p?.namaBarang || '-'}</p>
                                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">{p?.kodeBarang || '-'}</p>
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{item.jumlah}</span>
                                    <span className="text-[9px] text-slate-400 ml-1 uppercase">{p?.satuan || 'Unit'}</span>
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
                <div className="py-20 text-center opacity-30">
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Tidak Ada Data</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-t dark:border-white/5 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedKecName(null)}
                className="px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
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
