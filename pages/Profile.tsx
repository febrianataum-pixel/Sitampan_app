
import React, { useState, useEffect } from 'react';
import { useInventory, db } from '../App';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  Info,
  Users,
  Search,
  Check,
  Lock,
  Settings,
  ShieldAlert,
  Plus,
  Database,
  Download,
  Upload,
  FileDown,
  FileUp,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Boxes,
  Layers,
  Sparkles
} from 'lucide-react';

const PERMISSION_MODULES = [
  { key: 'dashboard', name: 'Dashboard Utama', actions: ['view'] },
  { key: 'database', name: 'Database Barang', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'masuk', name: 'Barang Masuk', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'keluar', name: 'Barang Keluar', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'berita_acara', name: 'Berita Acara (BAST)', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'stok', name: 'Stok Barang', actions: ['view'] },
  { key: 'laporan', name: 'Peta Sebaran Laporan', actions: ['view'] },
  { key: 'dokumen', name: 'Arsip Dokumen', actions: ['view', 'add', 'edit', 'delete'] },
  { key: 'rekap', name: 'Rekap Bulanan', actions: ['view'] },
  { key: 'indikator', name: 'Rekap Indikator', actions: ['view'] },
  { key: 'profile', name: 'Profil & Branding', actions: ['view', 'edit'] }
];

