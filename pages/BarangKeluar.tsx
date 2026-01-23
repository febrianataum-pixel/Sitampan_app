
import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../App';
import { 
  Plus, 
  Trash2, 
  X, 
  AlertCircle, 
  Edit2, 
  Copy, 
  Eye, 
  MapPin, 
  Calendar, 
  User, 
  Search, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Camera, 
  Upload, 
  CheckCircle2, 
  Clock,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { OutboundTransaction, OutboundItem, formatIndoDate, Product } from '../types';

type SortKey = 'tanggal' | 'penerima' | 'alamat';

const BarangKeluar: React.FC = () => {
  const { products, outbound, setOutbound, calculateStock, settings } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingTx, setEditingTx] = useState<OutboundTransaction | null>(null);
  const [viewingTx, setViewingTx] = useState<OutboundTransaction | null>(null);
  const [uploadingTxId, setUploadingTxId] = useState<string | null>(null);
  
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  // State untuk Sorting - Default Tanggal Terbaru (Desc)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'tanggal',
    direction: 'desc'
  });

  const [generalData, setGeneralData] = useState({
    penerima: '',
    tanggal: new Date().toISOString().split('T')[0],
    alamat: ''
  });

  const [items, setItems] = useState<OutboundItem[]>([
    { id: crypto.randomUUID(), productId: '', jumlah: 1 }
  ]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleOpenModal = (tx?: OutboundTransaction, duplicate = false) => {
    if (tx) {
      if (!duplicate) setEditingTx(tx);
      else setEditingTx(null);
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
    setSearchQueries({});
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && uploadingTxId) {
      setIsProcessing(true);
      try {
        const compressedImages: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const compressed = await compressImage(files[i]);
          compressedImages.push(compressed);
        }
        await setOutbound((prev: OutboundTransaction[]) => {
          return prev.map(tx => 
            tx.id === uploadingTxId 
              ? { ...tx, images: [...(tx.images || []), ...compressedImages] } 
              : tx
          );
        });
        setIsUploadModalOpen(false);
        setUploadingTxId(null);
        alert('Dokumentasi berhasil diunggah!');
      } catch (error) {
        alert('Gagal mengunggah foto.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDeleteTx = (id: string) => {
    if (confirm('Hapus transaksi ini? Stok akan disesuaikan kembali.')) {
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
        alert(`Gagal: Stok tidak mencukupi.`);
        return;
      }
    }
    const newTransaction: OutboundTransaction = {
      id: editingTx ? editingTx.id : crypto.randomUUID(),
      ...generalData,
      items: items,
      images: editingTx?.images || []
    };
    if (editingTx) setOutbound(prev => prev.map(o => o.id === editingTx.id ? newTransaction : o));
    else setOutbound(prev => [...prev, newTransaction]);
    setIsModalOpen(false);
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
  };

  const sortedOutbound = [...outbound].sort((a, b) => {
    const key = sortConfig.key;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    
    if (key === 'tanggal') {
      return (new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()) * dir;
    }
    
    const valA = (a[key] || '').toString().toLowerCase();
    const valB = (b[key] || '').toString().toLowerCase();
    
    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });

  const getFilteredAvailableProducts = (currentRowId: string) => {
    const currentItem = items.find(it => it.id === currentRowId);
    return [...products]
      .filter(p => {
        const stock = calculateStock(p.id);
        const isAlreadyInThisTx = editingTx?.items.some(i => i.productId === p.id);
        const isCurrentSelected = currentItem?.productId === p.id;
        return stock > 0 || isAlreadyInThisTx || isCurrentSelected;
      })
      .sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Barang Keluar</h2>
          <p className="text-slate-500 text-sm font-medium">Manajemen distribusi dan pengurutan data.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95" style={{ backgroundColor: settings.themeColor }}>
          <Plus size={18} /> Transaksi Baru
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b select-none">
              <tr>
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th 
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors ${sortConfig.key === 'tanggal' ? 'text-blue-600' : ''}`}
                  onClick={() => handleSort('tanggal')}
                >
                  <div className="flex items-center gap-2">
                    Tanggal Transaksi {renderSortIcon('tanggal')}
                  </div>
                </th>
                <th 
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors ${sortConfig.key === 'penerima' ? 'text-blue-600' : ''}`}
                  onClick={() => handleSort('penerima')}
                >
                  <div className="flex items-center gap-2">
                    Nama Penerima {renderSortIcon('penerima')}
                  </div>
                </th>
                <th 
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors ${sortConfig.key === 'alamat' ? 'text-blue-600' : ''}`}
                  onClick={() => handleSort('alamat')}
                >
                  <div className="flex items-center gap-2">
                    Alamat / Tujuan {renderSortIcon('alamat')}
                  </div>
                </th>
                <th className="px-6 py-4">Status / Dokumentasi</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedOutbound.map((o, index) => {
                const isTuntas = o.images && o.images.length > 0;
                return (
                  <tr key={o.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-300">{index + 1}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isTuntas ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                        {formatIndoDate(o.tanggal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm italic">{o.penerima}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium max-w-[250px] truncate" title={o.alamat}>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-300 shrink-0"/>
                        <span className="truncate">{o.alamat || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isTuntas ? (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg w-fit border border-emerald-100">
                          <CheckCircle2 size={12}/>
                          <span className="text-[10px] font-black uppercase tracking-tight">Tuntas ({o.images?.length})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-50 text-slate-400 px-3 py-1 rounded-lg w-fit border border-slate-100">
                          <Clock size={12}/>
                          <span className="text-[10px] font-black uppercase tracking-tight">Proses</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => { setUploadingTxId(o.id); setIsUploadModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Dokumentasi"><Camera size={16}/></button>
                        <button onClick={() => setViewingTx(o)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Lihat"><Eye size={16}/></button>
                        <button onClick={() => handleOpenModal(o, true)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" title="Duplikat"><Copy size={16}/></button>
                        <button onClick={() => handleOpenModal(o)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeleteTx(o.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedOutbound.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">Belum ada catatan transaksi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload (Tetap) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold uppercase text-slate-800">Tindak Lanjut Dokumentasi</h3>
              <button onClick={() => setIsUploadModalOpen(false)} disabled={isProcessing}><X size={20}/></button>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner relative">
                {isProcessing ? <Loader2 size={40} className="animate-spin" /> : <Camera size={40}/>}
              </div>
              <div>
                <p className="font-bold text-slate-700">{isProcessing ? 'Sedang Memproses...' : 'Upload Bukti Foto'}</p>
                <p className="text-xs text-slate-400 mt-1">Unggah bukti foto penyerahan barang.</p>
              </div>
              {!isProcessing && (
                <label className="block w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl">
                  PILIH FOTO
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              )}
              {isProcessing && (
                <div className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">
                  TUNGGU SEBENTAR...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lihat (Tetap) */}
      {viewingTx && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-tight">Rincian & Dokumentasi</h3>
              <button onClick={() => setViewingTx(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</p>
                  <p className="font-bold flex items-center gap-2 text-xs text-slate-700"><Calendar size={12}/> {formatIndoDate(viewingTx.tanggal)}</p>
                </div>
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Penerima</p>
                  <p className="font-bold flex items-center gap-2 text-xs text-slate-700"><User size={12}/> {viewingTx.penerima}</p>
                </div>
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alamat</p>
                  <p className="font-bold flex items-center gap-2 text-xs text-slate-700"><MapPin size={12}/> {viewingTx.alamat || '-'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ImageIcon size={14}/> Dokumentasi Foto
                </h4>
                {viewingTx.images && viewingTx.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {viewingTx.images.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group">
                        <img src={img} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a href={img} download={`Dokumentasi_${viewingTx.penerima}_${idx}.jpg`} className="p-2 bg-white rounded-full text-slate-900"><Upload size={14}/></a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center text-slate-300 italic text-xs">
                    <Camera size={32} className="mb-2 opacity-20"/> Belum ada dokumentasi foto.
                  </div>
                )}
              </div>
              
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-slate-50 font-bold text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-5 py-3">Nama Barang</th>
                        <th className="px-5 py-3 text-center">Jumlah</th>
                        <th className="px-5 py-3 text-right">Harga Satuan</th>
                        <th className="px-5 py-3 text-right">Total Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {viewingTx.items.map(item => {
                        const p = products.find(prod => prod.id === item.productId);
                        const subtotal = item.jumlah * (p?.harga || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3">
                              <p className="font-bold text-slate-700">{p?.namaBarang}</p>
                              <p className="text-[9px] text-slate-400 uppercase">{p?.kodeBarang}</p>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="font-bold text-blue-600">{item.jumlah}</span>
                              <span className="ml-1 text-slate-400 text-[10px] uppercase">{p?.satuan}</span>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-500 font-semibold">
                              Rp {(p?.harga || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-3 text-right font-black text-slate-900">
                              Rp {subtotal.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50/50 border-t">
                      <tr>
                        <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-400 uppercase tracking-widest">Grand Total</td>
                        <td className="px-5 py-4 text-right font-black text-emerald-600 text-sm">
                          Rp {viewingTx.items.reduce((acc, curr) => {
                            const p = products.find(prod => prod.id === curr.productId);
                            return acc + (curr.jumlah * (p?.harga || 0));
                          }, 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end shrink-0">
              <button onClick={() => setViewingTx(null)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-lg">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input (Tetap) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-50 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-tight">{editingTx ? 'Edit Transaksi' : 'Transaksi Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Penerima*</label>
                  <input type="text" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={generalData.penerima} onChange={(e) => setGeneralData({...generalData, penerima: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</label>
                  <input type="date" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={generalData.tanggal} onChange={(e) => setGeneralData({...generalData, tanggal: e.target.value})} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alamat Tujuan</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" value={generalData.alamat} onChange={(e) => setGeneralData({...generalData, alamat: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Barang</h4>
                  <button type="button" onClick={handleAddItemRow} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all uppercase">+ Baris</button>
                </div>
                <div className="space-y-3">
                  {items.map((item) => {
                    const originalQty = editingTx ? editingTx.items.find(i => i.productId === item.productId)?.jumlah || 0 : 0;
                    const stock = item.productId ? calculateStock(item.productId) + originalQty : 0;
                    const isOverStock = item.jumlah > stock;
                    const selectedIds = items.filter(it => it.id !== item.id).map(it => it.productId);
                    const selectedProduct = products.find(p => p.id === item.productId);
                    const query = searchQueries[item.id] || '';
                    const isSearchActive = activeSearchId === item.id;
                    const results = getFilteredAvailableProducts(item.id).filter(p => {
                      const match = p.namaBarang.toLowerCase().includes(query.toLowerCase()) || p.kodeBarang.toLowerCase().includes(query.toLowerCase());
                      return match && !selectedIds.includes(p.id);
                    });
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative">
                        <div className="col-span-12 md:col-span-7 relative">
                          <label className="block text-[8px] font-bold text-slate-300 uppercase mb-1">Cari Barang</label>
                          <div className="relative">
                            <input type="text" className="w-full text-xs bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50" placeholder="Ketik nama atau kode..." value={isSearchActive ? query : (selectedProduct?.namaBarang || '')} onFocus={() => setActiveSearchId(item.id)} onChange={(e) => setSearchQueries({...searchQueries, [item.id]: e.target.value})} />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          </div>
                          {isSearchActive && (
                            <>
                              <div className="fixed inset-0 z-[110]" onClick={() => setActiveSearchId(null)}></div>
                              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-[120] max-h-48 overflow-y-auto scrollbar-hide py-1">
                                {results.length > 0 ? results.map(p => {
                                  const sisa = calculateStock(p.id);
                                  return (
                                    <button key={p.id} type="button" className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0" onClick={() => { handleItemChange(item.id, 'productId', p.id); setSearchQueries({...searchQueries, [item.id]: p.namaBarang}); setActiveSearchId(null); }}>
                                      <p className="text-xs font-bold text-slate-700">{p.namaBarang}</p>
                                      <div className="flex justify-between items-center mt-1">
                                        <p className="text-[9px] font-bold text-blue-500 uppercase">{p.kodeBarang}</p>
                                        <span className="text-[8px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-black">STOK: {sisa}</span>
                                      </div>
                                    </button>
                                  );
                                }) : <div className="p-4 text-center text-xs text-slate-400 italic">Tidak ditemukan.</div>}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="col-span-8 md:col-span-3">
                          <label className="block text-[8px] font-bold text-slate-300 uppercase mb-1">Jumlah</label>
                          <input type="number" min="1" required className={`w-full text-xs bg-white border rounded-xl px-4 py-2.5 font-bold outline-none ${isOverStock ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-100'}`} value={item.jumlah} onChange={(e) => handleItemChange(item.id, 'jumlah', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-4 md:col-span-2 flex items-end justify-center pb-2">
                          <button type="button" onClick={() => setItems(items.length > 1 ? items.filter(it => it.id !== item.id) : items)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-6 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px]">Batal</button>
                <button type="submit" className="flex-2 py-4 text-white font-bold rounded-xl shadow-lg uppercase text-[10px] tracking-widest" style={{ backgroundColor: settings.themeColor }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangKeluar;
