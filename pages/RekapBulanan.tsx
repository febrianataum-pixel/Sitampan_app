
import React, { useState, useEffect } from 'react';
import { useInventory } from '../App';
import { Download, FileText, Calendar, CheckSquare, Check, RotateCcw } from 'lucide-react';
import { MONTHS } from '../types';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const RekapBulanan: React.FC = () => {
  const { products, inbound, outbound, settings, calculateStock, selectedYear: globalYear } = useInventory();
  
  // Mengikuti pilihan tahun yang paling atas (di samping tombol sync)
  const selectedYear = globalYear && !isNaN(parseInt(globalYear, 10))
    ? parseInt(globalYear, 10)
    : new Date().getFullYear();

  // Checklist bulan yang akan ditampilkan (indeks 0..11)
  const [selectedMonths, setSelectedMonths] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

  // Handler toggle bulan
  const toggleMonth = (idx: number) => {
    setSelectedMonths(prev => {
      if (prev.includes(idx)) {
        if (prev.length === 1) return prev; // Pertahankan minimal 1 bulan
        return prev.filter(i => i !== idx);
      } else {
        return [...prev, idx].sort((a, b) => a - b);
      }
    });
  };

  const selectAllMonths = () => {
    setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  };

  const selectSemester1 = () => {
    setSelectedMonths([0, 1, 2, 3, 4, 5]);
  };

  const selectSemester2 = () => {
    setSelectedMonths([6, 7, 8, 9, 10, 11]);
  };

  const selectQuarter = (q: 1 | 2 | 3 | 4) => {
    if (q === 1) setSelectedMonths([0, 1, 2]);
    else if (q === 2) setSelectedMonths([3, 4, 5]);
    else if (q === 3) setSelectedMonths([6, 7, 8]);
    else if (q === 4) setSelectedMonths([9, 10, 11]);
  };

  const sortedSelectedMonths = [...selectedMonths].sort((a, b) => a - b);

  // Menghitung data matriks: Barang x Bulan
  const rekapTahunan = products.map(p => {
    const monthlyTotals = MONTHS.map((_, monthIdx) => {
      return outbound
        .filter(tx => {
          const stringYear = (tx.tanggal || '').slice(0, 4);
          const txDate = new Date(tx.tanggal);
          const txYear = stringYear.length === 4 && !isNaN(Number(stringYear))
            ? Number(stringYear)
            : (!isNaN(txDate.getTime()) ? txDate.getFullYear() : null);

          const parts = (tx.tanggal || '').split('-');
          let txMonthIndex = -1;
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            txMonthIndex = parseInt(parts[1], 10) - 1;
          } else if (!isNaN(txDate.getTime())) {
            txMonthIndex = txDate.getMonth();
          }
          return txMonthIndex === monthIdx && txYear === selectedYear;
        })
        .reduce((acc, tx) => {
          const item = tx.items.find(i => i.productId === p.id);
          return acc + (item?.jumlah || 0);
        }, 0);
    });

    const totalYear = monthlyTotals.reduce((a, b) => a + b, 0);
    const totalSelected = sortedSelectedMonths.reduce((acc, mIdx) => acc + (monthlyTotals[mIdx] || 0), 0);

    // Hitung total masuk untuk tahun terpilih
    const totalMasuk = inbound
      .filter(tx => {
        const stringYear = (tx.tanggal || '').slice(0, 4);
        const txDate = new Date(tx.tanggal);
        const y = tx.tahun || (stringYear.length === 4 && !isNaN(Number(stringYear)) ? Number(stringYear) : (!isNaN(txDate.getTime()) ? txDate.getFullYear() : null));
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
      totalSelected,
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
  const totalSelectedAll = rekapTahunan.reduce((acc, r) => acc + r.totalSelected, 0);
  const totalSisaAll = rekapTahunan.reduce((acc, r) => acc + r.sisa, 0);

  const handleExportCSV = () => {
    const totalColLabel = sortedSelectedMonths.length === 12 ? 'TOTAL TAHUNAN' : `TOTAL (${sortedSelectedMonths.length} BULAN)`;

    const data = rekapTahunan.map(r => {
      const row: any = {
        'KODE': r.kodeBarang,
        'NAMA BARANG': r.namaBarang,
        'MASUK': r.totalMasuk,
      };
      sortedSelectedMonths.forEach((mIdx) => {
        const m = MONTHS[mIdx];
        row[m.toUpperCase()] = r.monthlyTotals[mIdx];
      });
      row[totalColLabel] = r.totalSelected;
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
      sortedSelectedMonths.forEach((mIdx) => {
        const m = MONTHS[mIdx];
        totalsRow[m.toUpperCase()] = monthlyTotalsAll[mIdx];
      });
      totalsRow[totalColLabel] = totalSelectedAll;
      totalsRow['SISA'] = totalSisaAll;
      totalsRow['SATUAN'] = '-';
      data.push(totalsRow);
    }

    const fileSuffix = sortedSelectedMonths.length === 12 
      ? `Rekap_Tahunan_${selectedYear}` 
      : `Rekap_Tahunan_${selectedYear}_(${sortedSelectedMonths.length}_Bulan)`;
    exportToCSV(data, fileSuffix);
  };

  const handleExportPDF = () => {
    const totalColLabel = sortedSelectedMonths.length === 12 ? 'Total Keluar' : `Total (${sortedSelectedMonths.length} Bln)`;

    const columns = [
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Masuk', dataKey: 'totalMasuk', align: 'center' as const, format: (v: any) => String(v) },
      ...sortedSelectedMonths.map((mIdx) => ({ 
        header: MONTHS[mIdx].substring(0, 3), 
        dataKey: `m${mIdx}`, 
        align: 'center' as const 
      })),
      { header: totalColLabel, dataKey: 'totalSelected', align: 'center' as const, format: (v: any) => String(v) },
      { header: 'Sisa', dataKey: 'sisa', align: 'center' as const, format: (v: any) => String(v) }
    ];

    const data = rekapTahunan.map(r => {
      const row: any = { 
        namaBarang: r.namaBarang, 
        totalMasuk: r.totalMasuk || '-',
        totalSelected: r.totalSelected || '-',
        sisa: r.sisa || '-'
      };
      sortedSelectedMonths.forEach((mIdx) => {
        row[`m${mIdx}`] = r.monthlyTotals[mIdx] || '-';
      });
      return row;
    });

    if (rekapTahunan.length > 0) {
      const totalsRow: any = {
        namaBarang: 'JUMLAH TOTAL',
        totalMasuk: String(totalMasukAll),
        totalSelected: String(totalSelectedAll),
        sisa: String(totalSisaAll)
      };
      sortedSelectedMonths.forEach((mIdx) => {
        totalsRow[`m${mIdx}`] = monthlyTotalsAll[mIdx] || '-';
      });
      data.push(totalsRow);
    }

    const title = sortedSelectedMonths.length === 12
      ? `REKAPITULASI MUTASI BARANG TAHUN ${selectedYear}`
      : `REKAPITULASI MUTASI BARANG TAHUN ${selectedYear} (${sortedSelectedMonths.length} BULAN TERPILIH)`;

    generateReportPDF(title, columns, data, settings);
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

      {/* Filter Card: Informasi Tahun Laporan & Menu Tampilkan Per Bulan (Checklist) */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 rounded-ios-lg border border-white/80 dark:border-white/10 shadow-sm space-y-4 theme-transition w-full">
        {/* Row 1: Status Tahun Laporan (Mengikuti Pilihan Tahun di Header Atas) & Status Kolom */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 text-ios-blue-light dark:text-ios-blue-dark rounded-ios shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Laporan</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-800 dark:text-slate-100">
                  Tahun {selectedYear}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                  Mengikuti pilihan tahun di bar atas (samping tombol sinkronisasi)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kolom Bulan Aktif</div>
              <div className="text-xs font-bold text-ios-blue-light dark:text-ios-blue-dark">
                {sortedSelectedMonths.length === 12 ? 'Semua Bulan (12/12)' : `${sortedSelectedMonths.length} dari 12 Bulan Terpilih`}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Menu Tampilkan Per Bulan (Checklist) */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-ios-blue-light dark:text-ios-blue-dark" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Tampilkan Per Bulan</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                Checklist Bulan
              </span>
            </div>

            {/* Tombol Preset Cepat */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button 
                onClick={selectAllMonths}
                className="px-2.5 py-1 rounded-ios bg-slate-100 dark:bg-white/10 hover:bg-ios-blue-light hover:text-white dark:hover:bg-ios-blue-dark text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                Pilih Semua
              </button>
              <button 
                onClick={() => selectQuarter(1)}
                className="px-2.5 py-1 rounded-ios bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                Triwulan I
              </button>
              <button 
                onClick={() => selectQuarter(2)}
                className="px-2.5 py-1 rounded-ios bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                Triwulan II
              </button>
              <button 
                onClick={() => selectQuarter(3)}
                className="px-2.5 py-1 rounded-ios bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                Triwulan III
              </button>
              <button 
                onClick={() => selectQuarter(4)}
                className="px-2.5 py-1 rounded-ios bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                Triwulan IV
              </button>
              <button 
                onClick={selectSemester1}
                className="px-2.5 py-1 rounded-ios bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                Semester 1
              </button>
              <button 
                onClick={selectSemester2}
                className="px-2.5 py-1 rounded-ios bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                Semester 2
              </button>
            </div>
          </div>

          {/* Grid Checklist 12 Bulan */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
            {MONTHS.map((m, idx) => {
              const isChecked = selectedMonths.includes(idx);
              return (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => toggleMonth(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-ios border text-xs font-semibold cursor-pointer select-none transition-all ${
                    isChecked 
                      ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-xs' 
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                  title={`${m} (Klik untuk ${isChecked ? 'sembunyikan' : 'tampilkan'})`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 ${
                    isChecked 
                      ? 'bg-ios-blue-light dark:bg-ios-blue-dark text-white' 
                      : 'border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800'
                  }`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className="truncate">{m.substring(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-ios-lg shadow-sm border border-white/80 dark:border-white/10 overflow-hidden theme-transition w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[11px] min-w-full">
            <thead className="bg-slate-50/80 dark:bg-white/5 font-bold border-b dark:border-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 sm:px-5 py-3.5 sticky left-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-56 sm:w-64 min-w-[200px]">Nama Barang</th>
                <th className="px-3 sm:px-4 py-3.5 text-center w-20 min-w-[70px] bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">Masuk</th>
                {sortedSelectedMonths.map(mIdx => (
                  <th key={mIdx} className="px-2 py-3.5 text-center w-12 min-w-[45px]">{MONTHS[mIdx].substring(0, 3)}</th>
                ))}
                <th className="px-3 sm:px-4 py-3.5 text-center bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 text-ios-blue-light dark:text-ios-blue-dark font-bold min-w-[80px]">
                  {sortedSelectedMonths.length === 12 ? 'Total Keluar' : `Total (${sortedSelectedMonths.length} Bln)`}
                </th>
                <th className="px-3 sm:px-4 py-3.5 text-center w-20 min-w-[70px] bg-amber-500/5 text-amber-700 dark:text-amber-400">Sisa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rekapTahunan.length > 0 ? rekapTahunan.map((r, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-4 sm:px-5 py-3 sticky left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur group-hover:bg-blue-50/95 dark:group-hover:bg-slate-800/95 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-56 sm:w-64 min-w-[200px]">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{r.namaBarang}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{r.kodeBarang}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.02]">
                    {r.totalMasuk || '-'}
                  </td>
                  {sortedSelectedMonths.map(mIdx => {
                    const val = r.monthlyTotals[mIdx];
                    return (
                      <td key={mIdx} className={`px-2 py-3 text-center font-bold ${val > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-300 dark:text-slate-700 font-normal'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                  <td className="px-3 sm:px-4 py-3 text-center font-bold text-ios-blue-light dark:text-ios-blue-dark bg-ios-blue-light/10 dark:bg-ios-blue-dark/10">
                    {r.totalSelected} <span className="text-[8px] text-slate-500 dark:text-slate-400 font-normal ml-0.5">{r.satuan}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-500/[0.02]">
                    {r.sisa}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4 + sortedSelectedMonths.length} className="px-6 py-24 text-center text-slate-400 dark:text-slate-600 italic">
                    Tidak ada data transaksi barang untuk tahun {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
            {rekapTahunan.length > 0 && (
              <tfoot className="bg-slate-100/90 dark:bg-white/10 font-bold border-t border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-[11px]">
                <tr>
                  <td className="px-4 sm:px-5 py-3.5 sticky left-0 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-black uppercase w-56 sm:w-64 min-w-[200px]">
                    Jumlah
                  </td>
                  <td className="px-3 sm:px-4 py-3.5 text-center font-black text-emerald-600 dark:text-emerald-400">
                    {totalMasukAll}
                  </td>
                  {sortedSelectedMonths.map(mIdx => (
                    <td key={mIdx} className="px-2 py-3.5 text-center font-black">
                      {monthlyTotalsAll[mIdx] || '-'}
                    </td>
                  ))}
                  <td className="px-3 sm:px-4 py-3.5 text-center font-black text-ios-blue-light dark:text-ios-blue-dark bg-ios-blue-light/20 dark:bg-ios-blue-dark/20">
                    {totalSelectedAll}
                  </td>
                  <td className="px-3 sm:px-4 py-3.5 text-center font-black text-amber-600 dark:text-amber-400">
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
          <p className="font-medium opacity-80">
            Data di atas adalah ringkasan volume barang yang masuk, keluar per bulan sesuai checklist bulan yang dipilih, total pengeluaran untuk bulan terpilih ({sortedSelectedMonths.length} bulan), dan sisa sediaan gudang. Angka 0 atau tanda (-) menunjukkan tidak ada aktivitas transaksi pada bulan tersebut.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RekapBulanan;
