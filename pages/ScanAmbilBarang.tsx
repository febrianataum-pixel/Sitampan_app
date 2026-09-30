import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../App';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  User, 
  MapPin, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Camera, 
  CheckCircle2, 
  Send, 
  Loader2, 
  Sun, 
  Moon, 
  LayoutDashboard,
  DoorOpen,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  FileText,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { OutboundTransaction, OutboundItem, formatIndoDate, Product } from '../types';

export const ScanAmbilBarang: React.FC = () => {
  const navigate = useNavigate();
  const { 
    products, 
    outbound, 
    setOutbound, 
    calculateStock, 
    settings, 
    user, 
    loginWithGoogle, 
    toggleTheme, 
    selectedYear 
  } = useInventory();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTx, setSubmittedTx] = useState<OutboundTransaction | null>(null);

  // Form states
  const today = new Date().toISOString().split('T')[0];
  const initialDate = selectedYear && !today.startsWith(selectedYear) ? `${selectedYear}-${today.slice(5)}` : today;

  const [generalData, setGeneralData] = useState({
    penerima: '',
    tanggal: initialDate,
    alamat: '',
    jenisBencana: '',
    subJenisBencana: '',
    keteranganBencana: ''
  });

  const [items, setItems] = useState<OutboundItem[]>([
    { id: crypto.randomUUID(), productId: '', jumlah: 1 }
  ]);

  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Urutkan barang sesuai abjad A - Z
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => 
      a.namaBarang.localeCompare(b.namaBarang, 'id', { sensitivity: 'base' })
    );
  }, [products]);

  const [images, setImages] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // Auto-fill user name button
  const handleFillMyName = () => {
    if (user?.displayName) {
      setGeneralData(prev => ({ ...prev, penerima: user.displayName! }));
    } else if (user?.email) {
      setGeneralData(prev => ({ ...prev, penerima: user.email.split('@')[0] }));
    }
  };

  const disasterCategories = [
    { 
      name: 'Bencana Alam', 
      subs: ['Gempa Bumi', 'Letusan Gunung', 'Angin Kencang', 'Banjir', 'Tanah Longsor', 'lainnya (sebutkan)'] 
    },
    { 
      name: 'Bencana Non Alam', 
      subs: ['Kebakaran akibat korsleting listrik', 'kecelakaan industri', 'pencemaran lingkungan', 'wabah penyakit', 'lainnya (sebutkan)'] 
    },
    { 
      name: 'Bencana Sosial', 
      subs: ['Kerusuhan', 'konflik antarkelompok', 'aksi kekerasan yang merusak ketertiban masyarakat', 'lainnya (sebutkan)'] 
    }
  ];

  // Helper image compression
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 900;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsProcessingPhotos(true);
      try {
        const compressedList: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const compressed = await compressImage(files[i]);
          compressedList.push(compressed);
        }
        setImages(prev => [...prev, ...compressedList]);
      } catch (err) {
        alert('Gagal memproses foto dokumentasi.');
      } finally {
        setIsProcessingPhotos(false);
        e.target.value = '';
      }
    }
  };

  const handleDeletePhoto = (idxToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleAddItemRow = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), productId: '', jumlah: 1 }]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (items.length <= 1) {
      setItems([{ id: crypto.randomUUID(), productId: '', jumlah: 1 }]);
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof OutboundItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!generalData.penerima.trim()) {
      alert('Nama penerima wajib diisi!');
      return;
    }

    if (!generalData.alamat.trim()) {
      alert('Alamat tujuan / lokasi penyerahan wajib diisi!');
      return;
    }

    if (items.some(i => !i.productId)) {
      alert('Harap pilih nama barang untuk seluruh baris barang yang diambil!');
      return;
    }

    if (items.some(i => i.jumlah <= 0)) {
      alert('Jumlah barang harus lebih dari 0!');
      return;
    }

    // Check stock for all items
    for (const item of items) {
      const stock = calculateStock(item.productId);
      const prod = products.find(p => p.id === item.productId);
      if (item.jumlah > stock) {
        alert(`Gagal: Stok untuk barang "${prod?.namaBarang || 'Barang'}" tidak mencukupi (Tersedia: ${stock}, Diminta: ${item.jumlah}). Harap sesuaikan jumlah barang.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newTransaction: OutboundTransaction = {
        id: crypto.randomUUID(),
        ...generalData,
        items: items,
        images: images
      };

      // Simpan ke state global, IndexedDB, localStorage, dan sync Firestore
      setOutbound((prev: OutboundTransaction[]) => [newTransaction, ...prev]);

      // Tampilkan layar sukses
      setSubmittedTx(newTransaction);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat menyimpan transaksi. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedTx(null);
    setGeneralData({
      penerima: '',
      tanggal: initialDate,
      alamat: '',
      jenisBencana: '',
      subJenisBencana: '',
      keteranganBencana: ''
    });
    setItems([{ id: crypto.randomUUID(), productId: '', jumlah: 1 }]);
    setImages([]);
  };

  // If not logged in, show a dedicated clean door access login card
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-[90px]" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-blue-500/10 blur-[90px]" />

        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner">
            <DoorOpen size={32} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/40">
              📍 Barcode Pintu Gudang
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
              Formulir Pengambilan Logistik Kebencanaan
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Silakan masuk dengan akun Anda untuk mulai mengisi formulir pengambilan logistik kebencanaan.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 py-3.5 px-6 rounded-2xl font-bold shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </div>

          <div className="pt-2 text-center border-t border-white/5">
            <Link
              to="/dashboard"
              className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 font-semibold"
            >
              <LayoutDashboard size={13} />
              Buka Halaman Utama / Login Biasa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS SUBMITTED SCREEN
  if (submittedTx) {
    const totalQty = submittedTx.items.reduce((acc, i) => acc + i.jumlah, 0);

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-center">
          
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
            <CheckCircle2 size={40} />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
              Transaksi Berhasil Disimpan
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              Pengambilan Logistik Berhasil!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data transaksi pengeluaran barang dan stok telah otomatis terupdate.
            </p>
          </div>

          {/* Transaction Summary Card */}
          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-left space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Penerima / Pengambil</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{submittedTx.penerima}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Tanggal</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatIndoDate(submittedTx.tanggal)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Alamat Tujuan</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{submittedTx.alamat}</span>
            </div>
            {submittedTx.jenisBencana && (
              <div className="flex justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Bencana</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{submittedTx.jenisBencana}</span>
              </div>
            )}

            {/* List of items taken */}
            <div className="space-y-1.5 pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] block">
                Barang yang Diambil ({submittedTx.items.length} Jenis, Total {totalQty} Unit):
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {submittedTx.items.map(item => {
                  const p = products.find(prod => prod.id === item.productId);
                  return (
                    <div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {p?.namaBarang || 'Barang'}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {item.jumlah} {p?.satuan || 'Unit'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {submittedTx.images && submittedTx.images.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold pt-1 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>{submittedTx.images.length} Foto penyaluran tersimpan (otomatis masuk ke kolom dokumentasi)</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleResetForm}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw size={15} />
              <span>Ambil Barang Lagi (Form Baru)</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/dashboard/berita-acara')}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText size={14} />
                <span>Cetak BA / Dokumen</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/keluar')}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>Lihat Data Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN FORM INTERFACE (MOBILE-OPTIMIZED)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/dashboard/keluar"
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Scan Pintu Gudang
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Formulir Pengambilan Logistik Kebencanaan
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
              title="Ubah Tema"
            >
              <Sun size={17} className="hidden dark:block text-amber-400" />
              <Moon size={17} className="block dark:hidden text-slate-600" />
            </button>
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Formulir Pengambilan Logistik Kebencanaan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                Formulir Pengambilan Logistik Kebencanaan
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              {/* Tanggal */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Tanggal Pengambilan*
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={generalData.tanggal}
                    onChange={(e) => setGeneralData({ ...generalData, tanggal: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Penerima */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Nama Penerima*
                  </label>
                  {user && (
                    <button
                      type="button"
                      onClick={handleFillMyName}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Isi nama saya
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso / Tim Relawan / Desa A"
                  value={generalData.penerima}
                  onChange={(e) => setGeneralData({ ...generalData, penerima: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Alamat Tujuan */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Alamat Tujuan / Lokasi Pengiriman*
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Posko Pengungsian Balai Desa Kedungtuban"
                  value={generalData.alamat}
                  onChange={(e) => setGeneralData({ ...generalData, alamat: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Kategori Bencana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Kategori Bencana
                  </label>
                  <select
                    value={generalData.jenisBencana}
                    onChange={(e) => setGeneralData({ ...generalData, jenisBencana: e.target.value, subJenisBencana: '', keteranganBencana: '' })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Pilih Kategori Bencana</option>
                    {disasterCategories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Sub Jenis Bencana
                  </label>
                  <select
                    disabled={!generalData.jenisBencana}
                    value={generalData.subJenisBencana}
                    onChange={(e) => setGeneralData({ ...generalData, subJenisBencana: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  >
                    <option value="">Pilih Detail Bencana</option>
                    {disasterCategories.find(c => c.name === generalData.jenisBencana)?.subs.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {generalData.subJenisBencana === 'lainnya (sebutkan)' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    Keterangan Bencana Lainnya*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sebutkan jenis bencana..."
                    value={generalData.keteranganBencana}
                    onChange={(e) => setGeneralData({ ...generalData, keteranganBencana: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-indigo-400/40 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Daftar Barang yang Diambil */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                  Barang yang Diambil ({items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Barang</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedProd = products.find(p => p.id === item.productId);
                const currentStock = item.productId ? calculateStock(item.productId) : 0;
                const isOverStock = item.productId && item.jumlah > currentStock;

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isOverStock 
                        ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' 
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Hapus baris"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Searchable Product Selector */}
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                          Pilih Barang Logistik (Urut Abjad A-Z)*
                        </label>

                        {/* Trigger Button showing selected item or placeholder */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                          }}
                          className={`w-full text-left bg-white dark:bg-slate-800 border rounded-xl px-3.5 py-3 font-bold text-xs text-slate-800 dark:text-slate-200 outline-none transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            activeDropdownId === item.id 
                              ? 'ring-2 ring-indigo-500/20 border-indigo-500' 
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                        >
                          {selectedProd ? (
                            <div className="flex items-center justify-between w-full min-w-0 pr-1">
                              <div className="truncate">
                                <span className="text-slate-900 dark:text-white font-extrabold">{selectedProd.namaBarang}</span>
                                <span className="text-slate-400 font-normal ml-1.5 uppercase text-[10px]">({selectedProd.kodeBarang})</span>
                              </div>
                              <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                currentStock > 10 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : currentStock > 0 
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}>
                                Stok: {currentStock} {selectedProd.satuan}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal flex items-center gap-1.5">
                              <Search size={14} className="text-slate-400" />
                              Pilih atau cari barang dari gudang (A-Z)...
                            </span>
                          )}
                          <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${activeDropdownId === item.id ? 'rotate-180 text-indigo-500' : ''}`} />
                        </button>

                        {/* Searchable Dropdown Popup */}
                        {activeDropdownId === item.id && (
                          <>
                            {/* Backdrop to close when clicking outside */}
                            <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                            
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              
                              {/* Search Input Box */}
                              <div className="p-2.5 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 relative">
                                <div className="relative flex items-center">
                                  <Search size={14} className="absolute left-3 text-indigo-500 shrink-0" />
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder="Ketik untuk mencari nama atau kode barang..."
                                    value={searchQueries[item.id] || ''}
                                    onChange={(e) => setSearchQueries({ ...searchQueries, [item.id]: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                  {searchQueries[item.id] && (
                                    <button
                                      type="button"
                                      onClick={() => setSearchQueries({ ...searchQueries, [item.id]: '' })}
                                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full cursor-pointer"
                                      title="Hapus kata kunci"
                                    >
                                      <X size={13} />
                                    </button>
                                  )}
                                </div>
                                <div className="flex justify-between items-center px-1 pt-2 text-[10px] text-slate-400 font-medium">
                                  <span>Urutan Abjad A - Z</span>
                                  <span>
                                    {sortedProducts.filter(p => {
                                      const q = (searchQueries[item.id] || '').toLowerCase();
                                      return p.namaBarang.toLowerCase().includes(q) || p.kodeBarang.toLowerCase().includes(q);
                                    }).length} barang ditemukan
                                  </span>
                                </div>
                              </div>

                              {/* Scrollable list of products */}
                              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 p-1">
                                {(() => {
                                  const q = (searchQueries[item.id] || '').toLowerCase();
                                  const filtered = sortedProducts.filter(p => 
                                    p.namaBarang.toLowerCase().includes(q) || 
                                    p.kodeBarang.toLowerCase().includes(q)
                                  );

                                  if (filtered.length === 0) {
                                    return (
                                      <div className="py-6 text-center text-xs text-slate-400">
                                        <Package size={24} className="mx-auto mb-1.5 opacity-30" />
                                        <p>Tidak ada barang yang cocok dengan &quot;{searchQueries[item.id]}&quot;</p>
                                      </div>
                                    );
                                  }

                                  return filtered.map(p => {
                                    const stock = calculateStock(p.id);
                                    const isSelected = item.productId === p.id;
                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          handleItemChange(item.id, 'productId', p.id);
                                          setActiveDropdownId(null);
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                          isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : ''
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                                            {isSelected && <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                            <span>{p.namaBarang}</span>
                                          </p>
                                          <p className="text-[10px] text-slate-400 uppercase mt-0.5">
                                            Kode: {p.kodeBarang} • Satuan: {p.satuan}
                                          </p>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                          stock > 10 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                            : stock > 0 
                                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                        }`}>
                                          Stok: {stock} {p.satuan}
                                        </span>
                                      </button>
                                    );
                                  });
                                })()}
                              </div>

                            </div>
                          </>
                        )}
                      </div>

                      {/* Quantity & Stock Indicator */}
                      {item.productId && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          {/* Stock badge */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">Tersedia di Gudang:</span>
                            <span className={`font-black px-2 py-0.5 rounded-lg text-xs ${
                              currentStock > 10 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : currentStock > 0 
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {currentStock} {selectedProd?.satuan}
                            </span>
                          </div>

                          {/* Stepper Input */}
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Jumlah:</label>
                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleItemChange(item.id, 'jumlah', Math.max(1, item.jumlah - 1))}
                                className="px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 font-black cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                required
                                min="1"
                                max={currentStock > 0 ? currentStock : 9999}
                                value={item.jumlah || ''}
                                onChange={(e) => handleItemChange(item.id, 'jumlah', parseInt(e.target.value) || 0)}
                                className="w-16 text-center font-black text-sm bg-transparent outline-none py-1.5"
                              />
                              <button
                                type="button"
                                onClick={() => handleItemChange(item.id, 'jumlah', item.jumlah + 1)}
                                className="px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 font-black cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                              {selectedProd?.satuan}
                            </span>
                          </div>
                        </div>
                      )}

                      {isOverStock && (
                        <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 animate-pulse">
                          <AlertCircle size={13} />
                          Jumlah melebihi stok yang tersedia ({currentStock} {selectedProd?.satuan})!
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah Baris Barang Lain</span>
            </button>
          </div>

          {/* Section 3: Foto Dokumentasi Penyaluran (Opsional) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <span>Foto Dokumentasi Penyaluran</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-white/10">
                    Opsional
                  </span>
                  {images.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                      {images.length} Foto Siap
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Foto dokumentasi bersifat <b>opsional (tidak wajib)</b>. Anda dapat langsung menyimpan pengambilan barang sekarang tanpa foto. Bukti foto dokumentasi nantinya dapat ditambahkan atau dilengkapi oleh <b>Admin</b> melalui menu Barang Keluar.
              </p>
            </div>

            {/* Photo Capture & Upload Button */}
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-2 border-dashed border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs cursor-pointer transition-all active:scale-[0.99]">
                <Camera size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>{isProcessingPhotos ? 'Sedang Memproses Foto...' : 'Ambil Foto Dokumentasi (Opsional - Kamera / Galeri)'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                  disabled={isProcessingPhotos}
                />
              </label>

              {isProcessingPhotos && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengompresi foto untuk pengunggahan cepat...</span>
                </div>
              )}

              {/* Photo Thumbnails */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group">
                      <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white rounded">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition-all cursor-pointer"
                        title="Hapus foto ini"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Action Card */}
          <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Total Barang yang Diambil:</span>
              <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                {items.reduce((acc, i) => acc + (i.jumlah || 0), 0)} Unit ({items.length} Jenis)
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isProcessingPhotos}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Menyimpan Pengambilan Logistik...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>KIRIM & SIMPAN PENGAMBILAN LOGISTIK</span>
                </>
              )}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
};
export default ScanAmbilBarang;
