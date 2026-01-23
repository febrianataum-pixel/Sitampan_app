
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
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
  UserCircle,
  WifiOff,
  Home,
  LogOut,
  ChevronRight
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
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, isCloudConnected } = useInventory();
  const location = useLocation();
  const todayFormatted = formatIndoDate(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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

  // Menu Khusus Mobile (Bottom Nav)
  const mobileMenus = [
    { name: 'Home', path: '/dashboard', icon: <Home size={22} /> },
    { name: 'Keluar', path: '/dashboard/keluar', icon: <ArrowUpCircle size={22} /> },
    { name: 'Stok', path: '/dashboard/stok', icon: <BarChart3 size={22} /> },
    { name: 'Profil', path: '/dashboard/profile', icon: <UserCircle size={22} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Desktop (Hidden on Mobile) */}
      <aside className={`
        fixed md:relative z-50 h-full bg-slate-900 text-white transition-all duration-300 hidden md:flex flex-col no-print shadow-2xl
        ${isSidebarOpen ? 'w-64' : 'w-20'}
      `}>
        <div className="p-6 flex items-center gap-3 h-20 overflow-hidden shrink-0">
          <div className="shrink-0">
            {settings.logo ? (
              <img src={settings.logo} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <Package className="text-blue-400" size={28} />
            )}
          </div>
          <div className={`flex flex-col truncate transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <span className="font-bold text-lg uppercase leading-tight truncate">{settings.appName}</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              `} 
              style={({ isActive }) => isActive ? { backgroundColor: settings.themeColor } : {}}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className={`font-semibold text-sm transition-all duration-300 ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="hidden md:flex p-4 hover:bg-white/5 justify-center text-slate-400 border-t border-white/5"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header (Responsive) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 no-print justify-between z-30 shrink-0 sticky top-0 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="md:hidden">
                {settings.logo ? (
                  <img src={settings.logo} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <Package className="text-blue-600" size={24} />
                )}
              </div>
              <h1 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest truncate">
                {settings.appName}
              </h1>
              {isCloudConnected ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[8px] font-bold border border-emerald-100 whitespace-nowrap">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full sync-pulse shrink-0"></div> 
                  <span>SYNC</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-400 px-2 py-1 rounded-full text-[8px] font-bold border border-slate-200 whitespace-nowrap">
                  <WifiOff size={10} className="shrink-0" /> 
                  <span>OFFLINE</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-slate-700 leading-none">{settings.adminName}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{todayFormatted}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden shadow-sm">
               {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover" /> : settings.adminName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-10">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation (Only visible on small screens) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around px-4 pb-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          {mobileMenus.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center gap-1.5 p-2 transition-all active-touch ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400'}`}
              >
                <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { size: 22, strokeWidth: isActive ? 3 : 2 })}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
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
    return saved ? JSON.parse(saved) : {
      appName: 'SITAMPAN',
      appSubtitle: 'Sistem Manajemen Inventaris',
      logo: '',
      themeColor: '#2563eb',
      bgType: 'color',
      bgColor: '#f8fafc',
      adminName: 'Admin',
      warehouseName: 'Gudang Utama',
      syncEnabled: false
    };
  });

  const dbRef = useRef<any>(null);
  const isRemoteChange = useRef(false);

  useEffect(() => {
    if (settings.fbApiKey && settings.fbProjectId && settings.syncEnabled) {
      try {
        const firebaseConfig = {
          apiKey: settings.fbApiKey,
          projectId: settings.fbProjectId,
          appId: settings.fbAppId
        };
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        dbRef.current = getFirestore(app);
        setIsCloudConnected(true);

        const unsubProducts = onSnapshot(collection(dbRef.current, 'products'), (snap) => {
          isRemoteChange.current = true;
          setProductsState(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
          setTimeout(() => isRemoteChange.current = false, 500);
        });

        const unsubInbound = onSnapshot(collection(dbRef.current, 'inbound'), (snap) => {
          isRemoteChange.current = true;
          setInboundState(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboundEntry)));
          setTimeout(() => isRemoteChange.current = false, 500);
        });

        const unsubOutbound = onSnapshot(collection(dbRef.current, 'outbound'), (snap) => {
          isRemoteChange.current = true;
          setOutboundState(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutboundTransaction)));
          setTimeout(() => isRemoteChange.current = false, 500);
        });

        const unsubSettings = onSnapshot(doc(dbRef.current, 'config', 'app_settings'), (snap) => {
          if (snap.exists()) {
            const remoteSettings = snap.data();
            setSettingsState(prev => ({
              ...prev,
              appName: remoteSettings.appName || prev.appName,
              appSubtitle: remoteSettings.appSubtitle || prev.appSubtitle,
              adminName: remoteSettings.adminName || prev.adminName,
              warehouseName: remoteSettings.warehouseName || prev.warehouseName,
              themeColor: remoteSettings.themeColor || prev.themeColor,
              logo: remoteSettings.logo || prev.logo
            }));
          }
        });

        return () => {
          unsubProducts(); unsubInbound(); unsubOutbound(); unsubSettings();
        };
      } catch (e) {
        setIsCloudConnected(false);
      }
    } else {
      setIsCloudConnected(false);
      ['products', 'inbound', 'outbound'].forEach(key => {
        const saved = localStorage.getItem(`inv_${key}`);
        if (saved) {
          if (key === 'products') setProductsState(JSON.parse(saved));
          if (key === 'inbound') setInboundState(JSON.parse(saved));
          if (key === 'outbound') setOutboundState(JSON.parse(saved));
        }
      });
    }
  }, [settings.fbApiKey, settings.fbProjectId, settings.syncEnabled]);

  const setSettings = async (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    localStorage.setItem('inv_settings', JSON.stringify(newSettings));
    if (isCloudConnected && dbRef.current) {
      const { fbApiKey, fbProjectId, fbAppId, ...syncable } = newSettings;
      await setDoc(doc(dbRef.current, 'config', 'app_settings'), syncable);
    }
  };

  const setProducts = async (newData: Product[] | ((prev: Product[]) => Product[])) => {
    const value = typeof newData === 'function' ? newData(products) : newData;
    
    if (isCloudConnected && dbRef.current && !isRemoteChange.current) {
      const deletedItems = products.filter(p => !value.some(v => v.id === p.id));
      for (const item of deletedItems) {
        await deleteDoc(doc(dbRef.current, 'products', item.id));
      }
    }

    setProductsState(value);
    localStorage.setItem('inv_products', JSON.stringify(value));
    
    if (isCloudConnected && dbRef.current && !isRemoteChange.current) {
      for (const item of value) {
        await setDoc(doc(dbRef.current, 'products', item.id), item);
      }
    }
  };

  const setInbound = async (newData: InboundEntry[] | ((prev: InboundEntry[]) => InboundEntry[])) => {
    const value = typeof newData === 'function' ? newData(inbound) : newData;

    if (isCloudConnected && dbRef.current && !isRemoteChange.current) {
      const deletedItems = inbound.filter(i => !value.some(v => v.id === i.id));
      for (const item of deletedItems) {
        await deleteDoc(doc(dbRef.current, 'inbound', item.id));
      }
    }

    setInboundState(value);
    localStorage.setItem('inv_inbound', JSON.stringify(value));

    if (isCloudConnected && dbRef.current && !isRemoteChange.current) {
      for (const item of value) {
        await setDoc(doc(dbRef.current, 'inbound', item.id), item);
      }
    }
  };

  const setOutbound = async (newData: OutboundTransaction[] | ((prev: OutboundTransaction[]) => OutboundTransaction[])) => {
    const value = typeof newData === 'function' ? newData(outbound) : newData;

    if (isCloudConnected && dbRef.current && !isRemoteChange.current) {
      const deletedItems = outbound.filter(o => !value.some(v => v.id === o.id));
      for (const item of deletedItems) {
        await deleteDoc(doc(dbRef.current, 'outbound', item.id));
      }
    }

    setOutboundState(value);
    localStorage.setItem('inv_outbound', JSON.stringify(value));

    if (isCloudConnected && dbRef.current && !isRemoteChange.current) {
      for (const item of value) {
        await setDoc(doc(dbRef.current, 'outbound', item.id), item);
      }
    }
  };

  const calculateStock = (productId: string) => {
    const totalIn = inbound.filter(i => i.productId === productId).reduce((acc, curr) => acc + curr.jumlah, 0);
    const totalOut = outbound.reduce((acc, tx) => acc + tx.items.filter(item => item.productId === productId).reduce((sum, item) => sum + item.jumlah, 0), 0);
    return totalIn - totalOut;
  };

  return (
    <InventoryContext.Provider value={{ products, setProducts, inbound, setInbound, outbound, setOutbound, settings, setSettings, calculateStock, isCloudConnected }}>
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
