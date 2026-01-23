
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

  // Fungsi untuk membersihkan input dari tanda kutip dan spasi tambahan
  const sanitizeInput = (val: string) => {
    return val.replace(/['"]+/g, '').trim();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Maksimal 2MB agar sinkronisasi lancar.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSettings({ ...settings, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    if (confirm("Hapus logo dan kembali ke ikon default?")) {
      setSettings({ ...settings, logo: '' });
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
          <h2 className="text-3xl font-extrabold text-slate-800 uppercase tracking-tighter">Profil & Branding</h2>
          <p className="text-slate-500 text-sm font-medium">Kustomisasi identitas aplikasi untuk instansi Anda.</p>
        </div>
      </div>

      {/* Identitas & Logo Section */}
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-200 space-y-10">
        <div className="flex flex-col md:flex-row items-center gap-10 border-b border-slate-50 pb-10">
           <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden shadow-inner shrink-0 transition-all group-hover:border-blue-400">
                {settings.logo ? (
                  <img src={settings.logo} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <ImageIcon size={48} />
                    <span className="text-[8px] font-black uppercase mt-2">No Logo</span>
                  </div>
                )}
                
                <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[10px] font-black cursor-pointer backdrop-blur-sm">
                  <Camera size={24} className="mb-2" />
                  GANTI LOGO
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              
              {settings.logo && (
                <button 
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all active:scale-90"
                  title="Hapus Logo"
                >
                  <Trash2 size={14} />
                </button>
              )}
           </div>

           <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Aplikasi / Instansi</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-800 focus:border-blue-300 focus:bg-white transition-all outline-none text-xl shadow-sm"
                  value={settings.appName}
                  placeholder="Contoh: SITAMPAN"
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slogan / Subtitle</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-600 focus:border-blue-300 focus:bg-white transition-all outline-none text-sm shadow-sm"
                  value={settings.appSubtitle}
                  placeholder="Contoh: Sistem Inventaris Logistik"
                  onChange={(e) => setSettings({ ...settings, appSubtitle: e.target.value })}
                />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><User size={14}/> Nama Admin (Penanggung Jawab)</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                value={settings.adminName}
                onChange={(e) => setSettings({ ...settings, adminName: e.target.value })}
              />
           </div>
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Warehouse size={14}/> Nama Gudang / Lokasi</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                value={settings.warehouseName}
                onChange={(e) => setSettings({ ...settings, warehouseName: e.target.value })}
              />
           </div>
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Paintbrush size={14}/> Warna Tema Utama</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  className="w-16 h-14 bg-slate-50 border border-slate-100 rounded-2xl p-1 cursor-pointer outline-none shadow-sm"
                  value={settings.themeColor}
                  onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                />
                <input 
                  type="text" 
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-mono font-bold text-slate-700 outline-none"
                  value={settings.themeColor.toUpperCase()}
                  onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                />
              </div>
           </div>
        </div>

        <div className="pt-6 border-t border-slate-50 flex justify-end">
           <button 
            className="w-full sm:w-auto flex items-center justify-center gap-3 text-white px-12 py-5 rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-xs" 
            style={{ backgroundColor: settings.themeColor }}
           >
             <Save size={18}/> Simpan Profil & Branding
           </button>
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
                  <h3 className="text-2xl font-black uppercase tracking-tight">Realtime Cloud Sync</h3>
                  <p className="text-orange-200 text-xs font-semibold italic">Hubungkan HP dan Laptop agar data logo & transaksi sinkron otomatis.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firebase API Key</label>
                  <input 
                    type="password" 
                    placeholder="AIzaSyA..."
                    className="w-full bg-white/10 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:bg-white/20 outline-none transition-all placeholder:text-white/20"
                    value={settings.fbApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, fbApiKey: sanitizeInput(e.target.value) })}
                  />
               </div>
               <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firebase Project ID</label>
                  <input 
                    type="text" 
                    placeholder="my-project-id"
                    className="w-full bg-white/10 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:bg-white/20 outline-none transition-all placeholder:text-white/20"
                    value={settings.fbProjectId || ''}
                    onChange={(e) => setSettings({ ...settings, fbProjectId: sanitizeInput(e.target.value) })}
                  />
               </div>
            </div>

            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-6 text-slate-400">
                <div className="flex flex-col items-center gap-1">
                  <Laptop size={20} className={isCloudConnected ? "text-emerald-400" : ""}/>
                  <span className="text-[8px] font-bold uppercase tracking-tighter">Laptop Mode</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-1 rounded-full ${isCloudConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-white/10'}`}></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Smartphone size={20} className={isCloudConnected ? "text-emerald-400" : ""}/>
                  <span className="text-[8px] font-bold uppercase tracking-tighter">Mobile App</span>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                 <button 
                  onClick={testConnection}
                  disabled={isTesting}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl"
                 >
                   {isTesting ? <RefreshCw className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                   {isTesting ? 'MENGHUBUNGKAN...' : 'AKTIFKAN CLOUD SYNC'}
                 </button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Profile;
