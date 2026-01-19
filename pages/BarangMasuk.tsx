
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Plus, Trash2, Download, Upload, Search, X, Edit2, FileText } from 'lucide-react';
import { InboundEntry, MONTHS, formatIndoDate } from '../types';
import { exportToExcel, parseExcel } from '../services/excelService';
import { generateReportPDF } from '../services/pdfService';

const BarangMasuk: React.FC = () => {
  const { products, inbound, setInbound, settings } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InboundEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    jumlah: 1,
    bulan: MONTHS[new Date().getMonth()],
    tahun: new Date().getFullYear(),
    tanggal: new Date().toISOString().split('T')[0]
  });

  const handleOpenModal = (entry?: InboundEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        productId: entry.productId,
        jumlah: entry.jumlah,
        bulan: entry.bulan,
        tahun: entry.tahun,
        tanggal: entry.tanggal
      });
    } else {
      setEditingEntry(null);
      setFormData({
        productId: '',
        jumlah: 1,
        bulan: MONTHS[new Date().getMonth()],
        tahun: new Date().getFullYear(),
        tanggal: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return alert('Pilih barang!');
    if (editingEntry) {
      setInbound(inbound.map(i => i.id === editingEntry.id ? { ...i, ...formData } : i));
    } else {
      setInbound([...inbound, { id: crypto.randomUUID(), ...formData }]);
    }
    setIsModalOpen(false);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No', dataKey: 'no', align: 'center' as const },
      { header: 'Tanggal', dataKey: 'tglFormatted' },
      { header: 'Barang', dataKey: 'nama' },
      { header: 'Kode', dataKey: 'kode' },
      { header: 'Jumlah', dataKey: 'jumlah', align: 'center' as const },
      { header: 'Total Nilai', dataKey: 'total', align: 'right' as const, format: (v: any) => `Rp ${v.toLocaleString('id-ID')}` }
    ];
    
    const data = filteredInbound.map((i, idx) => {
      const p = products.find(prod => prod.id === i.productId);
      return {
        no: idx + 1,
        tglFormatted: formatIndoDate(i.tanggal),
        nama: p?.namaBarang || '-',
        kode: p?.kodeBarang || '-',
        jumlah: `${i.jumlah} ${p?.satuan || ''}`,
        total: (p?.harga || 0) * i.jumlah
      };
    });
    
    generateReportPDF('LOG BARANG MASUK', columns, data, settings);
  };

  const handleExportExcel = () => {
    const data = filteredInbound.map(i => {
      const p = products.find(prod => prod.id === i.productId);
      return { 
        'TANGGAL': formatIndoDate(i.tanggal),
        'NAMA BARANG': p?.namaBarang || '', 
        'KODE BARANG': p?.kodeBarang || '', 
        'SATUAN': p?.satuan || '',
        'HARGA': p?.harga || 0,
        'JUMLAH': i.jumlah,
        'TOTAL': (p?.harga || 0) * i.jumlah,
        'BULAN': i.bulan,
        'TAHUN': i.tahun
      };
    });
    exportToExcel(data, 'Laporan_Barang_Masuk');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const rawData = await parseExcel(file);
        if (!rawData || rawData.length === 0) return;
        const firstRow = rawData[0];
        let kodeIdx = -1, jumlahIdx = -1, bulanIdx = -1, tahunIdx = -1;
        const hasHeader = firstRow.some((cell: any) => /KODE|JUMLAH|QTY|NAMA|SATUAN|HARGA|BULAN|TAHUN/i.test(String(cell)));
        if (hasHeader) {
          firstRow.forEach((cell: any, idx: number) => {
            const val = String(cell).toUpperCase();
            if (val.includes('KODE')) kodeIdx = idx;
            if (val.includes('JUMLAH') || val.includes('QTY')) jumlahIdx = idx;
            if (val.includes('BULAN')) bulanIdx = idx;
            if (val.includes('TAHUN')) tahunIdx = idx;
          });
        }
        if (kodeIdx === -1) kodeIdx = 0; if (jumlahIdx === -1) jumlahIdx = 4;
        if (bulanIdx === -1) bulanIdx = 6; if (tahunIdx === -1) tahunIdx = 7;
        const dataRows = hasHeader ? rawData.slice(1) : rawData;
        const imported: InboundEntry[] = dataRows.map((row: any) => {
          let cols = Array.isArray(row) ? row : [];
          if (cols.length <= Math.max(kodeIdx, jumlahIdx)) return null;
          const kode = String(cols[kodeIdx] || '').trim();
          const qty = parseInt(String(cols[jumlahIdx] || '0').replace(/\./g, '')) || 0;
          const p = products.find(prod => prod.kodeBarang === kode);
          if (!p || qty <= 0) return null;
          const d = new Date();
          return { id: crypto.randomUUID(), productId: p.id, jumlah: qty, tanggal: d.toISOString().split('T')[0], bulan: MONTHS[d.getMonth()], tahun: d.getFullYear() };
        }).filter(Boolean) as InboundEntry[];
        if (imported.length > 0) {
          setInbound(prev => [...prev, ...imported]);
          alert(`Berhasil impor ${imported.length} data.`);
        }
      } catch (err) { alert('Gagal impor.'); }
    }
    e.target.value = '';
  };

  const filteredInbound = inbound.filter(i => {
    const p = products.find(prod => prod.id === i.productId);
    return p?.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) || p?.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Barang Masuk</h2>
          <p className="text-slate-500 text-sm font-medium">Log penerimaan stok barang ke gudang.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg text-xs uppercase tracking-widest transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>
            <Plus size={18} /> Tambah Data
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-red-100">
            <FileText size={18} /> Export PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50">
            <Download size={18} className="text-emerald-500" /> Excel
          </button>
          <label className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer hover:bg-slate-50">
            <Upload size={18} className="text-blue-500" /> Import
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 bg-white relative group border-b border-slate-50">
           <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
           <input 
            type="text" 
            placeholder="Cari transaksi berdasarkan kode atau nama..." 
            className="w-full pl-14 pr-6 py-3 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Kode Barang</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Total Nilai</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInbound.map(i => {
                const p = products.find(prod => prod.id === i.productId);
                const total = (p?.harga || 0) * i.jumlah;
                return (
                  <tr key={i.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400 whitespace-nowrap">{formatIndoDate(i.tanggal)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p?.namaBarang}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 uppercase tracking-tight">{p?.kodeBarang}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-semibold uppercase">{p?.satuan}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">+{i.jumlah}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">Rp {total.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(i)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 size={16} /></button>
                        <button onClick={() => { if(confirm('Hapus transaksi?')) setInbound(inbound.filter(it => it.id !== i.id)) }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInbound.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic">Data belum ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{editingEntry ? 'Edit Masuk' : 'Input Barang Masuk'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Barang</label>
                <select required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})}>
                  <option value="">-- Pilih Barang --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.namaBarang} ({p.kodeBarang})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah</label>
                  <input type="number" min="1" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={formData.jumlah} onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal</label>
                  <input type="date" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={formData.tanggal} onChange={(e) => {
                    const d = new Date(e.target.value);
                    setFormData({...formData, tanggal: e.target.value, bulan: MONTHS[d.getMonth()], tahun: d.getFullYear()});
                  }} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-4 text-white font-bold rounded-2xl uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangMasuk;
