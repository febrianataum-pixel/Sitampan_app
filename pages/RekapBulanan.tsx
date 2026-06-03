
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Download, FileText, Calendar } from 'lucide-react';
import { MONTHS } from '../types';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const RekapBulanan: React.FC = () => {
  const { products, inbound, outbound, settings, calculateStock } = useInventory();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Menghitung data matriks: Barang x Bulan
  const rekapTahunan = products.map(p => {
    const monthlyTotals = MONTHS.map((_, monthIdx) => {
      return outbound
        .filter(tx => {
          const d = new Date(tx.tanggal);
          return d.getMonth() === monthIdx && d.getFullYear() === selectedYear;
        })
        .reduce((acc, tx) => {
          const item = tx.items.find(i => i.productId === p.id);
          return acc + (item?.jumlah || 0);
        }, 0);
    });

    const totalYear = monthlyTotals.reduce((a, b) => a + b, 0);

    // Hitung total masuk untuk tahun terpilih
    const totalMasuk = inbound
      .filter(tx => {
        const d = new Date(tx.tanggal);
        const y = tx.tahun || d.getFullYear();
        return tx.productId === p.id && y === selectedYear;
      })
      .reduce((acc, tx) => acc + tx.jumlah, 0);

    const sisa = calculateStock(p.id);

    return {
      id: p.id,
      namaBarang: p.namaBarang,
      kodeBarang: p.kodeBarang,
      satuan: p.satuan,
      monthlyTotals,
      totalYear,
      totalMasuk,
      sisa
    };
  })
  .filter(r => r.totalYear > 0 || r.totalMasuk > 0)
  .sort((a, b) => a.namaBarang.localeCompare(b.namaBarang, 'id')); // Urutkan secara abjad berdasarkan nama barang

  // Menghitung grand total untuk baris paling bawah
  const totalMasukAll = rekapTahunan.reduce((acc, r) => acc + r.totalMasuk, 0);
  const monthlyTotalsAll = MONTHS.map((_, mIdx) => {
    return rekapTahunan.reduce((acc, r) => acc + r.monthlyTotals[mIdx], 0);
  });
  const totalYearAll = rekapTahunan.reduce((acc, r) => acc + r.totalYear, 0);
  const totalSisaAll = rekapTahunan.reduce((acc, r) => acc + r.sisa, 0);

  const handleExportCSV = () => {
    const data = rekapTahunan.map(r => {
      const row: any = {
        'KODE': r.kodeBarang,
        'NAMA BARANG': r.namaBarang,
        'MASUK': r.totalMasuk,
      };
      MONTHS.forEach((m, idx) => {
        row[m.toUpperCase()] = r.monthlyTotals[idx];
      });
      row['TOTAL TAHUNAN'] = r.totalYear;
      row['SISA'] = r.sisa;
      row['SATUAN'] = r.satuan;
      return row;
    });

    // Add totals row to CSV
    if (rekapTahunan.length > 0) {
      const totalsRow: any = {
        'KODE': '-',
        'NAMA BARANG': 'JUMLAH TOTAL',
        'MASUK': totalMasukAll,
      };
      MONTHS.forEach((m, idx) => {
        totalsRow[m.toUpperCase()] = monthlyTotalsAll[idx];
      });
      totalsRow['TOTAL TAHUNAN'] = totalYearAll;
      totalsRow['SISA'] = totalSisaAll;
      totalsRow['SATUAN'] = '-';
      data.push(totalsRow);
    }

    exportToCSV(data, `Rekap_Tahunan_${selectedYear}`);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Masuk', dataKey: 'totalMasuk', align: 'center' as const, format: (v: any) => String(v) },
      ...MONTHS.map((m, idx) => ({ 
        header: m.substring(0, 3), 
        dataKey: `m${idx}`, 
        align: 'center' as const 
      })),
      { header: 'Total Keluar', dataKey: 'totalYear', align: 'center' as const, format: (v: any) => String(v) },
      { header: 'Sisa', dataKey: 'sisa', align: 'center' as const, format: (v: any) => String(v) }
    ];

    const data = rekapTahunan.map(r => {
      const row: any = { 
        namaBarang: r.namaBarang, 
        totalMasuk: r.totalMasuk || '-',
        totalYear: r.totalYear || '-',
        sisa: r.sisa || '-'
      };
      r.monthlyTotals.forEach((val, idx) => {
        row[`m${idx}`] = val || '-';
      });
      return row;
    });

    if (rekapTahunan.length > 0) {
      const totalsRow: any = {
        namaBarang: 'JUMLAH TOTAL',
        totalMasuk: String(totalMasukAll),
        totalYear: String(totalYearAll),
        sisa: String(totalSisaAll)
      };
      monthlyTotalsAll.forEach((val, idx) => {
        totalsRow[`m${idx}`] = val || '-';
      });
      data.push(totalsRow);
    }

    generateReportPDF(`REKAPITULASI MUTASI BARANG TAHUN ${selectedYear}`, columns, data, settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Rekap Tahunan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitoring distribusi barang per bulan dalam setahun.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExportPDF} className="flex-1 sm:flex-none bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 px-5 py-2 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-red-100 transition-all active:scale-95 text-xs">
            <FileText size={16}/> PDF
          </button>
          <button onClick={handleExportCSV} className="flex-1 sm:flex-none bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-5 py-2 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-xs">
            <Download size={16}/> CSV
          </button>
        </div>
      </div>

      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4 theme-transition">
        <div className="p-3 bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 text-ios-blue-light dark:text-ios-blue-dark rounded-ios">
          <Calendar size={24} />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Pilih Tahun Laporan</label>
          <input 
            type="number" 
            className="w-full max-w-[200px] bg-slate-100 dark:bg-white/5 border-none px-4 py-2 rounded-ios font-bold text-slate-800 dark:text-slate-200 outline-none transition-all text-lg" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())} 
          />
        </div>
      </div>

      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden theme-transition">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-[11px] min-w-[1200px]">
            <thead className="bg-slate-50 dark:bg-white/5 font-bold border-b dark:border-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-ios-secondary-dark z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Nama Barang</th>
                <th className="px-4 py-4 text-center w-20">Masuk</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-2 py-4 text-center w-16">{m.substring(0, 3)}</th>
                ))}
                <th className="px-4 py-4 text-center bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 text-ios-blue-light dark:text-ios-blue-dark">Total</th>
                <th className="px-4 py-4 text-center w-20">Sisa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rekapTahunan.length > 0 ? rekapTahunan.map((r, idx) => (
                <tr key={idx} className="hover:bg-ios-blue-light/5 dark:hover:bg-ios-blue-dark/5 transition-colors group">
                  <td className="px-6 py-4 sticky left-0 bg-ios-secondary-light dark:bg-ios-secondary-dark group-hover:bg-ios-blue-light/5 dark:group-hover:bg-ios-blue-dark/5 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{r.namaBarang}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{r.kodeBarang}</p>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {r.totalMasuk || '-'}
                  </td>
                  {r.monthlyTotals.map((val, mIdx) => (
                    <td key={mIdx} className={`px-2 py-4 text-center font-bold ${val > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-300 dark:text-slate-700 font-normal'}`}>
                      {val || '-'}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center font-bold text-ios-blue-light dark:text-ios-blue-dark bg-ios-blue-light/10 dark:bg-ios-blue-dark/10">
                    {r.totalYear} <span className="text-[8px] text-slate-500 dark:text-slate-400 font-normal ml-1">{r.satuan}</span>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-amber-600 dark:text-amber-400">
                    {r.sisa}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={16} className="px-6 py-24 text-center text-slate-400 dark:text-slate-600 italic">Tidak ada data transaksi barang untuk tahun {selectedYear}.</td></tr>
              )}
            </tbody>
            {rekapTahunan.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-white/10 font-bold border-t border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                <tr>
                  <td className="px-6 py-4 sticky left-0 bg-slate-100 dark:bg-ios-secondary-dark z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-black uppercase">
                    Jumlah
                  </td>
                  <td className="px-4 py-4 text-center font-black text-emerald-600 dark:text-emerald-400">
                    {totalMasukAll}
                  </td>
                  {monthlyTotalsAll.map((val, mIdx) => (
                    <td key={mIdx} className="px-2 py-4 text-center font-black">
                      {val || '-'}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center font-black text-ios-blue-light dark:text-ios-blue-dark bg-ios-blue-light/20 dark:bg-ios-blue-dark/20">
                    {totalYearAll}
                  </td>
                  <td className="px-4 py-4 text-center font-black text-amber-600 dark:text-amber-400">
                    {totalSisaAll}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      <div className="bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 p-6 rounded-ios-lg border border-ios-blue-light/20 dark:border-ios-blue-dark/20 text-ios-blue-light dark:text-ios-blue-dark flex items-start gap-4">
        <div className="p-2 bg-ios-blue-light dark:bg-ios-blue-dark text-white rounded-ios shrink-0 mt-1">
          <Calendar size={16}/>
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold uppercase tracking-tight">Informasi Laporan</p>
          <p className="font-medium opacity-80">Data di atas adalah ringkasan volume barang yang masuk, keluar per bulan, total keluaan tahunan, dan sisa stok. Angka 0 atau tanda (-) menunjukkan tidak ada aktivitas transaksi pada bulan tersebut.</p>
        </div>
      </div>
    </div>
  );
};

export default RekapBulanan;
