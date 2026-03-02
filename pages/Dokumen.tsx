
import React, { useState } from 'react';
import { useInventory } from '../App';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Pencil, 
  Filter,
  X,
  Upload,
  Archive,
  Calendar,
  Tag,
  Info
} from 'lucide-react';
import { ArchiveDocument, formatIndoDate } from '../types';
import { saveFileToIDB, getFileFromIDB, deleteFileFromIDB } from '../utils/idb';

const Dokumen: React.FC = () => {
  const { documents, setDocuments } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ArchiveDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ArchiveDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Laporan',
    date: new Date().toISOString().split('T')[0],
    description: '',
    fileUrl: '',
    fileName: ''
  });

  const categories = ['Semua', 'Laporan', 'Berita Acara', 'SPPB', 'Surat Masuk', 'Surat Keluar', 'Lainnya'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Hanya file PDF yang diperbolehkan!');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          fileUrl: reader.result as string,
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.fileUrl) {
      alert('Judul dan File wajib diisi!');
      return;
    }

    const docId = editingDoc ? editingDoc.id : crypto.randomUUID();
    
    // Save file to IndexedDB
    try {
      await saveFileToIDB(docId, formData.fileUrl);
    } catch (err) {
      console.error("Failed to save to IndexedDB:", err);
      alert("Gagal menyimpan file ke database lokal. Pastikan browser Anda mengizinkan penyimpanan.");
      return;
    }

    // Prepare metadata for localStorage/Firestore (placeholder for fileUrl)
    const docMetadata = {
      ...formData,
      fileUrl: '[IDB_FILE]'
    };

    if (editingDoc) {
      setDocuments(documents.map(d => d.id === docId ? { ...d, ...docMetadata, id: docId } : d));
    } else {
      const newDoc: ArchiveDocument = {
        id: docId,
        ...docMetadata
      };
      setDocuments([...documents, newDoc]);
    }

    setIsModalOpen(false);
    setEditingDoc(null);
    setFormData({
      title: '',
      category: 'Laporan',
      date: new Date().toISOString().split('T')[0],
      description: '',
      fileUrl: '',
      fileName: ''
    });
  };

  const handleEdit = async (doc: ArchiveDocument) => {
    setEditingDoc(doc);
    
    // Fetch file from IndexedDB
    let actualFileUrl = doc.fileUrl;
    if (doc.fileUrl === '[IDB_FILE]') {
      actualFileUrl = await getFileFromIDB(doc.id) || '';
    }

    setFormData({
      title: doc.title,
      category: doc.category,
      date: doc.date,
      description: doc.description || '',
      fileUrl: actualFileUrl,
      fileName: doc.fileName
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen ini dari arsip?')) {
      setDocuments(documents.filter(d => d.id !== id));
      await deleteFileFromIDB(id);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const viewDocument = async (doc: ArchiveDocument) => {
    let fileUrl = doc.fileUrl;
    if (doc.fileUrl === '[IDB_FILE]') {
      fileUrl = await getFileFromIDB(doc.id) || '';
    }
    
    if (!fileUrl) {
      alert("File tidak ditemukan di database lokal.");
      return;
    }

    setPreviewUrl(fileUrl);
    setPreviewDoc(doc);
  };

  const handleDownload = async (e: React.MouseEvent, doc: ArchiveDocument) => {
    if (doc.fileUrl === '[IDB_FILE]') {
      e.preventDefault();
      const fileUrl = await getFileFromIDB(doc.id);
      if (fileUrl) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("File tidak ditemukan di database lokal.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-ios-blue-light dark:bg-ios-blue-dark text-white rounded-lg shadow-sm">
              <Archive size={16}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Arsip Dokumen</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Penyimpanan dokumen digital dan laporan resmi.</p>
        </div>
        <button 
          onClick={() => { setEditingDoc(null); setFormData({ title: '', category: 'Laporan', date: new Date().toISOString().split('T')[0], description: '', fileUrl: '', fileName: '' }); setIsModalOpen(true); }}
          className="w-full md:w-auto bg-ios-blue-light dark:bg-ios-blue-dark text-white px-6 py-2.5 rounded-ios flex items-center justify-center gap-2 font-bold shadow-sm active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          <Plus size={18}/> Tambah Dokumen
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark p-4 rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-4 theme-transition">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text"
            placeholder="Cari judul atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-ios outline-none font-medium text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-ios text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-ios-blue-light dark:bg-ios-blue-dark text-white shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="group bg-white dark:bg-ios-secondary-dark rounded-ios-lg border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col">
              <div className="p-4 flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg cursor-pointer" onClick={() => viewDocument(doc)}>
                    <FileText size={24}/>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-full">
                    {doc.category}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight cursor-pointer hover:text-ios-blue-light transition-colors" onClick={() => viewDocument(doc)}>{doc.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    <Calendar size={10}/> {formatIndoDate(doc.date)}
                  </p>
                </div>
                {doc.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                    {doc.description}
                  </p>
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/5 border-t dark:border-white/5 flex items-center justify-between">
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(doc)}
                    className="p-2 text-ios-blue-light dark:text-ios-blue-dark hover:bg-ios-blue-light/10 dark:hover:bg-ios-blue-dark/10 rounded-ios transition-colors"
                    title="Edit Dokumen"
                  >
                    <Pencil size={18}/>
                  </button>
                  <a 
                    href={doc.fileUrl === '[IDB_FILE]' ? '#' : doc.fileUrl} 
                    download={doc.fileName}
                    onClick={(e) => handleDownload(e, doc)}
                    className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-ios transition-colors"
                    title="Download PDF"
                  >
                    <Download size={18}/>
                  </a>
                </div>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-ios transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-ios-secondary-dark rounded-ios-lg border border-slate-200 dark:border-white/5 p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
            <Archive size={40}/>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum Ada Dokumen</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1">
            Mulai arsipkan dokumen PDF Anda dengan menekan tombol "Tambah Dokumen" di atas.
          </p>
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-ios-secondary-dark w-full max-w-lg rounded-ios-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b dark:border-white/5 flex items-center justify-between">
              <h3 className="font-bold uppercase text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {editingDoc ? <Pencil size={18} className="text-ios-blue-light"/> : <Upload size={18} className="text-ios-blue-light"/>} 
                {editingDoc ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingDoc(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400">
                <X size={24}/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Judul Dokumen</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Contoh: Laporan Distribusi Maret 2026"
                  className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none appearance-none"
                  >
                    {categories.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tanggal Dokumen</label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-4 py-3 font-bold text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Deskripsi (Opsional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Tambahkan keterangan singkat tentang dokumen ini..."
                  className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-ios px-4 py-3 font-medium text-slate-800 dark:text-slate-200 outline-none min-h-[80px] text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">File PDF</label>
                <div className="relative">
                  <input 
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label 
                    htmlFor="pdf-upload"
                    className={`w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-ios cursor-pointer transition-all ${formData.fileUrl ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-white/10 hover:border-ios-blue-light bg-slate-50 dark:bg-white/5'}`}
                  >
                    {formData.fileUrl ? (
                      <>
                        <FileText className="text-emerald-500" size={32}/>
                        <div className="text-center">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formData.fileName}</p>
                          <p className="text-[10px] text-emerald-500/60">Klik untuk mengganti file</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="text-slate-400" size={32}/>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Pilih File PDF</p>
                          <p className="text-[10px] text-slate-400">Maksimal 5MB</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingDoc(null); }}
                  className="flex-1 px-6 py-3 rounded-ios font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-ios-blue-light dark:bg-ios-blue-dark text-white px-6 py-3 rounded-ios font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {editingDoc ? 'Simpan Perubahan' : 'Simpan ke Arsip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewDoc && previewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex flex-col animate-in fade-in duration-300">
          {/* Toolbar */}
          <div className="bg-slate-900/90 text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-500 rounded text-white">
                <FileText size={16}/>
              </div>
              <div>
                <h3 className="text-sm font-bold truncate max-w-[200px] md:max-w-md">{previewDoc.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{previewDoc.category} • {formatIndoDate(previewDoc.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = previewDoc.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Download"
              >
                <Download size={20}/>
              </button>
              <button 
                onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Tutup"
              >
                <X size={24}/>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 bg-slate-800 flex items-center justify-center overflow-hidden">
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-none"
              title={previewDoc.title}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dokumen;
