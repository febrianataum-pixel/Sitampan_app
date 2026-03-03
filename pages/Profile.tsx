
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Profil & Branding</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Kustomisasi identitas aplikasi untuk instansi Anda.</p>
        </div>
      </div>

      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-8 md:p-12 rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 space-y-10 theme-transition">
        
        {/* Logo Branding (Sidebar/Header) */}
        <div className="flex flex-col md:flex-row items-center gap-10 border-b dark:border-white/5 pb-10">
           <div className="relative group text-center space-y-2">
              <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Logo Instansi (Internal)</label>
              <div className="w-32 h-32 rounded-ios bg-slate-100 dark:bg-white/5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden shadow-inner transition-all group-hover:border-ios-blue-light mx-auto">
                {settings.logo ? (
                  <img src={settings.logo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                    <ImageIcon size={32} />
                    <span className="text-[7px] font-bold uppercase mt-1">Logo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer backdrop-blur-sm">
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
              <label className="block text-[9px] font-bold text-ios-blue-light dark:text-ios-blue-dark uppercase tracking-wide mb-2 flex items-center gap-1 justify-center"><Smartphone size={10}/> Logo Aplikasi (Splash Screen)</label>
              <div className="w-32 h-32 rounded-ios bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 flex flex-col items-center justify-center border-2 border-dashed border-ios-blue-light/20 dark:border-ios-blue-dark/20 relative overflow-hidden shadow-inner transition-all group-hover:border-ios-blue-light mx-auto">
                {settings.appLogo ? (
                  <img src={settings.appLogo} className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center text-ios-blue-light/40 dark:text-ios-blue-dark/40">
                    <Smartphone size={32} />
                    <span className="text-[7px] font-bold uppercase mt-1">Splash Logo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-ios-blue-light/60 dark:bg-ios-blue-dark/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer backdrop-blur-sm">
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
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Nama Aplikasi</label>
                <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-900 dark:text-slate-100 outline-none text-xl shadow-sm" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Slogan</label>
                <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-600 dark:text-slate-400 outline-none text-sm shadow-sm" value={settings.appSubtitle} onChange={(e) => setSettings({ ...settings, appSubtitle: e.target.value })} />
              </div>
           </div>
        </div>

        <div className="bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 p-4 rounded-ios border border-ios-blue-light/20 dark:border-ios-blue-dark/20 flex gap-3">
          <Info className="text-ios-blue-light dark:text-ios-blue-dark shrink-0" size={20}/>
          <p className="text-[10px] text-ios-blue-light dark:text-ios-blue-dark font-medium"><b>Logo Aplikasi (Splash Screen)</b> digunakan pada animasi pembuka saat aplikasi pertama kali dimuat di perangkat dan juga akan muncul sebagai ikon pada tab browser (favicon). Gunakan gambar transparan format PNG untuk hasil terbaik.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-1">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1"><User size={14}/> Nama Admin</label>
              <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm" value={settings.adminName} onChange={(e) => setSettings({ ...settings, adminName: e.target.value })} />
           </div>
           <div className="space-y-1">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1"><Warehouse size={14}/> Lokasi Gudang</label>
              <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm" value={settings.warehouseName} onChange={(e) => setSettings({ ...settings, warehouseName: e.target.value })} />
           </div>
        </div>

        <div className="pt-6 border-t dark:border-white/5 flex justify-end">
           <button onClick={() => { localStorage.setItem('inv_settings', JSON.stringify(settings)); alert('Profil & Branding disimpan!'); window.location.reload(); }} className="w-full sm:w-auto flex items-center justify-center gap-3 text-white px-12 py-3 rounded-ios font-bold shadow-sm text-xs" style={{ backgroundColor: settings.themeColor }}>
             <Save size={18}/> Simpan Profil & Branding
           </button>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-ios-secondary-dark text-white p-8 md:p-12 rounded-ios-lg shadow-2xl relative overflow-hidden group border dark:border-white/10">
         <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-orange-500 rounded-ios shadow-xl"><Cloud size={28}/></div>
               <div>
                  <h3 className="text-2xl font-bold tracking-tight">Realtime Cloud Sync</h3>
                  <p className="text-orange-200 dark:text-orange-400/60 text-xs font-semibold italic">Sinkronisasi data antar perangkat secara otomatis.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">Firebase API Key</label>
                  <input type="password" placeholder="AIzaSyA..." className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-ios px-6 py-3 font-bold text-white outline-none" value={settings.fbApiKey || ''} onChange={(e) => setSettings({ ...settings, fbApiKey: sanitizeInput(e.target.value) })} />
               </div>
               <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">Firebase Project ID</label>
                  <input type="text" placeholder="my-project-id" className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-ios px-6 py-3 font-bold text-white outline-none" value={settings.fbProjectId || ''} onChange={(e) => setSettings({ ...settings, fbProjectId: sanitizeInput(e.target.value) })} />
               </div>
               <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">Firebase Storage Bucket</label>
                  <input type="text" placeholder="my-project.firebasestorage.app" className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-ios px-6 py-3 font-bold text-white outline-none" value={settings.fbStorageBucket || ''} onChange={(e) => setSettings({ ...settings, fbStorageBucket: sanitizeInput(e.target.value) })} />
               </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto justify-end">
               <button onClick={testConnection} disabled={isTesting} className="flex items-center justify-center gap-3 bg-white dark:bg-ios-blue-dark text-slate-900 dark:text-white px-10 py-3 rounded-ios font-bold text-xs transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm">
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
