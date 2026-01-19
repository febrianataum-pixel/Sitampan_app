
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Download, Search, AlertTriangle, FileText } from 'lucide-react';
import { exportToCSV } from '../services/csvService';
import { generateReportPDF } from '../services/pdfService';

const StokBarang: React.FC = () => {
  const { products, calculateStock, settings } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  const stockList = products.map(p => ({
    ...p,
    stokSaatIni: calculateStock(p.id),
    nilaiStok: calculateStock(p.id) * p.harga
  })).sort((a, b) => b.stokSaatIni - a.stokSaatIni);

  const filteredStock = stockList.filter(s => 
    s.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const data = filteredStock.map(s => ({
      'KODE BARANG': s.kodeBarang,
      'NAMA BARANG': s.namaBarang,
      'STOK SAAT INI': s.stokSaatIni,
      'SATUAN': s.satuan,
      'HARGA': s.harga,
      'TOTAL NILAI STOK': s.nilaiStok
    }));
    exportToCSV(data, 'Laporan_Stok_Barang');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No', dataKey: 'no', align: 'center' as const },
      { header: 'Kode', dataKey: 'kodeBarang' },
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Stok Sisa', dataKey: 'stokSaatIni', align: 'center' as const, format: (v: any) => String(v) },
      { header: 'Satuan', dataKey: 'satuan', align: 'center' as const },
      { header: 'Harga Satuan', dataKey: 'harga', align: 'right' as const, format: (v: any) => `Rp ${v.toLocaleString('id-ID')}` },
      { header: 'Total Nilai', dataKey: 'nilaiStok', align: 'right' as const, format: (v: any) => `Rp ${v.toLocaleString('id-ID')}` }
    ];
    const dataWithIndex = filteredStock.map((s, idx) => ({ ...s, no: idx + 1 }));
    generateReportPDF('REKAPITULASI STOK BARANG', columns, dataWithIndex, settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Stok Barang</h2>
          <p className="text-slate-500 text-sm font-medium">Monitoring ketersediaan stok secara real-time.</p>
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

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="relative group px-6 py-5 bg-white border-b border-slate-50">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari item untuk cek stok..." 
            className="w-full pl-14 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl outline-none text-sm transition-all font-medium focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Stok Saat Ini</th>
                <th className="px-6 py-4">Harga Satuan</th>
                <th className="px-6 py-4">Total Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStock.map(s => (
                <tr key={s.id} className={`hover:bg-blue-50/20 transition-colors ${s.stokSaatIni <= 0 ? 'bg-red-50/40' : ''}`}>
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{s.kodeBarang}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{s.namaBarang}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-1.5 w-fit border ${
                      s.stokSaatIni <= 0 
                      ? 'bg-red-600 text-white border-red-700' 
                      : s.stokSaatIni < 5 
                      ? 'bg-orange-50 text-orange-700 border-orange-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {s.stokSaatIni <= 0 ? <AlertTriangle size={14}/> : null}
                      {s.stokSaatIni} {s.satuan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-bold">Rp {s.harga.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 font-black text-slate-900">Rp {s.nilaiStok.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StokBarang;
