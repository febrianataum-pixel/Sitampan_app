
import React, { useState } from 'react';
import { useInventory } from '../App';
import { 
  Save, 
  Image as ImageIcon, 
  User, 
  Warehouse, 
  Cloud, 
  ShieldCheck, 
  ExternalLink, 
  RefreshCw, 
  Smartphone, 
  Laptop,
  Trash2,
  Camera,
  Paintbrush
} from 'lucide-react';

const Profile: React.FC = () => {
  const { settings, setSettings, isCloudConnected } = useInventory();
  const [isTesting, setIsTesting] = useState(false);

  const sanitizeInput = (val: string) => val.replace(/['"]+/g, '').trim();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Ukuran file terlalu besar! Maksimal 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => setSettings({ ...settings, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    if (confirm("Hapus logo?")) setSettings({ ...settings, logo: '' });
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
        <div className="flex flex-col md:flex-row items-center gap-10 border-b dark:border-white/5 pb-10">
           <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden shadow-inner transition-all group-hover:border-blue-400">
                {settings.logo ? (
                  <img src={settings.logo} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300 dark:text-slate-700">
                    <ImageIcon size={48} />
                    <span className="text-[8px] font-black uppercase mt-2">No Logo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[10px] font-black cursor-pointer backdrop-blur-sm">
                  <Camera size={24} className="mb-2" />
                  GANTI LOGO
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              {settings.logo && (
                <button onClick={removeLogo} className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-90"><Trash2 size={14} /></button>
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
           <button className="w-full sm:w-auto flex items-center justify-center gap-3 text-white px-12 py-5 rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs" style={{ backgroundColor: settings.themeColor }}>
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
