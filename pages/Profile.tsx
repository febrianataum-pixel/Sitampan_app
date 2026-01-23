
import React, { useState } from 'react';
import { useInventory } from '../App';
import { 
  Save, 
  Image as ImageIcon, 
  User, 
  Warehouse, 
  Cloud, 
  ShieldCheck, 
  RefreshCw, 
  Trash2,
  Camera,
  Smartphone,
  Info
} from 'lucide-react';

const Profile: React.FC = () => {
  const { settings, setSettings, isCloudConnected } = useInventory();
  const [isTesting, setIsTesting] = useState(false);

  const sanitizeInput = (val: string) => val.replace(/['"]+/g, '').trim();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'appLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Ukuran file terlalu besar! Maksimal 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (field: 'logo' | 'appLogo') => {
    if (confirm("Hapus logo ini?")) {
      setSettings({ ...settings, [field]: '' });
    }
  };

  const testConnection = async () => {
    if (!settings.fbApiKey || !settings.fbProjectId) return alert('Lengkapi data Firebase!');
    setIsTesting(true);
    setTimeout(() => {
      setSettings({ ...settings, syncEnabled: true });
      setIsTesting(false);
      alert('Konfigurasi Disimpan!');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Profil & Branding</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Kustomisasi identitas aplikasi untuk instansi Anda.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-200 dark:border-white/5 space-y-10 theme-transition">
        
        {/* Logo Branding (Sidebar/Header) */}
        <div className="flex flex-col md:flex-row items-center gap-10 border-b dark:border-white/5 pb-10">
           <div className="relative group text-center space-y-2">
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Logo Instansi (Internal)</label>
              <div className="w-32 h-32 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden shadow-inner transition-all group-hover:border-blue-400 mx-auto">
                {settings.logo ? (
                  <img src={settings.logo} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300 dark:text-slate-700">
                    <ImageIcon size={32} />
                    <span className="text-[7px] font-black uppercase mt-1">Logo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[9px] font-black cursor-pointer backdrop-blur-sm">
                  <Camera size={20} className="mb-1" />
                  UPLOAD
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} />
                </label>
              </div>
              {settings.logo && (
                <button onClick={() => removeLogo('logo')} className="absolute -top-1 -right-1 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-90"><Trash2 size={12} /></button>
              )}
           </div>

           {/* LOGO APLIKASI / SPLASH SCREEN */}
           <div className="relative group text-center space-y-2">
              <label className="block text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1 justify-center"><Smartphone size={10}/> Logo Aplikasi (Splash Screen)</label>
              <div className="w-32 h-32 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-900/30 relative overflow-hidden shadow-inner transition-all group-hover:border-blue-500 mx-auto">
                {settings.appLogo ? (
                  <img src={settings.appLogo} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center text-blue-300 dark:text-blue-800">
                    <Smartphone size={32} />
                    <span className="text-[7px] font-black uppercase mt-1">Splash Logo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-blue-900/60 dark:bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[9px] font-black cursor-pointer backdrop-blur-sm">
                  <Camera size={20} className="mb-1" />
                  UPLOAD LOGO
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'appLogo')} />
                </label>
              </div>
              {settings.appLogo && (
                <button onClick={() => removeLogo('appLogo')} className="absolute -top-1 -right-1 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-90"><Trash2 size={12} /></button>
              )}
           </div>

           <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Aplikasi</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-black text-slate-800 dark:text-slate-100 focus:border-blue-300 outline-none text-xl shadow-sm" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Slogan</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-bold text-slate-600 dark:text-slate-400 focus:border-blue-300 outline-none text-sm shadow-sm" value={settings.appSubtitle} onChange={(e) => setSettings({ ...settings, appSubtitle: e.target.value })} />
              </div>
           </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
          <Info className="text-blue-500 shrink-0" size={20}/>
          <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium"><b>Logo Aplikasi (Splash Screen)</b> digunakan pada animasi pembuka saat aplikasi pertama kali dimuat di perangkat dan juga akan muncul sebagai ikon pada tab browser (favicon). Gunakan gambar transparan format PNG untuk hasil terbaik.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1"><User size={14}/> Nama Admin</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-black text-slate-700 dark:text-slate-200 outline-none shadow-sm" value={settings.adminName} onChange={(e) => setSettings({ ...settings, adminName: e.target.value })} />
           </div>
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1"><Warehouse size={14}/> Lokasi Gudang</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-black text-slate-700 dark:text-slate-200 outline-none shadow-sm" value={settings.warehouseName} onChange={(e) => setSettings({ ...settings, warehouseName: e.target.value })} />
           </div>
        </div>

        <div className="pt-6 border-t dark:border-white/5 flex justify-end">
           <button onClick={() => { localStorage.setItem('inv_settings', JSON.stringify(settings)); alert('Profil & Branding disimpan!'); window.location.reload(); }} className="w-full sm:w-auto flex items-center justify-center gap-3 text-white px-12 py-5 rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs" style={{ backgroundColor: settings.themeColor }}>
             <Save size={18}/> Simpan Profil & Branding
           </button>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-surface-dark text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group border dark:border-white/10">
         <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-orange-500 rounded-[1.5rem] shadow-xl"><Cloud size={28}/></div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Realtime Cloud Sync</h3>
                  <p className="text-orange-200 dark:text-orange-400/60 text-xs font-semibold italic">Sinkronisasi data antar perangkat secara otomatis.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Firebase API Key</label>
                  <input type="password" placeholder="AIzaSyA..." className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white outline-none" value={settings.fbApiKey || ''} onChange={(e) => setSettings({ ...settings, fbApiKey: sanitizeInput(e.target.value) })} />
               </div>
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Firebase Project ID</label>
                  <input type="text" placeholder="my-project-id" className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white outline-none" value={settings.fbProjectId || ''} onChange={(e) => setSettings({ ...settings, fbProjectId: sanitizeInput(e.target.value) })} />
               </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto justify-end">
               <button onClick={testConnection} disabled={isTesting} className="flex items-center justify-center gap-3 bg-white dark:bg-blue-600 text-slate-900 dark:text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl">
                 {isTesting ? <RefreshCw className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                 {isTesting ? 'MENGHUBUNGKAN...' : 'AKTIFKAN CLOUD SYNC'}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Profile;
