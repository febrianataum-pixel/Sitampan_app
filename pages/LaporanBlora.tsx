import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../App';
import { 
  FileText, 
  Calendar, 
  Download, 
  MapPin, 
  TrendingUp, 
  Package,
  ChevronRight,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
  User,
  Clock,
  Eye,
  EyeOff,
  Search,
  RotateCcw,
  Check
} from 'lucide-react';
import { MONTHS, formatIndoDate } from '../types';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const LaporanBlora: React.FC = () => {
  const { products, inbound, outbound, settings, calculateStock } = useInventory();
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // State for selected product details for sebaran modal
  const [selectedProductDetails, setSelectedProductDetails] = useState<{ id: string; name: string; code: string; unit: string; price: number } | null>(null);
  const [modalTab, setModalTab] = useState<'current' | 'all'>('current');

  // Filter data berdasarkan periode yang dipilih
  const filteredInbound = useMemo(() => {
    return inbound.filter(entry => {
      if (!entry.tanggal) return false;
      const entryDate = new Date(entry.tanggal);
      if (reportType === 'monthly') {
        return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
      } else {
        return entryDate.getFullYear() === selectedYear;
      }
    });
  }, [inbound, reportType, selectedMonth, selectedYear]);

  const filteredOutbound = useMemo(() => {
    return outbound.filter(tx => {
      if (!tx.tanggal) return false;
      const txDate = new Date(tx.tanggal);
      if (reportType === 'monthly') {
        return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
      } else {
        return txDate.getFullYear() === selectedYear;
      }
    });
  }, [outbound, reportType, selectedMonth, selectedYear]);

  // Rekap jumlah masuk, keluar, sisa per jenis barang (semua barang pada periode ini)
  const allSummaryItems = useMemo(() => {
    return products.map(product => {
      // Calculate inbound for this product in current filtered period
      const totalIn = filteredInbound
        .filter(entry => entry.productId === product.id)
        .reduce((sum, entry) => sum + entry.jumlah, 0);

      // Calculate outbound for this product in current filtered period
      const totalOut = filteredOutbound.reduce((sum, tx) => {
        const matchItem = tx.items.find(item => item.productId === product.id);
        return sum + (matchItem ? matchItem.jumlah : 0);
      }, 0);

      // Remaining stock of product as of now
      const sisa = calculateStock(product.id);

      return {
        id: product.id,
        namaBarang: product.namaBarang,
        kodeBarang: product.kodeBarang,
        satuan: product.satuan,
        hargaSatuan: product.harga,
        jumlahMasuk: totalIn,
        jumlahKeluar: totalOut,
        sisaBarang: sisa,
        totalHargaSisa: sisa * product.harga
      };
    })
    // Tampilkan barang yang memiliki transaksi masuk, keluar, atau memiliki sisa stok > 0
    .filter(item => item.jumlahMasuk > 0 || item.jumlahKeluar > 0 || item.sisaBarang > 0)
    .sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  }, [products, filteredInbound, filteredOutbound, calculateStock]);

  // State ID barang yang disembunyikan (Hide)
  const [hiddenProductIds, setHiddenProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sitampan_laporan_hidden_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Simpan preferensi hidden products ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sitampan_laporan_hidden_products', JSON.stringify(hiddenProductIds));
    } catch {}
  }, [hiddenProductIds]);

  // Daftar barang aktif yang ditampilkan (Show)
  const summaryItems = useMemo(() => {
    return allSummaryItems.filter(item => !hiddenProductIds.includes(item.id));
  }, [allSummaryItems, hiddenProductIds]);

  // Daftar barang yang sedang disembunyikan (Hide)
  const hiddenItems = useMemo(() => {
    return allSummaryItems.filter(item => hiddenProductIds.includes(item.id));
  }, [allSummaryItems, hiddenProductIds]);

  // Tab tampilan tabel: 'visible' (Ditampilkan) atau 'hidden' (Disembunyikan)
  const [tableTab, setTableTab] = useState<'visible' | 'hidden'>('visible');
  // Modal kelola Hide / Show
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  // Pencarian pada modal kelola
  const [searchManageTerm, setSearchManageTerm] = useState('');

  // Aksi toggle, hide, show
  const hideProduct = (id: string) => {
    setHiddenProductIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const showProduct = (id: string) => {
    setHiddenProductIds(prev => prev.filter(pId => pId !== id));
  };

  const toggleHideProduct = (id: string) => {
    setHiddenProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const showAllProducts = () => {
    setHiddenProductIds([]);
  };

  const hideAllProducts = () => {
    setHiddenProductIds(allSummaryItems.map(item => item.id));
  };

  // Filter barang pada modal kelola
  const filteredManageProducts = useMemo(() => {
    if (!searchManageTerm.trim()) return allSummaryItems;
    const term = searchManageTerm.toLowerCase();
    return allSummaryItems.filter(p => 
      p.namaBarang.toLowerCase().includes(term) || 
      p.kodeBarang.toLowerCase().includes(term)
    );
  }, [allSummaryItems, searchManageTerm]);

  // Item yang sedang aktif di tabel utama
  const currentTableItems = tableTab === 'visible' ? summaryItems : hiddenItems;

  // Sebaran pada periode terpilih (aktif)
  const productDistributionPeriod = useMemo(() => {
    if (!selectedProductDetails) return [];
    return filteredOutbound
      .filter(tx => tx.items.some(item => item.productId === selectedProductDetails.id))
      .map(tx => {
        const matchItem = tx.items.find(item => item.productId === selectedProductDetails.id);
        return {
          id: tx.id,
          penerima: tx.penerima,
          tanggal: tx.tanggal,
          alamat: tx.alamat,
          jumlah: matchItem ? matchItem.jumlah : 0,
          jenisBencana: tx.jenisBencana || '',
          subJenisBencana: tx.subJenisBencana || '',
          keterangan: tx.keteranganBencana || ''
        };
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [selectedProductDetails, filteredOutbound]);

  // Semua histori pengeluaran barang ini (tanpa filter tanggal)
  const productDistributionAllTime = useMemo(() => {
    if (!selectedProductDetails) return [];
    return outbound
      .filter(tx => tx.items.some(item => item.productId === selectedProductDetails.id))
      .map(tx => {
        const matchItem = tx.items.find(item => item.productId === selectedProductDetails.id);
        return {
          id: tx.id,
          penerima: tx.penerima,
          tanggal: tx.tanggal,
          alamat: tx.alamat,
          jumlah: matchItem ? matchItem.jumlah : 0,
          jenisBencana: tx.jenisBencana || '',
          subJenisBencana: tx.subJenisBencana || '',
          keterangan: tx.keteranganBencana || ''
        };
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [selectedProductDetails, outbound]);

  const totalInbound = summaryItems.reduce((acc, curr) => acc + curr.jumlahMasuk, 0);
  const totalOutbound = summaryItems.reduce((acc, curr) => acc + curr.jumlahKeluar, 0);
  const totalSisa = summaryItems.reduce((acc, curr) => acc + curr.sisaBarang, 0);
  const totalValuation = summaryItems.reduce((acc, curr) => acc + curr.totalHargaSisa, 0);

  const getFullNarrative = () => {
    const period = reportType === 'monthly' ? `${MONTHS[selectedMonth]} ${selectedYear}` : `Tahun ${selectedYear}`;
    return `Berdasarkan data pencatatan logistik pada sistem SITAMPAN (SISTEM TANGGAP PEMANTAUAN LOGISTIK KEBENCANAAN), berikut disampaikan laporan rekapitulasi inventory barang untuk periode ${period}. Laporan ini menjabarkan rincian jenis barang, jumlah barang masuk, barang keluar, serta sisa sediaan nyata (stok akhir) yang tersedia di gudang.`;
  };

  const handleExportPDF = () => {
    const title = reportType === 'monthly' 
      ? `REKAPITULASI LOGISTIK - ${MONTHS[selectedMonth].toUpperCase()} ${selectedYear}`
      : `REKAPITULASI LOGISTIK - TAHUN ${selectedYear}`;

    const columns = [
      { header: 'Jenis Barang', dataKey: 'namaBarang' },
      { 
        header: 'Jumlah Masuk', 
        dataKey: 'jumlahMasuk', 
        align: 'center' as const, 
        format: (v: number, row: any) => `${v.toLocaleString('id-ID')} ${row.satuan || ''}` 
      },
      { 
        header: 'Jumlah Keluar', 
        dataKey: 'jumlahKeluar', 
        align: 'center' as const, 
        format: (v: number, row: any) => `${v.toLocaleString('id-ID')} ${row.satuan || ''}` 
      },
      { 
        header: 'Sisa Barang', 
        dataKey: 'sisaBarang', 
        align: 'center' as const, 
        format: (v: number, row: any) => `${v.toLocaleString('id-ID')} ${row.satuan || ''}` 
      }
    ];

    generateReportPDF(
      title, 
      columns, 
      summaryItems, 
      settings, 
      getFullNarrative(),
      { label: 'REKAP NILAI SISA BARANG', value: `Rp ${totalValuation.toLocaleString('id-ID')}` }
    );
  };

  const handleExportCSV = () => {
    const filename = reportType === 'monthly'
      ? `Laporan_Stok_Logistik_${MONTHS[selectedMonth]}_${selectedYear}`
      : `Laporan_Stok_Logistik_Tahun_${selectedYear}`;
    
    const data = summaryItems.map(item => ({
      'KODE BARANG': item.kodeBarang,
      'JENIS BARANG': item.namaBarang,
      'JUMLAH MASUK': item.jumlahMasuk,
      'JUMLAH KELUAR': item.jumlahKeluar,
      'SISA BARANG': item.sisaBarang,
      'SATUAN': item.satuan,
      'HARGA SATUAN': item.hargaSatuan,
      'NILAI SISA': item.totalHargaSisa
    }));

    exportToCSV(data, filename);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-ios-blue-light text-white rounded-lg shadow-sm">
              <FileText size={16}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Laporan Rekapitulasi Barang</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Rekapitulasi aktivitas jumlah masuk, jumlah keluar, dan sisa stok barang.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsManageModalOpen(true)}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2.5 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm transition-all active:scale-95 text-xs cursor-pointer"
            title="Buka menu pengaturan Hide / Show barang"
          >
            {hiddenItems.length > 0 ? (
              <>
                <EyeOff size={16} className="text-amber-400 shrink-0" />
                <span>Hide / Show</span>
                <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {hiddenItems.length} Hide
                </span>
              </>
            ) : (
              <>
                <Eye size={16} className="shrink-0" />
                <span>Hide / Show Barang</span>
              </>
            )}
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm transition-all active:scale-95 text-xs cursor-pointer"
          >
            <Download size={16}/> PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 text-xs cursor-pointer"
          >
            <FileText size={16}/> CSV
          </button>
        </div>
      </div>

      {/* Formal Narrative Section */}
      <div className="bg-white dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm theme-transition">
        <div className="flex items-start gap-4">
          <div className="w-1 h-12 bg-ios-blue-light dark:bg-ios-blue-dark rounded-full shrink-0 mt-1"></div>
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-ios-blue-light dark:text-ios-blue-dark uppercase tracking-[0.2em]">Pernyataan Resmi Laporan</h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
              <p>
                "Berdasarkan data pencatatan logistik pada sistem inovasi <span className="font-bold text-slate-900 dark:text-white">SITAMPAN (SISTEM TANGGAP PEMANTAUAN LOGISTIK KEBENCANAAN)</span>, 
                berikut disampaikan laporan rekapitulasi data barang logistik untuk wilayah kerja gudang untuk periode 
                <span className="text-ios-blue-light dark:text-ios-blue-dark font-bold"> {reportType === 'monthly' ? `${MONTHS[selectedMonth]} ${selectedYear}` : `Tahun ${selectedYear}`}</span>. 
                Laporan ini mendokumentasikan rincian Jenis Barang, statistik transaksi masuk & keluar, beserta sisa nyata persediaan barang saat ini."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-4 sm:p-6 rounded-ios-lg border border-white/80 dark:border-white/10 shadow-sm space-y-6 w-full">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Filter size={12}/> Jenis Laporan
            </label>
            <div className="flex p-1 bg-slate-100/80 dark:bg-white/5 rounded-ios gap-1">
              <button 
                onClick={() => setReportType('monthly')}
                className={`flex-1 py-2 text-xs font-bold rounded-ios transition-all ${reportType === 'monthly' ? 'bg-white dark:bg-ios-secondary-dark shadow-sm text-ios-blue-light dark:text-ios-blue-dark' : 'text-slate-500'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setReportType('yearly')}
                className={`flex-1 py-2 text-xs font-bold rounded-ios transition-all ${reportType === 'yearly' ? 'bg-white dark:bg-ios-secondary-dark shadow-sm text-ios-blue-light dark:text-ios-blue-dark' : 'text-slate-500'}`}
              >
                Tahunan
              </button>
            </div>
          </div>

          <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportType === 'monthly' && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar size={12}/> Pilih Bulan
                </label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 px-4 py-2.5 rounded-ios font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={12}/> Pilih Tahun
              </label>
              <input 
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 px-4 py-2.5 rounded-ios font-bold text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        <div className="bg-emerald-500 p-6 rounded-ios-lg text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <ArrowDownCircle size={120}/>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Barang Masuk</p>
            <p className="text-3xl font-black">{totalInbound.toLocaleString('id-ID')} <span className="text-xs font-medium">Unit</span></p>
            <p className="text-[10px] mt-2 font-medium opacity-85">Transaksi Masuk Periode Ini</p>
          </div>
        </div>

        <div className="bg-rose-500 p-6 rounded-ios-lg text-white shadow-lg shadow-rose-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <ArrowUpCircle size={120}/>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Barang Keluar</p>
            <p className="text-3xl font-black">{totalOutbound.toLocaleString('id-ID')} <span className="text-xs font-medium">Unit</span></p>
            <p className="text-[10px] mt-2 font-medium opacity-85">Transaksi Keluar Periode Ini</p>
          </div>
        </div>

        <div className="bg-ios-blue-light dark:bg-ios-blue-dark p-6 rounded-ios-lg text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Package size={120}/>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Sisa Barang</p>
            <p className="text-3xl font-black">{totalSisa.toLocaleString('id-ID')} <span className="text-xs font-medium">Unit</span></p>
            <p className="text-[10px] mt-2 font-medium opacity-85">Stok Sedia Saat Ini</p>
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-6 rounded-ios-lg border border-white/80 dark:border-white/10 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Nilai Sisa</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">Rp {totalValuation.toLocaleString('id-ID')}</p>
          <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">Valuasi Sisa Barang</p>
        </div>
      </div>

      {/* Hidden Items Notice Banner */}
      {hiddenItems.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-ios-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-amber-900 dark:text-amber-200">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-ios shrink-0">
              <EyeOff size={18} />
            </div>
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">
                {hiddenItems.length} jenis barang sedang disembunyikan (Hide)
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 mt-0.5">
                Barang yang disembunyikan tidak dihitung dalam ringkasan statistik dan tidak dimasukkan ke dalam cetakan PDF / ekspor CSV.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={showAllProducts}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-ios text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RotateCcw size={13} /> Tampilkan Semua (Show All)
            </button>
            <button
              onClick={() => setTableTab(tableTab === 'visible' ? 'hidden' : 'visible')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 font-bold rounded-ios text-xs flex items-center justify-center gap-1.5 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              {tableTab === 'visible' ? (
                <>
                  <EyeOff size={13} /> Lihat Daftar Tersembunyi ({hiddenItems.length})
                </>
              ) : (
                <>
                  <Eye size={13} /> Lihat Barang Aktif ({summaryItems.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-ios-lg shadow-sm border border-white/80 dark:border-white/10 overflow-hidden w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Tabs Filter Tampilan: Ditampilkan vs Disembunyikan */}
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-100/80 dark:bg-white/5 rounded-ios border border-slate-200/60 dark:border-white/5">
              <button
                onClick={() => setTableTab('visible')}
                className={`px-3.5 py-1.5 rounded-ios text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  tableTab === 'visible'
                    ? 'bg-white dark:bg-ios-secondary-dark text-ios-blue-light dark:text-ios-blue-dark shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Eye size={13} />
                <span>Ditampilkan ({summaryItems.length})</span>
              </button>
              <button
                onClick={() => setTableTab('hidden')}
                className={`px-3.5 py-1.5 rounded-ios text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  tableTab === 'hidden'
                    ? 'bg-white dark:bg-ios-secondary-dark text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <EyeOff size={13} />
                <span>Disembunyikan / Hide ({hiddenItems.length})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {hiddenItems.length > 0 && (
              <button
                onClick={showAllProducts}
                className="text-xs font-bold text-ios-blue-light dark:text-ios-blue-dark hover:underline flex items-center gap-1 cursor-pointer"
                title="Tampilkan semua barang yang tersembunyi"
              >
                <RotateCcw size={12} /> Tampilkan Semua
              </button>
            )}
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-ios font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Filter size={13} /> Kelola Hide & Show
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-full">
            <thead className="bg-slate-50/70 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-white/5">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 w-[30%]">Jenis Barang</th>
                <th className="px-4 sm:px-6 py-3.5 text-center w-[14%]">Jumlah Masuk</th>
                <th className="px-4 sm:px-6 py-3.5 text-center w-[14%]">Jumlah Keluar</th>
                <th className="px-4 sm:px-6 py-3.5 text-center w-[14%]">Sisa Barang</th>
                <th className="px-4 sm:px-6 py-3.5 text-right w-[15%]">Nilai Sisa</th>
                <th className="px-4 sm:px-6 py-3.5 text-center w-[13%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {currentTableItems.length > 0 ? currentTableItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group/cell"
                    onClick={() => setSelectedProductDetails({ id: item.id, name: item.namaBarang, code: item.kodeBarang, unit: item.satuan, price: item.hargaSatuan })}
                    title="Klik untuk melihat sebaran distribusi barang ini"
                  >
                    <div className="flex items-center gap-2">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200 group-hover/cell:text-ios-blue-light dark:group-hover/cell:text-blue-400 transition-colors flex items-center gap-2">
                          {item.namaBarang}
                          <span className="text-[9px] bg-ios-blue-light/10 dark:bg-blue-500/10 text-ios-blue-light dark:text-blue-400 font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 group-hover/cell:scale-100 opacity-60 group-hover/cell:opacity-100 transition-all">
                            Sebaran ➔
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{item.kodeBarang}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <ArrowDownCircle size={14} className="opacity-70 shrink-0" />
                      {item.jumlahMasuk.toLocaleString('id-ID')} <span className="text-[10px] font-medium opacity-60 uppercase">{item.satuan}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm">
                      <ArrowUpCircle size={14} className="opacity-70 shrink-0" />
                      {item.jumlahKeluar.toLocaleString('id-ID')} <span className="text-[10px] font-medium opacity-60 uppercase">{item.satuan}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 text-ios-blue-light dark:text-ios-blue-dark font-bold text-sm">
                      <Package size={14} className="opacity-70 shrink-0" />
                      {item.sisaBarang.toLocaleString('id-ID')} <span className="text-[10px] font-bold opacity-60 uppercase">{item.satuan}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Rp {item.totalHargaSisa.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Rp {item.hargaSatuan.toLocaleString('id-ID')}/unit</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {tableTab === 'visible' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          hideProduct(item.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ios bg-slate-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 border border-slate-200/50 dark:border-white/5"
                        title="Sembunyikan (Hide) barang ini dari laporan"
                      >
                        <EyeOff size={13} className="shrink-0 text-slate-400 group-hover:text-rose-500" />
                        <span>Hide</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showProduct(item.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ios bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 border border-emerald-300/40 dark:border-emerald-700/40"
                        title="Tampilkan kembali (Show) barang ini ke laporan"
                      >
                        <Eye size={13} className="shrink-0" />
                        <span>Show</span>
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      {tableTab === 'visible' && hiddenItems.length > 0 ? (
                        <>
                          <EyeOff size={40} className="mb-3 text-amber-500 opacity-60" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Semua barang ({hiddenItems.length}) sedang disembunyikan (Hide)
                          </p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            Tidak ada barang yang aktif di laporan. Klik tombol di bawah untuk menampilkan kembali semua barang.
                          </p>
                          <button
                            onClick={showAllProducts}
                            className="mt-4 px-4 py-2 bg-ios-blue-light text-white rounded-ios font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-blue-600 transition-all cursor-pointer"
                          >
                            <Eye size={14} /> Tampilkan Semua Barang (Show All)
                          </button>
                        </>
                      ) : tableTab === 'hidden' ? (
                        <>
                          <Eye size={40} className="mb-3 text-emerald-500 opacity-60" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Tidak Ada Barang yang Disembunyikan
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Semua {allSummaryItems.length} jenis barang sedang ditampilkan pada laporan rekapitulasi.
                          </p>
                          <button
                            onClick={() => setTableTab('visible')}
                            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-ios font-bold text-xs flex items-center gap-2 hover:bg-slate-200 transition-all cursor-pointer"
                          >
                            Lihat Barang Ditampilkan
                          </button>
                        </>
                      ) : (
                        <>
                          <Package size={44} className="mb-3 text-slate-400 opacity-30" />
                          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Tidak Ada Data Logistik</p>
                          <p className="text-xs text-slate-400 mt-1">Silakan pilih periode lain atau tambahkan data barang baru.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {currentTableItems.length > 0 && (
              <tfoot className="bg-slate-50/80 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 font-bold text-xs text-slate-800 dark:text-slate-200">
                <tr>
                  <td className="px-6 py-3 uppercase tracking-wider text-[11px] text-slate-500">
                    Total ({currentTableItems.length} Barang {tableTab === 'visible' ? 'Ditampilkan' : 'Disembunyikan'})
                  </td>
                  <td className="px-6 py-3 text-center text-emerald-600 dark:text-emerald-400 font-mono">
                    {currentTableItems.reduce((acc, curr) => acc + curr.jumlahMasuk, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-3 text-center text-rose-600 dark:text-rose-400 font-mono">
                    {currentTableItems.reduce((acc, curr) => acc + curr.jumlahKeluar, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-3 text-center text-ios-blue-light dark:text-ios-blue-dark font-mono">
                    {currentTableItems.reduce((acc, curr) => acc + curr.sisaBarang, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-3 text-right font-black">
                    Rp {currentTableItems.reduce((acc, curr) => acc + curr.totalHargaSisa, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {tableTab === 'visible' && hiddenItems.length > 0 && (
                      <button
                        onClick={showAllProducts}
                        className="text-[10px] text-ios-blue-light dark:text-ios-blue-dark hover:underline font-bold"
                      >
                        Reset Show
                      </button>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-6 bg-blue-50 dark:bg-blue-950/10 rounded-ios-lg border border-blue-100 dark:border-blue-900/20 flex gap-4">
        <div className="w-10 h-10 bg-ios-blue-light text-white rounded-ios flex items-center justify-center shrink-0">
          <TrendingUp size={20}/>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-tight">Informasi Stok Akhir</p>
          <p className="text-[11px] text-blue-700/70 dark:text-blue-400/60 leading-relaxed">
            Laporan rekapitulasi data barang di atas memetakan detail sediaan fisik logistik gudang. Sisa barang (stok aktual) ditarik berdasarkan perhitungan total barang masuk dikurangi total barang keluar secara terus-menerus.
          </p>
        </div>
      </div>

      {/* Sebaran Distribution Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 rounded-ios-lg shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col scale-in animate-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <span className="text-[10px] bg-ios-blue-light/10 dark:bg-blue-500/10 text-ios-blue-light dark:text-blue-400 font-black px-2.5 py-1 rounded uppercase tracking-wider">
                  Sebaran Penyaluran Logistik
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-1">
                  {selectedProductDetails.name}
                </h3>
                <p className="text-xs font-mono text-slate-500 uppercase">
                  ID SKU: {selectedProductDetails.code}
                </p>
              </div>
              <button 
                onClick={() => setSelectedProductDetails(null)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick stats & Tab Selector */}
            <div className="px-6 pt-5 pb-2 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
              {/* Tabs */}
              <div className="flex p-0.5 bg-slate-100 dark:bg-white/5 rounded-ios border border-slate-200 dark:border-white/5 gap-1">
                <button
                  onClick={() => setModalTab('current')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-ios transition-all cursor-pointer ${
                    modalTab === 'current' 
                      ? 'bg-white dark:bg-ios-secondary-dark shadow-sm text-ios-blue-light dark:text-ios-blue-dark' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Periode Terpilih ({productDistributionPeriod.length})
                </button>
                <button
                  onClick={() => setModalTab('all')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-ios transition-all cursor-pointer ${
                    modalTab === 'all' 
                      ? 'bg-white dark:bg-ios-secondary-dark shadow-sm text-ios-blue-light dark:text-ios-blue-dark' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Semua Riwayat ({productDistributionAllTime.length})
                </button>
              </div>

              {/* Total Distributed Information Counter */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-ios text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    Total Disalurkan ({modalTab === 'current' ? 'Periode Ini' : 'Semua'})
                  </p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    {(modalTab === 'current' ? productDistributionPeriod : productDistributionAllTime)
                      .reduce((sum, d) => sum + d.jumlah, 0)
                      .toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-medium uppercase text-slate-500">
                      {selectedProductDetails.unit}
                    </span>
                  </p>
                </div>
                <div className="bg-ios-blue-light/10 border border-blue-500/20 p-3.5 rounded-ios text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ios-blue-light dark:text-blue-400">
                    Stok Akhir Saat Ini
                  </p>
                  <p className="text-xl font-bold text-ios-blue-light dark:text-blue-400 mt-1">
                    {calculateStock(selectedProductDetails.id).toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-medium uppercase text-slate-500">
                      {selectedProductDetails.unit}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* List / Timeline Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {/* Active data list */}
              {(modalTab === 'current' ? productDistributionPeriod : productDistributionAllTime).length > 0 ? (
                <div className="border-l-2 border-dashed border-slate-205 dark:border-slate-800 ml-4 pl-6 relative space-y-6 py-2">
                  {(modalTab === 'current' ? productDistributionPeriod : productDistributionAllTime).map((dist) => (
                    <div key={dist.id} className="relative group/item">
                      {/* Timeline Dot Icon */}
                      <span className="absolute -left-[35px] top-1.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-4 ring-white dark:ring-slate-900">
                        <MapPin size={12} />
                      </span>

                      {/* Card Content */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-ios border border-slate-200 dark:border-white/5 space-y-3 transition-colors hover:border-rose-500/30 group-hover/item:bg-white dark:group-hover/item:bg-slate-850">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Clock size={12} />
                            <span>{formatIndoDate(dist.tanggal)}</span>
                          </div>
                          {dist.jenisBencana && (
                            <span className="text-[9px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              {dist.jenisBencana} {dist.subJenisBencana && `(${dist.subJenisBencana})`}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* SIAPA */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <User size={10} /> Penerima (Siapa)
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 pl-3 border-l-2 border-ios-blue-light/30">
                              {dist.penerima}
                            </p>
                          </div>

                          {/* JUMLAH */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Package size={10} /> Jumlah Disalurkan
                            </span>
                            <p className="text-sm font-black text-rose-600 dark:text-rose-400 pl-3 border-l-2 border-rose-500/30">
                              {dist.jumlah.toLocaleString('id-ID')}{' '}
                              <span className="text-[10px] font-medium uppercase text-slate-500">
                                {selectedProductDetails.unit}
                              </span>
                            </p>
                          </div>

                          {/* DIMANA */}
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <MapPin size={10} /> Alamat Penyaluran (Dimana)
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-amber-500/30 leading-relaxed font-semibold">
                              {dist.alamat || 'Alamat tidak diinput (pembagian umum gawat darurat)'}
                            </p>
                          </div>
                        </div>

                        {dist.keterangan && dist.keterangan !== '-' && (
                          <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] text-slate-500 italic mt-2.5 leading-normal">
                            <b>Keterangan Bencana:</b> {dist.keterangan}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                  <Package size={48} className="mb-3 text-slate-400" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Tidak Ada Sebaran Distribusi
                  </p>
                  <p className="text-[10px] mt-1 max-w-xs leading-normal">
                    {modalTab === 'current' 
                      ? 'Tidak ditemukan pencatatan barang keluar untuk jenis barang ini pada periode terpilih.' 
                      : 'Belum ada riwayat transaksi barang keluar sama sekali untuk jenis barang ini.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedProductDetails(null)}
                className="w-full sm:w-auto bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm text-center"
              >
                Tutup Sebaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Tampilan Barang (Hide / Show) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 rounded-ios-lg shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col scale-in animate-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 text-ios-blue-light dark:text-ios-blue-dark rounded-ios">
                    <Eye size={16} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Kelola Hide & Show Barang
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih barang yang ingin disembunyikan (Hide) atau dimunculkan (Show) pada Laporan Rekapitulasi Barang.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsManageModalOpen(false);
                  setSearchManageTerm('');
                }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Bar: Search & Quick Actions */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-900/30 border-b border-slate-100 dark:border-white/5 space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchManageTerm}
                  onChange={(e) => setSearchManageTerm(e.target.value)}
                  placeholder="Cari nama atau kode barang..."
                  className="w-full pl-9 pr-14 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-ios-blue-light dark:focus:border-ios-blue-dark"
                />
                {searchManageTerm && (
                  <button
                    onClick={() => setSearchManageTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{summaryItems.length} Ditampilkan</span> • <span className="text-amber-600 dark:text-amber-400 font-bold">{hiddenItems.length} Disembunyikan</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={showAllProducts}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-ios font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800/40 shadow-2xs"
                  >
                    <Eye size={12} /> Tampilkan Semua (Show All)
                  </button>
                  <button
                    onClick={hideAllProducts}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-ios font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200 dark:border-rose-800/40 shadow-2xs"
                  >
                    <EyeOff size={12} /> Sembunyikan Semua (Hide All)
                  </button>
                </div>
              </div>
            </div>

            {/* List of Products */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 divide-y divide-slate-100 dark:divide-white/5 scrollbar-thin">
              {filteredManageProducts.map(product => {
                const isHidden = hiddenProductIds.includes(product.id);
                return (
                  <div 
                    key={product.id}
                    className={`pt-2 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-ios transition-colors ${
                      isHidden 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/20' 
                        : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleHideProduct(product.id)}
                        className="w-4 h-4 rounded text-ios-blue-light focus:ring-ios-blue-light cursor-pointer"
                        id={`manage-prod-${product.id}`}
                      />
                      <label htmlFor={`manage-prod-${product.id}`} className="min-w-0 cursor-pointer">
                        <p className={`text-xs font-bold truncate ${isHidden ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                          {product.namaBarang}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {product.kodeBarang} • Sisa: {product.sisaBarang.toLocaleString('id-ID')} {product.satuan} • Masuk: {product.jumlahMasuk} • Keluar: {product.jumlahKeluar}
                        </p>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleHideProduct(product.id)}
                        className={`px-3 py-1.5 rounded-ios font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isHidden
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-300 dark:border-amber-700/50'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-700/50'
                        }`}
                      >
                        {isHidden ? (
                          <>
                            <EyeOff size={13} className="shrink-0" />
                            <span>Hidden (Show)</span>
                          </>
                        ) : (
                          <>
                            <Eye size={13} className="shrink-0" />
                            <span>Visible (Hide)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredManageProducts.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <Package size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">Barang tidak ditemukan</p>
                  <p className="text-[10px]">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Total {allSummaryItems.length} jenis barang terdata pada periode ini
              </span>
              <button
                onClick={() => {
                  setIsManageModalOpen(false);
                  setSearchManageTerm('');
                }}
                className="bg-ios-blue-light hover:bg-blue-600 text-white px-5 py-2 rounded-ios text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanBlora;
