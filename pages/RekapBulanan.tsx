
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Download, FileText } from 'lucide-react';
import { MONTHS } from '../types';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const RekapBulanan: React.FC = () => {
  const { products, outbound, settings } = useInventory();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const rekapData = products.map(p => {
    const totalKeluar = outbound
      .filter(tx => {
        const d = new Date(tx.tanggal);
        return MONTHS[d.getMonth()] === selectedMonth && d.getFullYear() === selectedYear;
      })
      .reduce((acc, tx) => {
        const item = tx.items.find(i => i.productId === p.id);
        return acc + (item?.jumlah || 0);
      }, 0);

    return {
      namaBarang: p.namaBarang,
      kodeBarang: p.kodeBarang,
      totalKeluar,
      satuan: p.satuan,
      totalNilai: totalKeluar * p.harga
    };
  }).filter(r => r.totalKeluar > 0);

  const handleExportCSV = () => {
    const data = rekapData.map(r => ({
      'KODE': r.kodeBarang,
      'NAMA': r.namaBarang,
      'TOTAL KELUAR': r.totalKeluar,
      'SATUAN': r.satuan,
      'NILAI PENGELUARAN': r.totalNilai
    }));
    exportToCSV(data, `Rekap_Bulanan_${selectedMonth}_${selectedYear}`);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No', dataKey: 'no', align: 'center' as const },
      { header: 'Kode', dataKey: 'kodeBarang' },
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Volume Keluar', dataKey: 'totalKeluar', align: 'center' as const, format: (v: any) => String(v) },
      { header: 'Satuan', dataKey: 'satuan', align: 'center' as const },
      { header: 'Total Nilai', dataKey: 'totalNilai', align: 'right' as const, format: (v: any) => `Rp ${v.toLocaleString('id-ID')}` }
    ];
    const dataWithIndex = rekapData.map((r, idx) => ({ ...r, no: idx + 1 }));
    generateReportPDF(`REKAP PENGELUARAN ${selectedMonth.toUpperCase()} ${selectedYear}`, columns, dataWithIndex, settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Rekap Bulanan</h2>
          <p className="text-slate-500 text-sm font-medium">Summary distribusi barang per periode.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="bg-red-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black shadow-xl hover:bg-red-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
            <FileText size={18}/> Export PDF
          </button>
          <button onClick={handleExportCSV} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black shadow-xl hover:bg-black transition-all active:scale-95 text-xs uppercase tracking-widest">
            <Download size={18}/> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Pilih Bulan</label>
          <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Pilih Tahun</label>
          <input type="number" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2024)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 font-black border-b text-slate-400 text-[10px] uppercase tracking-[0.2em]">
            <tr>
              <th className="px-6 py-4">Deskripsi Barang</th>
              <th className="px-6 py-4 text-center">Volume Keluar</th>
              <th className="px-6 py-4 text-right">Estimasi Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rekapData.length > 0 ? rekapData.map((r, idx) => (
              <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{r.namaBarang}</p>
                  <p className="text-[10px] text-slate-400 font-mono font-black">{r.kodeBarang}</p>
                </td>
                <td className="px-6 py-4 text-center font-black text-orange-600">{r.totalKeluar} {r.satuan}</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">Rp {r.totalNilai.toLocaleString('id-ID')}</td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="px-6 py-20 text-center text-slate-400 italic">Data nihil untuk periode ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RekapBulanan;
