
import React, { useMemo, useState } from 'react';
import { useInventory } from '../App';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlertOctagon,
  BarChart3,
  MapPin,
  Box,
  Inbox,
  TrendingUp,
  X,
  History,
  Smartphone,
  Info,
  ChevronRight,
  Users,
  Calendar,
  Activity,
  Search,
  Sparkles
} from 'lucide-react';
import { formatIndoDate } from '../types';

// 16 Canonical Sub-districts (Kecamatan) of Blora
const CANONICAL_KECAMATAN = [
  'Todanan', 'Japah', 'Tunjungan', 'Blora', 'Bogorejo', 
  'Jepon', 'Jiken', 'Sambong', 'Cepu', 'Kedungtuban', 
  'Kradenan', 'Randublatung', 'Jati', 'Kunduran', 'Ngawen', 'Banjarejo'
];

const getCanonicalKecamatan = (address: string | undefined): string => {
  if (!address) return 'Lainnya';
  const lowercase = address.toLowerCase();
  
  // Direct matches
  if (lowercase.includes('todanan')) return 'Todanan';
  if (lowercase.includes('japah')) return 'Japah';
  if (lowercase.includes('tunjungan')) return 'Tunjungan';
  if (lowercase.includes('bogorejo')) return 'Bogorejo';
  if (lowercase.includes('jepon')) return 'Jepon';
  if (lowercase.includes('jiken')) return 'Jiken';
  if (lowercase.includes('sambong')) return 'Sambong';
  if (lowercase.includes('cepu')) return 'Cepu';
  if (lowercase.includes('kedungtuban') || lowercase.includes('kedung tuban')) return 'Kedungtuban';
  if (lowercase.includes('kradenan')) return 'Kradenan';
  if (lowercase.includes('randublatung') || lowercase.includes('randu blatung')) return 'Randublatung';
  if (lowercase.includes('jati')) return 'Jati';
  if (lowercase.includes('kunduran')) return 'Kunduran';
  if (lowercase.includes('ngawen')) return 'Ngawen';
  if (lowercase.includes('banjarejo')) return 'Banjarejo';
  if (lowercase.includes('blora') || lowercase.includes('kota blora')) return 'Blora';
  
  // Regex fallback: "Kec. XX" or "Kecamatan XX"
  const match = address.match(/(Kec\.\s+|Kecamatan\s+)([A-Za-z]+)/i);
  if (match) {
    const rawName = match[2].trim();
    const capitalized = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    const cleanList = CANONICAL_KECAMATAN.map(v => v.toLowerCase());
    const matchedIndex = cleanList.indexOf(capitalized.toLowerCase());
    if (matchedIndex !== -1) {
      return CANONICAL_KECAMATAN[matchedIndex];
    }
    return capitalized;
  }
  
  return 'Lainnya';
};

