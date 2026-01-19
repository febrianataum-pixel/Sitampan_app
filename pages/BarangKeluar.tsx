
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Plus, Trash2, X, AlertCircle, Edit2, Copy, Eye, MapPin, Calendar, User } from 'lucide-react';
import { OutboundTransaction, OutboundItem, formatIndoDate } from '../types';

const BarangKeluar: React.FC = () => {
  const { products, outbound, setOutbound, calculateStock, settings } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<OutboundTransaction | null>(null);
  const [viewingTx, setViewingTx] = useState<OutboundTransaction | null>(null);

  const [generalData, setGeneralData] = useState({
    penerima: '',
    tanggal: new Date().toISOString().split('T')[0],
    alamat: ''
  });

  const [items, setItems] = useState<OutboundItem[]>([
    { id: crypto.randomUUID(), productId: '', jumlah: 1 }
  ]);

  const handleOpenModal = (tx?: OutboundTransaction, duplicate = false) => {
    if (tx) {
      if (!duplicate) {
        setEditingTx(tx);
      } else {
        setEditingTx(null);
      }
      setGeneralData({ 
        penerima: tx.penerima, 
        tanggal: duplicate ? new Date().toISOString().split('T')[0] : tx.tanggal, 
        alamat: tx.alamat 
      });
      setItems(tx.items.map(item => ({ ...item, id: crypto.randomUUID() })));
    } else {
      setEditingTx(null);
      setGeneralData({ penerima: '', tanggal: new Date().toISOString().split('T')[0], alamat: '' });
      setItems([{ id: crypto.randomUUID(), productId: '', jumlah: 1 }]);
    }
    setIsModalOpen(true);
  };

  const handleDeleteTx = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini? Data stok akan disesuaikan kembali.')) {
      setOutbound(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { id: crypto.randomUUID(), productId: '', jumlah: 1 }]);
  };

  const handleItemChange = (id: string, field: keyof OutboundItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.productId)) return alert('Pilih semua barang!');

    for (const item of items) {
      const stock = calculateStock(item.productId);
      const originalQty = editingTx ? editingTx.items.find(i => i.productId === item.productId)?.jumlah || 0 : 0;
      const effectiveStock = stock + originalQty;
      if (item.jumlah > effectiveStock) {
        alert(`Gagal: Stok tidak mencukupi untuk salah satu barang.`);
        return;
      }
    }

    const newTransaction: OutboundTransaction = {
      id: editingTx ? editingTx.id : crypto.randomUUID(),
      ...generalData,
      items: items
    };

    if (editingTx) {
      setOutbound(prev => prev.map(o => o.id === editingTx.id ? newTransaction : o));
    } else {
      setOutbound(prev => [...prev, newTransaction]);
    }
    
    setIsModalOpen(false);
  };

  const availableProducts = products.filter(p => calculateStock(p.id) > 0 || (editingTx && editingTx.items.some(i => i.productId === p.id)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Barang Keluar</h2>
          <p className="text-slate-500 text-sm font-medium">Manajemen distribusi barang keluar gudang.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>
          <Plus size={18} /> Transaksi Baru
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">Tanggal Transaksi</th>
              <th className="px-6 py-4">Nama Penerima</th>
              <th className="px-6 py-4">Alamat / Tujuan</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {outbound.map(o => (
              <tr key={o.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 text-slate-400 text-xs font-semibold whitespace-nowrap">{formatIndoDate(o.tanggal)}</td>
                <td className="px-6 py-4 font-bold text-slate-700 text-sm italic">{o.penerima}</td>
                <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[200px]">{o.alamat || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => setViewingTx(o)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Lihat Rincian"><Eye size={16}/></button>
                    <button onClick={() => handleOpenModal(o)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><Edit2 size={16}/></button>
                    <button onClick={() => handleOpenModal(o, true)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all" title="Duplikat"><Copy size={16}/></button>
                    <button onClick={() => handleDeleteTx(o.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {outbound.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Belum ada catatan transaksi keluar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Lihat Rincian */}
      {viewingTx && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold uppercase tracking-tight">Rincian Transaksi Keluar</h3>
              <button onClick={() => setViewingTx(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</p>
                  <p className="font-bold flex items-center gap-2 text-sm text-slate-700"><Calendar size={14} className="text-blue-500"/> {formatIndoDate(viewingTx.tanggal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penerima</p>
                  <p className="font-bold flex items-center gap-2 text-sm text-slate-700"><User size={14} className="text-blue-500"/> {viewingTx.penerima}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat</p>
                  <p className="font-bold flex items-center gap-2 text-sm text-slate-700"><MapPin size={14} className="text-blue-500"/> {viewingTx.alamat || '-'}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-3">Nama Barang</th>
                      <th className="px-5 py-3 text-center">Jumlah</th>
                      <th className="px-5 py-3 text-right">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {viewingTx.items.map(item => {
                      const p = products.find(prod => prod.id === item.productId);
                      return (
                        <tr key={item.id}>
                          <td className="px-5 py-3 font-bold text-slate-700">{p?.namaBarang}</td>
                          <td className="px-5 py-3 text-center font-bold text-blue-600">{item.jumlah}</td>
                          <td className="px-5 py-3 text-right text-slate-400 uppercase font-bold">{p?.satuan}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex justify-end">
              <button onClick={() => setViewingTx(null)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-xl">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-50 shrink-0">
              <h3 className="text-xl font-bold uppercase tracking-tight">{editingTx ? 'Edit Transaksi Keluar' : 'Form Transaksi Keluar Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Penerima*</label>
                  <input type="text" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={generalData.penerima} onChange={(e) => setGeneralData({...generalData, penerima: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal Keluar</label>
                  <input type="date" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={generalData.tanggal} onChange={(e) => setGeneralData({...generalData, tanggal: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Tujuan / Lokasi</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={generalData.alamat} onChange={(e) => setGeneralData({...generalData, alamat: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rincian Barang</h4>
                  <button type="button" onClick={handleAddItemRow} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all uppercase tracking-widest">
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => {
                    const originalQty = editingTx ? editingTx.items.find(i => i.productId === item.productId)?.jumlah || 0 : 0;
                    const stock = item.productId ? calculateStock(item.productId) + originalQty : 0;
                    const isOverStock = item.jumlah > stock;
                    const selectedIds = items.filter(it => it.id !== item.id).map(it => it.productId);

                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100">
                        <div className="col-span-12 md:col-span-6">
                          <label className="block text-[8px] font-bold text-slate-300 uppercase mb-1 ml-2">Pilih Barang</label>
                          <select 
                            required 
                            className="w-full text-sm bg-white border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50"
                            value={item.productId}
                            onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                          >
                            <option value="">-- Cari Barang --</option>
                            {availableProducts
                              .filter(p => !selectedIds.includes(p.id))
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.namaBarang} (Sisa: {calculateStock(p.id) + (editingTx && editingTx.items.find(i => i.productId === p.id) ? editingTx.items.find(i => i.productId === p.id)!.jumlah : 0)})
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="col-span-8 md:col-span-3">
                          <label className="block text-[8px] font-bold text-slate-300 uppercase mb-1 ml-2">Jumlah</label>
                          <div className="relative">
                            <input 
                              type="number" min="1" required 
                              className={`w-full text-sm bg-white border rounded-xl px-4 py-3 font-bold outline-none transition-all ${isOverStock ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-100'}`}
                              value={item.jumlah}
                              onChange={(e) => handleItemChange(item.id, 'jumlah', parseInt(e.target.value) || 0)}
                            />
                            {isOverStock && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={16}/>}
                          </div>
                        </div>
                        <div className="col-span-4 md:col-span-3 flex items-center justify-end gap-2 pt-5">
                          {item.productId && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">Stok: {stock}</span>}
                          <button type="button" onClick={() => setItems(items.length > 1 ? items.filter(it => it.id !== item.id) : items)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Batal</button>
                <button type="submit" className="flex-1 py-4 text-white font-bold rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>
                  {editingTx ? 'Update Transaksi' : 'Selesaikan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangKeluar;
