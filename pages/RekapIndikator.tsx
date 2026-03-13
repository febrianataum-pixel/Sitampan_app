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
  FileText
} from 'lucide-react';
import { useInventory } from '../App';
import { Product, OutboundTransaction, InboundEntry } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const RekapIndikator: React.FC = () => {
  const { products, inbound, outbound, documents, calculateStock, settings } = useInventory();
  const [selectedData, setSelectedData] = useState<{ title: string; items: any[] } | null>(null);

  // 1. Rekapan Distribusi per Kecamatan
  const kecamatanData = useMemo(() => {
    const counts: Record<string, { name: string; value: number; originalItems: OutboundTransaction[] }> = {};
    outbound.forEach(tx => {
      // Simple extraction: assume kecamatan is part of address or just use address
      // For now, let's try to extract kecamatan if the address format is "Kec. [Name]"
      const match = tx.alamat.match(/Kec\.\s*([a-zA-Z\s]+)/i);
      const key = match ? match[1].trim() : tx.alamat || 'Lainnya';
      
      if (!counts[key]) {
        counts[key] = { name: key, value: 0, originalItems: [] };
      }
      counts[key].value += 1;
      counts[key].originalItems.push(tx);
    });
    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [outbound]);

  // 2. Jenis Bencana
  const bencanaData = useMemo(() => {
    const counts: Record<string, { name: string; value: number; originalItems: OutboundTransaction[] }> = {};
    outbound.forEach(tx => {
      const key = tx.jenisBencana || 'Lainnya';
      if (!counts[key]) {
        counts[key] = { name: key, value: 0, originalItems: [] };
      }
      counts[key].value += 1;
      counts[key].originalItems.push(tx);
    });
    return Object.values(counts).sort((a, b) => b.value - a.value);
  }, [outbound]);

  // 3. Keuangan (Nilai Aset)
  const keuanganData = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;

    inbound.forEach(entry => {
      const product = products.find(p => p.id === entry.productId);
      if (product) {
        totalMasuk += entry.jumlah * product.harga;
      }
    });

    outbound.forEach(tx => {
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
  }, [products, inbound, outbound]);

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
    outbound.forEach(tx => {
      const date = new Date(tx.tanggal);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) {
        months[key] = { month: key, count: 0 };
      }
      months[key].count += 1;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [outbound]);

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
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-ios bg-ios-blue-light/10 text-ios-blue-light dark:bg-ios-blue-dark/10 dark:text-ios-blue-dark">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">REKAP INDIKATOR</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Visualisasi Data & Analitik Sistem</p>
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
              <h3 className="font-bold text-slate-900 dark:text-white">Jenis Bencana</h3>
            </div>
            <div className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full text-slate-500">PIE CHART</div>
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
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 dark:text-white">{item.penerima}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{item.tanggal}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">{item.alamat}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.items.map((it: any, i: number) => {
                            const p = products.find(prod => prod.id === it.productId);
                            return (
                              <span key={i} className="text-[10px] font-bold bg-ios-blue-light/10 text-ios-blue-light px-2 py-0.5 rounded-full">
                                {p?.namaBarang || 'Unknown'}: {it.jumlah} {p?.satuan}
                              </span>
                            );
                          })}
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