const Profile: React.FC = () => {
  const { 
    products, 
    setProducts, 
    inbound, 
    setInbound, 
    outbound, 
    setOutbound, 
    documents, 
    setDocuments, 
    settings, 
    setSettings, 
    isCloudConnected, 
    user, 
    logout, 
    userPermissions, 
    hasPermission 
  } = useInventory();
  const [isTesting, setIsTesting] = useState(false);

  const [activeTab, setActiveTab] = useState<'branding' | 'otoritas' | 'koneksi' | 'backup_restore'>('koneksi');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userPermissionsForm, setUserPermissionsForm] = useState<any>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // States for adding user manually
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // States for Backup & Restore
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSelections, setRestoreSelections] = useState({
    products: true,
    inbound: true,
    outbound: true,
    documents: true,
    settings: true
  });

  const isPrimaryAdmin = user?.email && ['febrianataum@gmail.com', 'febridesain19@gmail.com'].includes(user.email);
  const canEditBranding = isPrimaryAdmin || (userPermissions?.profile?.edit);

  const fetchUsers = async () => {
    if (!isPrimaryAdmin) return;
    setIsLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Auto-seed known active emails from authentication if they are not in Firestore
      const knownEmails = [
        { email: 'febrianataum@gmail.com', name: 'Febrian Ataum', uid: 'lNM5eFeec8O7AmmOKfOKEVsUpQP2' },
        { email: 'febridesain19@gmail.com', name: 'Febri Desain', uid: 'PBcOMizdQbTJpTiwt7wNMNE2v5s1' },
        { email: 'brianrasta46@gmail.com', name: 'Brian Rasta', uid: 'temp_brianrasta46' },
        { email: 'dinsosp3a.bla@gmail.com', name: 'Dinsos P3A Blora', uid: 'temp_dinsosp3a_bla' },
        { email: 'bidangsosialblora@gmail.com', name: 'Bidang Sosial Blora', uid: 'temp_bidangsosialblora' }
      ];

      for (const item of knownEmails) {
        const alreadyExists = list.some((u: any) => u.email?.toLowerCase() === item.email.toLowerCase());
        if (!alreadyExists) {
          const docId = item.uid;
          const defaultPermissions = {
            dashboard: { view: true },
            database: { view: item.email === 'febridesain19@gmail.com' || item.email === 'febrianataum@gmail.com' },
            masuk: { view: item.email === 'febridesain19@gmail.com' || item.email === 'febrianataum@gmail.com' },
            keluar: { view: item.email === 'febridesain19@gmail.com' || item.email === 'febrianataum@gmail.com' },
            berita_acara: { view: item.email === 'febridesain19@gmail.com' || item.email === 'febrianataum@gmail.com' },
            stok: { view: true },
            laporan: { view: true },
            dokumen: { view: item.email === 'febridesain19@gmail.com' || item.email === 'febrianataum@gmail.com' },
            rekap: { view: true },
            indikator: { view: true },
            profile: { view: item.email === 'febridesain19@gmail.com' || item.email === 'febrianataum@gmail.com', edit: item.email === 'febridesain19@gmail.com' || item.email === 'febrianataum@gmail.com' }
          };

          const newUserDoc = {
            uid: docId,
            email: item.email,
            displayName: item.name,
            photoURL: '',
            lastLogin: '',
            permissions: defaultPermissions
          };

          await setDoc(doc(db, 'users', docId), newUserDoc);
          list.push({ id: docId, ...newUserDoc });
        }
      }

      setUsersList(list);
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddNewUser = async () => {
    if (!newUserEmail || !newUserName) {
      alert("Email dan Nama Lengkap wajib diisi!");
      return;
    }
    const cleanEmail = newUserEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      alert("Format email tidak valid!");
      return;
    }

    const alreadyExists = usersList.some(u => u.email?.toLowerCase() === cleanEmail);
    if (alreadyExists) {
      alert("User dengan email ini sudah terdaftar!");
      return;
    }

    try {
      const docId = 'temp_' + cleanEmail.replace(/[@.]/g, '_');
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

      const newUserDoc = {
        uid: docId,
        email: cleanEmail,
        displayName: newUserName,
        photoURL: '',
        lastLogin: '',
        permissions: defaultPermissions
      };

      await setDoc(doc(db, 'users', docId), newUserDoc);
      alert(`User ${newUserName} berhasil ditambahkan! Anda sekarang dapat mengatur hak aksesnya.`);
      
      setUsersList(prev => [...prev, { id: docId, ...newUserDoc }]);
      setIsAddingUser(false);
      setNewUserEmail('');
      setNewUserName('');
    } catch (err) {
      console.error("Gagal menambahkan user:", err);
      alert("Terjadi kesalahan saat menyimpan user baru.");
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!isPrimaryAdmin) return;
    if (u.email === 'febrianataum@gmail.com' || u.email === 'febridesain19@gmail.com') {
      alert("Tidak dapat menghapus Admin Utama!");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${u.displayName || u.email}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', u.uid));
      alert(`User ${u.displayName || u.email} berhasil dihapus.`);
      setUsersList(prev => prev.filter(item => item.uid !== u.uid));
      if (selectedUser?.uid === u.uid) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Gagal menghapus user:", err);
      alert("Terjadi kesalahan saat menghapus user.");
    }
  };

  useEffect(() => {
    if (isPrimaryAdmin) {
      fetchUsers();
      setActiveTab('branding'); // Admin starts on Branding
    } else {
      setActiveTab('koneksi'); // Normal user starts on Koneksi Akun
    }
  }, [user]);

  const handleSelectUser = (u: any) => {
    setSelectedUser(u);
    // Initialize permissions form state with defaults
    const permissions = u.permissions || {};
    const defaultForm: any = {};
    PERMISSION_MODULES.forEach(mod => {
      defaultForm[mod.key] = {};
      mod.actions.forEach(act => {
        defaultForm[mod.key][act] = permissions[mod.key]?.[act] || false;
      });
    });
    setUserPermissionsForm(defaultForm);
  };

  const handleTogglePermission = (modKey: string, action: string) => {
    setUserPermissionsForm((prev: any) => ({
      ...prev,
      [modKey]: {
        ...prev[modKey],
        [action]: !prev[modKey]?.[action]
      }
    }));
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUser || isSavingPermissions) return;
    setIsSavingPermissions(true);
    try {
      const userRef = doc(db, 'users', selectedUser.uid);
      await updateDoc(userRef, { permissions: userPermissionsForm });
      alert(`Otoritas hak akses untuk ${selectedUser.displayName || selectedUser.email} berhasil diperbarui!`);
      
      // Update local state list
      setUsersList(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, permissions: userPermissionsForm } : u));
      setSelectedUser(prev => prev ? { ...prev, permissions: userPermissionsForm } : null);
    } catch (err) {
      console.error("Gagal memperbarui otoritas:", err);
      alert("Terjadi kesalahan saat menyimpan data otoritas.");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const sanitizeInput = (val: string) => val.replace(/['"]+/g, '').trim();

  const compressImage = (base64Str: string, format: string = 'image/png', maxWidth = 180, maxHeight = 180): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          let result = '';
          const isJpeg = format === 'image/jpeg' || format === 'image/jpg';
          
          if (isJpeg) {
            result = canvas.toDataURL('image/jpeg', 0.7);
          } else {
            // PNG or other format. Let's try to export as PNG.
            result = canvas.toDataURL('image/png');
            // If the PNG representation is extremely large (e.g. over 100KB), 
            // compress it to high-performance JPEG with 0.6 quality to keep Firestore happy.
            if (result.length > 100000) {
              result = canvas.toDataURL('image/jpeg', 0.6);
            }
          }

          // Double check: if it is still larger than 150KB, aggressively compress via low-res Jpeg.
          if (result.length > 150000) {
            const miniCanvas = document.createElement('canvas');
            miniCanvas.width = 100;
            miniCanvas.height = Math.round((height * 100) / width);
            const mCtx = miniCanvas.getContext('2d');
            if (mCtx) {
              mCtx.drawImage(img, 0, 0, miniCanvas.width, miniCanvas.height);
              result = miniCanvas.toDataURL('image/jpeg', 0.5);
            }
          }
          
          resolve(result);
        } else {
          // No canvas context, ensure we don't save a massive original file.
          if (base64Str.length > 150000) {
            resolve('');
          } else {
            resolve(base64Str);
          }
        }
      };
      img.onerror = () => {
        if (base64Str.length > 150000) {
          resolve('');
        } else {
          resolve(base64Str);
        }
      };
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'appLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        // Limit max dimensions to 180 for efficient loading and printing copy clarity
        compressImage(rawBase64, file.type, 180, 180)
          .then((compressed) => {
            if (compressed) {
              setSettings({ ...settings, [field]: compressed });
            } else {
              alert('Gagal mengompresi gambar. Silakan gunakan tipe file gambar standar yang lebih kecil.');
            }
          })
          .catch((err) => {
            console.error('Error compressing image:', err);
            if (rawBase64.length < 150000) {
              setSettings({ ...settings, [field]: rawBase64 });
            } else {
              alert('Ukuran berkas gambar terlalu besar untuk disimpan. Silakan gunakan berkas dengan resolusi lebih kecil.');
            }
          });
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

  // Backup Database Handler
  const handleDownloadBackup = () => {
    try {
      setIsDownloadingBackup(true);
      const backupData = {
        app: settings.appName || "SITAMPAN",
        system: "SITAMPAN Logistik Kebencanaan",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email || "anonymous",
        summary: {
          totalProducts: products.length,
          totalInbound: inbound.length,
          totalOutbound: outbound.length,
          totalDocuments: documents.length,
          hasSettings: true
        },
        data: {
          products: products || [],
          inbound: inbound || [],
          outbound: outbound || [],
          documents: documents || [],
          settings: settings || {}
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      const cleanAppName = (settings.appName || 'sitampan').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${cleanAppName}_backup_database_${dateFormatted}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setTimeout(() => {
        setIsDownloadingBackup(false);
      }, 600);
    } catch (err) {
      console.error("Backup error:", err);
      alert("Gagal melakukan backup database.");
      setIsDownloadingBackup(false);
    }
  };

  // Process File for Restore
  const processBackupFile = (file: File) => {
    setRestoreError(null);
    setRestoreSuccess(null);
    if (!file.name.toLowerCase().endsWith('.json')) {
      setRestoreError('Format berkas tidak valid. Harap pilih berkas cadangan dengan ekstensi .json.');
      setParsedBackup(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Determine data payload
        const dataPayload = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        const hasProducts = Array.isArray(dataPayload.products);
        const hasInbound = Array.isArray(dataPayload.inbound);
        const hasOutbound = Array.isArray(dataPayload.outbound);
        const hasDocuments = Array.isArray(dataPayload.documents);
        const hasSettings = typeof dataPayload.settings === 'object' && dataPayload.settings !== null;

        if (!hasProducts && !hasInbound && !hasOutbound && !hasDocuments && !hasSettings) {
          setRestoreError('File JSON ini tidak memuat struktur data cadangan SITAMPAN yang valid (tidak ditemukan data barang, transaksi, dokumen, atau pengaturan).');
          setParsedBackup(null);
          return;
        }

        const productsCount = hasProducts ? dataPayload.products.length : 0;
        const inboundCount = hasInbound ? dataPayload.inbound.length : 0;
        const outboundCount = hasOutbound ? dataPayload.outbound.length : 0;
        const documentsCount = hasDocuments ? dataPayload.documents.length : 0;

        setParsedBackup({
          raw: parsed,
          data: dataPayload,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          exportedAt: parsed.exportedAt || null,
          exportedBy: parsed.exportedBy || null,
          appName: parsed.app || dataPayload.settings?.appName || 'SITAMPAN',
          counts: {
            products: productsCount,
            inbound: inboundCount,
            outbound: outboundCount,
            documents: documentsCount,
            hasSettings
          }
        });

        setRestoreSelections({
          products: hasProducts && productsCount > 0,
          inbound: hasInbound && inboundCount > 0,
          outbound: hasOutbound && outboundCount > 0,
          documents: hasDocuments && documentsCount > 0,
          settings: hasSettings
        });
      } catch (err: any) {
        setRestoreError('Gagal memproses file JSON. Pastikan isi berkas tidak rusak atau terpotong.');
        setParsedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore Database
  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;
    
    const selectedCount = Object.values(restoreSelections).filter(Boolean).length;
    if (selectedCount === 0) {
      alert('Pilih setidaknya satu komponen data yang ingin dipulihkan.');
      return;
    }

    if (!confirm(`PERINGATAN RESTORE DATABASE:\n\nData aktif pada aplikasi saat ini akan ditimpa/diperbarui dengan data dari file cadangan "${parsedBackup.fileName}".\n\nApakah Anda yakin ingin memulihkan data tersebut sekarang?`)) {
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const payload = parsedBackup.data;
      const restoredSummary: string[] = [];

      // 1. Restore Products
      if (restoreSelections.products && Array.isArray(payload.products)) {
        setProducts(payload.products);
        restoredSummary.push(`${payload.products.length} Master Barang`);
        if (isCloudConnected && user) {
          try {
            const batch = writeBatch(db);
            payload.products.forEach((p: any) => batch.set(doc(db, 'products', p.id), p));
            await batch.commit();
          } catch (e) {
            console.error("Cloud batch product restore error:", e);
          }
        }
      }

      // 2. Restore Inbound
      if (restoreSelections.inbound && Array.isArray(payload.inbound)) {
        setInbound(payload.inbound);
        restoredSummary.push(`${payload.inbound.length} Transaksi Masuk`);
        if (isCloudConnected && user) {
          try {
            const batch = writeBatch(db);
            payload.inbound.forEach((i: any) => batch.set(doc(db, 'inbound', i.id), i));
            await batch.commit();
          } catch (e) {
            console.error("Cloud batch inbound restore error:", e);
          }
        }
      }

      // 3. Restore Outbound
      if (restoreSelections.outbound && Array.isArray(payload.outbound)) {
        setOutbound(payload.outbound);
        restoredSummary.push(`${payload.outbound.length} Transaksi Keluar`);
        if (isCloudConnected && user) {
          try {
            const batch = writeBatch(db);
            payload.outbound.forEach((o: any) => batch.set(doc(db, 'outbound', o.id), o));
            await batch.commit();
          } catch (e) {
            console.error("Cloud batch outbound restore error:", e);
          }
        }
      }

      // 4. Restore Documents
      if (restoreSelections.documents && Array.isArray(payload.documents)) {
        setDocuments(payload.documents);
        restoredSummary.push(`${payload.documents.length} Arsip Dokumen`);
        if (isCloudConnected && user) {
          try {
            const batch = writeBatch(db);
            payload.documents.forEach((d: any) => batch.set(doc(db, 'documents', d.id), d));
            await batch.commit();
          } catch (e) {
            console.error("Cloud batch document restore error:", e);
          }
        }
      }

      // 5. Restore Settings
      if (restoreSelections.settings && payload.settings) {
        await setSettings({ ...settings, ...payload.settings });
        restoredSummary.push('Pengaturan & Profil');
      }

      setRestoreSuccess(`Pemulihan database berhasil! (${restoredSummary.join(', ')})`);
      setParsedBackup(null);
    } catch (err: any) {
      console.error("Restore error:", err);
      setRestoreError(`Gagal melakukan restore: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const currentOrigin = window.location.origin;
  const suggestedRedirectUri = `${currentOrigin}/api/auth/callback`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Profil Pengguna</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Informasi akun, kustomisasi identitas, backup database, dan otoritas hak akses.</p>
        </div>
        
        {/* Tab Buttons */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-white/5 p-1 rounded-ios gap-1">
          <button 
            onClick={() => setActiveTab('koneksi')} 
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-ios transition-all ${activeTab === 'koneksi' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
          >
            <Cloud size={14} /> Koneksi Akun
          </button>

          <button 
            onClick={() => setActiveTab('backup_restore')} 
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-ios transition-all ${activeTab === 'backup_restore' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
          >
            <Database size={14} /> Backup & Restore
          </button>
          
          {canEditBranding && (
            <button 
              onClick={() => setActiveTab('branding')} 
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-ios transition-all ${activeTab === 'branding' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Settings size={14} /> Branding & Konfigurasi
            </button>
          )}
          
          {isPrimaryAdmin && (
            <button 
              onClick={() => setActiveTab('otoritas')} 
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-ios transition-all ${activeTab === 'otoritas' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <ShieldCheck size={14} /> Otoritas User
            </button>
          )}
        </div>
      </div>

      {activeTab === 'branding' && canEditBranding && (
        <div className="space-y-8 animate-in fade-in duration-300">
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
                    <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-900 dark:text-slate-100 outline-none text-xl shadow-sm" value={settings.appName || ''} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Slogan</label>
                    <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-600 dark:text-slate-400 outline-none text-sm shadow-sm" value={settings.appSubtitle || ''} onChange={(e) => setSettings({ ...settings, appSubtitle: e.target.value })} />
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
                  <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm" value={settings.adminName || ''} onChange={(e) => setSettings({ ...settings, adminName: e.target.value })} />
               </div>
               <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1"><Warehouse size={14}/> Lokasi Gudang</label>
                  <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm" value={settings.warehouseName || ''} onChange={(e) => setSettings({ ...settings, warehouseName: e.target.value })} />
               </div>
            </div>

            {/* Kepala Bidang Sosial */}
            <div className="pt-6 border-t dark:border-white/5 space-y-6">
              <div className="border-l-4 border-ios-blue-light dark:border-ios-blue-dark pl-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">1. Kepala Bidang Sosial (Pihak Kesatu Berita Acara)</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Informasi Kepala Bidang yang akan dicetak pada Berita Acara Serah Terima (BAST).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Nama Kepala Bidang</label>
                  <input type="text" placeholder="NURKHOLIS, S.Kep, MM." className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.kabidNama || ''} onChange={(e) => setSettings({ ...settings, kabidNama: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">NIP Kepala Bidang</label>
                  <input type="text" placeholder="19680328 198803 1 004" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.kabidNip || ''} onChange={(e) => setSettings({ ...settings, kabidNip: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Jabatan Kepala Bidang</label>
                  <input type="text" placeholder="Plt. Kepala Bidang Sosial" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.kabidJabatan || ''} onChange={(e) => setSettings({ ...settings, kabidJabatan: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Instansi Kepala Bidang</label>
                  <input type="text" placeholder="Dinsos PPPA Kab. Blora" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.kabidInstansi || ''} onChange={(e) => setSettings({ ...settings, kabidInstansi: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Petugas Logistik */}
            <div className="pt-6 border-t dark:border-white/5 space-y-6">
              <div className="border-l-4 border-emerald-500 pl-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">2. Petugas Logistik (SPPB)</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Informasi Petugas Logistik yang akan dicetak pada Surat Perintah Pengeluaran Barang (SPPB).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Nama Petugas Logistik</label>
                  <input type="text" placeholder="Budi Santoso, A.Md." className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.petugasNama || ''} onChange={(e) => setSettings({ ...settings, petugasNama: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">NIP Petugas Logistik</label>
                  <input type="text" placeholder="19850102 201001 1 003" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.petugasNip || ''} onChange={(e) => setSettings({ ...settings, petugasNip: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Jabatan Petugas Logistik</label>
                  <input type="text" placeholder="Staf Seksi Logistik Kebencanaan" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.petugasJabatan || ''} onChange={(e) => setSettings({ ...settings, petugasJabatan: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Instansi Petugas Logistik</label>
                  <input type="text" placeholder="Dinsos PPPA Kab. Blora" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.petugasInstansi || ''} onChange={(e) => setSettings({ ...settings, petugasInstansi: e.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Nama SK (Dasar Hukum SPPB)</label>
                  <input type="text" placeholder="Keputusan Kepala Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Blora" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.petugasNamaSk || ''} onChange={(e) => setSettings({ ...settings, petugasNamaSk: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">No SK Petugas Logistik</label>
                  <input type="text" placeholder="800/123/2026" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.petugasNoSk || ''} onChange={(e) => setSettings({ ...settings, petugasNoSk: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Tanggal SK Petugas Logistik</label>
                  <input type="date" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm" value={settings.petugasTanggalSk || ''} onChange={(e) => setSettings({ ...settings, petugasTanggalSk: e.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Tentang SK Petugas Logistik</label>
                  <input type="text" placeholder="Penunjukan Petugas Pengelola Barang Persediaan Bidang Sosial" className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-6 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" value={settings.petugasTentangSk || ''} onChange={(e) => setSettings({ ...settings, petugasTentangSk: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t dark:border-white/5 flex justify-end">
               <button onClick={async () => { await setSettings(settings); alert('Profil & Branding disimpan!'); }} className="w-full sm:w-auto flex items-center justify-center gap-3 text-white px-12 py-3 rounded-ios font-bold shadow-sm text-xs" style={{ backgroundColor: settings.themeColor }}>
                 <Save size={18}/> Simpan Profil & Branding
               </button>
            </div>
          </div>

          {/* Google Drive Configuration */}
          <div className="bg-emerald-900 dark:bg-ios-secondary-dark text-white p-8 md:p-12 rounded-ios-lg shadow-2xl relative overflow-hidden group border dark:border-white/10">
             <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-5">
                   <div className="p-4 bg-emerald-500 rounded-ios shadow-xl"><ImageIcon size={28}/></div>
                   <div>
                      <h3 className="text-2xl font-bold tracking-tight">Google Drive Integration</h3>
                      <p className="text-emerald-200 dark:text-emerald-400/60 text-xs font-semibold italic">Simpan arsip PDF langsung ke Google Drive Anda.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wide ml-1">Client ID</label>
                      <input type="password" placeholder="123456789-abc.apps.googleusercontent.com" className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-ios px-6 py-3 font-bold text-white outline-none" value={settings.googleClientId || ''} onChange={(e) => setSettings({ ...settings, googleClientId: sanitizeInput(e.target.value) })} />
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wide ml-1">Client Secret</label>
                      <input type="password" placeholder="GOCSPX-..." className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-ios px-6 py-3 font-bold text-white outline-none" value={settings.googleClientSecret || ''} onChange={(e) => setSettings({ ...settings, googleClientSecret: sanitizeInput(e.target.value) })} />
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wide ml-1">Redirect URI</label>
                      <input type="text" placeholder={suggestedRedirectUri} className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-ios px-6 py-3 font-bold text-white outline-none" value={settings.googleRedirectUri || ''} onChange={(e) => setSettings({ ...settings, googleRedirectUri: sanitizeInput(e.target.value) })} />
                      <p className="text-[8px] text-emerald-300/60 mt-1 italic">Saran: {suggestedRedirectUri}</p>
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wide ml-1">Folder ID (Opsional)</label>
                      <input type="text" placeholder="1Y4pgcJb9..." className="w-full bg-white/10 dark:bg-black/20 border border-white/5 rounded-ios px-6 py-3 font-bold text-white outline-none" value={settings.googleFolderId || ''} onChange={(e) => setSettings({ ...settings, googleFolderId: sanitizeInput(e.target.value) })} />
                   </div>
                </div>

                <div className="bg-emerald-500/10 p-4 rounded-ios border border-emerald-500/20 flex gap-3">
                  <Info className="text-emerald-400 shrink-0" size={20}/>
                  <div className="space-y-1">
                    <p className="text-[10px] text-emerald-200 font-medium"><b>Cara Mendapatkan API Key:</b></p>
                    <ol className="text-[9px] text-emerald-300/80 list-decimal ml-4 space-y-0.5">
                      <li>Buka Google Cloud Console.</li>
                      <li>Buat Project baru & Aktifkan Google Drive API.</li>
                      <li>Di menu Credentials, buat OAuth 2.0 Client ID (Web Application).</li>
                      <li>Tambahkan Redirect URI di atas ke daftar "Authorized redirect URIs".</li>
                      <li>Salin Client ID & Secret ke sini.</li>
                    </ol>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'koneksi' && (
        <div className="bg-slate-900 dark:bg-ios-secondary-dark text-white p-8 md:p-12 rounded-ios-lg shadow-2xl relative overflow-hidden group border dark:border-white/10 animate-in fade-in duration-300">
           {/* Decorative background blur */}
           <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />
           
           <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-5">
                 <div className="p-4 bg-orange-500 rounded-ios shadow-xl shrink-0"><Cloud size={28}/></div>
                 <div>
                    <h3 className="text-2xl font-bold tracking-tight">Koneksi Cloud & Realtime Sync</h3>
                    <p className="text-orange-200 dark:text-orange-400/60 text-xs font-semibold italic">Aplikasi terintegrasi secara aman dengan arsitektur Cloud Firebase.</p>
                 </div>
              </div>

              {user ? (
                <div className="bg-white/5 backdrop-blur-md rounded-ios-lg p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-16 h-16 rounded-full border-2 border-orange-500 object-cover shadow-lg" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/50 flex items-center justify-center font-bold text-xl text-orange-400">{user.displayName?.[0] || 'U'}</div>
                    )}
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest bg-emerald-500 text-white uppercase mb-1">TERKONEKSI</span>
                      <h4 className="font-black text-lg text-white leading-snug">{user.displayName}</h4>
                      <p className="text-xs text-slate-400 font-medium font-mono">{user.email}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { if (confirm("Apakah Anda yakin ingin keluar?")) logout(); }}
                    className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-ios text-xs whitespace-nowrap active:scale-95 transition-all shadow-md shadow-rose-500/10 cursor-pointer"
                  >
                    Keluar Akun
                  </button>
                </div>
              ) : (
                <div className="bg-rose-500/10 p-6 rounded-ios-lg border border-rose-500/20 text-center space-y-3">
                  <p className="text-sm text-rose-300 font-bold">Koneksi Cloud belum terautentikasi.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">Silakan muat kembali aplikasi dan lakukan login menggunakan akun Google Anda untuk mengaktifkan sinkronisasi otomatis.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Backup & Restore Database Tab */}
      {activeTab === 'backup_restore' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header Overview Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-ios-secondary-dark dark:to-black text-white p-8 rounded-ios-lg shadow-xl border border-slate-700/50 dark:border-white/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-blue-500/20 border border-blue-400/30 rounded-ios text-blue-400 shrink-0">
                  <Database size={30} />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Manajemen Backup & Restore Database</h3>
                  <p className="text-slate-300 dark:text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
                    Amankan seluruh rekaman inventaris logistik kebencanaan Anda. Buat cadangan data mandiri (JSON) untuk arsip aman atau pulihkan database dari berkas backup kapan saja.
                  </p>
                </div>
              </div>

              {/* Status summary pills */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <span className="px-3 py-1.5 bg-white/10 dark:bg-white/5 rounded-full text-[10px] font-mono font-bold text-slate-200 border border-white/10 flex items-center gap-1.5">
                  <Package size={12} className="text-blue-400" /> {products.length} Barang
                </span>
                <span className="px-3 py-1.5 bg-white/10 dark:bg-white/5 rounded-full text-[10px] font-mono font-bold text-slate-200 border border-white/10 flex items-center gap-1.5">
                  <ArrowDownLeft size={12} className="text-emerald-400" /> {inbound.length} Masuk
                </span>
                <span className="px-3 py-1.5 bg-white/10 dark:bg-white/5 rounded-full text-[10px] font-mono font-bold text-slate-200 border border-white/10 flex items-center gap-1.5">
                  <ArrowUpRight size={12} className="text-amber-400" /> {outbound.length} Keluar
                </span>
                <span className="px-3 py-1.5 bg-white/10 dark:bg-white/5 rounded-full text-[10px] font-mono font-bold text-slate-200 border border-white/10 flex items-center gap-1.5">
                  <FileText size={12} className="text-purple-400" /> {documents.length} Dokumen
                </span>
              </div>
            </div>
          </div>

          {/* Success / Error notification alerts */}
          {restoreSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-ios flex items-start gap-3 text-emerald-900 dark:text-emerald-200 text-xs animate-in slide-in-from-top-2">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Restore Berhasil Dilakukan!</p>
                <p className="text-emerald-700 dark:text-emerald-300/80 mt-0.5">{restoreSuccess}</p>
              </div>
              <button onClick={() => setRestoreSuccess(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-sm">✕</button>
            </div>
          )}

          {restoreError && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-4 rounded-ios flex items-start gap-3 text-rose-900 dark:text-rose-200 text-xs animate-in slide-in-from-top-2">
              <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Gagal Melakukan Restore</p>
                <p className="text-rose-700 dark:text-rose-300/80 mt-0.5">{restoreError}</p>
              </div>
              <button onClick={() => setRestoreError(null)} className="text-rose-500 hover:text-rose-700 font-bold text-sm">✕</button>
            </div>
          )}

          {/* Two Columns: Backup Card & Restore Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* BACKUP CARD */}
            <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 md:p-8 rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-6 theme-transition">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-ios-blue-light dark:text-ios-blue-dark rounded-ios">
                    <Download size={22} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Backup Database (Unduh)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Download seluruh data inventaris ke file JSON</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Menyimpan salinan lengkap seluruh data aktif ke dalam file JSON terenkripsi. Berkas ini dapat digunakan untuk mengembalikan data jika berpindah perangkat atau terjadi kehilangan data.
                </p>

                {/* What's included checklist */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-ios space-y-2 border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cakupan Data Cadangan:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500" />
                      <span>Master Barang ({products.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500" />
                      <span>Barang Masuk ({inbound.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500" />
                      <span>Barang Keluar ({outbound.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500" />
                      <span>Arsip BAST ({documents.length})</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Check size={14} className="text-emerald-500" />
                      <span>Profil, Kop Surat, & Konfigurasi Instansi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={isDownloadingBackup}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-ios text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isDownloadingBackup ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Menyiapkan File Cadangan...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={16} />
                      <span>Download Backup Data (.JSON)</span>
                    </>
                  )}
                </button>
                <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 mt-2">
                  Format berkas: <b>.json</b> • Kompatibel dengan semua versi SITAMPAN
                </p>
              </div>
            </div>

            {/* RESTORE CARD */}
            <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 md:p-8 rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-6 theme-transition">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-ios">
                    <Upload size={22} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Restore Database (Pulihkan)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Unggah file backup untuk memulihkan database</p>
                  </div>
                </div>

                {!parsedBackup ? (
                  /* Drag and Drop Zone */
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processBackupFile(file);
                    }}
                    className={`border-2 border-dashed rounded-ios p-6 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      isDraggingFile 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-slate-300 dark:border-white/10 hover:border-emerald-500/50 bg-slate-50 dark:bg-white/5'
                    }`}
                  >
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                      <FileUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Pilih berkas backup .json atau seret ke sini
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Maksimal ukuran 50 MB
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-ios text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95">
                      <Upload size={14} /> Pilih File Cadangan
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processBackupFile(file);
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  /* Backup Preview and Selector */
                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-ios border border-slate-200 dark:border-white/10 space-y-4 animate-in fade-in">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <FileCheck size={16} className="text-emerald-500" />
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                            {parsedBackup.fileName}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Ukuran: {parsedBackup.fileSize} • Aplikasi: {parsedBackup.appName}
                        </p>
                        {parsedBackup.exportedAt && (
                          <p className="text-[9px] text-slate-400">
                            Waktu Ekspor: {new Date(parsedBackup.exportedAt).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setParsedBackup(null)}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 bg-slate-200 dark:bg-white/10 rounded"
                      >
                        Ganti File
                      </button>
                    </div>

                    {/* Component selection */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pilih Data yang Akan Dipulihkan:
                      </span>

                      <div className="space-y-1.5 text-xs">
                        <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-100/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Master Data Barang ({parsedBackup.counts.products} data)
                          </span>
                          <input
                            type="checkbox"
                            className="rounded accent-emerald-600"
                            checked={restoreSelections.products}
                            onChange={(e) => setRestoreSelections({ ...restoreSelections, products: e.target.checked })}
                          />
                        </label>

                        <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-100/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Transaksi Barang Masuk ({parsedBackup.counts.inbound} data)
                          </span>
                          <input
                            type="checkbox"
                            className="rounded accent-emerald-600"
                            checked={restoreSelections.inbound}
                            onChange={(e) => setRestoreSelections({ ...restoreSelections, inbound: e.target.checked })}
                          />
                        </label>

                        <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-100/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Transaksi Barang Keluar ({parsedBackup.counts.outbound} data)
                          </span>
                          <input
                            type="checkbox"
                            className="rounded accent-emerald-600"
                            checked={restoreSelections.outbound}
                            onChange={(e) => setRestoreSelections({ ...restoreSelections, outbound: e.target.checked })}
                          />
                        </label>

                        <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-100/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Arsip Dokumen / BAST ({parsedBackup.counts.documents} data)
                          </span>
                          <input
                            type="checkbox"
                            className="rounded accent-emerald-600"
                            checked={restoreSelections.documents}
                            onChange={(e) => setRestoreSelections({ ...restoreSelections, documents: e.target.checked })}
                          />
                        </label>

                        <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-100/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Profil & Konfigurasi Instansi
                          </span>
                          <input
                            type="checkbox"
                            className="rounded accent-emerald-600"
                            checked={restoreSelections.settings}
                            onChange={(e) => setRestoreSelections({ ...restoreSelections, settings: e.target.checked })}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Warning message */}
                    <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-700 dark:text-amber-300">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Data aktif yang dipilih akan ditimpa dengan data dari file cadangan ini.</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setParsedBackup(null)}
                        disabled={isRestoring}
                        className="flex-1 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-ios text-xs font-bold transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteRestore}
                        disabled={isRestoring}
                        className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-ios text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Memulihkan Database...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Konfirmasi & Mulai Restore</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!parsedBackup && (
                <div className="pt-2">
                  <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-ios text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
                    <span>
                      Gunakan fitur ini saat ingin mengembalikan data setelah instalasi ulang, membersihkan browser, atau migrasi data ke komputer baru.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'otoritas' && isPrimaryAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-300">
          
          {/* User List Panel */}
          <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 flex flex-col h-[600px] theme-transition">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-ios-blue-light dark:text-ios-blue-dark" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">Daftar Akun Login</h3>
              </div>
              <button 
                onClick={() => setIsAddingUser(!isAddingUser)}
                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-ios transition-all active:scale-95 ${isAddingUser ? 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300' : 'bg-ios-blue-light/10 text-ios-blue-light dark:bg-ios-blue-dark/10 dark:text-ios-blue-dark'}`}
                title="Tambah User Baru"
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            {/* Inline Add User Form */}
            {isAddingUser && (
              <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-ios mb-4 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email Pengguna</label>
                  <input 
                    type="email" 
                    placeholder="contoh@gmail.com" 
                    className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap" 
                    className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-ios px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button 
                    onClick={() => { setIsAddingUser(false); setNewUserEmail(''); setNewUserName(''); }}
                    className="px-3 py-1.5 rounded-ios text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleAddNewUser}
                    className="px-4 py-1.5 rounded-ios text-[10px] font-bold text-white bg-ios-blue-light dark:bg-ios-blue-dark active:scale-95 transition-all shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}
            
            {/* Search Input */}
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-600" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama atau email..." 
                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List of Users */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="animate-spin text-slate-400" size={24} />
                </div>
              ) : (
                usersList
                  .filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(u => {
                    const isSelected = selectedUser?.uid === u.uid;
                    const isTemp = u.uid?.startsWith('temp_');
                    return (
                      <button 
                        key={u.uid} 
                        onClick={() => handleSelectUser(u)}
                        className={`w-full flex items-center gap-3 p-3 rounded-ios text-left transition-all border ${isSelected ? 'bg-ios-blue-light/10 border-ios-blue-light dark:bg-ios-blue-dark/10 dark:border-ios-blue-dark' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5'}`}
                      >
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm border dark:border-white/10" referrerPolicy="no-referrer" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isTemp ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>{u.displayName?.[0] || 'U'}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{u.displayName || 'No Name'}</h4>
                            {isTemp && (
                              <span className="shrink-0 text-[7px] font-black text-orange-500 bg-orange-500/10 px-1 py-0.5 rounded tracking-wide uppercase">Belum Login</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{u.email}</p>
                        </div>
                      </button>
                    );
                  })
              )}
              {usersList.length === 0 && !isLoadingUsers && (
                <p className="text-center text-xs text-slate-400 italic py-10">Belum ada user yang terdaftar.</p>
              )}
            </div>
          </div>

          {/* User Permissions Panel */}
          <div className="md:col-span-2 bg-ios-secondary-light dark:bg-ios-secondary-dark p-6 rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 flex flex-col h-[600px] theme-transition">
            {selectedUser ? (
              <div className="flex flex-col h-full">
                {/* Header of selected user */}
                <div className="flex items-center justify-between border-b dark:border-white/5 pb-4 mb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="w-12 h-12 rounded-full object-cover border dark:border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-slate-500">{selectedUser.displayName?.[0] || 'U'}</div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedUser.displayName}</h3>
                      <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  {/* Warning if trying to edit own primary admin permissions, else show Delete button */}
                  {(selectedUser.email === 'febrianataum@gmail.com' || selectedUser.email === 'febridesain19@gmail.com') ? (
                    <div className="flex items-center gap-1 text-[9px] font-black tracking-wider uppercase bg-orange-500/10 text-orange-500 px-2 py-1 rounded border border-orange-500/20">
                      <Lock size={10} /> Admin Utama
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleDeleteUser(selectedUser)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 px-3 py-1.5 rounded-ios transition-all duration-200 active:scale-95"
                      title="Hapus Akun"
                    >
                      <Trash2 size={14} /> Hapus Akun
                    </button>
                  )}
                </div>

                {/* Permissions Grid scrollable area */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-hide">
                  <div className="border-l-4 border-ios-blue-light dark:border-ios-blue-dark pl-4 py-1">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Konfigurasi Hak Akses Menu</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Atur batasan edit, hapus, tambah, dan tampilkan data untuk masing-masing menu.</p>
                  </div>

                  <div className="space-y-3">
                    {PERMISSION_MODULES.map(mod => {
                      const isProfileSetting = mod.key === 'profile';
                      const isDashboardSetting = mod.key === 'dashboard';
                      const isCurrentUserAdmin = selectedUser.email === 'febrianataum@gmail.com' || selectedUser.email === 'febridesain19@gmail.com';
                      
                      return (
                        <div key={mod.key} className="p-4 bg-slate-100 dark:bg-white/5 rounded-ios border dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-[150px]">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{mod.name}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Menu key: {mod.key}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4">
                            {mod.actions.includes('view') && (
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                  checked={userPermissionsForm[mod.key]?.view || false}
                                  onChange={() => handleTogglePermission(mod.key, 'view')}
                                  disabled={isCurrentUserAdmin && (isProfileSetting || isDashboardSetting)} // Admin cannot lock self out of Profile/Dashboard
                                />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Tampilkan Data (Lihat)</span>
                              </label>
                            )}

                            {mod.actions.includes('add') && (
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                  checked={userPermissionsForm[mod.key]?.add || false}
                                  onChange={() => handleTogglePermission(mod.key, 'add')}
                                  disabled={isCurrentUserAdmin}
                                />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Tambah</span>
                              </label>
                            )}

                            {mod.actions.includes('edit') && (
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                  checked={userPermissionsForm[mod.key]?.edit || false}
                                  onChange={() => handleTogglePermission(mod.key, 'edit')}
                                  disabled={isCurrentUserAdmin && isProfileSetting}
                                />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Edit</span>
                              </label>
                            )}

                            {mod.actions.includes('delete') && (
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                  checked={userPermissionsForm[mod.key]?.delete || false}
                                  onChange={() => handleTogglePermission(mod.key, 'delete')}
                                  disabled={isCurrentUserAdmin}
                                />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Hapus</span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t dark:border-white/5 mt-4 shrink-0 flex justify-end gap-3">
                  <button 
                    onClick={handleSaveUserPermissions}
                    disabled={isSavingPermissions}
                    className="flex items-center gap-2 text-white font-bold text-xs px-8 py-3 rounded-ios shadow-sm bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSavingPermissions ? (
                      <RefreshCw className="animate-spin" size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                    Simpan Otoritas Akses
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 dark:text-slate-600"><Lock size={32} /></div>
                <div>
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Pilih User untuk Konfigurasi</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Silakan pilih salah satu pengguna dari daftar di sebelah kiri untuk mengatur batas hak akses menu dan operasinya.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
