
import React, { useState } from 'react';
import { useInventory } from '../App';
import { Save, Image as ImageIcon, User, Warehouse, Cloud, ShieldCheck, ExternalLink, RefreshCw, Smartphone, Laptop } from 'lucide-react';

const Profile: React.FC = () => {
  const { settings, setSettings, isCloudConnected } = useInventory();
  const [isTesting, setIsTesting] = useState(false);

  // Fungsi untuk membersihkan input dari tanda kutip dan spasi tambahan
  const sanitizeInput = (val: string) => {
    return val.replace(/['"]+/g, '').trim();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSettings({ ...settings, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const testConnection = async () => {
    if (!settings.fbApiKey || !settings.fbProjectId) return alert('Lengkapi data API Key dan Project ID Firebase!');
    setIsTesting(true);
    
    // Simulasi penyimpanan dan aktivasi
    setTimeout(() => {
      setSettings({ ...settings, syncEnabled: true });
      setIsTesting(false);
      alert('Konfigurasi Disimpan! Sistem akan mencoba menghubungkan ke Firebase secara realtime.');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 uppercase tracking-tighter">Profil & Koneksi Cloud</h2>
          <p className="text-slate-500 text-sm font-medium">Kustomisasi identitas dan aktifkan sinkronisasi HP-Laptop.</p>
        </div>
      </div>

      {/* Firebase Cloud Sync Section */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cloud size={240} />
         </div>
         <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-orange-500 rounded-[1.5rem] shadow-xl"><Cloud size={28}/></div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Realtime Firebase Sync</h3>
                  <p className="text-orange-200 text-xs font-semibold">Data sinkron otomatis antara HP dan Laptop dalam <span className="underline italic">realtime</span>.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firebase API Key (Tanpa Tanda Kutip)</label>
                  <input 
                    type="password" 
                    placeholder="Contoh: AIzaSyA..."
                    className="w-full bg-white/10 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:bg-white/20 outline-none transition-all placeholder:text-white/20"
                    value={settings.fbApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, fbApiKey: sanitizeInput(e.target.value) })}
                  />
               </div>
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firebase Project ID</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: my-project-123"
                    className="w-full bg-white/10 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:bg-white/20 outline-none transition-all placeholder:text-white/20"
                    value={settings.fbProjectId || ''}
                    onChange={(e) => setSettings({ ...settings, fbProjectId: sanitizeInput(e.target.value) })}
                  />
               </div>
               <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App ID (Opsional)</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 1:123456789:web:abcdef..."
                    className="w-full bg-white/10 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:bg-white/20 outline-none transition-all placeholder:text-white/20"
                    value={settings.fbAppId || ''}
                    onChange={(e) => setSettings({ ...settings, fbAppId: sanitizeInput(e.target.value) })}
                  />
               </div>
            </div>

            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-6 text-slate-400">
                <div className="flex flex-col items-center gap-1">
                  <Laptop size={20} className={isCloudConnected ? "text-emerald-400" : ""}/>
                  <span className="text-[8px] font-bold">LAPTOP</span>
                </div>
                <div className="h-px w-10 bg-white/10 relative">
                  <div className={`absolute inset-0 bg-emerald-500/50 blur-sm ${isCloudConnected ? 'opacity-100' : 'opacity-0'}`}></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Smartphone size={20} className={isCloudConnected ? "text-emerald-400" : ""}/>
                  <span className="text-[8px] font-bold">PHONE</span>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                 <button 
                  onClick={testConnection}
                  disabled={isTesting}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                 >
                   {isTesting ? <RefreshCw className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                   {isTesting ? 'MENGHUBUNGKAN...' : 'SIMPAN & AKTIFKAN CLOUD'}
                 </button>
                 <a 
                  href="https://console.firebase.google.com" 
                  target="_blank" 
                  className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all shadow-lg"
                  title="Buka Firebase Console"
                 >
                   <ExternalLink size={20}/>
                 </a>
              </div>
            </div>
            
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] text-center">Sistem akan otomatis menghapus tanda kutip jika Anda tidak sengaja menyalinnya.</p>
         </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-200 space-y-10">
        <div className="flex flex-col md:flex-row items-center gap-10 border-b border-slate-50 pb-10">
           <div className="w-32 h-32 rounded-[2rem] bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden group shadow-inner shrink-0">
              {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={32} />}
              <label className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer backdrop-blur-sm">
                GANTI LOGO
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
           </div>
           <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Aplikasi</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-800 focus:border-blue-300 focus:bg-white transition-all outline-none text-lg shadow-sm"
                  value={settings.appName}
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><User size={14}/> Penanggung Jawab</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                value={settings.adminName}
                onChange={(e) => setSettings({ ...settings, adminName: e.target.value })}
              />
           </div>
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Warehouse size={14}/> Lokasi Gudang</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                value={settings.warehouseName}
                onChange={(e) => setSettings({ ...settings, warehouseName: e.target.value })}
              />
           </div>
        </div>

        <div className="pt-6 border-t border-slate-50 flex justify-end">
           <button 
            className="w-full sm:w-auto flex items-center justify-center gap-3 text-white px-12 py-5 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-xs" 
            style={{ backgroundColor: settings.themeColor }}
           >
             <Save size={18}/> Simpan Profil & Pengaturan
           </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
