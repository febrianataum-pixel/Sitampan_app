
import React, { useState, useRef } from 'react';
import { useInventory } from '../App';
import { 
  Eye, 
  ArrowLeft, 
  Settings, 
  Save, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  Table as TableIcon,
  Printer,
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  Palette,
  Upload,
  Download
} from 'lucide-react';
import { OutboundTransaction, MONTHS, formatIndoDate } from '../types';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

const CetakBeritaAcara: React.FC = () => {
  const { products, outbound, settings, setSettings } = useInventory();
  const [selectedTx, setSelectedTx] = useState<OutboundTransaction | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const defaultBA = `
    <div style="display:flex; align-items:center; border-bottom:3px double #000; padding-bottom:15px; margin-bottom:20px;">
      <div style="margin-right:20px;">[logo_app]</div>
      <div style="flex:1; text-align:center;">
        <h1 style="margin:0; font-size:24px;">[nama_app]</h1>
        <p style="margin:0; font-size:12px; color:#666;">[subtitle_app]</p>
        <p style="margin:0; font-size:11px;">[nama_gudang] - Admin: [nama_admin]</p>
      </div>
    </div>
    <h2 style="text-align:center; text-decoration:underline;">BERITA ACARA SERAH TERIMA</h2>
    <p style="text-align:center;">Nomor: [id_transaksi]/BAST/[tahun]</p>
    <br>
    <p>Pada hari ini <b>[tanggal_panjang]</b>, bertempat di <b>[nama_gudang]</b>, telah diserahkan barang operasional kepada pihak penerima:</p>
    <table style="width:auto; margin-bottom:15px;">
      <tr><td width="120">Penerima</td><td>: <b>[penerima]</b></td></tr>
      <tr><td>Alamat</td><td>: [alamat]</td></tr>
    </table>
    <p>Rincian barang sebagai berikut:</p>
    [tabel_barang]
    <br>
    <p>Demikian berita acara ini dibuat dalam keadaan sadar untuk dipergunakan sebagaimana mestinya.</p>
    <br><br>
    <table style="width:100%; border:none;">
      <tr>
        <td align="center" width="50%">Pihak Penerima,<br><br><br><br><br>( [penerima] )</td>
        <td align="center" width="50%">Pihak Penyerah,<br><br><br><br><br>( [nama_admin] )</td>
      </tr>
    </table>
  `;

  const [currentTemplate, setCurrentTemplate] = useState(settings.baTemplate || defaultBA);

  const renderBA = (tx: OutboundTransaction) => {
    let html = currentTemplate;
    const dateObj = new Date(tx.tanggal);
    const datePanjang = formatIndoDate(tx.tanggal);
    
    const logoHtml = settings.logo 
      ? `<img src="${settings.logo}" style="height:80px; width:auto; object-fit:contain;" />`
      : `<div style="width:80px; height:80px; background:#f8fafc; border:2px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; font-size:10px; color:#94a3b8; font-weight:bold;">LOGO</div>`;

    let grandTotal = 0;
    const tableRows = tx.items.map((item, idx) => {
      const p = products.find(prod => prod.id === item.productId);
      const harga = p?.harga || 0;
      const total = item.jumlah * harga;
      grandTotal += total;
      
      return `
        <tr style="font-size:12px;">
          <td style="border:1px solid #000; padding:8px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:8px;">${p?.namaBarang || '-'}</td>
          <td style="border:1px solid #000; padding:8px; text-align:center;">${item.jumlah}</td>
          <td style="border:1px solid #000; padding:8px; text-align:center;">${p?.satuan || '-'}</td>
          <td style="border:1px solid #000; padding:8px; text-align:right;">Rp ${harga.toLocaleString('id-ID')}</td>
          <td style="border:1px solid #000; padding:8px; text-align:right; font-weight:bold;">Rp ${total.toLocaleString('id-ID')}</td>
        </tr>
      `;
    }).join('');

    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:15px 0;">
        <thead>
          <tr style="background-color:#f1f5f9; font-size:11px; text-transform:uppercase; letter-spacing:1px;">
            <th style="border:1px solid #000; padding:10px;">No</th>
            <th style="border:1px solid #000; padding:10px; text-align:left;">Nama Barang</th>
            <th style="border:1px solid #000; padding:10px;">Jumlah</th>
            <th style="border:1px solid #000; padding:10px;">Satuan</th>
            <th style="border:1px solid #000; padding:10px; text-align:right;">Harga</th>
            <th style="border:1px solid #000; padding:10px; text-align:right;">Total Harga</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="font-size:12px; background-color:#f8fafc;">
            <td colspan="5" style="border:1px solid #000; padding:10px; text-align:right; font-weight:700; text-transform:uppercase;">Grand Total</td>
            <td style="border:1px solid #000; padding:10px; text-align:right; font-weight:700; color:#000;">Rp ${grandTotal.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>
    `;

    html = html.replace(/\[logo_app\]/g, logoHtml);
    html = html.replace(/\[nama_app\]/g, settings.appName);
    html = html.replace(/\[subtitle_app\]/g, settings.appSubtitle);
    html = html.replace(/\[nama_gudang\]/g, settings.warehouseName);
    html = html.replace(/\[nama_admin\]/g, settings.adminName);
    html = html.replace(/\[id_transaksi\]/g, tx.id.split('-')[0].toUpperCase());
    html = html.replace(/\[tahun\]/g, dateObj.getFullYear().toString());
    html = html.replace(/\[penerima\]/g, tx.penerima);
    html = html.replace(/\[alamat\]/g, tx.alamat || '-');
    html = html.replace(/\[tanggal_panjang\]/g, datePanjang);
    html = html.replace(/\[tabel_barang\]/g, tableHtml);

    return html;
  };

  const handleDownloadPDF = () => {
    if (!printAreaRef.current || !selectedTx) return;
    
    setIsGenerating(true);
    const element = printAreaRef.current;
    
    const dateObj = new Date(selectedTx.tanggal);
    const bulan = MONTHS[dateObj.getMonth()];
    const namaPenerima = selectedTx.penerima.trim().replace(/\s+/g, '_');
    const alamat = (selectedTx.alamat || 'Tanpa_Alamat').trim().replace(/\s+/g, '_').substring(0, 30);
    
    const filename = `${bulan}_${namaPenerima}_${alamat}.pdf`;
    
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
    }).catch((err: any) => {
      console.error('PDF Error:', err);
      setIsGenerating(false);
      alert('Gagal membuat PDF.');
    });
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) setCurrentTemplate(editorRef.current.innerHTML);
  };

  const insertPlaceholder = (tag: string) => {
    document.execCommand('insertText', false, `[${tag}]`);
    if (editorRef.current) setCurrentTemplate(editorRef.current.innerHTML);
  };

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const imgTag = `<img src="${dataUrl}" style="max-width:300px; height:auto; display:block; margin: 10px 0;" />`;
        document.execCommand('insertHTML', false, imgTag);
        if (editorRef.current) setCurrentTemplate(editorRef.current.innerHTML);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, logo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = () => {
    setSettings({ ...settings, baTemplate: currentTemplate });
    setIsEditorOpen(false);
    alert('Desain Berita Acara berhasil disimpan!');
  };

  if (selectedTx) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <button 
            onClick={() => setSelectedTx(null)} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={18}/> KEMBALI
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()} 
              className="bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-sm active:scale-95 transition-all"
            >
              <Printer size={18}/> Cetak Manual
            </button>
            <button 
              disabled={isGenerating}
              onClick={handleDownloadPDF} 
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Download size={18}/>
              )}
              {isGenerating ? 'MENYIAPKAN...' : 'UNDUH PDF SEKARANG'}
            </button>
          </div>
        </div>

        <div className="no-print bg-blue-50 border border-blue-100 p-4 rounded-2xl text-blue-700 text-xs font-medium flex items-center gap-3">
           <div className="bg-blue-600 text-white p-2 rounded-lg"><Download size={16}/></div>
           <p>Klik tombol <b>UNDUH PDF</b> di atas untuk menyimpan dokumen serah terima.</p>
        </div>

        <div className="flex justify-center p-4">
          <div 
            ref={printAreaRef}
            className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0"
            dangerouslySetInnerHTML={{ __html: renderBA(selectedTx) }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Berita Acara</h2>
          <p className="text-slate-500 text-sm font-medium">Buat dokumen serah terima dengan editor visual yang fleksibel.</p>
        </div>
        <button 
          onClick={() => setIsEditorOpen(true)} 
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
        >
          <Settings size={18}/> Desain Template BA
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] border-b uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Tanggal Transaksi</th>
              <th className="px-6 py-4">Nama Penerima</th>
              <th className="px-6 py-4">Tujuan / Alamat</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {outbound.map((o) => (
              <tr key={o.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 text-xs font-semibold text-slate-400 whitespace-nowrap">{formatIndoDate(o.tanggal)}</td>
                <td className="px-6 py-4 font-bold text-slate-700 italic">{o.penerima}</td>
                <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{o.alamat || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => setSelectedTx(o)} 
                    className="text-blue-600 font-bold flex items-center gap-2 bg-blue-50 px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all mx-auto"
                  >
                    <Eye size={14}/> Pratinjau & PDF
                  </button>
                </td>
              </tr>
            ))}
            {outbound.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">
                  Belum ada data transaksi keluar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[1400px] mx-auto rounded-[3rem] shadow-2xl flex flex-col overflow-hidden h-full">
            <div className="px-10 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Settings size={22}/></div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight">Editor Berita Acara</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Kustomisasi Kop, Logo, dan Konten Dokumen</p>
                  </div>
               </div>
               <button onClick={() => setIsEditorOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                 <X size={24}/>
               </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
               <div className="w-80 bg-slate-50 border-r border-slate-100 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo Instansi</p>
                      <div className="relative group bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-3">
                        {settings.logo ? (
                          <img src={settings.logo} className="h-16 w-auto object-contain" alt="Current Logo" />
                        ) : (
                          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                            <ImageIcon size={32}/>
                          </div>
                        )}
                        <label className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-bold cursor-pointer uppercase tracking-widest shadow-md hover:scale-105 transition-all">
                          <Upload size={14}/> Ganti Logo
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variabel Dokumen</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { label: 'Logo', tag: 'logo_app', color: 'bg-emerald-50 text-emerald-600' },
                          { label: 'Penerima', tag: 'penerima' },
                          { label: 'Alamat', tag: 'alamat' },
                          { label: 'Tanggal', tag: 'tanggal_panjang' },
                          { label: 'ID Transaksi', tag: 'id_transaksi' },
                          { label: 'Tabel Barang', tag: 'tabel_barang', color: 'bg-blue-50 text-blue-600' },
                          { label: 'Nama App', tag: 'nama_app' },
                          { label: 'Admin', tag: 'nama_admin' }
                        ].map((item) => (
                          <button 
                            key={item.tag} 
                            onClick={() => insertPlaceholder(item.tag)} 
                            className={`w-full text-left px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-bold hover:border-slate-900 transition-all shadow-sm flex justify-between items-center group bg-white ${item.color || 'text-slate-600'}`}
                          >
                            <span>{item.label}</span>
                            <span className="opacity-30 group-hover:opacity-100 font-mono text-[8px]">[{item.tag}]</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>

               <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden relative">
                  <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 flex-wrap justify-center shadow-sm z-10">
                    <div className="flex bg-slate-50 p-1 rounded-xl gap-0.5 border border-slate-100">
                      <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600"><Bold size={16}/></button>
                      <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600"><Italic size={16}/></button>
                      <button onClick={() => handleFormat('underline')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600"><Underline size={16}/></button>
                    </div>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                      <Type size={14} className="text-slate-400"/>
                      <select 
                        className="bg-transparent text-[10px] font-bold outline-none text-slate-700 cursor-pointer py-1"
                        onChange={(e) => handleFormat('fontSize', e.target.value)}
                        defaultValue="3"
                      >
                        <option value="1">10px</option>
                        <option value="2">13px</option>
                        <option value="3">16px</option>
                        <option value="4">18px</option>
                        <option value="5">24px</option>
                        <option value="6">32px</option>
                        <option value="7">48px</option>
                      </select>
                    </div>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <div className="flex bg-slate-50 p-1 rounded-xl gap-0.5 border border-slate-100">
                      <button onClick={() => handleFormat('justifyLeft')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600"><AlignLeft size={16}/></button>
                      <button onClick={() => handleFormat('justifyCenter')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600"><AlignCenter size={16}/></button>
                      <button onClick={() => handleFormat('justifyRight')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600"><AlignRight size={16}/></button>
                      <button onClick={() => handleFormat('justifyFull')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600"><AlignJustify size={16}/></button>
                    </div>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                      <Palette size={14} className="text-slate-400"/>
                      <input 
                        type="color" 
                        className="w-5 h-5 cursor-pointer border-none bg-transparent"
                        onChange={(e) => handleFormat('foreColor', e.target.value)}
                      />
                    </div>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <label className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <ImageIcon size={14}/> SISIPKAN GAMBAR
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageInsert} />
                    </label>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-12 flex justify-center bg-slate-100">
                    <div 
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="bg-white w-[210mm] min-h-[297mm] p-[25mm] shadow-2xl outline-none text-slate-800"
                      style={{ fontFamily: 'var(--font-main)' }}
                      onBlur={(e) => setCurrentTemplate(e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: currentTemplate }}
                    />
                  </div>
               </div>
            </div>

            <div className="px-10 py-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
              <button 
                onClick={() => { if(confirm('Reset template?')) setCurrentTemplate(defaultBA); }} 
                className="px-6 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500 transition-all"
              >
                Reset Ke Default
              </button>
              <div className="flex-1"></div>
              <button onClick={() => setIsEditorOpen(false)} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest transition-all">Batal</button>
              <button 
                onClick={handleSaveTemplate} 
                className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
              >
                <Save size={18}/> Simpan Desain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CetakBeritaAcara;
