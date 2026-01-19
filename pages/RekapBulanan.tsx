
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Download, FileText, Calendar } from 'lucide-react';
import { MONTHS } from '../types';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const RekapBulanan: React.FC = () => {
  const { products, outbound, settings } = useInventory();
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

    return {
      namaBarang: p.namaBarang,
      kodeBarang: p.kodeBarang,
      satuan: p.satuan,
      monthlyTotals,
      totalYear
    };
  }).filter(r => r.totalYear > 0); // Hanya tampilkan barang yang pernah keluar di tahun tersebut

  const handleExportCSV = () => {
    const data = rekapTahunan.map(r => {
      const row: any = {
        'KODE': r.kodeBarang,
        'NAMA BARANG': r.namaBarang,
      };
      MONTHS.forEach((m, idx) => {
        row[m.toUpperCase()] = r.monthlyTotals[idx];
      });
      row['TOTAL TAHUNAN'] = r.totalYear;
      row['SATUAN'] = r.satuan;
      return row;
    });
    exportToCSV(data, `Rekap_Tahunan_${selectedYear}`);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      ...MONTHS.map((m, idx) => ({ 
        header: m.substring(0, 3), 
        dataKey: `m${idx}`, 
        align: 'center' as const 
      })),
      { header: 'Total', dataKey: 'totalYear', align: 'center' as const, format: (v: any) => String(v) }
    ];

    const data = rekapTahunan.map(r => {
      const row: any = { namaBarang: r.namaBarang, totalYear: r.totalYear };
      r.monthlyTotals.forEach((val, idx) => {
        row[`m${idx}`] = val || '-';
      });
      return row;
    });

    generateReportPDF(`REKAPITULASI PENGELUARAN TAHUN ${selectedYear}`, columns, data, settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Rekap Tahunan</h2>
          <p className="text-slate-500 text-sm font-medium">Monitoring distribusi barang per bulan dalam setahun.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExportPDF} className="flex-1 sm:flex-none bg-red-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black shadow-xl hover:bg-red-700 transition-all active:scale-95 text-[10px] uppercase tracking-widest">
            <FileText size={16}/> PDF
          </button>
          <button onClick={handleExportCSV} className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black shadow-xl hover:bg-black transition-all active:scale-95 text-[10px] uppercase tracking-widest">
            <Download size={16}/> CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Calendar size={24} />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Pilih Tahun Laporan</label>
          <input 
            type="number" 
            className="w-full max-w-[200px] bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-lg" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())} 
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-[11px] min-w-[1200px]">
            <thead className="bg-slate-50/50 font-black border-b text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Nama Barang</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-2 py-5 text-center w-16">{m.substring(0, 3)}</th>
                ))}
                <th className="px-6 py-5 text-center bg-blue-50/50 text-blue-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rekapTahunan.length > 0 ? rekapTahunan.map((r, idx) => (
                <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <p className="font-bold text-slate-800">{r.namaBarang}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{r.kodeBarang}</p>
                  </td>
                  {r.monthlyTotals.map((val, mIdx) => (
                    <td key={mIdx} className={`px-2 py-4 text-center font-bold ${val > 0 ? 'text-slate-700' : 'text-slate-200 font-normal'}`}>
                      {val || '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-black text-blue-600 bg-blue-50/30">
                    {r.totalYear} <span className="text-[8px] text-slate-400 font-normal ml-1">{r.satuan}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={14} className="px-6 py-24 text-center text-slate-400 italic">Tidak ada data pengeluaran barang untuk tahun {selectedYear}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 text-blue-700 flex items-start gap-4">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-1">
          <Calendar size={16}/>
        </div>
        <div className="text-xs space-y-1">
          <p className="font-black uppercase tracking-tight">Informasi Laporan</p>
          <p className="font-medium opacity-80">Data di atas adalah ringkasan volume barang yang keluar (Barang Keluar) setiap bulannya. Angka 0 atau tanda (-) menunjukkan tidak ada aktivitas pengeluaran pada bulan tersebut.</p>
        </div>
      </div>
    </div>
  );
};

export default RekapBulanan;
