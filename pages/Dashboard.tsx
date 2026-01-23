
import React, { useMemo } from 'react';
import { useInventory } from '../App';
import { 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlertOctagon,
  BarChart3,
  MapPin,
  Box,
  ChevronRight,
  Inbox,
  TrendingUp
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();

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

  // 2. Data Grafik Ketersediaan Stok (Tampilkan Semua atau Top 10)
  const stockAvailabilityData = useMemo(() => {
    return products
      .map(p => ({ 
        name: p.namaBarang, 
        stock: calculateStock(p.id),
        code: p.kodeBarang
      }))
      .sort((a, b) => b.stock - a.stock);
  }, [products, calculateStock]);

  // 3. Data Grafik Distribusi Bantuan Per Kecamatan (Berdasarkan Alamat/Tujuan)
  const distributionByKecamatan = useMemo(() => {
    const map = new Map<string, number>();
    
    outbound.forEach(tx => {
      const destination = tx.alamat?.trim() || 'Tidak Diketahui';
      const totalQty = tx.items.reduce((sum, item) => sum + item.jumlah, 0);
      map.set(destination, (map.get(destination) || 0) + totalQty);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Ambil Top 8 Kecamatan/Tujuan
  }, [outbound]);

  const maxDist = Math.max(...distributionByKecamatan.map(d => d.value), 1);

  // 4. Barang Stok Habis
  const outOfStockItems = useMemo(() => {
    return products.filter(p => calculateStock(p.id) <= 0);
  }, [products, calculateStock]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
            Ringkasan Inventaris
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Sistem Pemantauan Logistik <span className="text-blue-600 dark:text-blue-400 font-bold">{settings.warehouseName}</span>.
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Realtime</span>
        </div>
      </div>

      {/* Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${s.color}-500/5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                  {s.label}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {s.value.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAFIK DISTRIBUSI BANTUAN PERKECAMATAN */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16}/> Distribusi Bantuan Per Kecamatan / Tujuan
            </h3>
          </div>
          <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[350px] flex flex-col justify-between">
            {distributionByKecamatan.length > 0 ? (
              <div className="flex-1 flex items-end justify-around gap-4 pt-10">
                {distributionByKecamatan.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end">
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold pointer-events-none z-20 whitespace-nowrap shadow-xl">
                      {d.value} Unit
                    </div>
                    <div 
                      className="w-full max-w-[50px] bg-blue-500 rounded-t-xl transition-all duration-1000 group-hover:bg-blue-400 cursor-pointer shadow-lg group-hover:shadow-blue-500/20"
                      style={{ height: `${(d.value / maxDist) * 100}%`, minHeight: '8px' }}
                    ></div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter text-center h-8 leading-tight">
                      {d.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 italic gap-2">
                <TrendingUp size={48} className="opacity-20"/>
                <p className="text-sm font-bold">Belum ada data distribusi.</p>
              </div>
            )}
          </div>
        </div>

        {/* GRAFIK KETERSEDIAAN STOK */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
            <BarChart3 size={16}/> Grafik Ketersediaan Stok
          </h3>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm space-y-5 max-h-[350px] overflow-y-auto scrollbar-hide">
            {stockAvailabilityData.length > 0 ? stockAvailabilityData.map((item, i) => {
              const maxVal = stockAvailabilityData[0].stock || 1;
              const percent = (item.stock / maxVal) * 100;
              const isLow = item.stock < 10 && item.stock > 0;
              const isEmpty = item.stock <= 0;

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[180px]">{item.name}</span>
                    <span className={isEmpty ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-blue-600 dark:text-blue-400'}>
                      {item.stock} Unit
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isEmpty ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center text-slate-300 dark:text-slate-700 italic text-sm font-bold">
                Belum ada data barang.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STOK HABIS */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest px-2 flex items-center gap-2">
          <AlertOctagon size={16}/> Stok Habis (Segera Restock)
        </h3>
        <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-red-100 dark:border-red-900/10 shadow-sm overflow-hidden">
          {outOfStockItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/5">
              {outOfStockItems.map(item => (
                <div key={item.id} className="p-6 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Inbox size={22}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{item.namaBarang}</p>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">{item.kodeBarang}</p>
                    </div>
                  </div>
                  <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-lg shadow-red-500/20">
                    Kosong
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Box size={32}/>
              </div>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Semua Stok Aman & Tersedia</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-900 dark:bg-blue-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-2xl font-black uppercase tracking-tight leading-none">Status Operasional</h4>
            <p className="text-sm opacity-70 font-medium">Logistik terus dipantau dan diperbarui secara otomatis melalui cloud sync.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-md border border-white/5">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Unit</p>
              <p className="text-2xl font-black">
                {stockAvailabilityData.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
