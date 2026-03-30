import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, 
  MapPin, 
  AlertTriangle, 
  Wallet, 
  PackageSearch, 
  TrendingUp,
  X,
  Info,
  FileText,
  ChevronLeft,
  Filter,
  Calendar,
  RotateCcw,
  ChevronDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Download
} from 'lucide-react';
import { useInventory } from '../App';
import { Product, OutboundTransaction, InboundEntry } from '../types';
import { generateReportPDF } from '../services/pdfService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const RekapIndikator: React.FC = () => {
  const { products, inbound, outbound, documents, calculateStock, settings } = useInventory();
  const [selectedData, setSelectedData] = useState<{ title: string; items: any[] } | null>(null);
  
  // Disaster Drill-down State
  const [disasterView, setDisasterView] = useState<{ level: 'category' | 'sub'; category?: string }>({ level: 'category' });

  // Ultimate Filter State
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    kecamatan: '',
    jenisBencana: '',
    subJenisBencana: '',
    kategori: '',
    tipeTransaksi: 'Semua', // Semua, Masuk, Keluar, Stock
    periode: 'Semua' // Semua, Bulan Ini, Triwulan Ini, Tahun Ini
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const CATEGORIES = ['Permakanan', 'Sandang', 'Tenda', 'Peralatan Dapur', 'Kesehatan', 'Lain-lain'];

  // Helper to extract kecamatan
  const getKecamatan = (alamat: string) => {
    const match = alamat.match(/Kec\.\s*([a-zA-Z\s]+)/i);
    return match ? match[1].trim() : alamat || 'Lainnya';
  };

  // Helper for period filtering
  const isInPeriod = (dateStr: string, periode: string) => {
    if (periode === 'Semua') return true;
    const date = new Date(dateStr);
    const now = new Date();
    
    if (periode === 'Bulan Ini') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (periode === 'Triwulan Ini') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const itemQuarter = Math.floor(date.getMonth() / 3);
      return currentQuarter === itemQuarter && date.getFullYear() === now.getFullYear();
    }
    if (periode === 'Tahun Ini') {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Unique values for filters
  const uniqueKecamatans = useMemo(() => {
    const set = new Set<string>();
    outbound.forEach(tx => set.add(getKecamatan(tx.alamat)));
    return Array.from(set).sort();
  }, [outbound]);

  const uniqueBencanas = useMemo(() => {
    const set = new Set<string>();
    outbound.forEach(tx => set.add(tx.jenisBencana || 'Lainnya'));
    return Array.from(set).sort();
  }, [outbound]);

  // Filtered Data
  const filteredOutbound = useMemo(() => {
    return outbound.filter(tx => {
      const dateMatch = (!filters.startDate || tx.tanggal >= filters.startDate) && 
                         (!filters.endDate || tx.tanggal <= filters.endDate);
      const periodMatch = isInPeriod(tx.tanggal, filters.periode);
      const kecamatanMatch = !filters.kecamatan || getKecamatan(tx.alamat) === filters.kecamatan;
      const bencanaMatch = !filters.jenisBencana || tx.jenisBencana === filters.jenisBencana;
      const subBencanaMatch = !filters.subJenisBencana || tx.subJenisBencana === filters.subJenisBencana;
      
      // Filter by category if selected
      const categoryMatch = !filters.kategori || tx.items.some(item => {
        const p = products.find(prod => prod.id === item.productId);
        return p?.kategori === filters.kategori;
      });

      const typeMatch = filters.tipeTransaksi === 'Semua' || filters.tipeTransaksi === 'Keluar';

      return dateMatch && periodMatch && kecamatanMatch && bencanaMatch && subBencanaMatch && categoryMatch && typeMatch;
    });
  }, [outbound, filters, products]);

  const filteredInbound = useMemo(() => {
    return inbound.filter(entry => {
      const dateMatch = (!filters.startDate || entry.tanggal >= filters.startDate) && 
                         (!filters.endDate || entry.tanggal <= filters.endDate);
      const periodMatch = isInPeriod(entry.tanggal, filters.periode);
      
      const p = products.find(prod => prod.id === entry.productId);
      const categoryMatch = !filters.kategori || p?.kategori === filters.kategori;

      const typeMatch = filters.tipeTransaksi === 'Semua' || filters.tipeTransaksi === 'Masuk';

      return dateMatch && periodMatch && categoryMatch && typeMatch;
    });
  }, [inbound, filters, products]);

  // Detailed Item Recap Data
  const itemRecapData = useMemo(() => {
    const recap: Record<string, { 
      productId: string; 
      namaBarang: string; 
      kategori: string; 
      satuan: string; 
      harga: number; 
      jumlahMasuk: number; 
      jumlahKeluar: number; 
      stok: number;
    }> = {};

    // Initialize with products that match category filter
    products.forEach(p => {
      if (!filters.kategori || p.kategori === filters.kategori) {
        recap[p.id] = {
          productId: p.id,
          namaBarang: p.namaBarang,
          kategori: p.kategori || 'Lain-lain',
          satuan: p.satuan,
          harga: p.harga,
          jumlahMasuk: 0,
          jumlahKeluar: 0,
          stok: calculateStock(p.id)
        };
      }
    });

    // Add inbound data
    filteredInbound.forEach(entry => {
      if (recap[entry.productId]) {
        recap[entry.productId].jumlahMasuk += entry.jumlah;
      }
    });

    // Add outbound data
    filteredOutbound.forEach(tx => {
      tx.items.forEach(item => {
        if (recap[item.productId]) {
          recap[item.productId].jumlahKeluar += item.jumlah;
        }
      });
    });

    // Filter by transaction type
    return Object.values(recap).filter(item => {
      if (filters.tipeTransaksi === 'Masuk') return item.jumlahMasuk > 0;
      if (filters.tipeTransaksi === 'Keluar') return item.jumlahKeluar > 0;
      if (filters.tipeTransaksi === 'Stock') return true; // Show all matching category
      return item.jumlahMasuk > 0 || item.jumlahKeluar > 0;
    }).sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  }, [products, filteredInbound, filteredOutbound, filters, calculateStock]);

  const grandTotal = useMemo(() => {
    return itemRecapData.reduce((acc, item) => {
      let amount = 0;
      if (filters.tipeTransaksi === 'Masuk') amount = item.jumlahMasuk;
      else if (filters.tipeTransaksi === 'Keluar') amount = item.jumlahKeluar;
      else if (filters.tipeTransaksi === 'Stock') amount = item.stok;
      else amount = item.jumlahMasuk + item.jumlahKeluar; // Default view
      
      return acc + (amount * item.harga);
    }, 0);
  }, [itemRecapData, filters.tipeTransaksi]);

  // Grouped Item Recap Data
  const groupedRecapData = useMemo<Record<string, any[]>>(() => {
    const groups: Record<string, any[]> = {};
    itemRecapData.forEach(item => {
      const cat = item.kategori || 'Lain-lain';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [itemRecapData]);

  const handleExportPDF = () => {
    const columns = [
      { header: 'Nama Barang', dataKey: 'namaBarang' },
      { header: 'Kategori', dataKey: 'kategori' },
      { 
        header: filters.tipeTransaksi === 'Masuk' ? 'Masuk' : filters.tipeTransaksi === 'Keluar' ? 'Keluar' : filters.tipeTransaksi === 'Stock' ? 'Stok' : 'Total Vol', 
        dataKey: 'volume',
        align: 'center' as const,
        format: (v: any) => v.toLocaleString('id-ID')
      },
      { 
        header: 'Harga Satuan', 
        dataKey: 'harga', 
        align: 'right' as const, 
        format: (v: any) => formatCurrency(v) 
      },
      { 
        header: 'Total Nominal', 
        dataKey: 'totalNominal', 
        align: 'right' as const, 
        format: (v: any) => formatCurrency(v) 
      }
    ];

    const flatData = itemRecapData.map(item => {
      let volume = 0;
      if (filters.tipeTransaksi === 'Masuk') volume = item.jumlahMasuk;
      else if (filters.tipeTransaksi === 'Keluar') volume = item.jumlahKeluar;
      else if (filters.tipeTransaksi === 'Stock') volume = item.stok;
      else volume = item.jumlahMasuk + item.jumlahKeluar;

      return {
        ...item,
        volume,
        totalNominal: volume * item.harga
      };
    });

    const narrative = `Laporan rekapitulasi barang berdasarkan filter: ${filters.tipeTransaksi} | Periode: ${filters.periode} | Kategori: ${filters.kategori || 'Semua'}`;
    
    generateReportPDF(
      'REKAP DATA BARANG & NOMINAL', 
      columns, 
      flatData, 
      settings, 
      narrative,
      { label: 'GRAND TOTAL', value: formatCurrency(grandTotal) }
    );
  };

  // 1. Rekapan Distribusi per Kecamatan
  const kecamatanData = useMemo(() => {
    const counts: Record<string, { name: string; value: number; originalItems: OutboundTransaction[] }> = {};
    filteredOutbound.forEach(tx => {
      const key = getKecamatan(tx.alamat);
      
      if (!counts[key]) {
        counts[key] = { name: key, value: 0, originalItems: [] };
      }
      counts[key].value += 1;
      counts[key].originalItems.push(tx);
    });
    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [filteredOutbound]);

  // 2. Jenis Bencana (Hierarchical)
  const bencanaData = useMemo(() => {
    const counts: Record<string, { name: string; value: number; originalItems: OutboundTransaction[]; hasSub: boolean }> = {};
    
    filteredOutbound.forEach(tx => {
      if (disasterView.level === 'category') {
        const key = tx.jenisBencana || 'Lainnya';
        if (!counts[key]) {
          counts[key] = { name: key, value: 0, originalItems: [], hasSub: false };
        }
        counts[key].value += 1;
        counts[key].originalItems.push(tx);
        if (tx.subJenisBencana) counts[key].hasSub = true;
      } else {
        // Sub-category level
        if (tx.jenisBencana === disasterView.category) {
          const key = tx.subJenisBencana || 'Lainnya';
          if (!counts[key]) {
            counts[key] = { name: key, value: 0, originalItems: [], hasSub: false };
          }
          counts[key].value += 1;
          counts[key].originalItems.push(tx);
        }
      }
    });
    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [filteredOutbound, disasterView]);

  // 3. Keuangan (Nilai Aset)
  const keuanganData = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;

    filteredInbound.forEach(entry => {
      const product = products.find(p => p.id === entry.productId);
      if (product) {
        totalMasuk += entry.jumlah * product.harga;
      }
    });

    filteredOutbound.forEach(tx => {
      tx.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          totalKeluar += item.jumlah * product.harga;
        }
      });
    });

    return [
      { name: 'Total Masuk', value: totalMasuk, color: '#10b981' },
      { name: 'Total Keluar', value: totalKeluar, color: '#ef4444' },
      { name: 'Sisa Stok', value: totalMasuk - totalKeluar, color: '#3b82f6' }
    ];
  }, [products, filteredInbound, filteredOutbound]);

  // 4. Urgensi Tambah Stok
  const urgensiStok = useMemo(() => {
    return products.map(p => {
      const stock = calculateStock(p.id);
      const totalIn = inbound.filter(i => i.productId === p.id).reduce((acc, i) => acc + i.jumlah, 0);
      // Urgency score: lower stock relative to total in
      const ratio = totalIn > 0 ? (stock / totalIn) : 0;
      return {
        name: p.namaBarang,
        stock,
        ratio: Math.round(ratio * 100),
        id: p.id
      };
    })
    .filter(p => p.stock < 50) // Threshold for urgency
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);
  }, [products, inbound, calculateStock]);

  // 5. Tren Bulanan (Barang Keluar)
  const trenBulanan = useMemo(() => {
    const months: Record<string, { month: string; count: number }> = {};
    filteredOutbound.forEach(tx => {
      const date = new Date(tx.tanggal);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) {
        months[key] = { month: key, count: 0 };
      }
      months[key].count += 1;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredOutbound]);

  // 6. Kategori Dokumen
  const dokumenData = useMemo(() => {
    const counts: Record<string, { name: string; value: number; originalItems: any[] }> = {};
    const docs = documents || [];
    docs.forEach(doc => {
      const key = doc.category || 'Lainnya';
      if (!counts[key]) {
        counts[key] = { name: key, value: 0, originalItems: [] };
      }
      counts[key].value += 1;
      counts[key].originalItems.push(doc);
    });
    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [documents]);

  const handleChartClick = (data: any, title: string) => {
    if (title === 'Detail Jenis Bencana') {
      if (disasterView.level === 'category' && data.hasSub) {
        setDisasterView({ level: 'sub', category: data.name });
        return;
      }
      title = `Detail Bencana: ${data.name}`;
    }

    if (data && data.originalItems) {
      setSelectedData({ title, items: data.originalItems });
    } else if (data && data.name) {
      // For items like stock urgency, maybe show product details
      if (title === 'Urgensi Tambah Stok') {
        const product = products.find(p => p.namaBarang === data.name);
        if (product) {
          setSelectedData({ title: `Detail Stok: ${data.name}`, items: [product] });
        }
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-ios bg-ios-blue-light/10 text-ios-blue-light dark:bg-ios-blue-dark/10 dark:text-ios-blue-dark">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">REKAP INDIKATOR</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Visualisasi Data & Analitik Sistem</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-ios font-bold text-sm transition-all ${isFilterOpen ? 'bg-ios-blue-light text-white' : 'bg-white dark:bg-ios-secondary-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 shadow-sm'}`}
        >
          <Filter size={18} />
          ULTIMATE FILTER
          <ChevronDown size={16} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Ultimate Filter Section */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg p-6 shadow-md border border-ios-blue-light/20 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Calendar size={10} /> Tanggal Mulai
              </label>
              <input 
                type="date" 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-ios-blue-light/20"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Calendar size={10} /> Tanggal Akhir
              </label>
              <input 
                type="date" 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-ios-blue-light/20"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <MapPin size={10} /> Kecamatan
              </label>
              <select 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-ios-blue-light/20"
                value={filters.kecamatan}
                onChange={(e) => setFilters({...filters, kecamatan: e.target.value})}
              >
                <option value="">Semua Kecamatan</option>
                {uniqueKecamatans.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <AlertTriangle size={10} /> Jenis Bencana
              </label>
              <select 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-ios-blue-light/20"
                value={filters.jenisBencana}
                onChange={(e) => setFilters({...filters, jenisBencana: e.target.value})}
              >
                <option value="">Semua Bencana</option>
                {uniqueBencanas.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Boxes size={10} /> Kategori Barang
              </label>
              <select 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-ios-blue-light/20"
                value={filters.kategori}
                onChange={(e) => setFilters({...filters, kategori: e.target.value})}
              >
                <option value="">Semua Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <LayoutDashboard size={10} /> Tipe Transaksi
              </label>
              <select 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-ios-blue-light/20"
                value={filters.tipeTransaksi}
                onChange={(e) => setFilters({...filters, tipeTransaksi: e.target.value})}
              >
                <option value="Semua">Semua Transaksi</option>
                <option value="Masuk">Barang Masuk</option>
                <option value="Keluar">Barang Keluar</option>
                <option value="Stock">Posisi Stok</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <TrendingUp size={10} /> Periode Waktu
              </label>
              <select 
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-ios-blue-light/20"
                value={filters.periode}
                onChange={(e) => setFilters({...filters, periode: e.target.value})}
              >
                <option value="Semua">Semua Waktu</option>
                <option value="Bulan Ini">Bulan Ini</option>
                <option value="Triwulan Ini">Triwulan Ini</option>
                <option value="Tahun Ini">Tahun Ini</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setFilters({ startDate: '', endDate: '', kecamatan: '', jenisBencana: '', subJenisBencana: '', kategori: '', tipeTransaksi: 'Semua', periode: 'Semua' })}
              className="flex items-center gap-2 text-[10px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
            >
              <RotateCcw size={12} /> Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* 7. Rekap Data Barang (Table) - MOVED TO TOP */}
      <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <PackageSearch className="text-ios-blue-light" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">Rekap Data Barang & Nominal</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase">Grand Total</span>
              <span className="text-lg font-black text-ios-blue-light">{formatCurrency(grandTotal)}</span>
            </div>
            <button 
              onClick={handleExportPDF}
              className="p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-ios hover:bg-red-100 transition-colors"
              title="Export PDF"
            >
              <Download size={18}/>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b dark:border-white/5">
              <tr>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4 text-center">
                  {filters.tipeTransaksi === 'Masuk' ? 'Masuk' : 
                   filters.tipeTransaksi === 'Keluar' ? 'Keluar' : 
                   filters.tipeTransaksi === 'Stock' ? 'Stok' : 'Total Vol'}
                </th>
                <th className="px-6 py-4 text-right">Harga Satuan</th>
                <th className="px-6 py-4 text-right">Total Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {Object.entries(groupedRecapData).map(([category, items]: [string, any[]]) => (
                <React.Fragment key={category}>
                  <tr className="bg-slate-100/50 dark:bg-white/5">
                    <td colSpan={4} className="px-6 py-2">
                      <span className="text-[10px] font-black text-ios-blue-light uppercase tracking-widest">{category}</span>
                    </td>
                  </tr>
                  {items.map((item) => {
                    let volume = 0;
                    if (filters.tipeTransaksi === 'Masuk') volume = item.jumlahMasuk;
                    else if (filters.tipeTransaksi === 'Keluar') volume = item.jumlahKeluar;
                    else if (filters.tipeTransaksi === 'Stock') volume = item.stok;
                    else volume = item.jumlahMasuk + item.jumlahKeluar;

                    const totalNominal = volume * item.harga;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.namaBarang}</span>
                            <span className="text-[10px] text-slate-400 font-mono uppercase">{item.productId.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{volume.toLocaleString('id-ID')}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.satuan}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                          {formatCurrency(item.harga)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(totalNominal)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {itemRecapData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic font-medium">
                    Tidak ada data barang yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Distribusi per Kecamatan */}
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg p-6 shadow-sm border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="text-ios-blue-light" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white">Distribusi per Kecamatan</h3>
            </div>
            <div className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-slate-500">BAR CHART</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={kecamatanData} 
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    handleChartClick(data.activePayload[0].payload, 'Detail Distribusi Kecamatan');
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'rgba(0, 122, 255, 0.05)' }}
                />
                <Bar dataKey="value" fill={settings.themeColor} radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Jenis Bencana */}
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg p-6 shadow-sm border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white">Jenis Bencana</h3>
                {disasterView.level === 'sub' && (
                  <button 
                    onClick={() => setDisasterView({ level: 'category' })}
                    className="flex items-center gap-1 text-[10px] font-black text-ios-blue-light uppercase mt-0.5 hover:opacity-70 transition-opacity"
                  >
                    <ChevronLeft size={12} /> Kembali ke Kategori
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-slate-500 uppercase">
                {disasterView.level === 'category' ? 'Kategori' : disasterView.category}
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bencanaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => handleChartClick(data, 'Detail Jenis Bencana')}
                  animationDuration={1500}
                >
                  {bencanaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string, props: any) => {
                    const item = props.payload;
                    return [`${value} Kejadian`, item.hasSub && disasterView.level === 'category' ? `${name} (Klik untuk Detail)` : name];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Keuangan (Nilai Aset) */}
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg p-6 shadow-sm border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Wallet className="text-emerald-500" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white">Nilai Aset (Keuangan)</h3>
            </div>
            <div className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-slate-500">SUMMARY</div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {keuanganData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-ios bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={keuanganData}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1500}>
                  {keuanganData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Urgensi Tambah Stok */}
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg p-6 shadow-sm border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PackageSearch className="text-red-500" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white">Urgensi Tambah Stok</h3>
            </div>
            <div className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-slate-500">LOW STOCK</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={urgensiStok} 
                layout="vertical"
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    handleChartClick(data.activePayload[0].payload, 'Urgensi Tambah Stok');
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={9} width={100} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="stock" fill="#ef4444" radius={[0, 4, 4, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Tren Bulanan */}
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg p-6 shadow-sm border border-slate-200 dark:border-white/5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-ios-blue-light" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white">Tren Distribusi Barang (Bulanan)</h3>
            </div>
            <div className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-slate-500">AREA CHART</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trenBulanan}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={settings.themeColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={settings.themeColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="count" stroke={settings.themeColor} fillOpacity={1} fill="url(#colorCount)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Kategori Dokumen */}
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg p-6 shadow-sm border border-slate-200 dark:border-white/5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="text-ios-blue-light" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white">Kategori Dokumen Terarsip</h3>
            </div>
            <div className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-slate-500">PIE CHART</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dokumenData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => handleChartClick(data, 'Detail Kategori Dokumen')}
                  animationDuration={1500}
                >
                  {dokumenData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-ios-secondary-dark w-full max-w-2xl rounded-ios-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/10">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-ios bg-ios-blue-light/10 text-ios-blue-light">
                  <Info size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedData.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedData(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-3">
                {selectedData.items.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-ios bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-ios-blue-light/30 transition-all">
                    {item.penerima ? (
                      // Outbound Transaction
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 dark:text-white">{item.penerima}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{item.tanggal}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">{item.alamat}</p>
                        <div className="mt-2 space-y-2">
                          {item.items.map((it: any, i: number) => {
                            const p = products.find(prod => prod.id === it.productId);
                            const subtotal = it.jumlah * (p?.harga || 0);
                            return (
                              <div key={i} className="flex items-center justify-between bg-white dark:bg-white/5 p-2 rounded-ios border border-slate-100 dark:border-white/5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p?.namaBarang || 'Unknown'}</span>
                                  <span className="text-[10px] text-slate-500">{it.jumlah} {p?.satuan} x {formatCurrency(p?.harga || 0)}</span>
                                </div>
                                <span className="text-xs font-black text-ios-blue-light">{formatCurrency(subtotal)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Total Transaksi</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(item.items.reduce((acc: number, it: any) => {
                              const p = products.find(prod => prod.id === it.productId);
                              return acc + (it.jumlah * (p?.harga || 0));
                            }, 0))}
                          </span>
                        </div>
                      </div>
                    ) : item.category ? (
                      // Archive Document
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 dark:text-white">{item.title}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{item.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.description || 'Tidak ada deskripsi'}</p>
                        <div className="mt-2">
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full uppercase">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Product
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{item.namaBarang}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.kodeBarang}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-500">Stok: {calculateStock(item.id)} {item.satuan}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Harga: {formatCurrency(item.harga)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {selectedData.items.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-slate-400 font-bold italic">Tidak ada data untuk ditampilkan.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedData(null)}
                className="px-6 py-2.5 rounded-ios bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapIndikator;
