
import React, { useMemo, useState } from 'react';
import { useInventory } from '../App';
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
  ChevronRight
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

      {/* Peta Sebaran Realtime & Sidebar Info (Blora Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* PETA BLORA INTERAKTIF */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <MapPin size={14} className="text-rose-500 animate-pulse"/> Peta Sebaran Distribusi (Kabupaten Blora)
            </h3>
            <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-450 font-black px-2 py-0.5 rounded uppercase tracking-wider">
              Klik Kecamatan untuk Rincian
            </span>
          </div>

          <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 md:p-8 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-ios border border-slate-200 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider space-y-1.5 z-10 shadow-sm">
              <p className="text-slate-400 mb-1 font-black">Status Penyaluran</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></span>
                <span className="text-slate-600 dark:text-slate-300">0 Kali Penyaluran</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/40"></span>
                <span className="text-slate-600 dark:text-slate-300">1 - 2 Kali</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-500/60 border border-rose-500/80"></span>
                <span className="text-slate-600 dark:text-slate-300">3 - 4 Kali</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-600 border border-rose-700"></span>
                <span className="text-slate-600 dark:text-slate-300 font-extrabold text-slate-800 dark:text-white">5+ Kali</span>
              </div>
            </div>

            {/* Compass / Directions Marker */}
            <div className="absolute top-4 left-4 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2 font-bold uppercase">
              <Info size={12}/> Klik wilayah untuk melihat daftar pengiriman
            </div>

            {/* SVG Map Container */}
            <div className="w-full max-w-xl aspect-[500/450] relative z-10 flex items-center justify-center">
              <svg 
                viewBox="0 0 500 450" 
                className="w-full h-full drop-shadow-lg select-none"
              >
                {/* Compass graphic */}
                <g transform="translate(60, 200)" className="opacity-30 dark:opacity-50">
                  <line x1="0" y1="-22" x2="0" y2="22" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="-22" y1="0" x2="22" y2="0" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  <polygon points="0,-22 -4,-4 0,-8" fill="currentColor" />
                  <polygon points="0,-22 4,-4 0,-8" fill="currentColor" className="opacity-60" />
                  <text x="0" y="-28" fontSize="11" fontWeight="900" textAnchor="middle" fill="currentColor">U</text>
                </g>

                {/* Sub-district SVG geographic paths */}
                {BLORA_KECAMATAN_DATA.map((kec) => {
                  const dbName = kec.name;
                  const totalPenyaluran = distributionByKecamatan.find(
                    d => d.name.toLowerCase() === dbName.toLowerCase() || 
                         d.name.toLowerCase().includes(dbName.toLowerCase())
                  )?.value || 0;

                  const isHovered = hoveredKecId === kec.id;

                  // Define dynamic styling based on the active shipment count
                  let strokeWidth = isHovered ? 2.5 : 1.2;
                  let opacity = 0.4;
                  if (totalPenyaluran > 0) {
                    opacity = 0.5 + Math.min(totalPenyaluran * 0.12, 0.5);
                  }

                  const getDynamicFillClass = () => {
                    if (totalPenyaluran === 0) {
                      return 'fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700/60 text-slate-350 dark:text-slate-700';
                    }
                    return ''; // Handled by inline styles for vector precision
                  };

                  return (
                    <g key={kec.id}>
                      <path
                        d={kec.path}
                        className={`transition-all duration-300 cursor-pointer ${getDynamicFillClass()} ${
                          isHovered 
                            ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.35)] brightness-105 scale-[1.015]' 
                            : 'hover:brightness-105 active:scale-[0.995]'
                        }`}
                        style={totalPenyaluran > 0 ? {
                          fill: kec.originalColor,
                          fillOpacity: opacity,
                          stroke: isHovered ? '#ef4444' : 'rgba(255, 255, 255, 0.75)',
                          strokeWidth: strokeWidth,
                          transformOrigin: `${kec.labelX}px ${kec.labelY}px`
                        } : {
                          stroke: isHovered ? '#ef4444' : 'rgba(150, 150, 150, 0.25)',
                          transformOrigin: `${kec.labelX}px ${kec.labelY}px`
                        }}
                        onMouseEnter={() => setHoveredKecId(kec.id)}
                        onMouseLeave={() => setHoveredKecId(null)}
                        onClick={() => setSelectedKecName(kec.name)}
                      />

                      {/* Subdistrict Name Text Badge overlay */}
                      <g 
                        className="pointer-events-none transition-all duration-300"
                        style={{ opacity: isHovered ? 1 : 0.85 }}
                      >
                        <text
                          x={kec.labelX}
                          y={kec.labelY}
                          className="text-[9px] font-black uppercase text-center select-none"
                          textAnchor="middle"
                          fill={totalPenyaluran > 0 ? '#ffffff' : '#94a3b8'}
                          style={{
                            textShadow: totalPenyaluran > 0 ? '1px 1px 2px rgba(0,0,0,0.85), -1px -1px 2px rgba(0,0,0,0.85)' : 'none',
                          }}
                        >
                          {kec.name}
                        </text>
                        {totalPenyaluran > 0 && (
                          <text
                            x={kec.labelX}
                            y={kec.labelY + 8}
                            className="text-[8px] font-bold text-center select-none"
                            textAnchor="middle"
                            fill="#ffe4e6"
                            style={{
                              textShadow: '1px 1px 1px rgba(0,0,0,0.85)'
                            }}
                          >
                            {totalPenyaluran}x
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* Float popover details on hover */}
              {hoveredKecId && (() => {
                const kec = BLORA_KECAMATAN_DATA.find(k => k.id === hoveredKecId);
                if (!kec) return null;
                const totalPenyaluran = distributionByKecamatan.find(
                  d => d.name.toLowerCase() === kec.name.toLowerCase() || 
                       d.name.toLowerCase().includes(kec.name.toLowerCase())
                )?.value || 0;

                return (
                  <div className="absolute top-4 right-4 bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-ios border border-white/10 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150 max-w-[220px] z-20 text-left">
                    <p className="text-[10px] font-black text-rose-450 uppercase tracking-widest">Kecamatan</p>
                    <p className="text-sm font-black tracking-tight">{kec.name}</p>
                    <div className="border-t border-white/10 my-1 pt-1.5 space-y-0.5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Total Penyaluran:</p>
                      <p className="text-lg font-black text-rose-400">
                        {totalPenyaluran} <span className="text-xs font-normal text-slate-300">Transaksi</span>
                      </p>
                    </div>
                    <p className="text-[8px] font-bold italic text-rose-300 flex items-center gap-1">
                      ➔ Klik untuk lihat histori
                    </p>
                  </div>
                );
              })()}
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
    </div>
  );
};

export default Dashboard;