// 16 Kecamatan Blora with representative geographic SVG paths and colors mapped closely to the map image
// Represented as a perfectly aligned, clean geographic cartogram grid to solve overlapping curves
const BLORA_KECAMATAN_DATA = [
  { id: 'todanan', name: 'Todanan', path: 'M 25,30 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 65, labelY: 70, originalColor: '#059669' }, // Emerald
  { id: 'japah', name: 'Japah', path: 'M 145,30 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 185, labelY: 70, originalColor: '#047857' }, // Green
  { id: 'tunjungan', name: 'Tunjungan', path: 'M 265,30 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 305, labelY: 70, originalColor: '#1d4ed8' }, // Blue
  { id: 'bogorejo', name: 'Bogorejo', path: 'M 385,30 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 425, labelY: 70, originalColor: '#7c3aed' }, // Purple

  { id: 'kunduran', name: 'Kunduran', path: 'M 25,130 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 65, labelY: 170, originalColor: '#0284c7' }, // Light Blue
  { id: 'ngawen', name: 'Ngawen', path: 'M 145,130 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 185, labelY: 170, originalColor: '#ec4899' }, // Pink
  { id: 'banjarejo', name: 'Banjarejo', path: 'M 265,130 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 305, labelY: 170, originalColor: '#d97706' }, // Amber
  { id: 'blora', name: 'Blora', path: 'M 385,130 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 425, labelY: 170, originalColor: '#f43f5e' }, // Rose

  { id: 'jati', name: 'Jati', path: 'M 25,230 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 65, labelY: 270, originalColor: '#84cc16' }, // Lime
  { id: 'randublatung', name: 'Randublatung', path: 'M 145,230 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 185, labelY: 270, originalColor: '#ea580c' }, // Orange
  { id: 'jepon', name: 'Jepon', path: 'M 265,230 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 305, labelY: 270, originalColor: '#14b8a6' }, // Teal
  { id: 'jiken', name: 'Jiken', path: 'M 385,230 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 425, labelY: 270, originalColor: '#06b6d4' }, // Cyan

  { id: 'kradenan', name: 'Kradenan', path: 'M 25,330 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 65, labelY: 370, originalColor: '#65a30d' }, // Dark Olive
  { id: 'kedungtuban', name: 'Kedungtuban', path: 'M 145,330 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 185, labelY: 370, originalColor: '#4f46e5' }, // Indigo
  { id: 'sambong', name: 'Sambong', path: 'M 265,330 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 305, labelY: 370, originalColor: '#b45309' }, // Brown
  { id: 'cepu', name: 'Cepu', path: 'M 385,330 h 80 a 10,10 0 0 1 10,10 v 60 a 10,10 0 0 1 -10,10 h -80 a 10,10 0 0 1 -10,-10 v -60 a 10,10 0 0 1 10,-10 Z', labelX: 425, labelY: 370, originalColor: '#dc2626' } // Red
];

const Dashboard: React.FC = () => {
  const { products, inbound, outbound, calculateStock, settings } = useInventory();
  const [selectedKecName, setSelectedKecName] = useState<string | null>(null);
  const [hoveredKecId, setHoveredKecId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'stok' | 'distribusi'>('distribusi');

  // 1. Statistik Utama
  const stats = useMemo(() => {
    const jenisLogistik = products.length;
    const totalMasuk = inbound.reduce((acc, i) => acc + i.jumlah, 0);
    const totalKeluar = outbound.reduce((acc, tx) => 
      acc + tx.items.reduce((sum, item) => sum + item.jumlah, 0), 0
    );
    const totalSisaBarang = products.reduce((acc, p) => acc + calculateStock(p.id), 0);

    const totalMasukRp = inbound.reduce((acc, i) => {
      const p = products.find(prod => prod.id === i.productId);
      return acc + (i.jumlah * (p?.harga || 0));
    }, 0);

    const totalKeluarRp = outbound.reduce((acc, tx) => 
      acc + tx.items.reduce((sum, item) => {
        const p = products.find(prod => prod.id === item.productId);
        return sum + (item.jumlah * (p?.harga || 0));
      }, 0), 0
    );

    const totalStokRp = products.reduce((acc, p) => acc + (calculateStock(p.id) * p.harga), 0);

    return [
      { label: 'Jenis Logistik', value: jenisLogistik, subValue: 'Varian Terdaftar', icon: <Package size={18}/>, color: 'blue' },
      { label: 'Total Unit Masuk', value: totalMasuk, subValue: `Rp ${totalMasukRp.toLocaleString('id-ID')}`, icon: <ArrowDownCircle size={18}/>, color: 'emerald' },
      { label: 'Total Unit Keluar', value: totalKeluar, subValue: `Rp ${totalKeluarRp.toLocaleString('id-ID')}`, icon: <ArrowUpCircle size={18}/>, color: 'orange' },
      { label: 'Saldo Akhir', value: totalSisaBarang, subValue: `Rp ${totalStokRp.toLocaleString('id-ID')}`, icon: <TrendingUp size={18}/>, color: 'indigo' },
    ];
  }, [products, inbound, outbound, calculateStock]);

  // 2. Data Grafik Ketersediaan Stok (UTAMA & BESAR)
  const stockAvailabilityData = useMemo(() => {
    return products
      .map(p => ({ 
        id: p.id,
        name: p.namaBarang, 
        stock: calculateStock(p.id),
        code: p.kodeBarang,
        satuan: p.satuan
      }))
      .sort((a, b) => b.stock - a.stock);
  }, [products, calculateStock]);

  // 3. Data Grafik Distribusi Per Kecamatan (Tampilkan SEMUA - Orange)
  const distributionByKecamatan = useMemo(() => {
    const map = new Map<string, number>();
    
    outbound.forEach(tx => {
      const kecName = getCanonicalKecamatan(tx.alamat);
      map.set(kecName, (map.get(kecName) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [outbound]);

  const maxDist = Math.max(...distributionByKecamatan.map(d => d.value), 1);

  // 4. Barang Stok Habis (Format Grid Card)
  const outOfStockItems = useMemo(() => {
    return products.filter(p => calculateStock(p.id) <= 0);
  }, [products, calculateStock]);

  // 5. Rincian Per Kecamatan
  const kecamatanDetails = useMemo(() => {
    if (!selectedKecName) return [];
    return outbound.filter(tx => {
      const name = getCanonicalKecamatan(tx.alamat);
      return name.toLowerCase() === selectedKecName.toLowerCase();
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [selectedKecName, outbound]);

  // 6. Trend Pergerakan Bantuan (Berdasarkan Nama Penerima di Menu Keluar)
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const current = new Date().getFullYear();
    years.add(current);
    outbound.forEach(tx => {
      if (tx.tanggal) {
        const y = new Date(tx.tanggal).getFullYear();
        if (!isNaN(y) && y > 2000 && y < 2100) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [outbound]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | null>(null);
  const [monthSearchQuery, setMonthSearchQuery] = useState('');

  // Perhitungan Data Trend Bulanan Berdasarkan Jumlah Nama Penerima di Menu Keluar
  const monthlyTrendData = useMemo(() => {
    return MONTH_LABELS.map((name, index) => {
      const monthTxs = outbound.filter(tx => {
        if (!tx.tanggal) return false;
        const d = new Date(tx.tanggal);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === selectedYear && d.getMonth() === index;
      });

      // Validasi penerima di menu keluar
      const validTxs = monthTxs.filter(tx => tx.penerima && tx.penerima.trim().length > 0);
      const recipientNames = Array.from(new Set(validTxs.map(tx => tx.penerima.trim())));

      const penerimaCount = validTxs.length;
      const totalTransaksi = monthTxs.length;
      const totalItems = monthTxs.reduce((sum, tx) => 
        sum + (tx.items || []).reduce((iSum, it) => iSum + (it.jumlah || 0), 0), 0
      );

      return {
        month: name,
        monthIndex: index,
        penerima: penerimaCount,
        uniquePenerima: recipientNames.length,
        transaksi: totalTransaksi,
        totalItems,
        recipientList: recipientNames,
        transactions: monthTxs
      };
    });
  }, [outbound, selectedYear]);

  // Statistik Ringkasan Trend
  const trendStats = useMemo(() => {
    const totalPenerima = monthlyTrendData.reduce((acc, curr) => acc + curr.penerima, 0);
    const totalTransaksi = monthlyTrendData.reduce((acc, curr) => acc + curr.transaksi, 0);
    const totalLogistik = monthlyTrendData.reduce((acc, curr) => acc + curr.totalItems, 0);
    const avgPenerima = totalPenerima > 0 ? Number((totalPenerima / 12).toFixed(1)) : 0;
    
    let peak = monthlyTrendData[0];
    monthlyTrendData.forEach(m => {
      if (m.penerima > peak.penerima) peak = m;
    });

    return {
      totalPenerima,
      totalTransaksi,
      totalLogistik,
      avgPenerima,
      peakMonth: peak.penerima > 0 ? peak : null
    };
  }, [monthlyTrendData]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-24 md:pb-10">
      
      {/* PWA Mobile Standing Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="md:hidden p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
              <Smartphone size={16}/>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
              Monitoring Realtime
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-widest">
            {settings.warehouseName} <span className="mx-2 opacity-30">|</span> Standalone PWA
          </p>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-4 md:p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative active:scale-95 touch-manipulation">
            <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${s.color}-500/5 rounded-full`}></div>
            <div className="flex flex-col md:flex-row md:items-center gap-3 relative z-10">
              <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-ios bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 shrink-0`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5 truncate">
                  {s.label}
                </p>
                <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {s.value.toLocaleString('id-ID')}
                </p>
                <p className={`text-[9px] font-bold mt-1 ${s.color === 'red' ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {s.subValue}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Pergerakan Bantuan & Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* GRAFIK TREND PERGERAKAN BANTUAN (BERDASARKAN PENERIMA) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div>
              <h3 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-[#3b5bfd] animate-pulse"/> Trend Pergerakan Bantuan
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Jumlah pergerakan bantuan per bulan dilihat dari nama penerima di menu keluar
              </p>
            </div>

            {/* Top Right: Legend & Year Selector */}
            <div className="flex items-center gap-3">
              {/* Legend matching reference image */}
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b5bfd]"></span>
                  <span className="text-slate-700 dark:text-slate-300">Penerima Bantuan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>
                  <span className="text-slate-700 dark:text-slate-300">Total Penyaluran</span>
                </div>
              </div>

              {/* Year Selector */}
              {availableYears.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-black rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>Tahun {year}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-4 md:p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[500px]">
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Recharts Area & Line Chart */}
            <div className="w-full relative z-10">
              <div className="h-[340px] md:h-[370px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyTrendData}
                    margin={{ top: 25, right: 15, left: -20, bottom: 5 }}
                    onClick={(data: any) => {
                      if (data && data.activePayload && data.activePayload.length > 0) {
                        setSelectedMonthIdx(data.activePayload[0].payload.monthIndex);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="colorTrendPenerima" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b5bfd" stopOpacity={0.45}/>
                        <stop offset="50%" stopColor="#3b5bfd" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="#3b5bfd" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>

                    <CartesianGrid 
                      strokeDasharray="4 4" 
                      vertical={false} 
                      stroke="currentColor" 
                      className="text-slate-200/80 dark:text-white/5" 
                    />

                    <XAxis 
                      dataKey="month" 
                      fontSize={11} 
                      fontWeight={700} 
                      tick={{ fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={8} 
                    />

                    <YAxis 
                      fontSize={10} 
                      fontWeight={700} 
                      tick={{ fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dx={-4}
                      domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax * 1.25), 10)]}
                      allowDecimals={false}
                    />

                    {trendStats.avgPenerima > 0 && (
                      <ReferenceLine 
                        y={trendStats.avgPenerima} 
                        stroke="#94a3b8" 
                        strokeDasharray="4 4" 
                        strokeOpacity={0.75} 
                        label={{ 
                          value: `Rata-rata (${trendStats.avgPenerima})`, 
                          fill: '#94a3b8', 
                          fontSize: 9, 
                          fontWeight: 700, 
                          position: 'insideTopRight' 
                        }} 
                      />
                    )}

                    <Tooltip 
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0]?.payload;
                          const penerimaVal = payload.find((p: any) => p.dataKey === 'penerima')?.value ?? 0;
                          const transaksiVal = payload.find((p: any) => p.dataKey === 'transaksi')?.value ?? 0;

                          return (
                            <div className="flex flex-col items-center pointer-events-none select-none z-50">
                              {/* Floating Top Pill Badge matching reference image */}
                              <div className="mb-2 bg-[#3b5bfd] text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-lg shadow-blue-500/40 border border-blue-400/40 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                <span>{penerimaVal}</span>
                                <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">Penerima</span>
                              </div>

                              {/* Detail Popover Card */}
                              <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 text-xs min-w-[210px] backdrop-blur-md space-y-2">
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
                                  <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-300">
                                    Bulan {label} {selectedYear}
                                  </span>
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 font-black px-2 py-0.5 rounded-full">
                                    Penyaluran
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[11px]">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-blue-300 font-semibold">
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#3b5bfd] ring-2 ring-blue-400/30"></span>
                                      Penerima Bantuan:
                                    </span>
                                    <span className="font-black text-white">{penerimaVal} Nama</span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] ring-2 ring-rose-400/30"></span>
                                      Frekuensi Penyaluran:
                                    </span>
                                    <span className="font-black text-white">{transaksiVal} Transaksi</span>
                                  </div>

                                  {data?.totalItems > 0 && (
                                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5 text-[10px] text-slate-400">
                                      <span>Total Barang Keluar:</span>
                                      <span className="font-bold text-slate-200">{data.totalItems.toLocaleString('id-ID')} Unit</span>
                                    </div>
                                  )}
                                </div>

                                {data?.recipientList && data.recipientList.length > 0 && (
                                  <div className="pt-1.5 border-t border-white/10">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                      Penerima di Bulan Ini:
                                    </p>
                                    <div className="space-y-0.5 text-[10px] text-blue-200">
                                      {data.recipientList.slice(0, 2).map((rName: string, idx: number) => (
                                        <p key={idx} className="truncate max-w-[190px]">• {rName}</p>
                                      ))}
                                      {data.recipientList.length > 2 && (
                                        <p className="text-[9px] text-slate-400 italic">
                                          +{data.recipientList.length - 2} penerima lainnya
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="text-[9px] text-blue-300/80 pt-1 text-center font-medium border-t border-white/5">
                                  ➔ Klik titik untuk rincian lengkap
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }} 
                      cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '0 0' }} 
                    />

                    {/* Smooth Blue Area curve with fill */}
                    <Area 
                      type="monotone" 
                      dataKey="penerima" 
                      name="Jumlah Penerima" 
                      stroke="#3b5bfd" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTrendPenerima)" 
                      activeDot={{ r: 6.5, stroke: '#ffffff', strokeWidth: 2.5, fill: '#3b5bfd' }} 
                    />

                    {/* Smooth Red Line curve without fill */}
                    <Line 
                      type="monotone" 
                      dataKey="transaksi" 
                      name="Total Penyaluran" 
                      stroke="#f43f5e" 
                      strokeWidth={2.5} 
                      dot={false} 
                      activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#f43f5e' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Metrics Bar Underneath */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Penerima ({selectedYear})</p>
                <p className="text-base font-black text-[#3b5bfd] mt-0.5">
                  {trendStats.totalPenerima.toLocaleString('id-ID')} <span className="text-[10px] font-medium text-slate-400">Nama</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Bulanan</p>
                <p className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {trendStats.avgPenerima} <span className="text-[10px] font-medium text-slate-400">Penerima</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Puncak Penyaluran</p>
                <p className="text-base font-black text-rose-500 mt-0.5 truncate">
                  {trendStats.peakMonth ? `${trendStats.peakMonth.month} (${trendStats.peakMonth.penerima})` : '-'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Logistik Keluar</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {trendStats.totalLogistik.toLocaleString('id-ID')} <span className="text-[10px] font-medium text-slate-400">Unit</span>
                </p>
              </div>
            </div>

            <div className="mt-3 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
              <Info size={12}/> Klik titik bulan pada grafik untuk melihat rincian lengkap daftar penerima bantuan
            </div>
          </div>
        </div>

        {/* SIDEBAR DUAL-TAB PANEL (STOK LOGISTIK & LIST DISTRIBUSI KECAMATAN) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-500"/> Pusat Data Gudang
            </h3>
            {/* Elegant Pill Switchers */}
            <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/5 text-[9px] font-black uppercase">
              <button 
                onClick={() => setSidebarTab('stok')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  sidebarTab === 'stok' 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-500 dark:text-blue-400 font-black' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                Stok
              </button>
              <button 
                onClick={() => setSidebarTab('distribusi')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  sidebarTab === 'distribusi' 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-rose-500 dark:text-rose-400 font-black' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                Distribusi
              </button>
            </div>
          </div>

          <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm min-h-[500px] flex flex-col justify-between">
            {sidebarTab === 'stok' ? (
              <div className="flex flex-col h-full flex-1 justify-between">
                <div>
                  <div className="mb-5 pb-3 border-b border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Sisa Unit Logistik</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                      {stockAvailabilityData.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString('id-ID')}{' '}
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Unit</span>
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {stockAvailabilityData.map((item) => {
                      const maxVal = stockAvailabilityData[0]?.stock || 1;
                      const percent = (item.stock / maxVal) * 100;
                      const isLow = item.stock < 10 && item.stock > 0;
                      const isEmpty = item.stock <= 0;

                      return (
                        <div key={item.id} className="space-y-1.5 group">
                          <div className="flex justify-between items-end">
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-500 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{item.code}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-black ${isEmpty ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-blue-500'}`}>
                                {item.stock} <span className="text-[9px] font-medium text-slate-450 uppercase">{item.satuan}</span>
                              </p>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${isEmpty ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.max(percent, isEmpty ? 0 : 2)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5 leading-normal">
                  <Info size={12}/> Monitoring sisa unit di gudang penyimpanan
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full flex-1 justify-between">
                <div>
                  <div className="mb-5 pb-3 border-b border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Pengeluaran Logistik</p>
                    <p className="text-2xl font-black text-rose-500 mt-1">
                      {outbound.length} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Penyaluran</span>
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {BLORA_KECAMATAN_DATA.map((kec) => {
                      const value = distributionByKecamatan.find(
                        d => d.name.toLowerCase() === kec.name.toLowerCase() || 
                             d.name.toLowerCase().includes(kec.name.toLowerCase())
                      )?.value || 0;

                      const percent = (value / maxDist) * 100;

                      return (
                        <button
                          key={kec.id}
                          onClick={() => setSelectedKecName(kec.name)}
                          className="w-full flex flex-col gap-1 text-left hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-ios transition-all active:scale-[0.98] group"
                        >
                          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wide">
                            <span className="text-slate-700 dark:text-slate-200 group-hover:text-rose-500 transition-colors flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: kec.originalColor }}></span>
                              {kec.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              value > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                            }`}>
                              {value} Kali
                            </span>
                          </div>
                          {value > 0 ? (
                            <div className="h-1 w-full bg-slate-105 dark:bg-white/5 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          ) : (
                            <span className="text-[8px] text-slate-400/50 italic mt-0.5">Belum ada penyaluran</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5 leading-normal">
                  <Info size={12}/> Klik kecamatan untuk melihat tanda terima harian
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STOK HABIS (MODERN CARD GRID) */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-4 flex items-center gap-2">
          <AlertOctagon size={16}/> Logistik Kosong (Peringatan Sistem)
        </h3>
        {outOfStockItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {outOfStockItems.map(item => (
              <div key={item.id} className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg border border-red-100 dark:border-red-900/10 shadow-sm hover:shadow-md transition-all group active:scale-95 overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 text-red-500 opacity-5 group-hover:scale-125 transition-transform duration-700">
                  <Inbox size={120}/>
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-ios bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                      <Inbox size={20}/>
                    </div>
                    <div className="bg-red-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase">
                      STOK HABIS
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {item.namaBarang}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
                      {item.code}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-slate-400">Status</span>
                    <span className="text-red-500">SEGERA ISI ULANG</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-500 p-8 rounded-ios-lg text-white text-center space-y-3 shadow-lg shadow-emerald-500/20">
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                <Package size={32}/>
             </div>
             <div>
                <p className="text-base font-bold uppercase tracking-wide">Logistik Tercukupi</p>
                <p className="text-[10px] font-medium opacity-70">Seluruh item inventaris tersedia di gudang penyimpanan.</p>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER DASHBOARD */}
      <div className="bg-slate-900 dark:bg-ios-secondary-dark p-8 md:p-10 rounded-ios-lg text-white shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <h4 className="text-xl md:text-2xl font-bold tracking-tight">Sistem Monitoring Terpadu</h4>
            </div>
            <p className="text-xs opacity-60 font-medium max-w-sm mx-auto md:mx-0 leading-relaxed text-slate-300">
              Sinkronisasi data dilakukan secara otomatis. Laporan divalidasi oleh petugas gudang pada {new Date().toLocaleTimeString('id-ID')} WIB.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/10 px-6 py-4 rounded-ios-lg backdrop-blur-2xl border border-white/10 text-center min-w-[140px]">
                <p className="text-[9px] font-bold uppercase opacity-60 mb-1 tracking-widest">Total Sisa Unit</p>
                <p className="text-3xl font-bold">
                  {stockAvailabilityData.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString('id-ID')}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* MODAL KECAMATAN */}
      {selectedKecName && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-ios-bg-light dark:bg-ios-bg-dark w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-ios-lg md:rounded-ios-lg shadow-2xl flex flex-col overflow-hidden border dark:border-white/5 animate-in slide-in-from-bottom-10 duration-300">
            <div className="p-6 border-b dark:border-white/5 flex items-center justify-between bg-orange-500 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-ios bg-white/20 flex items-center justify-center shadow-sm">
                  <MapPin size={24}/>
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{selectedKecName}</h3>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide">Detail Penyaluran Logistik</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedKecName(null)}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"
              >
                <X size={24}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8">
              {kecamatanDetails.length > 0 ? (
                <div className="space-y-6">
                  {kecamatanDetails.map((tx) => (
                    <div key={tx.id} className="bg-ios-secondary-light dark:bg-ios-secondary-dark rounded-ios-lg p-6 border border-slate-200 dark:border-white/10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                            <History size={12}/> Waktu Transaksi
                          </p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatIndoDate(tx.tanggal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Penerima Bantuan</p>
                          <p className="text-sm font-bold text-orange-600 dark:text-orange-400 italic truncate max-w-[200px]">{tx.penerima}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b dark:border-white/10">
                            <tr>
                              <th className="pb-3">Nama Logistik</th>
                              <th className="pb-3 text-right">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {tx.items.map((item, idx) => {
                              const p = products.find(prod => prod.id === item.productId);
                              return (
                                <tr key={idx}>
                                  <td className="py-3">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p?.namaBarang || '-'}</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase">{p?.kodeBarang || '-'}</p>
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.jumlah}</span>
                                    <span className="text-[10px] text-slate-400 ml-1 uppercase">{p?.satuan || 'Unit'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-20">
                  <p className="text-lg font-bold uppercase tracking-widest">NIHIL</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-ios-secondary-light dark:bg-ios-secondary-dark border-t dark:border-white/5 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedKecName(null)}
                className="w-full md:w-auto px-10 py-4 bg-ios-blue-light dark:bg-ios-blue-dark text-white font-bold text-sm rounded-ios shadow-sm active:scale-95 transition-all"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RINCIAN PENERIMA BULANAN (TREND PENERIMA BANTUAN) */}
      {selectedMonthIdx !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
          <div className="bg-ios-bg-light dark:bg-ios-bg-dark w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-ios-lg md:rounded-ios-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom-6 duration-200">
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#3b5bfd] to-indigo-600 text-white shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <Users size={22}/>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black tracking-tight">
                    Rincian Penerima: Bulan {MONTH_LABELS[selectedMonthIdx]} {selectedYear}
                  </h3>
                  <p className="text-[10px] font-bold opacity-85 uppercase tracking-widest mt-0.5">
                    {monthlyTrendData[selectedMonthIdx]?.penerima || 0} Nama Penerima • {monthlyTrendData[selectedMonthIdx]?.transaksi || 0} Transaksi Penyaluran
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedMonthIdx(null); setMonthSearchQuery(''); }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 cursor-pointer"
                title="Tutup"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Search Filter Box */}
            <div className="p-3.5 md:px-6 border-b dark:border-white/5 bg-slate-50 dark:bg-white/5">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="text"
                  value={monthSearchQuery}
                  onChange={(e) => setMonthSearchQuery(e.target.value)}
                  placeholder="Cari nama penerima bantuan, alamat, atau jenis bencana..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3b5bfd]"
                />
              </div>
            </div>

            {/* Modal Content - Recipients list */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 scrollbar-thin">
              {(() => {
                const monthTxs = (monthlyTrendData[selectedMonthIdx]?.transactions || []).filter(tx => {
                  if (!monthSearchQuery) return true;
                  const q = monthSearchQuery.toLowerCase();
                  return (
                    tx.penerima?.toLowerCase().includes(q) ||
                    tx.alamat?.toLowerCase().includes(q) ||
                    tx.jenisBencana?.toLowerCase().includes(q)
                  );
                });

                if (monthTxs.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-2.5">
                      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                        <Users size={24}/>
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {monthSearchQuery ? 'Tidak ditemukan data penerima yang cocok dengan pencarian.' : 'Belum ada transaksi penyaluran bantuan di bulan ini.'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Setiap transaksi penyaluran yang dicatat pada menu Keluar dengan nama penerima akan otomatis ditampilkan di sini.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {monthTxs.map((tx, idx) => (
                      <div 
                        key={tx.id || idx} 
                        className="bg-ios-secondary-light dark:bg-ios-secondary-dark rounded-ios p-4 border border-slate-200 dark:border-white/10 space-y-2.5 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 dark:border-white/5 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#3b5bfd] shrink-0"></span>
                              <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100">
                                {tx.penerima || 'Penerima Tanpa Nama'}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 ml-4.5">
                              {tx.alamat || 'Alamat tidak terdata'}
                            </p>
                          </div>
                          <div className="flex sm:flex-col sm:items-end justify-between">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {formatIndoDate(tx.tanggal)}
                            </span>
                            {tx.jenisBencana && (
                              <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 mt-1 uppercase">
                                {tx.jenisBencana}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items distributed to recipient */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b dark:border-white/5">
                              <tr>
                                <th className="pb-1.5">Logistik Bantuan</th>
                                <th className="pb-1.5 text-right">Jumlah</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                              {(tx.items || []).map((item, itemIdx) => {
                                const p = products.find(prod => prod.id === item.productId);
                                return (
                                  <tr key={itemIdx}>
                                    <td className="py-1.5">
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{p?.namaBarang || 'Item Logistik'}</span>
                                      {p?.kodeBarang && <span className="text-[10px] font-mono text-slate-400 ml-1.5">({p.kodeBarang})</span>}
                                    </td>
                                    <td className="py-1.5 text-right font-black text-slate-900 dark:text-slate-100">
                                      {item.jumlah.toLocaleString('id-ID')} <span className="text-[10px] font-semibold text-slate-400 uppercase">{p?.satuan || 'Unit'}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-ios-secondary-dark border-t dark:border-white/5 flex justify-end shrink-0">
              <button 
                onClick={() => { setSelectedMonthIdx(null); setMonthSearchQuery(''); }}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#3b5bfd] hover:bg-blue-700 text-white font-bold text-xs rounded-ios shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
