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
  Sun,
  Moon,
  ShieldAlert,
  CloudUpload
} from 'lucide-react';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

import Dashboard from './pages/Dashboard';
import DatabaseBarang from './pages/DatabaseBarang';
import BarangMasuk from './pages/BarangMasuk';
import BarangKeluar from './pages/BarangKeluar';
import CetakBeritaAcara from './pages/CetakBeritaAcara';
import StokBarang from './pages/StokBarang';
import RekapBulanan from './pages/RekapBulanan';
import Profile from './pages/Profile';
import LaporanBlora from './pages/LaporanBlora';
import Dokumen from './pages/Dokumen';

import { Product, InboundEntry, OutboundTransaction, AppSettings, formatIndoDate, ArchiveDocument } from './types';

interface InventoryContextType {
  products: Product[];
  setProducts: (data: Product[] | ((prev: Product[]) => Product[])) => void;
  inbound: InboundEntry[];
  setInbound: (data: InboundEntry[] | ((prev: InboundEntry[]) => InboundEntry[])) => void;
  outbound: OutboundTransaction[];
  setOutbound: (data: OutboundTransaction[] | ((prev: OutboundTransaction[]) => OutboundTransaction[])) => void;
  documents: ArchiveDocument[];
  setDocuments: (data: ArchiveDocument[] | ((prev: ArchiveDocument[]) => ArchiveDocument[])) => void;
  settings: AppSettings;
  setSettings: (newSettings: AppSettings) => void;
  calculateStock: (productId: string) => number;
  isCloudConnected: boolean;
  isRescuing: boolean;
  toggleTheme: () => void;
  syncError: string | null;
  storage: FirebaseStorage | null;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, isCloudConnected, isRescuing, toggleTheme, syncError } = useInventory();
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
    { name: 'Laporan', path: '/dashboard/laporan-blora', icon: <FileText size={20} /> },
    { name: 'Dokumen', path: '/dashboard/dokumen', icon: <Package size={20} /> },
    { name: 'Rekap', path: '/dashboard/rekap', icon: <CalendarDays size={20} /> },
    { name: 'Profil', path: '/dashboard/profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-ios-bg-light dark:bg-ios-bg-dark theme-transition">
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:relative z-40 h-full bg-ios-secondary-light dark:bg-ios-secondary-dark transition-all duration-300 flex flex-col no-print shadow-sm border-r border-slate-200 dark:border-white/5 ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'} md:flex`}>
        <div className="p-6 flex items-center gap-3 h-20 overflow-hidden shrink-0">
          <div className="shrink-0">{settings.logo ? <img src={settings.logo} className="w-8 h-8 rounded-ios object-cover" referrerPolicy="no-referrer" /> : <Package className="text-ios-blue-light dark:text-ios-blue-dark" size={28} />}</div>
          <div className={`flex flex-col truncate transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}><span className="font-bold text-lg leading-tight truncate text-slate-900 dark:text-white">{settings.appName}</span></div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }: any) => `flex items-center gap-3 p-3 rounded-ios transition-all ${isActive ? 'text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`} style={({ isActive }: any) => isActive ? { backgroundColor: settings.themeColor } : {}}>
              <div className="shrink-0">{item.icon}</div>
              <span className={`font-bold text-sm transition-all duration-300 ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex p-4 hover:bg-slate-100 dark:hover:bg-white/5 justify-center text-slate-400 border-t border-slate-200 dark:border-white/5">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white/80 dark:bg-ios-secondary-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 no-print z-30 shrink-0 sticky top-0 shadow-sm theme-transition">
          <div className="h-16 flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-ios transition-colors"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{settings.appName}</h1>
              {isRescuing ? (
                <div className="flex items-center gap-1 bg-ios-blue-light/10 text-ios-blue-light px-2 py-1 rounded-full text-[8px] font-bold animate-pulse"><CloudUpload size={10} /> <span>RESCUING...</span></div>
              ) : isCloudConnected ? (
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full text-[8px] font-bold"><span>SYNC ACTIVE</span></div>
              ) : syncError ? (
                <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-[8px] font-bold"><ShieldAlert size={10} /> <span>ERROR</span></div>
              ) : (
                <div className="flex items-center gap-1 bg-slate-500/10 text-slate-500 px-2 py-1 rounded-full text-[8px] font-bold"><WifiOff size={10} /> <span>OFFLINE</span></div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2.5 rounded-ios bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">{settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">{settings.adminName}</p>
                 <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">{todayFormatted}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-32 md:pb-10 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-ios-secondary-dark/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 flex items-center justify-around px-2 py-2 pb-8 z-50 no-print theme-transition shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
          {menuItems.filter(item => ['Dashboard', 'Keluar', 'Laporan', 'Dokumen', 'Profil'].includes(item.name)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: any) => `flex flex-col items-center gap-1 px-2 py-1 transition-all ${isActive ? 'text-ios-blue-light dark:text-ios-blue-dark' : 'text-slate-400'}`}
            >
              <div className="shrink-0 scale-90">{item.icon}</div>
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [products, setProductsState] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('inv_products');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [inbound, setInboundState] = useState<InboundEntry[]>(() => {
    try {
      const saved = localStorage.getItem('inv_inbound');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [outbound, setOutboundState] = useState<OutboundTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('inv_outbound');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [documents, setDocumentsState] = useState<ArchiveDocument[]>(() => {
    try {
      const saved = localStorage.getItem('inv_documents');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isRescuing, setIsRescuing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('inv_settings');
      return saved ? JSON.parse(saved) : {
        appName: "SITAMPAN",
        theme: "light",
        syncEnabled: false,
        themeColor: "#007AFF",
        adminName: "Admin",
        warehouseName: "Gudang"
      };
    } catch (e) {
      return {
        appName: "SITAMPAN",
        theme: "light",
        syncEnabled: false,
        themeColor: "#007AFF",
        adminName: "Admin",
        warehouseName: "Gudang"
      };
    }
  });

  const productsRef = useRef(products);
  const inboundRef = useRef(inbound);
  const outboundRef = useRef(outbound);
  const documentsRef = useRef(documents);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { inboundRef.current = inbound; }, [inbound]);
  useEffect(() => { outboundRef.current = outbound; }, [outbound]);
  useEffect(() => { documentsRef.current = documents; }, [documents]);

  const dbRef = useRef<any>(null);
  const isRemoteChange = useRef(false);

  const rescueDataToCloud = async (colName: string, localData: any[]) => {
    if (!dbRef.current || localData.length === 0) return;
    setIsRescuing(true);
    try {
      const batch = writeBatch(dbRef.current);
      localData.forEach(item => batch.set(doc(dbRef.current, colName, item.id), item));
      await batch.commit();
    } catch (e) { console.error("Rescue failed:", e); } finally { setIsRescuing(false); }
  };

  useEffect(() => {
    if (!settings.fbApiKey || !settings.fbProjectId || !settings.syncEnabled) {
      setIsCloudConnected(false);
      return;
    }
    let unsubs: (() => void)[] = [];
    const connectCloud = async () => {
      try {
        const app = getApps().length === 0 ? initializeApp({ 
          apiKey: settings.fbApiKey, 
          projectId: settings.fbProjectId, 
          appId: settings.fbAppId,
          storageBucket: settings.fbStorageBucket
        }) : getApp();
        dbRef.current = getFirestore(app);
        setStorage(getStorage(app));
        setIsCloudConnected(true);
        setSyncError(null);

        const syncCol = (name: string, ref: React.MutableRefObject<any[]>, setState: Function) => {
          return onSnapshot(collection(dbRef.current, name), (snap) => {
            if (snap.empty && ref.current.length > 0) {
              rescueDataToCloud(name, ref.current);
            } else if (!snap.empty) {
              isRemoteChange.current = true;
              const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
              setState(remote);
              localStorage.setItem(`inv_${name}`, JSON.stringify(remote));
              setTimeout(() => { isRemoteChange.current = false; }, 500);
            }
          }, (err) => setSyncError(err.message));
        };

        unsubs.push(syncCol('products', productsRef, setProductsState));
        unsubs.push(syncCol('inbound', inboundRef, setInboundState));
        unsubs.push(syncCol('outbound', outboundRef, setOutboundState));
        unsubs.push(syncCol('documents', documentsRef, setDocumentsState));
      } catch (e: any) { setSyncError(e.message); }
    };
    connectCloud();
    return () => unsubs.forEach(u => u());
  }, [settings.fbApiKey, settings.fbProjectId, settings.syncEnabled]);

  const setSettings = async (s: AppSettings) => {
    setSettingsState(s);
    localStorage.setItem('inv_settings', JSON.stringify(s));
    if (isCloudConnected && dbRef.current) {
      const { fbApiKey, fbProjectId, fbAppId, ...syncable } = s;
      await setDoc(doc(dbRef.current, 'config', 'app_settings'), syncable);
    }
  };

  const updateCloud = async (col: string, data: any[], deleted?: any) => {
    if (isCloudConnected && dbRef.current && !isRemoteChange.current) {
      if (deleted) await deleteDoc(doc(dbRef.current, col, deleted.id));
      for (const it of data) await setDoc(doc(dbRef.current, col, it.id), it);
    }
  };

  const setProducts = (newData: any) => {
    const val = typeof newData === 'function' ? newData(products) : newData;
    const deleted = products.find(p => !val.some((v:any) => v.id === p.id));
    setProductsState(val);
    localStorage.setItem('inv_products', JSON.stringify(val));
    updateCloud('products', val, deleted);
  };

  const setInbound = (newData: any) => {
    const val = typeof newData === 'function' ? newData(inbound) : newData;
    const deleted = inbound.find(i => !val.some((v:any) => v.id === i.id));
    setInboundState(val);
    localStorage.setItem('inv_inbound', JSON.stringify(val));
    updateCloud('inbound', val, deleted);
  };

  const setOutbound = (newData: any) => {
    const val = typeof newData === 'function' ? newData(outbound) : newData;
    const deleted = outbound.find(o => !val.some((v:any) => v.id === o.id));
    setOutboundState(val);
    localStorage.setItem('inv_outbound', JSON.stringify(val));
    updateCloud('outbound', val, deleted);
  };

  const setDocuments = (newData: any) => {
    const val = typeof newData === 'function' ? newData(documents) : newData;
    const deleted = documents.find(d => !val.some((v:any) => v.id === d.id));
    setDocumentsState(val);
    localStorage.setItem('inv_documents', JSON.stringify(val));
    updateCloud('documents', val, deleted);
  };

  const calculateStock = (productId: string) => {
    const totalIn = inbound.filter(i => i.productId === productId).reduce((acc, i) => acc + i.jumlah, 0);
    const totalOut = outbound.reduce((acc, tx) => acc + (tx.items.find(i => i.productId === productId)?.jumlah || 0), 0);
    return totalIn - totalOut;
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings({ ...settings, theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <InventoryContext.Provider value={{ products, setProducts, inbound, setInbound, outbound, setOutbound, documents, setDocuments, settings, setSettings, calculateStock, isCloudConnected, isRescuing, toggleTheme, syncError, storage }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/database" element={<DatabaseBarang />} />
            <Route path="/dashboard/masuk" element={<BarangMasuk />} />
            <Route path="/dashboard/keluar" element={<BarangKeluar />} />
            <Route path="/dashboard/berita-acara" element={<CetakBeritaAcara />} />
            <Route path="/dashboard/stok" element={<StokBarang />} />
            <Route path="/dashboard/laporan-blora" element={<LaporanBlora />} />
            <Route path="/dashboard/dokumen" element={<Dokumen />} />
            <Route path="/dashboard/rekap" element={<RekapBulanan />} />
            <Route path="/dashboard/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </HashRouter>
    </InventoryContext.Provider>
  );
};

export default App;