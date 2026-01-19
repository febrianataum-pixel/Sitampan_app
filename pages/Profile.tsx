
import React from 'react';
import { useInventory } from '../App';
import { Save, Image as ImageIcon, User, Warehouse } from 'lucide-react';

const Profile: React.FC = () => {
  const { settings, setSettings } = useInventory();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Identitas & Tema</h2>
        <p className="text-slate-500 text-sm font-medium">Kustomisasi informasi instansi dan preferensi visual aplikasi.</p>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10 relative overflow-hidden">
        {/* Branding Section */}
        <div className="flex flex-col md:flex-row items-center gap-10 border-b border-slate-50 pb-10">
           <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border-4 border-dashed border-slate-200 relative overflow-hidden group shadow-inner shrink-0">
              {settings.logo ? (
                <img src={settings.logo} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <ImageIcon className="text-slate-300" size={48} />
              )}
              <label className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[10px] font-black cursor-pointer backdrop-blur-sm">
                <ImageIcon size={24} className="mb-2" />
                GANTI LOGO
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
           </div>
           <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Utama Aplikasi</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-800 focus:border-blue-300 focus:bg-white transition-all outline-none text-xl shadow-sm italic"
                  value={settings.appName}
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtitle Aplikasi</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-600 focus:border-blue-300 focus:bg-white transition-all outline-none shadow-sm"
                  value={settings.appSubtitle}
                  onChange={(e) => setSettings({ ...settings, appSubtitle: e.target.value })}
                  placeholder="Misal: Manajemen Inventaris Warehouse"
                />
              </div>
           </div>
        </div>

        {/* Info Admin & Gudang */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><User size={14}/> Nama Admin Penanggung Jawab</label>
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
        </div>

        {/* Visual Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warna Tema Utama</label>
            <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-[2rem] border border-slate-100">
              <input 
                type="color" 
                className="w-16 h-16 rounded-2xl cursor-pointer border-none bg-transparent"
                value={settings.themeColor}
                onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
              />
              <div className="flex-1">
                <p className="font-mono font-black text-slate-800 uppercase text-lg">{settings.themeColor}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aksen Aktif</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latar Belakang Aplikasi</label>
            <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 space-y-4">
              <div className="flex gap-2">
                 <button 
                  onClick={() => setSettings({...settings, bgType: 'color'})}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${settings.bgType === 'color' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'}`}
                 >WARNA</button>
                 <button 
                  onClick={() => setSettings({...settings, bgType: 'gradient'})}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${settings.bgType === 'gradient' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'}`}
                 >GRADIENT</button>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                  value={settings.bgColor}
                  onChange={(e) => setSettings({ ...settings, bgColor: e.target.value })}
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pilih Dasar Warna</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-end">
           <button className="w-full md:w-auto flex items-center justify-center gap-3 text-white px-12 py-5 rounded-2xl font-black shadow-2xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs" style={{ backgroundColor: settings.themeColor }}>
             <Save size={20}/> Simpan Profil
           </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
