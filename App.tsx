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
  CloudUpload,
  Mail,
  Lock,
  Boxes,
  Layers,
  Send,
  ScrollText,
  Archive,
  Bell,
  LogOut,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
  userPermissions: any;
  hasPermission: (menuKey: string, actionKey?: 'view' | 'add' | 'edit' | 'delete') => boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { settings, isCloudConnected, isRescuing, toggleTheme, syncError, user, logout, userPermissions, hasPermission } = useInventory();
  const location = useLocation();
  const todayFormatted = formatIndoDate(new Date().toISOString().split('T')[0]);

  useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);

  const isSpecialUser = user?.email && ['febrianataum@gmail.com', 'febridesain19@gmail.com'].includes(user.email.toLowerCase().trim());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : (settings.adminName ? settings.adminName.split(' ')[0] : 'Admin');

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={21} />, key: 'dashboard' },
    { name: 'Database', path: '/dashboard/database', icon: <Database size={21} />, key: 'database' },
    { name: 'Masuk', path: '/dashboard/masuk', icon: <ArrowDownCircle size={21} />, key: 'masuk' },
    { name: 'Keluar', path: '/dashboard/keluar', icon: <ArrowUpCircle size={21} />, key: 'keluar' },
    { name: 'Berita Acara', path: '/dashboard/berita-acara', icon: <FileText size={21} />, key: 'berita_acara' },
    { name: 'Stok', path: '/dashboard/stok', icon: <BarChart3 size={21} />, key: 'stok' },
    { name: 'Laporan', path: '/dashboard/laporan-blora', icon: <FileText size={21} />, key: 'laporan' },
    { name: 'Dokumen', path: '/dashboard/dokumen', icon: <Package size={21} />, key: 'dokumen' },
    { name: 'Rekap', path: '/dashboard/rekap', icon: <CalendarDays size={21} />, key: 'rekap' },
    { name: 'Indikator', path: '/dashboard/rekap-indikator', icon: <PieChart size={21} />, key: 'indikator' },
    { name: 'Profil', path: '/dashboard/profile', icon: <UserCircle size={21} />, key: 'profile' },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (isSpecialUser) return true;
    return hasPermission(item.key, 'view');
  });

  const firstAllowedPath = isSpecialUser 
    ? '/dashboard' 
    : (allMenuItems.find(item => hasPermission(item.key, 'view'))?.path || '/dashboard/profile');

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#dce5fb] via-[#edf2fc] to-[#d7e3fa] dark:from-[#090e1a] dark:via-[#0f172a] dark:to-[#1e1b4b] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                {settings.logo ? (
                  <img src={settings.logo} className="w-7 h-7 rounded-xl object-cover" referrerPolicy="no-referrer" alt="Logo" />
                ) : (
                  <Sparkles size={20} />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{settings.appName}</h3>
                <p className="text-[10px] text-slate-400 font-medium">Logistik Kebencanaan</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {menuItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }: any) => `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-xs transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <div className="shrink-0">{item.icon}</div>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {user && (
          <button 
            onClick={() => { if (confirm("Apakah Anda yakin ingin keluar?")) logout(); }} 
            className="flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl font-bold text-xs transition-all cursor-pointer"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Keluar Akun</span>
          </button>
        )}
      </aside>

      {/* Desktop Floating Pill Sidebar Rail (Expandable) */}
      <aside className={`hidden md:flex flex-col items-center justify-between my-5 ml-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[32px] py-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/90 dark:border-white/10 shrink-0 z-40 transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'w-60 px-3' : 'w-[72px] px-0'
      }`}>
        {/* Top: Logo & Menu Items List */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Top Logo / Brand Icon & Name */}
          <NavLink 
            to="/dashboard" 
            className={`flex items-center transition-all hover:scale-105 active:scale-95 group relative ${
              isSidebarExpanded ? 'w-full gap-3 px-3 py-1.5 justify-start' : 'w-12 h-12 justify-center rounded-2xl'
            }`}
          >
            {settings.logo ? (
              <img src={settings.logo} className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0" referrerPolicy="no-referrer" alt="Logo" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="5" fill="currentColor" fillOpacity="0.9" />
                  <circle cx="16" cy="8" r="5" fill="currentColor" fillOpacity="0.7" />
                  <circle cx="8" cy="16" r="5" fill="currentColor" fillOpacity="0.7" />
                  <circle cx="16" cy="16" r="5" fill="currentColor" fillOpacity="0.9" />
                </svg>
              </div>
            )}
            {isSidebarExpanded ? (
              <div className="flex flex-col min-w-0 overflow-hidden animate-in fade-in duration-200">
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">{settings.appName}</h2>
                <p className="text-[10px] text-slate-400 font-medium truncate">Logistik Kebencanaan</p>
              </div>
            ) : (
              <span className="absolute left-16 px-2.5 py-1 bg-slate-900/90 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {settings.appName}
              </span>
            )}
          </NavLink>

          <div className={`h-[1px] bg-slate-200/60 dark:bg-white/10 my-0.5 transition-all ${isSidebarExpanded ? 'w-full' : 'w-8'}`}></div>

          {/* Vertical Icon Rail & Text Labels */}
          <nav className="flex flex-col items-center gap-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide max-h-[calc(100vh-230px)] w-full">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }: any) => `transition-all duration-200 group relative ${
                  isSidebarExpanded 
                    ? `w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(55,88,249,0.25)]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                      }`
                    : `w-11 h-11 rounded-2xl flex items-center justify-center ${
                        isActive
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-[0_4px_16px_rgba(55,88,249,0.18)] border border-slate-100 dark:border-slate-700/60 ring-1 ring-black/5 scale-105'
                          : 'text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/5'
                      }`
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {isSidebarExpanded ? (
                  <span className="truncate whitespace-nowrap">{item.name}</span>
                ) : (
                  /* Tooltip when collapsed */
                  <span className="absolute left-16 px-3 py-1.5 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10 dark:border-slate-200">
                    {item.name}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Actions: Hamburger Toggle (Expand/Collapse) & Logout */}
        <div className={`flex flex-col items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10 w-full ${isSidebarExpanded ? 'px-1' : 'px-2'}`}>
          {/* Hamburger Menu Toggle button at bottom */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`rounded-2xl transition-all duration-200 group relative cursor-pointer ${
              isSidebarExpanded
                ? 'w-full flex items-center gap-3.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400'
                : 'w-11 h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/30'
            }`}
            title={isSidebarExpanded ? "Kecilkan Menu" : "Buka Menu Lengkap"}
          >
            <div className="shrink-0">
              <Menu size={20} />
            </div>
            {isSidebarExpanded ? (
              <span className="truncate whitespace-nowrap font-bold">Kecilkan Menu</span>
            ) : (
              <span className="absolute left-16 px-3 py-1.5 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10 dark:border-slate-200">
                Menu Lengkap
              </span>
            )}
          </button>

          {user && (
            <button
              onClick={() => { if (confirm("Apakah Anda yakin ingin keluar?")) logout(); }}
              className={`rounded-2xl transition-all duration-200 group relative cursor-pointer text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 ${
                isSidebarExpanded
                  ? 'w-full flex items-center gap-3.5 px-3.5 py-2.5 text-xs font-bold'
                  : 'w-11 h-11 flex items-center justify-center'
              }`}
            >
              <div className="shrink-0">
                <LogOut size={19} />
              </div>
              {isSidebarExpanded ? (
                <span className="truncate whitespace-nowrap text-rose-500 font-bold">Keluar Akun</span>
              ) : (
                <span className="absolute left-16 px-3 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Keluar Akun
                </span>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Modern Top Floating Header */}
        <header className="px-4 md:px-8 pt-4 md:pt-5 pb-2 shrink-0 z-30 no-print">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left: Greeting & App Title */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-white transition-all"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="5" fill="currentColor" fillOpacity="0.9" />
                    <circle cx="16" cy="8" r="5" fill="currentColor" fillOpacity="0.7" />
                    <circle cx="8" cy="16" r="5" fill="currentColor" fillOpacity="0.7" />
                    <circle cx="16" cy="16" r="5" fill="currentColor" fillOpacity="0.9" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{firstName}</span>
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Sistem Tanggap Logistik Kebencanaan
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Circular Floating Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              
              {/* Cloud Sync Status Badge */}
              <div className="hidden sm:flex items-center">
                {isRescuing ? (
                  <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-blue-500/20 shadow-sm animate-pulse">
                    <CloudUpload size={12} />
                    <span>RESCUING...</span>
                  </div>
                ) : isCloudConnected ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>SYNC AKTIF</span>
                  </div>
                ) : syncError ? (
                  <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-rose-500/20 shadow-sm">
                    <ShieldAlert size={12} />
                    <span>ERROR</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-slate-500/20 shadow-sm">
                    <WifiOff size={12} />
                    <span>OFFLINE</span>
                  </div>
                )}
              </div>

              {/* Theme Toggle Circle Button */}
              <button 
                onClick={toggleTheme} 
                title="Ganti Tema"
                className="w-10 h-10 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/90 dark:border-white/10 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {settings.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* User Avatar with Live Online Dot */}
              <NavLink 
                to="/dashboard/profile"
                className="flex items-center gap-2.5 pl-1 group"
              >
                <div className="relative">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm">
                      {firstName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {/* Live Green Online Dot Indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></span>
                </div>
              </NavLink>

            </div>
          </div>
        </header>

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-7 py-3 md:py-5 pb-28 md:pb-8 scrollbar-hide">
          <div className="w-full mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>

        {/* Mobile Floating Bottom Pill Navigation Bar */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-full shadow-2xl border border-white/80 dark:border-white/10 px-3 py-2 flex items-center justify-around z-40 no-print shadow-slate-900/10">
          {menuItems.filter(item => ['Dashboard', 'Masuk', 'Keluar', 'Berita Acara', 'Profil'].includes(item.name)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: any) => `flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className="shrink-0 scale-90">{item.icon}</div>
              <span className="text-[9px] font-bold tracking-tight">{item.name}</span>
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
  
  // Custom Email/Password Authentication States
  const isAndroidWebView = typeof window !== 'undefined' && (
    /wv|Android.*Version\/[0-9.]+/i.test(navigator.userAgent) ||
    (window as any).Android !== undefined
  );

  const [useEmail, setUseEmail] = useState(isAndroidWebView);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error("Google Login Error:", e);
      let msg = "Gagal login dengan Google.";
      if (e?.code === 'auth/unauthorized-domain') {
        msg = `Domain (${window.location.hostname}) belum didaftarkan di Firebase Authentication > Settings > Authorized domains.`;
      } else if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request' || e?.message?.includes('popup')) {
        msg = "Popup Google diblokir oleh WebView APK Android. Silakan gunakan tab 'Email & Password' di atas untuk masuk.";
      } else if (e?.message?.includes('disallowed_useragent') || e?.code === 'auth/disallowed-useragent') {
        msg = "Google memblokir login OAuth di dalam WebView APK Android (disallowed_useragent). Silakan gunakan tab 'Email & Password' atau install lewat Google Chrome (PWA).";
      } else {
        msg = `Gagal login Google (${e?.code || e?.message || 'Error'}). Untuk pengguna APK HP, silakan gunakan tab 'Email & Password' di atas.`;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Email dan password wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password minimal harus 6 karakter.");
      return;
    }
    if (isSignUp && !displayName) {
      setErrorMsg("Nama Lengkap wajib diisi untuk pendaftaran.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (isSignUp) {
        // Sign Up Flow
        const newUserCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (newUserCredential.user) {
          await updateProfile(newUserCredential.user, { displayName: displayName.trim() });
          // Force a state update
          window.location.reload();
        }
      } else {
        // Sign In Flow
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      let msg = "Terjadi kesalahan saat otentikasi.";
      if (error.code === 'auth/user-not-found') {
        msg = "Email belum terdaftar. Silakan klik teks 'Belum punya akun? Daftar gratis disini' di bawah.";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "Password salah atau kredensial tidak sesuai. Jika belum mendaftar, silakan klik 'Daftar gratis disini'.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "Format email tidak valid. Masukkan alamat email yang benar.";
      } else if (error.code === 'auth/email-already-in-use') {
        msg = "Email ini sudah terdaftar. Silakan langsung login atau gunakan kata sandi yang sesuai.";
      } else if (error.code === 'auth/weak-password') {
        msg = "Password terlalu lemah (minimal harus 6 karakter).";
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = "Metode 'Email/Password' belum diaktifkan di Firebase Console. Harap buka Firebase Console > Authentication > Sign-in method dan aktifkan 'Email/Password'.";
      } else if (error.code === 'auth/unauthorized-domain') {
        msg = `Domain (${window.location.hostname}) belum diizinkan. Daftarkan di Firebase Console > Authentication > Settings > Authorized domains.`;
      } else if (error.code === 'auth/network-request-failed') {
        msg = "Koneksi internet gagal. Pastikan APK memiliki izin internet aktif.";
      } else {
        msg = `${error.message || 'Error saat otentikasi'}. Pastikan Email/Password aktif di Firebase Console.`;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-100 relative overflow-hidden font-sans">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className="w-full max-w-md p-8 md:p-10 mx-4 bg-slate-800/60 backdrop-blur-xl rounded-ios-lg border border-white/10 shadow-2xl space-y-6 text-center relative z-10">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-blue-600/10 rounded-3xl mx-auto flex items-center justify-center border border-blue-500/20 shadow-inner">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="w-10 h-10 object-contain font-bold" />
            ) : (
              <Package size={30} className="text-blue-400" />
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">{appName}</h2>
          <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase italic max-w-xs mx-auto leading-normal">
            {appSubtitle || "SISTEM TANGGAP PEMANTAUAN LOGISTIK KEBENCANAAN"}
          </p>
        </div>

        <div className="w-full h-px bg-white/5" />

        {/* Auth Method Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-ios border border-white/5 gap-1">
          <button
            onClick={() => { setUseEmail(false); setErrorMsg(null); }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-ios transition-all cursor-pointer ${!useEmail ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Google Sign-In
          </button>
          <button
            onClick={() => { setUseEmail(true); setErrorMsg(null); }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-ios transition-all cursor-pointer ${useEmail ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Email & Password
          </button>
        </div>

        <div className="space-y-4 text-left">
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold rounded-ios animate-pulse text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          {!useEmail ? (
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-300 text-center">
                Silakan masuk dengan Akun Google resmi Anda untuk mengakses sistem logistik. (Gunakan browser biasa)
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 py-3 px-6 rounded-ios font-bold shadow-lg shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer mt-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.84-4.53z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                )}
                {loading ? "Menghubungkan..." : "Masuk dengan Google"}
              </button>

              <div className="bg-blue-950/40 border border-blue-500/20 p-2.5 rounded-ios text-[10px] text-blue-300 space-y-1 mt-4">
                <p className="font-bold uppercase tracking-wider">💡 Pengguna HP Android / APK:</p>
                <p className="leading-relaxed">
                  Jika Anda membuka via APK dan login Google ditolak (disallowed_useragent), silakan klik menu <b>"Email & Password"</b> di atas untuk mendaftarkan akun atau masuk dengan mudah.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1">
                {isSignUp ? "Pendaftaran Akun Baru" : "Masuk Ke Akun"}
              </div>

              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Nama Lengkap</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Admin Blora"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-ios py-2.5 px-3 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600 font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Alamat Email (Gmail Anda)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="nama@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-ios py-2.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-ios py-2.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-ios text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                {isSignUp ? "Daftar Akun Baru" : "Masuk dengan Email"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isSignUp ? "Sudah punya akun? Masuk disini" : "Belum punya akun? Daftar gratis disini"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center pt-2">
          <details className="group text-left bg-slate-900/60 rounded-ios p-3 border border-white/5 text-[11px] text-slate-400">
            <summary className="font-bold text-blue-400 cursor-pointer flex items-center justify-between select-none">
              <span>❓ Bantuan: Mengapa APK tidak bisa login?</span>
              <span className="group-open:rotate-180 transition-transform text-xs">▼</span>
            </summary>
            <div className="mt-2.5 space-y-2 text-slate-300 leading-relaxed border-t border-white/5 pt-2">
              <p>
                <b>1. Google memblokir APK biasa:</b> Google memblokir login akun Google di dalam WebView aplikasi APK (aturan <i>disallowed_useragent</i>).
              </p>
              <p>
                <b>2. Solusi Terbaik (PWA):</b> Buka link web di <b>Google Chrome HP</b> &rarr; klik titik tiga (⋮) di kanan atas &rarr; pilih <b>"Instal aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>. Aplikasi terpasang seperti APK asli dan Login Google berfungsi 100% normal.
              </p>
              <p>
                <b>3. Jika tetap pakai APK:</b> Gunakan tab <b>"Email & Password"</b> di atas. Klik <i>"Daftar gratis disini"</i> untuk membuat akun pertama kali. (Pastikan provider Email/Password sudah diaktifkan di Firebase Console).
              </p>
            </div>
          </details>
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

  const [userPermissions, setUserPermissions] = useState<any>(null);

  // Helper function to check custom user permissions
  const hasPermission = (menuKey: string, actionKey: 'view' | 'add' | 'edit' | 'delete' = 'view') => {
    const isPrimaryAdmin = user?.email && ['febrianataum@gmail.com', 'febridesain19@gmail.com'].includes(user.email.toLowerCase().trim());
    if (isPrimaryAdmin) return true;
    if (userPermissions && typeof userPermissions === 'object' && userPermissions[menuKey]) {
      return !!userPermissions[menuKey][actionKey];
    }
    return false;
  };

  // Monitor real-time custom user permissions
  useEffect(() => {
    if (!user || !user.email) {
      setUserPermissions(null);
      return;
    }

    const emailClean = user.email.toLowerCase().trim();
    const isPrimaryAdmin = ['febrianataum@gmail.com', 'febridesain19@gmail.com'].includes(emailClean);
    
    if (isPrimaryAdmin) {
      setUserPermissions({
        dashboard: { view: true },
        database: { view: true, add: true, edit: true, delete: true },
        masuk: { view: true, add: true, edit: true, delete: true },
        keluar: { view: true, add: true, edit: true, delete: true },
        berita_acara: { view: true, add: true, edit: true, delete: true },
        stok: { view: true },
        laporan: { view: true },
        dokumen: { view: true, add: true, edit: true, delete: true },
        rekap: { view: true },
        indikator: { view: true },
        profile: { view: true, edit: true }
      });
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().permissions) {
        setUserPermissions(docSnap.data().permissions);
      } else {
        // Fallback: check matching doc by email if UID doc is not populated yet
        const q = query(collection(db, 'users'), where('email', '==', emailClean));
        getDocs(q).then((querySnap) => {
          if (!querySnap.empty) {
            const docWithPerms = querySnap.docs.find(d => d.data().permissions);
            if (docWithPerms && docWithPerms.data().permissions) {
              const perms = docWithPerms.data().permissions;
              setUserPermissions(perms);
              // Mirror to user's UID doc
              setDoc(userDocRef, {
                uid: user.uid,
                email: emailClean,
                displayName: user.displayName || docWithPerms.data().displayName || 'User',
                photoURL: user.photoURL || docWithPerms.data().photoURL || '',
                lastLogin: new Date().toISOString(),
                permissions: perms
              }, { merge: true }).catch(err => console.warn("Failed mirroring perms to UID doc:", err));
            }
          }
        }).catch(err => console.error("Error fetching permissions by email:", err));
      }
    }, (err) => {
      console.error("Gagal mendengarkan izin pengguna:", err);
    });

    return () => unsub();
  }, [user]);

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

        // Register user or update lastLogin in Firestore
        // Search by email to support matching pre-seeded/pre-registered user profiles
        const emailClean = (u.email || '').toLowerCase().trim();
        const isPrimaryAdmin = ['febrianataum@gmail.com', 'febridesain19@gmail.com'].includes(emailClean);

        const q = query(collection(db, 'users'), where('email', '==', emailClean));
        getDocs(q).then((querySnap) => {
          let existingPermissions: any = null;
          let tempDocId: string | null = null;
          let existingDisplayName: string | null = null;

          if (!querySnap.empty) {
            for (const docSnap of querySnap.docs) {
              const d = docSnap.data();
              if (d.permissions) {
                existingPermissions = d.permissions;
              }
              if (d.displayName) {
                existingDisplayName = d.displayName;
              }
              if (docSnap.id.startsWith('temp_')) {
                tempDocId = docSnap.id;
              }
            }
          }

          const userRef = doc(db, 'users', u.uid);

          const defaultPermissions = {
            dashboard: { view: true },
            database: { view: false, add: false, edit: false, delete: false },
            masuk: { view: false, add: false, edit: false, delete: false },
            keluar: { view: false, add: false, edit: false, delete: false },
            berita_acara: { view: false, add: false, edit: false, delete: false },
            stok: { view: true },
            laporan: { view: true },
            dokumen: { view: false, add: false, edit: false, delete: false },
            rekap: { view: true },
            indikator: { view: true },
            profile: { view: false, edit: false }
          };
          
          const adminPermissions = {
            dashboard: { view: true },
            database: { view: true, add: true, edit: true, delete: true },
            masuk: { view: true, add: true, edit: true, delete: true },
            keluar: { view: true, add: true, edit: true, delete: true },
            berita_acara: { view: true, add: true, edit: true, delete: true },
            stok: { view: true },
            laporan: { view: true },
            dokumen: { view: true, add: true, edit: true, delete: true },
            rekap: { view: true },
            indikator: { view: true },
            profile: { view: true, edit: true }
          };

          const finalPermissions = isPrimaryAdmin ? adminPermissions : (existingPermissions || defaultPermissions);

          const dataToSet = {
            uid: u.uid,
            email: emailClean,
            displayName: u.displayName || existingDisplayName || 'User',
            photoURL: u.photoURL || '',
            lastLogin: new Date().toISOString(),
            permissions: finalPermissions
          };

          setDoc(userRef, dataToSet, { merge: true }).then(() => {
            // If the existing document had a temporary document ID, delete it to keep database pristine
            if (tempDocId && tempDocId !== u.uid) {
              deleteDoc(doc(db, 'users', tempDocId)).catch(err => console.error("Error deleting temp user doc:", err));
            }
          }).catch(err => console.error("Error setting user document:", err));
        }).catch(err => console.error("Error finding user by email:", err));
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

const RestrictedAccess: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in duration-300">
    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 shadow-sm border border-amber-500/20">
      <ShieldAlert size={32} />
    </div>
    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Akses Menu Terbatas</h2>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
      Akun Anda (<strong>{user?.email}</strong>) saat ini belum memiliki akses ke menu yang dipilih atau sedang menunggu persetujuan otoritas dari Administrator.
    </p>
    <button
      onClick={() => { if (confirm("Apakah Anda yakin ingin keluar?")) logout(); }}
      className="flex items-center gap-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
    >
      <LogOut size={16} /> Keluar Akun
    </button>
  </div>
);

  if (isAuthLoading) {
    return <SplashLoading appName={settings.appName} appLogo={settings.appLogo} />;
  }

  if (!user) {
    return <LoginGate loginWithGoogle={loginWithGoogle} appName={settings.appName} appSubtitle={settings.appSubtitle} appLogo={settings.appLogo} />;
  }

  const isSpecialUser = user?.email && ['febrianataum@gmail.com', 'febridesain19@gmail.com'].includes(user.email.toLowerCase().trim());

  const getFirstAllowedRoute = () => {
    if (isSpecialUser) return '/dashboard';
    const menuOrder = [
      { key: 'dashboard', path: '/dashboard' },
      { key: 'database', path: '/dashboard/database' },
      { key: 'masuk', path: '/dashboard/masuk' },
      { key: 'keluar', path: '/dashboard/keluar' },
      { key: 'berita_acara', path: '/dashboard/berita-acara' },
      { key: 'stok', path: '/dashboard/stok' },
      { key: 'laporan', path: '/dashboard/laporan-blora' },
      { key: 'dokumen', path: '/dashboard/dokumen' },
      { key: 'rekap', path: '/dashboard/rekap' },
      { key: 'indikator', path: '/dashboard/rekap-indikator' },
      { key: 'profile', path: '/dashboard/profile' },
    ];
    const allowed = menuOrder.find(m => hasPermission(m.key, 'view'));
    return allowed ? allowed.path : '/dashboard/restricted';
  };

  return (
    <InventoryContext.Provider value={{ products, setProducts, inbound, setInbound, outbound, setOutbound, documents, setDocuments, settings, setSettings, calculateStock, isCloudConnected, isRescuing, toggleTheme, syncError, storage: storageState, user, logout, loginWithGoogle, userPermissions, hasPermission }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard" element={hasPermission('dashboard', 'view') ? <Dashboard /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/database" element={hasPermission('database', 'view') ? <DatabaseBarang /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/masuk" element={hasPermission('masuk', 'view') ? <BarangMasuk /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/keluar" element={hasPermission('keluar', 'view') ? <BarangKeluar /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/berita-acara" element={hasPermission('berita_acara', 'view') ? <CetakBeritaAcara /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/stok" element={hasPermission('stok', 'view') ? <StokBarang /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/laporan-blora" element={hasPermission('laporan', 'view') ? <LaporanBlora /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/dokumen" element={hasPermission('dokumen', 'view') ? <Dokumen /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/rekap" element={hasPermission('rekap', 'view') ? <RekapBulanan /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/rekap-indikator" element={hasPermission('indikator', 'view') ? <RekapIndikator /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/profile" element={hasPermission('profile', 'view') ? <Profile /> : <Navigate to={getFirstAllowedRoute()} replace />} />
            <Route path="/dashboard/restricted" element={<RestrictedAccess user={user} logout={logout} />} />
            <Route path="*" element={<Navigate to={getFirstAllowedRoute()} replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </InventoryContext.Provider>
  );
};

export default App;