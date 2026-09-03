
import React, { useState, useMemo } from 'react';
import { useInventory } from '../App';
import { 
  Download, 
  Search, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Boxes, 
  Archive, 
  CheckCircle2, 
  PackageX,
  Info
} from 'lucide-react';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const StokBarang: React.FC = () => {
  const { products, calculateStock, settings } = useInventory();
  const [activeTab, setActiveTab] = useState<'stok' | 'arsip'>('stok');
  const [searchQuery, setSearchQuery] = useState('');

  // Perhitungan stok untuk semua barang
  const allStockList = useMemo(() => {
    return products.map(p => {
      const sisa = calculateStock(p.id);
      return {
        ...p,
        stokSaatIni: sisa,
        nilaiStok: sisa > 0 ? sisa * p.harga : 0
      };
    }).sort((a, b) => b.stokSaatIni - a.stokSaatIni);
  }, [products, calculateStock]);

  // 1. Menu Stok: Stok barang yang masih (> 0)
  const itemsWithStock = useMemo(() => {
    return allStockList.filter(s => s.stokSaatIni > 0);
  }, [allStockList]);

  // 2. Menu Arsip: Stok barang yang sudah 0 (kosong)
  const itemsEmptyStock = useMemo(() => {
    return allStockList.filter(s => s.stokSaatIni <= 0);
  }, [allStockList]);

  // Current list based on active tab
  const currentTabItems = activeTab === 'stok' ? itemsWithStock : itemsEmptyStock;

  // Filter pencarian
  const filteredStock = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentTabItems;
    return currentTabItems.filter(s => 
      s.namaBarang.toLowerCase().includes(q) || 
      s.kodeBarang.toLowerCase().includes(q) ||
      (s.kategori && s.kategori.toLowerCase().includes(q))
    );
  }, [currentTabItems, searchQuery]);

  const grandTotal = useMemo(() => {
    return filteredStock.reduce((acc, curr) => acc + curr.nilaiStok, 0);
  }, [filteredStock]);

  const totalUnits = useMemo(() => {
    return filteredStock.reduce((acc, curr) => acc + Math.max(0, curr.stokSaatIni), 0);
  }, [filteredStock]);

  const handleExportCSV = () => {
    const fileName = activeTab === 'stok' ? 'Laporan_Stok_Barang_Tersedia' : 'Laporan_Arsip_Stok_Kosong';
    const data = filteredStock.map(s => ({
      'KODE BARANG': s.kodeBarang,
      'NAMA BARANG': s.namaBarang,
      'KATEGORI': s.kategori || '-',
      'STATUS': s.stokSaatIni > 0 ? 'Tersedia' : 'Habis / Arsip',
      'STOK SAAT INI': s.stokSaatIni,
      'SATUAN': s.satuan,
      'HARGA SATUAN': s.harga,
      'TOTAL NILAI STOK': s.nilaiStok
    }));
    exportToCSV(data, fileName);
  };

  const handleExportPDF = () => {
    const title = activeTab === 'stok' 
      ? 'REKAPITULASI STOK BARANG (TERSEDIA)' 
      : 'REKAPITULASI ARSIP STOK BARANG (HABIS / KOSONG)';
      
    const columns = [
      { header: 'No', dataKey: 'no', align: 'center' as const },
      { header: 'Kode', dataKey: 'kodeBarang' },
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Status Stok', dataKey: 'stokSaatIni', align: 'center' as const, format: (v: any, row?: any) => {
        return v <= 0 ? `0 ${row?.satuan || ''} (HABIS)` : `${v} ${row?.satuan || ''}`;
      }},
      { header: 'Harga Satuan', dataKey: 'harga', align: 'right' as const, format: (v: any) => `Rp ${v.toLocaleString('id-ID')}` },
      { header: 'Total Nilai', dataKey: 'nilaiStok', align: 'right' as const, format: (v: any) => `Rp ${v.toLocaleString('id-ID')}` }
    ];
    
    const dataWithIndex = filteredStock.map((s, idx) => ({ ...s, no: idx + 1 }));
    
    generateReportPDF(
      title, 
      columns, 
      dataWithIndex, 
      settings, 
      activeTab === 'stok' 
        ? `Laporan daftar logistik yang memiliki ketersediaan stok aktif per ${new Date().toLocaleDateString('id-ID')}. Total aset tersimpan: Rp ${grandTotal.toLocaleString('id-ID')}.`
        : `Laporan daftar logistik yang ketersediaan stoknya telah mencapai 0 (habis terdistribusi) per ${new Date().toLocaleDateString('id-ID')}.`,
      activeTab === 'stok' ? {
        label: 'TOTAL NILAI ASET TERSEDIA',
        value: `Rp ${grandTotal.toLocaleString('id-ID')}`
      } : {
        label: 'TOTAL ITEM ARSIP KOSONG',
        value: `${filteredStock.length} Item`
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Stok Barang</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Monitoring ketersediaan stok logistik aktif dan arsip stok barang habis.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF} 
            className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 sm:px-5 py-2 rounded-ios flex items-center gap-2 font-bold shadow-sm hover:bg-red-100 transition-all active:scale-95 text-xs cursor-pointer"
          >
            <FileText size={18}/> Export PDF {activeTab === 'stok' ? '(Stok)' : '(Arsip)'}
          </button>
          <button 
            onClick={handleExportCSV} 
            className="bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 sm:px-5 py-2 rounded-ios flex items-center gap-2 font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-xs cursor-pointer"
          >
            <Download size={18}/> Export CSV
          </button>
        </div>
      </div>

      {/* MENU NAVIGASI DI ATAS: 1. Menu Stok & 2. Menu Arsip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
          {/* 1. Menu Stok (Barang yg masih) */}
          <button
            onClick={() => setActiveTab('stok')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'stok'
                ? 'bg-[#3b5bfd] text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Boxes size={17} />
            <span>Menu Stok</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold transition-colors ${
              activeTab === 'stok' 
                ? 'bg-white/20 text-white' 
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              {itemsWithStock.length}
            </span>
          </button>

          {/* 2. Menu Arsip (Barang yg sudah 0/kosong) */}
          <button
            onClick={() => setActiveTab('arsip')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'arsip'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Archive size={17} />
            <span>Menu Arsip</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold transition-colors ${
              activeTab === 'arsip' 
                ? 'bg-white/20 text-white' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {itemsEmptyStock.length}
            </span>
          </button>
        </div>

        {/* Tab Description Tag */}
        <div className="text-xs font-bold px-3 py-1 flex items-center justify-center sm:justify-end gap-2">
          {activeTab === 'stok' ? (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Stok Masih Tersedia ({itemsWithStock.length} Barang)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Stok Sudah 0 / Kosong ({itemsEmptyStock.length} Barang)
            </span>
          )}
        </div>
      </div>

      {/* Konten Tab Stok / Arsip */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-ios-lg shadow-sm border border-white/80 dark:border-white/10 overflow-hidden theme-transition w-full">
        {/* Metric Bar & Search Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {activeTab === 'stok' ? (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-ios border border-blue-500/20">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Total Nilai Aset Tersedia
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/10" />

              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Total Logistik Fisik
                </p>
                <p className="text-base font-black text-blue-600 dark:text-blue-400">
                  {totalUnits.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-400">Unit</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-ios border border-rose-500/20">
                  <Archive size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Total Barang di Arsip
                  </p>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {itemsEmptyStock.length} <span className="text-xs font-semibold text-slate-400">Barang Habis (Stok 0)</span>
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/10" />

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                Barang yang terdaftar di sini otomatis kembali ke <strong>Menu Stok</strong> jika ada transaksi barang masuk baru.
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative group flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-ios-blue-light transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'stok' ? "Cari stok barang tersedia berdasarkan nama atau kode..." : "Cari barang di arsip stok kosong..."} 
              className="w-full pl-12 pr-6 py-2.5 bg-slate-100/80 dark:bg-white/5 border-none rounded-full outline-none text-sm transition-all font-medium dark:text-slate-200"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-full">
            <thead className="bg-slate-50/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wide border-b dark:border-white/5">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 w-[5%] text-center">No</th>
                <th className="px-4 sm:px-6 py-3.5 w-[15%]">Kode</th>
                <th className="px-4 sm:px-6 py-3.5 w-[32%]">Nama Barang</th>
                <th className="px-4 sm:px-6 py-3.5 w-[16%] text-center">
                  {activeTab === 'stok' ? 'Stok Tersedia' : 'Status Stok'}
                </th>
                <th className="px-4 sm:px-6 py-3.5 w-[16%]">Harga Satuan</th>
                <th className="px-4 sm:px-6 py-3.5 w-[16%]">Total Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                        {activeTab === 'stok' ? <Boxes size={26}/> : <CheckCircle2 size={26} className="text-emerald-500"/>}
                      </div>
                      <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                        {searchQuery 
                          ? `Tidak ditemukan barang "${searchQuery}" pada ${activeTab === 'stok' ? 'Menu Stok' : 'Menu Arsip'}`
                          : activeTab === 'stok'
                            ? 'Belum ada barang dengan ketersediaan stok (> 0).'
                            : 'Arsip Kosong! Seluruh barang saat ini masih memiliki ketersediaan stok.'
                        }
                      </p>
                      <p className="text-xs text-slate-400">
                        {activeTab === 'stok'
                          ? 'Jika semua barang habis, Anda dapat mengecek logistik lama di Menu Arsip atau menambahkan transaksi Barang Masuk.'
                          : 'Barang yang stoknya telah habis terdistribusi (stok = 0) akan otomatis dipindahkan ke tab arsip ini.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStock.map((s, idx) => (
                  <tr 
                    key={s.id} 
                    className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                      s.stokSaatIni <= 0 ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="px-4 sm:px-6 py-4 text-center font-bold text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-mono font-bold text-ios-blue-light dark:text-ios-blue-dark">
                      {s.kodeBarang}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{s.namaBarang}</p>
                      {s.kategori && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {s.kategori}
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase flex items-center gap-1.5 w-fit border ${
                          s.stokSaatIni <= 0 
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-500/20' 
                            : s.stokSaatIni < 5 
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/30' 
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30'
                        }`}>
                          {s.stokSaatIni <= 0 ? (
                            <>
                              <Archive size={12}/>
                              0 {s.satuan} (HABIS)
                            </>
                          ) : (
                            <>
                              {s.stokSaatIni < 5 && <AlertTriangle size={12}/>}
                              {s.stokSaatIni.toLocaleString('id-ID')} {s.satuan}
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400 font-bold">
                      Rp {s.harga.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-black text-slate-900 dark:text-slate-100">
                      {s.stokSaatIni > 0 ? (
                        `Rp ${s.nilaiStok.toLocaleString('id-ID')}`
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold italic">Rp 0 (Habis)</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Petunjuk Bawah */}
      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 flex items-start sm:items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
        <Info size={18} className="shrink-0 text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed font-medium">
          <strong>Keterangan:</strong> <strong>Menu Stok</strong> menampilkan barang logistik yang masih tersedia (stok &gt; 0). Sedangkan <strong>Menu Arsip</strong> mencatat seluruh barang yang stoknya telah habis mencapai 0 sehingga pemantauan ketersediaan logistik gudang tetap rapi dan akurat.
        </p>
      </div>
    </div>
  );
};

export default StokBarang;
