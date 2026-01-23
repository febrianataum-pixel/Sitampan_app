
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Plus, Edit2, Trash2, Download, Upload, Search, X, CheckSquare, Square, FileText } from 'lucide-react';
import { Product } from '../types';
import { exportToExcel, parseExcel } from '../services/excelService';
import { generateReportPDF } from '../services/pdfService';

const DatabaseBarang: React.FC = () => {
  const { products, setProducts, settings } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    kodeBarang: '',
    namaBarang: '',
    satuan: '',
    harga: 0
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        kodeBarang: product.kodeBarang,
        namaBarang: product.namaBarang,
        satuan: product.satuan,
        harga: product.harga
      });
    } else {
      setEditingProduct(null);
      setFormData({ kodeBarang: '', namaBarang: '', satuan: '', harga: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isCodeTaken = products.some(p => p.kodeBarang === formData.kodeBarang && p.id !== editingProduct?.id);
    if (isCodeTaken) {
      alert('Kode Barang sudah digunakan!');
      return;
    }

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p));
    } else {
      const newProduct: Product = { id: crypto.randomUUID(), ...formData };
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Hapus ${selectedIds.size} barang terpilih?`)) {
      setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    }
  };

  const handleExportExcel = () => {
    const data = products.map(p => ({
      'KODE BARANG': p.kodeBarang,
      'NAMA BARANG': p.namaBarang,
      'SATUAN': p.satuan,
      'HARGA': p.harga
    }));
    exportToExcel(data, 'Database_Barang');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No', dataKey: 'no', align: 'center' as const, format: (v: any) => String(v) },
      { header: 'Kode', dataKey: 'kodeBarang' },
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Satuan', dataKey: 'satuan', align: 'center' as const },
      { header: 'Harga Satuan', dataKey: 'harga', align: 'right' as const, format: (v: any) => `Rp ${v.toLocaleString('id-ID')}` }
    ];
    const dataWithIndex = filteredProducts.map((p, idx) => ({ ...p, no: idx + 1 }));
    generateReportPDF('DATABASE BARANG', columns, dataWithIndex, settings);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const rawData = await parseExcel(file);
        if (!rawData || rawData.length === 0) return;
        const firstRow = rawData[0];
        const hasHeader = firstRow.some((cell: any) => /KODE|NAMA|SATUAN|HARGA/i.test(String(cell)));
        const dataRows = hasHeader ? rawData.slice(1) : rawData;
        const imported = dataRows.map((row: any[]) => {
          if (!row || row.length < 2) return null;
          const kode = String(row[0] || '').trim();
          const nama = String(row[1] || '').trim();
          const satuan = String(row[2] || '').trim();
          const hargaRaw = row[3] || '0';
          const harga = Number(String(hargaRaw).replace(/[^0-9.-]+/g, '')) || 0;
          if (!kode || !nama) return null;
          return { id: crypto.randomUUID(), kodeBarang: kode, namaBarang: nama, satuan: satuan || 'Unit', harga };
        }).filter(Boolean) as Product[];
        if (imported.length > 0) {
          const existingCodes = new Set(products.map(p => p.kodeBarang));
          const newItems = imported.filter(p => !existingCodes.has(p.kodeBarang));
          setProducts(prev => [...prev, ...newItems]);
          alert(`Berhasil impor ${newItems.length} barang.`);
        }
      } catch (err) { alert('Gagal impor.'); }
    }
    e.target.value = '';
  };

  const filteredProducts = products.filter(p => 
    p.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Database Barang</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pengelolaan data induk inventaris.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-black shadow-lg text-[10px] uppercase">
              <Trash2 size={14} /> Hapus ({selectedIds.size})
            </button>
          )}
          <button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-black shadow-xl text-[10px] uppercase transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>
            <Plus size={16} /> Tambah
          </button>
          <button onClick={handleExportPDF} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl"><FileText size={18}/></button>
          <button onClick={handleExportExcel} className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl"><Download size={18}/></button>
          <label className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl cursor-pointer">
            <Upload size={18} />
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[2rem] shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden theme-transition">
        <div className="px-6 py-4 bg-white dark:bg-surface-dark border-b border-slate-50 dark:border-white/5 flex items-center relative group">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500" size={18} />
          <input type="text" placeholder="Cari barang..." className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-medium dark:text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[650px]">
            <thead className="bg-slate-50/50 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b dark:border-white/5">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <button onClick={() => {
                    if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
                    else setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                  }}>
                    {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredProducts.map((p) => (
                <tr key={p.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors ${selectedIds.has(p.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleSelect(p.id)}>
                      {selectedIds.has(p.id) ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" /> : <Square size={18} className="text-slate-200 dark:text-slate-800" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">{p.kodeBarang}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-sm">{p.namaBarang}</td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">{p.satuan}</td>
                  <td className="px-6 py-4 font-black text-slate-900 dark:text-slate-100 text-sm">Rp {p.harga.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleOpenModal(p)} className="p-2 text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400"><Edit2 size={16} /></button>
                      <button onClick={() => { if(confirm('Hapus?')) setProducts(products.filter(it => it.id !== p.id)) }} className="p-2 text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 dark:text-slate-600 italic">Database kosong.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-surface-dark rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 border dark:border-white/5">
            <div className="flex items-center justify-between p-6 border-b dark:border-white/5">
              <h3 className="text-lg font-bold uppercase tracking-tight dark:text-slate-100">{editingProduct ? 'Edit Barang' : 'Barang Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Kode Barang</label>
                <input type="text" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20" value={formData.kodeBarang} onChange={(e) => setFormData({...formData, kodeBarang: e.target.value})} />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Nama Barang</label>
                <input type="text" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20" value={formData.namaBarang} onChange={(e) => setFormData({...formData, namaBarang: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Satuan</label>
                  <input type="text" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20" value={formData.satuan} onChange={(e) => setFormData({...formData, satuan: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Harga (Rp)</label>
                  <input type="number" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20" value={formData.harga} onChange={(e) => setFormData({...formData, harga: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px]">Batal</button>
                <button type="submit" className="flex-1 py-3 text-white font-bold rounded-xl shadow-lg uppercase text-[10px] transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseBarang;
