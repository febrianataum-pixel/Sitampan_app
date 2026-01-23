
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { 
  Database, ArrowDownCircle, ArrowUpCircle, FileText, BarChart3, Package, Menu, X,
  LayoutDashboard, CalendarDays, UserCircle, WifiOff, Home, Sun, Moon, ChevronRight
} from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
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
  setProducts: (data: Product[] | ((prev: Product[]) => Product[])) => void;
  inbound: InboundEntry[];
  setInbound: (data: InboundEntry[] | ((prev: InboundEntry[]) => InboundEntry[])) => void;
  outbound: OutboundTransaction[];
  setOutbound: (data: OutboundTransaction[] | ((prev: OutboundTransaction[]) => OutboundTransaction[])) => void;
  settings: AppSettings;
  setSettings: (newSettings: AppSettings) => void;
  calculateStock: (productId: string) => number;
  isCloudConnected: boolean;
  toggleTheme: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, isCloudConnected, toggleTheme } = useInventory();
  const location = useLocation();
  const todayFormatted = formatIndoDate(new Date().toISOString().split('T')[0]);

  useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Database', path: '/dashboard/database', icon: <Database size={20} /> },
    { name: 'Masuk', path: '/dashboard/masuk', icon: <ArrowDownCircle size={20} /> },
    { name: 'Keluar', path: '/dashboard/keluar', icon: <ArrowUpCircle size={20} /> },
    { name: 'Berita Acara', path: '/dashboard/berita-acara', icon: <FileText size={20} /> },
    { name: 'Stok', path: '/dashboard/stok', icon: <BarChart3 size={20} /> },
    { name: 'Rekap', path: '/dashboard/rekap', icon: <CalendarDays size={20} /> },
    { name: 'Profil', path: '/dashboard/profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-true-black transition-colors duration-300">
      <aside className={`fixed md:relative z-40 h-full bg-slate-900 dark:bg-black text-white transition-all duration-300 hidden md:flex flex-col no-print ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 h-20 shrink-0">
          <div className="shrink-0">{settings.logo ? <img src={settings.logo} className="w-8 h-8 rounded-lg object-cover" /> : <Package className="text-blue-400" size={28} />}</div>
          {isSidebarOpen && <span className="font-bold text-lg uppercase truncate">{settings.appName}</span>}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'text-white' : 'text-slate-400 hover:bg-white/5'}`} style={({ isActive }) => isActive ? { backgroundColor: settings.themeColor } : {}}>
              {item.icon}
              {isSidebarOpen && <span className="font-semibold text-sm">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 hover:bg-white/5 flex justify-center text-slate-400 border-t border-white/5">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-white/5 z-30 h-16 flex items-center px-4 md:px-6 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="md:hidden">{settings.logo ? <img src={settings.logo} className="w-8 h-8 rounded-lg" /> : <Package size={24} />}</div>
            <h1 className="text-xs md:text-sm font-black uppercase tracking-widest truncate">{settings.appName}</h1>
            {isCloudConnected && <div className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-bold">SYNC</div>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border dark:border-white/10">
              {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
               {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">A</div>}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t dark:border-white/5 h-20 flex items-center justify-around z-50">
           {[{path:'/dashboard',icon:<Home/>},{path:'/dashboard/keluar',icon:<ArrowUpCircle/>},{path:'/dashboard/stok',icon:<BarChart3/>},{path:'/dashboard/profile',icon:<UserCircle/>}].map((it,idx)=>(
             <NavLink key={idx} to={it.path} className={({isActive})=>`p-2 rounded-2xl ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
               {React.cloneElement(it.icon as React.ReactElement, {size: 24})}
             </NavLink>
           ))}
        </nav>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [products, setProductsState] = useState<Product[]>([]);
  const [inbound, setInboundState] = useState<InboundEntry[]>([]);
  const [outbound, setOutboundState] = useState<OutboundTransaction[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('inv_settings');
    return saved ? JSON.parse(saved) : { appName: 'SITAMPAN', theme: 'light', themeColor: '#2563eb', adminName: 'Admin', syncEnabled: false };
  });

  const dbRef = useRef<any>(null);

  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) setTimeout(() => splash.classList.add('fade-out'), 2000);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('inv_settings', JSON.stringify(settings));
  }, [settings.theme]);

  useEffect(() => {
    if (settings.fbApiKey && settings.syncEnabled) {
      try {
        const app = getApps().length === 0 ? initializeApp({ apiKey: settings.fbApiKey, projectId: settings.fbProjectId, appId: settings.fbAppId }) : getApp();
        dbRef.current = getFirestore(app);
        setIsCloudConnected(true);
        onSnapshot(doc(dbRef.current, 'config', 'app_settings'), (snap) => {
          if (snap.exists()) {
            setSettingsState(prev => {
              const updated = { ...prev, ...snap.data() };
              localStorage.setItem('inv_settings', JSON.stringify(updated));
              return updated;
            });
          }
        });
      } catch (e) { setIsCloudConnected(false); }
    }
  }, [settings.fbApiKey, settings.syncEnabled]);

  const setSettings = async (s: AppSettings) => {
    setSettingsState(s);
    localStorage.setItem('inv_settings', JSON.stringify(s));
    if (isCloudConnected && dbRef.current) await setDoc(doc(dbRef.current, 'config', 'app_settings'), s);
  };

  const toggleTheme = () => setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });

  // Placeholder for other setters...
  const setProducts = (d: any) => setProductsState(d);
  const setInbound = (d: any) => setInboundState(d);
  const setOutbound = (d: any) => setOutboundState(d);
  const calculateStock = (id: string) => 0;

  return (
    <InventoryContext.Provider value={{ products, setProducts, inbound, setInbound, outbound, setOutbound, settings, setSettings, calculateStock, isCloudConnected, toggleTheme }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/database" element={<DatabaseBarang />} />
            <Route path="/dashboard/masuk" element={<BarangMasuk />} />
            <Route path="/dashboard/keluar" element={<BarangKeluar />} />
            <Route path="/dashboard/berita-acara" element={<CetakBeritaAcara />} />
            <Route path="/dashboard/stok" element={<StokBarang />} />
            <Route path="/dashboard/rekap" element={<RekapBulanan />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout>
      </HashRouter>
    </InventoryContext.Provider>
  );
};

export default App;
