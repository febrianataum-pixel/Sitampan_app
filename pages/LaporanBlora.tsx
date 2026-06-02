import React, { useState, useMemo } from 'react';
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
  ArrowUpCircle
} from 'lucide-react';
import { MONTHS, formatIndoDate } from '../types';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const LaporanBlora: React.FC = () => {
  const { products, inbound, outbound, settings, calculateStock } = useInventory();
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // Rekap jumlah masuk, keluar, sisa per jenis barang
  const summaryItems = useMemo(() => {
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
      { header: 'Kode Barang', dataKey: 'kodeBarang' },
      { header: 'Jenis Barang', dataKey: 'namaBarang' },
      { header: 'Jumlah Masuk', dataKey: 'jumlahMasuk', align: 'center' as const, format: (v: number) => `${v.toLocaleString('id-ID')}` },
      { header: 'Jumlah Keluar', dataKey: 'jumlahKeluar', align: 'center' as const, format: (v: number) => `${v.toLocaleString('id-ID')}` },
      { header: 'Sisa Barang', dataKey: 'sisaBarang', align: 'center' as const, format: (v: number) => `${v.toLocaleString('id-ID')}` },
      { header: 'Satuan', dataKey: 'satuan', align: 'center' as const },
      { header: 'Nilai Sisa', dataKey: 'totalHargaSisa', align: 'right' as const, format: (v: number) => `Rp ${v.toLocaleString('id-ID')}` }
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
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm transition-all active:scale-95 text-xs"
          >
            <Download size={16}/> PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 text-xs"
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
      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Filter size={12}/> Jenis Laporan
            </label>
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-ios gap-1">
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
                  className="w-full bg-slate-100 dark:bg-white/5 border-none px-4 py-2.5 rounded-ios font-bold text-slate-800 dark:text-slate-200 outline-none appearance-none cursor-pointer"
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
                className="w-full bg-slate-100 dark:bg-white/5 border-none px-4 py-2.5 rounded-ios font-bold text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Nilai Sisa</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">Rp {totalValuation.toLocaleString('id-ID')}</p>
          <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">Valuasi Sisa Barang</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-5 border-b dark:border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Rincian Transaksi & Stok Persediaan</h3>
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full text-slate-500">
            {summaryItems.length} Jenis Barang
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Jenis Barang</th>
                <th className="px-6 py-4 text-center">Jumlah Masuk</th>
                <th className="px-6 py-4 text-center">Jumlah Keluar</th>
                <th className="px-6 py-4 text-center">Sisa Barang</th>
                <th className="px-6 py-4 text-right">Nilai Sisa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {summaryItems.length > 0 ? summaryItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.namaBarang}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">{item.kodeBarang}</p>
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
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <Package size={48} className="mb-4"/>
                      <p className="text-sm font-bold uppercase tracking-widest">Tidak Ada Data Logistik</p>
                      <p className="text-[10px] mt-1">Silakan pilih periode lain atau tambahkan data barang baru.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
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
    </div>
  );
};

export default LaporanBlora;
