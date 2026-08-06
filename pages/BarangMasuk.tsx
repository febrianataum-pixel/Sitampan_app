
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Plus, Trash2, Download, Upload, Search, X, Edit2, FileText, TrendingUp, ChevronDown, Check } from 'lucide-react';
import { InboundEntry, MONTHS, formatIndoDate, Product } from '../types';
import { exportToExcel, parseExcel } from '../services/excelService';
import { generateReportPDF } from '../services/pdfService';

interface ItemRow {
  id: string;
  productId: string;
  jumlah: number;
}

const BarangMasuk: React.FC = () => {
  const { products, inbound, setInbound, settings, hasPermission } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InboundEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // General date state for modal
  const [generalData, setGeneralData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    bulan: MONTHS[new Date().getMonth()],
    tahun: new Date().getFullYear(),
  });

  // Multiple items state for modal
  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), productId: '', jumlah: 1 }
  ]);

  // Product search states per item row
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  // Sorted products A-Z by namaBarang
  const sortedProducts = [...products].sort((a, b) =>
    a.namaBarang.localeCompare(b.namaBarang, 'id', { sensitivity: 'base' })
  );

  const getFilteredProductsForRow = (rowId: string) => {
    const q = (searchQueries[rowId] || '').toLowerCase().trim();
    const selectedInOtherRows = items.filter(it => it.id !== rowId).map(it => it.productId);

    return sortedProducts.filter(p => {
      const matchesQuery = p.namaBarang.toLowerCase().includes(q) || p.kodeBarang.toLowerCase().includes(q);
      const isNotUsedInOtherRow = !selectedInOtherRows.includes(p.id);
      return matchesQuery && isNotUsedInOtherRow;
    });
  };

  const handleOpenModal = (entry?: InboundEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setGeneralData({
        tanggal: entry.tanggal,
        bulan: entry.bulan,
        tahun: entry.tahun
      });
      const p = products.find(prod => prod.id === entry.productId);
      const rowId = entry.id;
      setItems([{ id: rowId, productId: entry.productId, jumlah: entry.jumlah }]);
      setSearchQueries({ [rowId]: p ? p.namaBarang : '' });
    } else {
      setEditingEntry(null);
      const newDateStr = new Date().toISOString().split('T')[0];
      const d = new Date(newDateStr);
      setGeneralData({
        tanggal: newDateStr,
        bulan: MONTHS[d.getMonth()],
        tahun: d.getFullYear()
      });
      const firstRowId = crypto.randomUUID();
      setItems([{ id: firstRowId, productId: '', jumlah: 1 }]);
      setSearchQueries({});
    }
    setActiveSearchId(null);
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    const newId = crypto.randomUUID();
    setItems(prev => [...prev, { id: newId, productId: '', jumlah: 1 }]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ItemRow, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.productId)) {
      alert('Pilih semua barang terlebih dahulu!');
      return;
    }
    if (items.some(i => i.jumlah <= 0)) {
      alert('Jumlah barang harus lebih dari 0!');
      return;
    }

    if (editingEntry) {
      const updatedEntry: InboundEntry = {
        id: editingEntry.id,
        productId: items[0].productId,
        jumlah: items[0].jumlah,
        tanggal: generalData.tanggal,
        bulan: generalData.bulan,
        tahun: generalData.tahun
      };
      setInbound(inbound.map(i => i.id === editingEntry.id ? updatedEntry : i));
    } else {
      const newEntries: InboundEntry[] = items.map(item => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        jumlah: item.jumlah,
        tanggal: generalData.tanggal,
        bulan: generalData.bulan,
        tahun: generalData.tahun
      }));
      setInbound([...inbound, ...newEntries]);
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
    
    generateReportPDF('LOG BARANG MASUK', columns, data, settings, undefined, {
      label: 'GRAND TOTAL',
      value: `Rp ${grandTotal.toLocaleString('id-ID')}`
    });
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

  const grandTotal = filteredInbound.reduce((acc, curr) => {
    const p = products.find(prod => prod.id === curr.productId);
    return acc + ((p?.harga || 0) * curr.jumlah);
  }, 0);

  // Total amount in the modal
  const modalTotal = items.reduce((acc, curr) => {
    const p = products.find(prod => prod.id === curr.productId);
    return acc + ((p?.harga || 0) * (curr.jumlah || 0));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Barang Masuk</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Log penerimaan stok barang ke gudang.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission('masuk', 'add') && (
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 text-white px-5 py-2 rounded-ios font-bold shadow-sm text-xs transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>
              <Plus size={18} /> Tambah Data
            </button>
          )}
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-ios font-bold text-xs shadow-sm hover:bg-red-100 transition-all">
            <FileText size={18} /> Export PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-ios font-bold text-xs shadow-sm hover:bg-slate-50 transition-all">
            <Download size={18} className="text-emerald-500" /> Excel
          </button>
          {hasPermission('masuk', 'add') && (
            <label className="flex items-center gap-2 bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-ios font-bold text-xs shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
              <Upload size={18} className="text-ios-blue-light" /> Import
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
            </label>
          )}
        </div>
      </div>

      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark rounded-ios-lg border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm theme-transition">
        <div className="px-6 py-4 bg-ios-secondary-light dark:bg-ios-secondary-dark border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-ios">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Grand Total Nilai</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">Rp {grandTotal.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="relative group flex-1 max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-ios-blue-light transition-colors" size={18} />
             <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-12 pr-6 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-full outline-none text-sm font-medium transition-all dark:text-slate-200"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[850px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b dark:border-white/5">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Nama Barang</th>
                <th className="px-6 py-3">Kode Barang</th>
                <th className="px-6 py-3">Satuan</th>
                <th className="px-6 py-3">Jumlah</th>
                <th className="px-6 py-3">Total Nilai</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredInbound.map(i => {
                const p = products.find(prod => prod.id === i.productId);
                const total = (p?.harga || 0) * i.jumlah;
                return (
                  <tr key={i.id} className="hover:bg-ios-blue-light/5 dark:hover:bg-ios-blue-dark/5 transition-colors group">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatIndoDate(i.tanggal)}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-sm">{p?.namaBarang}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-ios-blue-light dark:text-ios-blue-dark uppercase tracking-tight">{p?.kodeBarang}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">{p?.satuan}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">+{i.jumlah}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">Rp {total.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {hasPermission('masuk', 'edit') && (
                          <button onClick={() => handleOpenModal(i)} className="p-2 text-slate-400 dark:text-slate-600 hover:text-ios-blue-light dark:hover:text-ios-blue-dark hover:bg-ios-blue-light/10 dark:hover:bg-ios-blue-dark/10 rounded-ios"><Edit2 size={16} /></button>
                        )}
                        {hasPermission('masuk', 'delete') && (
                          <button onClick={() => { if(confirm('Hapus transaksi?')) setInbound(inbound.filter(it => it.id !== i.id)) }} className="p-2 text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-ios"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInbound.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 dark:text-slate-600 italic">Data belum ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-ios-bg-light dark:bg-ios-bg-dark rounded-ios-lg w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in duration-300 border dark:border-white/5">
            <div className="p-6 border-b dark:border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {editingEntry ? 'Edit Barang Masuk' : 'Input Barang Masuk'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editingEntry ? 'Ubah detail data penerimaan barang.' : 'Tambahkan satu atau beberapa penerimaan barang sekaligus.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-1">
              {/* Tanggal Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 ml-1">Tanggal Masuk</label>
                <input 
                  type="date" 
                  required 
                  className="w-full bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/5 rounded-ios px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-ios-blue-light/20 dark:focus:ring-ios-blue-dark/20" 
                  value={generalData.tanggal} 
                  onChange={(e) => {
                    const d = new Date(e.target.value);
                    setGeneralData({
                      tanggal: e.target.value, 
                      bulan: MONTHS[d.getMonth()], 
                      tahun: d.getFullYear()
                    });
                  }} 
                />
              </div>

              {/* Items List Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Daftar Barang Masuk ({items.length})
                  </h4>
                  {!editingEntry && (
                    <button 
                      type="button" 
                      onClick={handleAddItemRow} 
                      className="text-[10px] font-bold text-ios-blue-light dark:text-ios-blue-dark bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 px-3 py-1.5 rounded-full hover:bg-ios-blue-light/20 transition-all uppercase flex items-center gap-1 active:scale-95"
                    >
                      <Plus size={12} /> Tambah Barang
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const selectedProduct = products.find(p => p.id === item.productId);
                    const query = searchQueries[item.id] || '';
                    const isSearchActive = activeSearchId === item.id;
                    const filteredProducts = getFilteredProductsForRow(item.id);

                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-3 bg-ios-secondary-light dark:bg-ios-secondary-dark p-4 rounded-ios border border-slate-200 dark:border-white/5 relative items-end">
                        {/* Searchable Product Input */}
                        <div className="col-span-12 md:col-span-7 relative">
                          <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">
                            Pilih / Cari Barang (A-Z)
                          </label>
                          <div className="relative">
                            <input 
                              type="text" 
                              required
                              className="w-full text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-ios pl-9 pr-8 py-2.5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-ios-blue-light/20 dark:focus:ring-ios-blue-dark/20" 
                              placeholder="Ketik nama atau kode barang (A-Z)..." 
                              value={isSearchActive ? query : (selectedProduct ? `${selectedProduct.namaBarang} (${selectedProduct.kodeBarang})` : '')} 
                              onFocus={() => {
                                setActiveSearchId(item.id);
                                if (!searchQueries[item.id] && selectedProduct) {
                                  setSearchQueries({ ...searchQueries, [item.id]: selectedProduct.namaBarang });
                                }
                              }} 
                              onChange={(e) => setSearchQueries({ ...searchQueries, [item.id]: e.target.value })} 
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={14} />
                          </div>

                          {/* Search Dropdown Popup */}
                          {isSearchActive && (
                            <>
                              <div className="fixed inset-0 z-[110]" onClick={() => setActiveSearchId(null)}></div>
                              <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-ios-bg-dark rounded-ios shadow-2xl border border-slate-200 dark:border-white/10 z-[120] max-h-56 overflow-y-auto scrollbar-hide py-1">
                                {filteredProducts.length > 0 ? (
                                  filteredProducts.map(p => (
                                    <button 
                                      key={p.id} 
                                      type="button" 
                                      className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0 flex items-center justify-between transition-colors ${item.productId === p.id ? 'bg-ios-blue-light/5 dark:bg-ios-blue-dark/10' : ''}`}
                                      onClick={() => { 
                                        handleItemChange(item.id, 'productId', p.id); 
                                        setSearchQueries({ ...searchQueries, [item.id]: p.namaBarang }); 
                                        setActiveSearchId(null); 
                                      }}
                                    >
                                      <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.namaBarang}</p>
                                        <p className="text-[9px] font-mono font-bold text-ios-blue-light dark:text-ios-blue-dark uppercase mt-0.5">
                                          {p.kodeBarang} • {p.satuan}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0 ml-2">
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                          Rp {(p.harga || 0).toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                                    Barang tidak ditemukan.
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Quantity Input */}
                        <div className="col-span-8 md:col-span-3">
                          <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">
                            Jumlah ({selectedProduct?.satuan || 'Qty'})
                          </label>
                          <input 
                            type="number" 
                            min="1" 
                            required 
                            className="w-full text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-ios px-3 py-2.5 font-bold outline-none dark:text-slate-200 focus:ring-2 focus:ring-ios-blue-light/20 dark:focus:ring-ios-blue-dark/20" 
                            value={item.jumlah} 
                            onChange={(e) => handleItemChange(item.id, 'jumlah', parseInt(e.target.value) || 0)} 
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="col-span-4 md:col-span-2 flex items-center justify-end pb-1">
                          {!editingEntry && items.length > 1 ? (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItemRow(item.id)} 
                              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-ios transition-all"
                              title="Hapus Baris"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 px-2">
                              Item #{index + 1}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary Preview */}
              {modalTotal > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-ios flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">Estimasi Total Nilai Masuk:</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                    Rp {modalTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-ios transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 text-white font-bold rounded-ios shadow-sm text-sm transition-all active:scale-95" 
                  style={{ backgroundColor: settings.themeColor }}
                >
                  Simpan Data ({items.length} Barang)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangMasuk;
