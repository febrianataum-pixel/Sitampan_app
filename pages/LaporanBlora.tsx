
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
  Filter
} from 'lucide-react';
import { MONTHS, formatIndoDate } from '../types';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const LaporanBlora: React.FC = () => {
  const { products, outbound, settings } = useInventory();
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter data berdasarkan Kabupaten Blora (asumsi alamat mengandung Blora)
  // Dan berdasarkan periode yang dipilih
  const filteredData = useMemo(() => {
    return outbound.filter(tx => {
      const txDate = new Date(tx.tanggal);
      const isBlora = tx.alamat?.toLowerCase().includes('blora') || true; // Default true jika user minta laporan Blora
      
      if (reportType === 'monthly') {
        return isBlora && txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
      } else {
        return isBlora && txDate.getFullYear() === selectedYear;
      }
    });
  }, [outbound, reportType, selectedMonth, selectedYear]);

  // Rekap jumlah per barang
  const summaryItems = useMemo(() => {
    const map = new Map<string, number>();
    
    filteredData.forEach(tx => {
      tx.items.forEach(item => {
        map.set(item.productId, (map.get(item.productId) || 0) + item.jumlah);
      });
    });

    return Array.from(map.entries()).map(([productId, total]) => {
      const product = products.find(p => p.id === productId);
      const hargaSatuan = product?.harga || 0;
      return {
        id: productId,
        namaBarang: product?.namaBarang || 'Barang Tidak Diketahui',
        kodeBarang: product?.kodeBarang || '-',
        satuan: product?.satuan || 'Unit',
        hargaSatuan,
        total,
        totalHarga: total * hargaSatuan
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredData, products]);

  // Extract unique kecamatan from alamat
  const listKecamatan = useMemo(() => {
    const kecamatanSet = new Set<string>();
    filteredData.forEach(tx => {
      if (tx.alamat) {
        const match = tx.alamat.match(/Kec\.\s*([a-zA-Z\s]+)/i);
        if (match) {
          kecamatanSet.add(match[1].trim());
        } else {
          const parts = tx.alamat.split(',');
          if (parts.length > 0) {
            kecamatanSet.add(parts[0].trim());
          }
        }
      }
    });
    return Array.from(kecamatanSet);
  }, [filteredData]);

  const totalExpenditure = summaryItems.reduce((acc, curr) => acc + curr.total, 0);
  const totalExpenditureValue = summaryItems.reduce((acc, curr) => acc + curr.totalHarga, 0);

  const getFullNarrative = () => {
    const period = reportType === 'monthly' ? `${MONTHS[selectedMonth]} ${selectedYear}` : `Tahun ${selectedYear}`;
    const baseNarrative = `Berdasarkan data transaksi pengeluaran logistik yang tercatat pada sistem inovasi SITAMPAN ((SISTEM TANGGAP PEMANTAUAN LOGISTIK KEBENCANAAN), berikut disampaikan laporan rekapitulasi pendistribusian barang untuk wilayah Kabupaten Blora pada periode ${period}. Laporan ini disusun sebagai bentuk transparansi dan akuntabilitas pengelolaan stok barang di gudang.`;
    
    const distributionNarrative = listKecamatan.length > 0 
      ? `\n\nPada periode ini, logistik telah disalurkan ke wilayah kecamatan ${listKecamatan.join(', ')} dengan total barang yang didistribusikan sebanyak ${totalExpenditure.toLocaleString('id-ID')} unit.`
      : `\n\nPada periode ini, total barang yang didistribusikan sebanyak ${totalExpenditure.toLocaleString('id-ID')} unit.`;
    
    return baseNarrative + distributionNarrative;
  };

  const handleExportPDF = () => {
    const title = reportType === 'monthly' 
      ? `PENGELUARAN KAB. BLORA - ${MONTHS[selectedMonth].toUpperCase()} ${selectedYear}`
      : `PENGELUARAN KAB. BLORA - TAHUN ${selectedYear}`;

    const columns = [
      { header: 'Kode', dataKey: 'kodeBarang' },
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Jumlah', dataKey: 'total', align: 'center' as const },
      { header: 'Satuan', dataKey: 'satuan' },
      { header: 'Nominal Harga', dataKey: 'hargaSatuan', align: 'right' as const, format: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
      { header: 'Total Harga', dataKey: 'totalHarga', align: 'right' as const, format: (v: number) => `Rp ${v.toLocaleString('id-ID')}` }
    ];

    generateReportPDF(title, columns, summaryItems, settings, getFullNarrative());
  };

  const handleExportCSV = () => {
    const filename = reportType === 'monthly'
      ? `Laporan_Blora_${MONTHS[selectedMonth]}_${selectedYear}`
      : `Laporan_Blora_Tahun_${selectedYear}`;
    
    const data = summaryItems.map(item => ({
      'KODE': item.kodeBarang,
      'NAMA BARANG': item.namaBarang,
      'JUMLAH': item.total,
      'SATUAN': item.satuan,
      'HARGA SATUAN': item.hargaSatuan,
      'TOTAL HARGA': item.totalHarga
    }));

    exportToCSV(data, filename);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-orange-500 text-white rounded-lg shadow-sm">
              <FileText size={16}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Laporan Kabupaten Blora</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Rekapitulasi pengeluaran logistik wilayah Blora.</p>
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
            <h3 className="text-[10px] font-black text-ios-blue-light dark:text-ios-blue-dark uppercase tracking-[0.2em]">Pernyataan Resmi</h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic space-y-3">
              <p>
                "Berdasarkan data transaksi pengeluaran logistik yang tercatat pada sistem inovasi <span className="font-bold text-slate-900 dark:text-white">SITAMPAN ((SISTEM TANGGAP PEMANTAUAN LOGISTIK KEBENCANAAN)</span>, 
                berikut disampaikan laporan rekapitulasi pendistribusian barang untuk wilayah <span className="font-bold text-slate-900 dark:text-white">Kabupaten Blora</span> pada periode 
                <span className="text-ios-blue-light dark:text-ios-blue-dark font-bold"> {reportType === 'monthly' ? `${MONTHS[selectedMonth]} ${selectedYear}` : `Tahun ${selectedYear}`}</span>. 
                Laporan ini disusun sebagai bentuk transparansi dan akuntabilitas pengelolaan stok barang di gudang."
              </p>
              {listKecamatan.length > 0 && (
                <p>
                  Pada periode ini, logistik telah disalurkan ke wilayah kecamatan <span className="font-bold text-slate-900 dark:text-white">{listKecamatan.join(', ')}</span> dengan total barang yang didistribusikan sebanyak <span className="font-bold text-ios-blue-light dark:text-ios-blue-dark">{totalExpenditure.toLocaleString('id-ID')} unit</span>.
                </p>
              )}
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
        <div className="bg-ios-blue-light dark:bg-ios-blue-dark p-6 rounded-ios-lg text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={120}/>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Pengeluaran</p>
            <p className="text-3xl font-black">{totalExpenditure.toLocaleString('id-ID')} <span className="text-xs font-medium">Unit</span></p>
            <p className="text-[10px] mt-2 font-medium opacity-80">
              {reportType === 'monthly' ? `${MONTHS[selectedMonth]} ${selectedYear}` : `Tahun ${selectedYear}`}
            </p>
          </div>
        </div>

        <div className="bg-emerald-500 p-6 rounded-ios-lg text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={120}/>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Nilai Logistik</p>
            <p className="text-xl font-black">Rp {totalExpenditureValue.toLocaleString('id-ID')}</p>
            <p className="text-[10px] mt-2 font-medium opacity-80">Akumulasi Nilai Barang</p>
          </div>
        </div>

        <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-ios flex items-center justify-center">
            <MapPin size={24}/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Wilayah Fokus</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Kabupaten Blora</p>
          </div>
        </div>

        <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-ios flex items-center justify-center">
            <Package size={24}/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Item Terdistribusi</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{summaryItems.length} Jenis</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-5 border-b dark:border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Rincian Item Keluar</h3>
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full text-slate-500">
            {filteredData.length} Transaksi
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Informasi Barang</th>
                <th className="px-6 py-4 text-center">Jumlah Keluar</th>
                <th className="px-6 py-4 text-right">Nominal Harga</th>
                <th className="px-6 py-4 text-right">Total Harga</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {summaryItems.length > 0 ? summaryItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.namaBarang}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{item.kodeBarang}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 text-ios-blue-light dark:text-ios-blue-dark font-bold text-sm">
                      {item.total} <span className="text-[10px] font-medium opacity-60 uppercase">{item.satuan}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Rp {item.hargaSatuan.toLocaleString('id-ID')}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Rp {item.totalHarga.toLocaleString('id-ID')}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-ios-blue-light dark:hover:text-ios-blue-dark transition-colors">
                      <ChevronRight size={18}/>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <Package size={48} className="mb-4"/>
                      <p className="text-sm font-bold uppercase tracking-widest">Tidak Ada Data Pengeluaran</p>
                      <p className="text-[10px] mt-1">Silakan pilih periode lain atau pastikan data tersedia.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-ios-lg border border-orange-100 dark:border-orange-900/20 flex gap-4">
        <div className="w-10 h-10 bg-orange-500 text-white rounded-ios flex items-center justify-center shrink-0">
          <TrendingUp size={20}/>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-tight">Analisis Distribusi</p>
          <p className="text-[11px] text-orange-700/70 dark:text-orange-400/60 leading-relaxed">
            Laporan ini menyajikan data akumulasi pengeluaran logistik untuk wilayah Kabupaten Blora. 
            Data ditarik dari transaksi "Barang Keluar" yang tercatat dalam sistem pada periode {reportType === 'monthly' ? MONTHS[selectedMonth] : 'Tahun'} {selectedYear}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaporanBlora;
