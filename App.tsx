
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  Database, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileText, 
  BarChart3, 
  Package, 
  Menu, 
  X,
  LayoutDashboard,
  CalendarDays,
  UserCircle
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DatabaseBarang from './pages/DatabaseBarang';
import BarangMasuk from './pages/BarangMasuk';
import BarangKeluar from './pages/BarangKeluar';
import CetakBeritaAcara from './pages/CetakBeritaAcara';
import StokBarang from './pages/StokBarang';
import RekapBulanan from './pages/RekapBulanan';
import Profile from './pages/Profile';
import { Product, InboundEntry, OutboundTransaction, AppSettings, formatIndoDate } from './types';

interface InventoryContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  inbound: InboundEntry[];
  setInbound: React.Dispatch<React.SetStateAction<InboundEntry[]>>;
  outbound: OutboundTransaction[];
  setOutbound: React.Dispatch<React.SetStateAction<OutboundTransaction[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  calculateStock: (productId: string) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const { settings } = useInventory();
  const todayFormatted = formatIndoDate(new Date().toISOString().split('T')[0]);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Database', path: '/database', icon: <Database size={20} /> },
    { name: 'Masuk', path: '/masuk', icon: <ArrowDownCircle size={20} /> },
    { name: 'Keluar', path: '/keluar', icon: <ArrowUpCircle size={20} /> },
    { name: 'Berita Acara', path: '/berita-acara', icon: <FileText size={20} /> },
    { name: 'Stok', path: '/stok', icon: <BarChart3 size={20} /> },
    { name: 'Rekap', path: '/rekap', icon: <CalendarDays size={20} /> },
    { name: 'Profil', path: '/profile', icon: <UserCircle size={20} /> },
  ];

  const getBackgroundStyle = () => {
    if (settings.bgType === 'gradient') {
      return { background: `linear-gradient(135deg, ${settings.bgColor}, #f1f5f9)` };
    }
    return { backgroundColor: settings.bgColor };
  };

  return (
    <div className="flex h-screen overflow-hidden" style={getBackgroundStyle()}>
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} fixed md:relative z-40 h-full bg-slate-900 text-white transition-all duration-300 flex flex-col no-print shadow-2xl ${window.innerWidth < 768 && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="p-6 flex items-center gap-3 overflow-hidden h-20">
          <div className="shrink-0">
            {settings.logo ? (
              <img src={settings.logo} className="w-8 h-8 rounded-lg object-cover" alt="Logo" />
            ) : (
              <Package className="text-blue-400" size={28} />
            )}
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-lg leading-tight uppercase tracking-tight">{settings.appName}</span>
              <span className="text-[10px] text-slate-400 font-semibold truncate uppercase tracking-wider">{settings.appSubtitle}</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: settings.themeColor } : {}}
            >
              <div className="shrink-0">{item.icon}</div>
              {isSidebarOpen && <span className="font-semibold text-sm">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-4 hover:bg-white/5 flex justify-center text-slate-400 transition-colors border-t border-white/5"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center px-6 no-print justify-between z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-lg text-slate-600"><Menu size={20}/></button>
            <h1 className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">
              {settings.appName} 
              <span className="text-slate-300 font-light mx-2">|</span> 
              <span className="text-slate-400 font-semibold">{settings.warehouseName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-slate-700 leading-none mb-1">{settings.adminName}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{todayFormatted}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
               {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover" /> : settings.adminName.charAt(0)}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inbound, setInbound] = useState<InboundEntry[]>([]);
  const [outbound, setOutbound] = useState<OutboundTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'INV-PRO',
    appSubtitle: 'Sistem Manajemen Inventaris',
    logo: '',
    themeColor: '#2563eb',
    bgType: 'color',
    bgColor: '#f8fafc',
    adminName: 'Super Admin',
    warehouseName: 'Gudang Utama'
  });

  useEffect(() => {
    const savedProducts = localStorage.getItem('inv_products');
    const savedInbound = localStorage.getItem('inv_inbound');
    const savedOutbound = localStorage.getItem('inv_outbound');
    const savedSettings = localStorage.getItem('inv_settings');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedInbound) setInbound(JSON.parse(savedInbound));
    if (savedOutbound) setOutbound(JSON.parse(savedOutbound));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem('inv_products', JSON.stringify(products));
    localStorage.setItem('inv_inbound', JSON.stringify(inbound));
    localStorage.setItem('inv_outbound', JSON.stringify(outbound));
    localStorage.setItem('inv_settings', JSON.stringify(settings));
  }, [products, inbound, outbound, settings]);

  const calculateStock = (productId: string) => {
    const totalIn = inbound
      .filter(i => i.productId === productId)
      .reduce((acc, curr) => acc + curr.jumlah, 0);
    const totalOut = outbound.reduce((acc, tx) => {
      const pCount = tx.items
        .filter(item => item.productId === productId)
        .reduce((sum, item) => sum + item.jumlah, 0);
      return acc + pCount;
    }, 0);
    return totalIn - totalOut;
  };

  return (
    <InventoryContext.Provider value={{ products, setProducts, inbound, setInbound, outbound, setOutbound, settings, setSettings, calculateStock }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/database" element={<DatabaseBarang />} />
            <Route path="/masuk" element={<BarangMasuk />} />
            <Route path="/keluar" element={<BarangKeluar />} />
            <Route path="/berita-acara" element={<CetakBeritaAcara />} />
            <Route path="/stok" element={<StokBarang />} />
            <Route path="/rekap" element={<RekapBulanan />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout>
      </HashRouter>
    </InventoryContext.Provider>
  );
};

export default App;
