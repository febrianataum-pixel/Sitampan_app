
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
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
  UserCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const { settings, isCloudConnected } = useInventory();
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} fixed md:relative z-40 h-full bg-slate-900 text-white transition-all duration-300 flex flex-col no-print shadow-2xl`}>
        <div className="p-6 flex items-center gap-3 h-20 overflow-hidden">
          <div className="shrink-0">{settings.logo ? <img src={settings.logo} className="w-8 h-8 rounded-lg object-cover" /> : <Package className="text-blue-400" size={28} />}</div>
          {isSidebarOpen && <div className="flex flex-col truncate"><span className="font-bold text-lg uppercase leading-tight">{settings.appName}</span></div>}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`} style={({ isActive }) => isActive ? { backgroundColor: settings.themeColor } : {}}>
              <div className="shrink-0">{item.icon}</div>
              {isSidebarOpen && <span className="font-semibold text-sm">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 hover:bg-white/5 flex justify-center text-slate-400 border-t border-white/5">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center px-6 no-print justify-between z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-lg text-slate-600"><Menu size={20}/></button>
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">{settings.appName}</h1>
              {isCloudConnected ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-bold border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full sync-pulse"></div> REALTIME SYNC
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-bold border border-slate-200">
                  <WifiOff size={10} /> OFFLINE MODE
                </div>
              )}
            </div>
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
        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [products, setProductsState] = useState<Product[]>([]);
  const [inbound, setInboundState] = useState<InboundEntry[]>([]);
  const [outbound, setOutboundState] = useState<OutboundTransaction[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
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

  // Inisialisasi Firebase
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

        // Listen Realtime
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

        return () => {
          unsubProducts();
          unsubInbound();
          unsubOutbound();
        };
      } catch (e) {
        console.error("Firebase Error:", e);
        setIsCloudConnected(false);
      }
    } else {
      setIsCloudConnected(false);
      // Load from LocalStorage if no sync
      const p = localStorage.getItem('inv_products');
      const i = localStorage.getItem('inv_inbound');
      const o = localStorage.getItem('inv_outbound');
      if (p) setProductsState(JSON.parse(p));
      if (i) setInboundState(JSON.parse(i));
      if (o) setOutboundState(JSON.parse(o));
    }
  }, [settings.fbApiKey, settings.fbProjectId, settings.syncEnabled]);

  // Simpan Settings
  useEffect(() => {
    localStorage.setItem('inv_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync Logics (Writers)
  const setProducts = async (newData: Product[] | ((prev: Product[]) => Product[])) => {
    const value = typeof newData === 'function' ? newData(products) : newData;
    setProductsState(value);
    localStorage.setItem('inv_products', JSON.stringify(value));
    if (isCloudConnected && !isRemoteChange.current) {
      // Sync logic here: Untuk efisiensi biasanya kita push item per item di Page, 
      // tapi untuk kesederhanaan kita push per koleksi (Batch).
      for (const item of value) {
        await setDoc(doc(dbRef.current, 'products', item.id), item);
      }
    }
  };

  const setInbound = async (newData: InboundEntry[] | ((prev: InboundEntry[]) => InboundEntry[])) => {
    const value = typeof newData === 'function' ? newData(inbound) : newData;
    setInboundState(value);
    localStorage.setItem('inv_inbound', JSON.stringify(value));
    if (isCloudConnected && !isRemoteChange.current) {
      for (const item of value) {
        await setDoc(doc(dbRef.current, 'inbound', item.id), item);
      }
    }
  };

  const setOutbound = async (newData: OutboundTransaction[] | ((prev: OutboundTransaction[]) => OutboundTransaction[])) => {
    const value = typeof newData === 'function' ? newData(outbound) : newData;
    setOutboundState(value);
    localStorage.setItem('inv_outbound', JSON.stringify(value));
    if (isCloudConnected && !isRemoteChange.current) {
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
