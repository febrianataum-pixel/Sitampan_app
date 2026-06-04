import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';

import { 
  Database, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileText, 
  BarChart3, 
  PieChart,
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
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json';

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
import RekapIndikator from './pages/RekapIndikator';

import { Product, InboundEntry, OutboundTransaction, AppSettings, formatIndoDate, ArchiveDocument } from './types';
import { saveStateToIDB, getStateFromIDB } from './utils/idb';

// Initialize Firebase singleton at module-scope
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  user: User | null;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, isCloudConnected, isRescuing, toggleTheme, syncError, user, logout } = useInventory();
  const location = useLocation();
  const todayFormatted = formatIndoDate(new Date().toISOString().split('T')[0]);

  useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);

  const isSpecialUser = user?.email === 'febrianataum@gmail.com';

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Database', path: '/dashboard/database', icon: <Database size={20} /> },
    { name: 'Masuk', path: '/dashboard/masuk', icon: <ArrowDownCircle size={20} /> },
    { name: 'Keluar', path: '/dashboard/keluar', icon: <ArrowUpCircle size={20} /> },
    { name: 'Berita Acara', path: '/dashboard/berita-acara', icon: <FileText size={20} /> },
    { name: 'Stok', path: '/dashboard/stok', icon: <BarChart3 size={20} /> },
    { name: 'Laporan', path: '/dashboard/laporan-blora', icon: <FileText size={20} /> },
    { name: 'Dokumen', path: '/dashboard/dokumen', icon: <Package size={20} /> },
    { name: 'Rekap', path: '/dashboard/rekap', icon: <CalendarDays size={20} /> },
    { name: 'Indikator', path: '/dashboard/rekap-indikator', icon: <PieChart size={20} /> },
    { name: 'Profil', path: '/dashboard/profile', icon: <UserCircle size={20} /> },
  ];

  const menuItems = isSpecialUser
    ? allMenuItems
    : allMenuItems.filter(item => ['Dashboard', 'Laporan', 'Stok', 'Rekap', 'Indikator'].includes(item.name));

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
        {user && (
          <button 
            onClick={() => { if (confirm("Apakah Anda yakin ingin keluar?")) logout(); }} 
            className="flex items-center gap-3 p-3 mx-3 my-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded-ios transition-all cursor-pointer font-bold text-sm shrink-0"
          >
            <UserCircle size={20} className="shrink-0 text-rose-500" />
            <span className={`transition-all duration-300 truncate font-bold text-rose-500 ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Keluar Akun</span>
          </button>
        )}
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
              <div className="flex items-center gap-3">
                {user?.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 object-cover" referrerPolicy="no-referrer" />
                )}
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">{user?.displayName || settings.adminName}</p>
                   <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1.5 leading-none">{todayFormatted}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-32 md:pb-10 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-ios-secondary-dark/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 flex items-center justify-around px-1 py-2 pb-8 z-50 no-print theme-transition shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
          {menuItems.filter(item => ['Dashboard', 'Keluar', 'Berita Acara', 'Indikator', 'Dokumen', 'Profil'].includes(item.name)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: any) => `flex flex-col items-center gap-1 px-1 py-1 transition-all ${isActive ? 'text-ios-blue-light dark:text-ios-blue-dark' : 'text-slate-400'}`}
            >
              <div className="shrink-0 scale-90">{item.icon}</div>
              <span className="text-[8px] font-black uppercase tracking-tighter text-center scale-95">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

const SplashLoading: React.FC<{ appName: string; appLogo?: string }> = ({ appName, appLogo }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-100 font-sans">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl mx-auto flex items-center justify-center border border-blue-500/20 shadow-inner animate-[pulse_2s_infinite]">
          {appLogo ? (
            <img src={appLogo} alt={appName} className="w-10 h-10 object-contain" />
          ) : (
            <Package size={28} className="text-blue-400" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-widest text-white uppercase">{appName}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistem Logistik Kebencanaan</p>
        </div>
      </div>
    </div>
  );
};

interface LoginGateProps {
  loginWithGoogle: () => Promise<void>;
  appName: string;
  appSubtitle?: string;
  appLogo?: string;
}

const LoginGate: React.FC<LoginGateProps> = ({ loginWithGoogle, appName, appSubtitle, appLogo }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Gagal melakukan login dengan Google. Pastikan integrasi Firebase Auth telah diaktifkan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-100 relative overflow-hidden font-sans">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className="w-full max-w-md p-8 md:p-10 mx-4 bg-slate-800/60 backdrop-blur-xl rounded-ios-lg border border-white/10 shadow-2xl space-y-8 text-center relative z-10">
        <div className="space-y-3">
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl mx-auto flex items-center justify-center border border-blue-500/20 shadow-inner">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="w-12 h-12 object-contain font-bold" />
            ) : (
              <Package size={36} className="text-blue-400" />
            )}
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">{appName}</h2>
          <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase italic max-w-xs mx-auto">
            {appSubtitle || "SISTEM TANGGAP PEMANTAUAN LOGISTIK KEBENCANAAN"}
          </p>
        </div>

        <div className="w-full h-px bg-white/5" />

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-300">
            Silakan masuk dengan Akun Google resmi Anda untuk mengakses sistem logistik.
          </p>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-ios animate-pulse">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 py-3.5 px-6 rounded-ios font-bold shadow-lg shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.84-4.53z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? "Menghubungkan..." : "Masuk dengan Google"}
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-medium tracking-tight mt-6">
          Sistem Keamanan Terenkripsi • SITAMPAN Logistik Kebencanaan
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
  const [storageState] = useState<FirebaseStorage | null>(firebaseStorage);

  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('inv_settings');
      return saved ? JSON.parse(saved) : {
        appName: "SITAMPAN",
        theme: "light",
        syncEnabled: true,
        themeColor: "#007AFF",
        adminName: "Admin",
        warehouseName: "Gudang"
      };
    } catch (e) {
      return {
        appName: "SITAMPAN",
        theme: "light",
        syncEnabled: true,
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
  const settingsRef = useRef(settings);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { inboundRef.current = inbound; }, [inbound]);
  useEffect(() => { outboundRef.current = outbound; }, [outbound]);
  useEffect(() => { documentsRef.current = documents; }, [documents]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const isRemoteChange = useRef(false);

  // Authentication state watcher
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
      if (u) {
        setSettingsState(prev => {
          const updated = {
            ...prev,
            adminName: u.displayName || prev.adminName,
            syncEnabled: true
          };
          try {
            localStorage.setItem('inv_settings', JSON.stringify(updated));
          } catch (e) {
            console.warn('localStorage quota exceeded for settings', e);
          }
          return updated;
        });
      }
    });
    return () => unsub();
  }, []);

  // Sync state from IndexedDB to React state on mount
  useEffect(() => {
    const loadFromIndexedDB = async () => {
      try {
        const cachedProducts = await getStateFromIDB('inv_products');
        if (cachedProducts && Array.isArray(cachedProducts)) {
          setProductsState(cachedProducts);
        }
        const cachedInbound = await getStateFromIDB('inv_inbound');
        if (cachedInbound && Array.isArray(cachedInbound)) {
          setInboundState(cachedInbound);
        }
        const cachedOutbound = await getStateFromIDB('inv_outbound');
        if (cachedOutbound && Array.isArray(cachedOutbound)) {
          setOutboundState(cachedOutbound);
        }
        const cachedDocuments = await getStateFromIDB('inv_documents');
        if (cachedDocuments && Array.isArray(cachedDocuments)) {
          setDocumentsState(cachedDocuments);
        }
      } catch (err) {
        console.error('Failed to load cache from IndexedDB on startup:', err);
      }
    };
    loadFromIndexedDB();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const rescueDataToCloud = async (colName: string, localData: any[]) => {
    if (localData.length === 0) return;
    setIsRescuing(true);
    try {
      const batch = writeBatch(db);
      localData.forEach(item => batch.set(doc(db, colName, item.id), item));
      await batch.commit();
    } catch (e) { 
      console.error("Rescue failed:", e); 
    } finally { 
      setIsRescuing(false); 
    }
  };

  // Realtime Cloud connections synced to active user session
  useEffect(() => {
    if (!user || !settings.syncEnabled) {
      setIsCloudConnected(false);
      return;
    }
    let unsubs: (() => void)[] = [];
    const connectCloud = async () => {
      try {
        setIsCloudConnected(true);
        setSyncError(null);

        const syncCol = (name: string, ref: React.MutableRefObject<any[]>, setState: Function) => {
          return onSnapshot(collection(db, name), (snap) => {
            if (snap.empty && ref.current.length > 0) {
              rescueDataToCloud(name, ref.current);
            } else if (!snap.empty) {
              isRemoteChange.current = true;
              const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
              setState(remote);
              try {
                localStorage.setItem(`inv_${name}`, JSON.stringify(remote));
              } catch (e) {
                console.warn(`localStorage quota exceeded for inv_${name}, fallback to memory & IndexedDB`, e);
              }
              saveStateToIDB(`inv_${name}`, remote).catch(err => console.error(err));
              setTimeout(() => { isRemoteChange.current = false; }, 500);
            }
          }, (err) => {
            setSyncError(err.message);
            try {
              handleFirestoreError(err, OperationType.GET, name);
            } catch (handledError) {
              console.error("Handled permissions error:", handledError);
            }
          });
        };

        unsubs.push(syncCol('products', productsRef, setProductsState));
        unsubs.push(syncCol('inbound', inboundRef, setInboundState));
        unsubs.push(syncCol('outbound', outboundRef, setOutboundState));
        unsubs.push(syncCol('documents', documentsRef, setDocumentsState));

        // Sync global app settings / profile branding document
        const unsubSettings = onSnapshot(doc(db, 'config', 'app_settings'), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setSettingsState(prev => {
              const updated = { ...prev, ...data };
              try {
                localStorage.setItem('inv_settings', JSON.stringify(updated));
              } catch (e) {
                console.warn('localStorage quota exceeded for settings', e);
              }
              if (updated.theme) {
                document.documentElement.classList.toggle('dark', updated.theme === 'dark');
              }
              return updated;
            });
          } else {
            // Configuration doesn't exist yet on project db, write the default configuration
            const { fbApiKey, fbProjectId, fbAppId, ...syncable } = settingsRef.current;
            setDoc(doc(db, 'config', 'app_settings'), syncable).catch(err => {
              console.error("Failed to rescue configurations to cloud db:", err);
            });
          }
        }, (err) => {
          try {
            handleFirestoreError(err, OperationType.GET, 'config/app_settings');
          } catch (handledError) {
            console.error("Handled permissions error for config/app_settings:", handledError);
          }
        });
        unsubs.push(unsubSettings);
      } catch (e: any) { 
        setSyncError(e.message); 
      }
    };
    connectCloud();
    return () => unsubs.forEach(u => u());
  }, [user, settings.syncEnabled]);

  const setSettings = async (s: AppSettings) => {
    setSettingsState(s);
    try {
      localStorage.setItem('inv_settings', JSON.stringify(s));
    } catch (e) {
      console.warn('localStorage quota exceeded for settings', e);
    }
    if (isCloudConnected && user) {
      try {
        const { fbApiKey, fbProjectId, fbAppId, ...syncable } = s;
        await setDoc(doc(db, 'config', 'app_settings'), syncable);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'config/app_settings');
      }
    }
  };

  const updateCloud = async (col: string, data: any[], deleted?: any) => {
    if (isCloudConnected && !isRemoteChange.current && user) {
      try {
        if (deleted) {
          await deleteDoc(doc(db, col, deleted.id));
        }
        for (const it of data) {
          await setDoc(doc(db, col, it.id), it);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${col}`);
      }
    }
  };

  const setProducts = (newData: any) => {
    const val = typeof newData === 'function' ? newData(products) : newData;
    const deleted = products.find(p => !val.some((v:any) => v.id === p.id));
    setProductsState(val);
    try {
      localStorage.setItem('inv_products', JSON.stringify(val));
    } catch (e) {
      console.warn('localStorage quota exceeded for products', e);
    }
    saveStateToIDB('inv_products', val).catch(err => console.error(err));
    updateCloud('products', val, deleted);
  };

  const setInbound = (newData: any) => {
    const val = typeof newData === 'function' ? newData(inbound) : newData;
    const deleted = inbound.find(i => !val.some((v:any) => v.id === i.id));
    setInboundState(val);
    try {
      localStorage.setItem('inv_inbound', JSON.stringify(val));
    } catch (e) {
      console.warn('localStorage quota exceeded for inbound', e);
    }
    saveStateToIDB('inv_inbound', val).catch(err => console.error(err));
    updateCloud('inbound', val, deleted);
  };

  const setOutbound = (newData: any) => {
    const val = typeof newData === 'function' ? newData(outbound) : newData;
    const deleted = outbound.find(o => !val.some((v:any) => v.id === o.id));
    setOutboundState(val);
    try {
      localStorage.setItem('inv_outbound', JSON.stringify(val));
    } catch (e) {
      console.warn('localStorage quota exceeded for outbound', e);
    }
    saveStateToIDB('inv_outbound', val).catch(err => console.error(err));
    updateCloud('outbound', val, deleted);
  };

  const setDocuments = (newData: any) => {
    const val = typeof newData === 'function' ? newData(documents) : newData;
    const deleted = documents.find(d => !val.some((v:any) => v.id === d.id));
    setDocumentsState(val);
    try {
      localStorage.setItem('inv_documents', JSON.stringify(val));
    } catch (e) {
      console.warn('localStorage quota exceeded for documents', e);
    }
    saveStateToIDB('inv_documents', val).catch(err => console.error(err));
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

  if (isAuthLoading) {
    return <SplashLoading appName={settings.appName} appLogo={settings.appLogo} />;
  }

  if (!user) {
    return <LoginGate loginWithGoogle={loginWithGoogle} appName={settings.appName} appSubtitle={settings.appSubtitle} appLogo={settings.appLogo} />;
  }

  return (
    <InventoryContext.Provider value={{ products, setProducts, inbound, setInbound, outbound, setOutbound, documents, setDocuments, settings, setSettings, calculateStock, isCloudConnected, isRescuing, toggleTheme, syncError, storage: storageState, user, logout, loginWithGoogle }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/database" element={user?.email === 'febrianataum@gmail.com' ? <DatabaseBarang /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/masuk" element={user?.email === 'febrianataum@gmail.com' ? <BarangMasuk /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/keluar" element={user?.email === 'febrianataum@gmail.com' ? <BarangKeluar /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/berita-acara" element={user?.email === 'febrianataum@gmail.com' ? <CetakBeritaAcara /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/stok" element={<StokBarang />} />
            <Route path="/dashboard/laporan-blora" element={<LaporanBlora />} />
            <Route path="/dashboard/dokumen" element={user?.email === 'febrianataum@gmail.com' ? <Dokumen /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/rekap" element={<RekapBulanan />} />
            <Route path="/dashboard/rekap-indikator" element={<RekapIndikator />} />
            <Route path="/dashboard/profile" element={user?.email === 'febrianataum@gmail.com' ? <Profile /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </InventoryContext.Provider>
  );
};

export default App;