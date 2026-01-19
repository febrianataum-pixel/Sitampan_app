
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

declare var html2pdf: any;

const CetakBeritaAcara: React.FC = () => {
  const { products, outbound, settings, setSettings } = useInventory();
  const [selectedTx, setSelectedTx] = useState<OutboundTransaction | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const defaultBA = `
    <div style="display:flex; align-items:center; border-bottom:4px double #000; padding-bottom:15px; margin-bottom:20px;">
      <div style="margin-right:20px; shrink-0;">[logo_app]</div>
      <div style="flex:1; text-align:center;">
        <h2 style="margin:0; font-size:16px; text-transform:uppercase; letter-spacing:1px;">Pemerintah Kabupaten Blora</h2>
        <h1 style="margin:0; font-size:19px; text-transform:uppercase; font-weight:900; line-height:1.2;">[nama_app]</h1>
        <p style="margin:2px 0; font-size:11px; font-weight:bold;">[subtitle_app]</p>
        <p style="margin:0; font-size:10px;">[nama_gudang]</p>
      </div>
    </div>
    
    <h3 style="text-align:center; text-decoration:underline; font-size:16px; margin-bottom:5px;">BERITA ACARA SERAH TERIMA</h3>
    <p style="text-align:center; margin-top:0; font-size:12px;">Nomor: [id_transaksi]/BAST/[tahun]</p>
    
    <br>
    <p style="font-size:13px; line-height:1.6;">Pada hari ini <b>[tanggal_panjang]</b>, yang bertandatangan di bawah ini masing-masing :</p>
    
    <table style="width:100%; font-size:13px; margin-bottom:15px; border-collapse:collapse;">
      <tr><td width="100" style="vertical-align:top;">Nama</td><td width="15">:</td><td style="font-weight:bold;">[nama_pihak_kesatu]</td></tr>
      <tr><td style="vertical-align:top;">Jabatan</td><td>:</td><td>[jabatan_pihak_kesatu]</td></tr>
      <tr><td style="vertical-align:top;">Instansi</td><td>:</td><td>[nama_app]</td></tr>
    </table>
    <p style="font-size:13px; margin-bottom:20px;">Selanjutnya disebut sebagai <b><i>PIHAK KESATU</i></b>.</p>

    <p style="font-size:13px;">Yang menerima bantuan :</p>
    <table style="width:100%; font-size:13px; margin-bottom:15px; border-collapse:collapse;">
      <tr><td width="100" style="vertical-align:top;">Penerima</td><td width="15">:</td><td style="font-weight:bold;">[penerima]</td></tr>
      <tr><td style="vertical-align:top;">Alamat</td><td>:</td><td>[alamat]</td></tr>
    </table>
    <p style="font-size:13px; margin-bottom:20px;">Selanjutnya disebut sebagai <b><i>PIHAK KEDUA</i></b>.</p>

    <p style="font-size:13px;"><b>PIHAK KESATU</b> menyerahkan barang kepada <b>PIHAK KEDUA</b> dengan rincian sebagai berikut:</p>
    [tabel_barang]
    
    <br>
    <p style="font-size:13px;">Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
    <br><br>
    
    <table style="width:100%; border:none; font-size:13px;">
      <tr>
        <td align="center" width="50%">Pihak Kedua,<br><br><br><br><br><b>( [penerima] )</b></td>
        <td align="center" width="50%">Pihak Kesatu,<br><br><br><br><br><b>( [nama_pihak_kesatu] )</b><br>[nip_pihak_kesatu]</td>
      </tr>
    </table>
  `;

  const [currentTemplate, setCurrentTemplate] = useState(settings.baTemplate || defaultBA);

  const renderBA = (tx: OutboundTransaction) => {
    let html = currentTemplate;
    const dateObj = new Date(tx.tanggal);
    const datePanjang = formatIndoDate(tx.tanggal);
    const logoHtml = settings.logo 
      ? `<img src="${settings.logo}" style="height:85px; width:auto; object-fit:contain;" />`
      : `<div style="width:70px; height:70px; background:#f8fafc; border:2px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; font-size:10px; color:#94a3b8; font-weight:bold;">LOGO</div>`;

    let grandTotal = 0;
    const tableRows = tx.items.map((item, idx) => {
      const p = products.find(prod => prod.id === item.productId);
      const total = item.jumlah * (p?.harga || 0);
      grandTotal += total;
      return `
        <tr style="font-size:12px;">
          <td style="border:1px solid #000; padding:8px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:8px;">${p?.namaBarang || '-'}</td>
          <td style="border:1px solid #000; padding:8px; text-align:center;">${item.jumlah}</td>
          <td style="border:1px solid #000; padding:8px; text-align:center;">${p?.satuan || '-'}</td>
          <td style="border:1px solid #000; padding:8px; text-align:right;">Rp ${(p?.harga || 0).toLocaleString('id-ID')}</td>
          <td style="border:1px solid #000; padding:8px; text-align:right; font-weight:bold;">Rp ${total.toLocaleString('id-ID')}</td>
        </tr>`;
    }).join('');

    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:15px 0;">
        <thead>
          <tr style="background-color:#f8f8f8; font-size:11px; text-transform:uppercase;">
            <th style="border:1px solid #000; padding:10px;">No</th>
            <th style="border:1px solid #000; padding:10px; text-align:left;">Nama Barang</th>
            <th style="border:1px solid #000; padding:10px;">Jumlah</th>
            <th style="border:1px solid #000; padding:10px;">Satuan</th>
            <th style="border:1px solid #000; padding:10px; text-align:right;">Harga</th>
            <th style="border:1px solid #000; padding:10px; text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="font-weight:bold;">
            <td colspan="5" style="border:1px solid #000; padding:10px; text-align:right;">Grand Total</td>
            <td style="border:1px solid #000; padding:10px; text-align:right;">Rp ${grandTotal.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>`;

    // Kita biarkan tag custom pihak kesatu tidak diganti otomatis oleh sistem (agar diisi di editor)
    // Kecuali jika user ingin fallback ke admin (opsional)
    html = html.replace(/\[logo_app\]/g, logoHtml)
               .replace(/\[nama_app\]/g, settings.appName)
               .replace(/\[subtitle_app\]/g, settings.appSubtitle)
               .replace(/\[nama_gudang\]/g, settings.warehouseName)
               .replace(/\[nama_admin\]/g, settings.adminName)
               .replace(/\[id_transaksi\]/g, tx.id.split('-')[0].toUpperCase())
               .replace(/\[tahun\]/g, dateObj.getFullYear().toString())
               .replace(/\[penerima\]/g, tx.penerima)
               .replace(/\[alamat\]/g, tx.alamat || '-')
               .replace(/\[tanggal_panjang\]/g, datePanjang)
               .replace(/\[tabel_barang\]/g, tableHtml);
               
    // Placeholder default untuk editor jika belum diisi oleh user
    // Jika user sudah mengetikkan nama di editor, string ini tidak akan muncul lagi setelah simpan.
    if (!settings.baTemplate) {
      html = html.replace(/\[nama_pihak_kesatu\]/g, "NAMA PEJABAT / ADMIN")
                 .replace(/\[jabatan_pihak_kesatu\]/g, "JABATAN PENYERAH")
                 .replace(/\[nip_pihak_kesatu\]/g, "NIP. 19xxxxxxxxxxxxxx");
    }
               
    return html;
  };

  const handleDownloadPDF = () => {
    if (!printAreaRef.current || !selectedTx) return;
    setIsGenerating(true);
    const element = printAreaRef.current;
    const opt = {
      margin: 10,
      filename: `BAST_${selectedTx.penerima.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => setIsGenerating(false));
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) setCurrentTemplate(editorRef.current.innerHTML);
  };

  const insertPlaceholder = (tag: string) => {
    document.execCommand('insertText', false, `[${tag}]`);
    if (editorRef.current) setCurrentTemplate(editorRef.current.innerHTML);
  };

  if (selectedTx) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <button onClick={() => setSelectedTx(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={18}/> KEMBALI
          </button>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              <Printer size={16}/> Cetak
            </button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex-2 sm:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
              <Download size={16}/> {isGenerating ? 'MENYIAPKAN...' : 'UNDUH PDF'}
            </button>
          </div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-700 text-xs flex items-center gap-3 no-print">
           <div className="p-2 bg-emerald-600 text-white rounded-lg"><Eye size={14}/></div>
           <p>Pratinjau Berita Acara siap. Pastikan Pihak Kesatu sudah sesuai sebelum mengunduh.</p>
        </div>

        <div className="flex justify-start sm:justify-center overflow-x-auto p-4 scrollbar-hide bg-slate-100/50 rounded-2xl border border-slate-200">
          <div ref={printAreaRef} className="bg-white w-[210mm] min-h-[297mm] p-[15mm] sm:p-[20mm] shadow-2xl shrink-0"
            dangerouslySetInnerHTML={{ __html: renderBA(selectedTx) }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Berita Acara</h2>
          <p className="text-slate-500 text-sm font-medium">Buat dokumen serah terima resmi.</p>
        </div>
        <button onClick={() => setIsEditorOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          <Settings size={18}/> Desain Template
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm min-w-[700px]">
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
                  <td className="px-6 py-4 text-xs font-semibold text-slate-400">{formatIndoDate(o.tanggal)}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 italic">{o.penerima}</td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{o.alamat || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => setSelectedTx(o)} className="text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-xl text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all">
                      <Eye size={14} className="inline mr-2"/> PDF
                    </button>
                  </td>
                </tr>
              ))}
              {outbound.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Belum ada data transaksi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex flex-col p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[1400px] mx-auto rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden h-full">
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
               <h3 className="font-bold uppercase text-slate-800">Editor Template BA</h3>
               <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
               <div className="w-full md:w-64 bg-slate-50 border-r p-6 space-y-4 overflow-y-auto shrink-0 scrollbar-hide">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Transaksi:</p>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {['logo_app', 'penerima', 'alamat', 'tanggal_panjang', 'id_transaksi', 'tabel_barang', 'tahun'].map(tag => (
                      <button key={tag} onClick={() => insertPlaceholder(tag)} className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-bold hover:border-blue-500 transition-all uppercase">[{tag}]</button>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Pihak Kesatu (Custom):</p>
                    <div className="grid grid-cols-1 gap-2">
                      {['nama_pihak_kesatu', 'jabatan_pihak_kesatu', 'nip_pihak_kesatu'].map(tag => (
                        <button key={tag} onClick={() => insertPlaceholder(tag)} className="text-left px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-[9px] font-bold hover:border-blue-500 transition-all uppercase text-blue-700">[{tag}]</button>
                      ))}
                    </div>
                    <p className="mt-2 text-[8px] text-slate-400 leading-tight italic">Gunakan tag di atas, lalu ketik manual rinciannya langsung di editor pratinjau.</p>
                  </div>
               </div>
               <div className="flex-1 bg-slate-100 overflow-auto p-4 sm:p-8 scrollbar-hide">
                  <div className="bg-white border border-slate-200 p-2 flex flex-wrap gap-2 justify-center mb-6 rounded-2xl shadow-sm sticky top-0 z-10">
                    <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><Bold size={18}/></button>
                    <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><Italic size={18}/></button>
                    <button onClick={() => handleFormat('underline')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><Underline size={18}/></button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={() => handleFormat('justifyLeft')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><AlignLeft size={18}/></button>
                    <button onClick={() => handleFormat('justifyCenter')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><AlignCenter size={18}/></button>
                    <button onClick={() => handleFormat('justifyFull')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><AlignJustify size={18}/></button>
                  </div>
                  <div className="flex justify-start sm:justify-center">
                    <div 
                      ref={editorRef} 
                      contentEditable 
                      suppressContentEditableWarning 
                      className="bg-white w-[210mm] min-h-[297mm] p-[15mm] sm:p-[20mm] shadow-2xl outline-none shrink-0" 
                      style={{ fontFamily: 'Times New Roman, serif' }}
                      dangerouslySetInnerHTML={{ __html: currentTemplate }} 
                      onInput={(e) => setCurrentTemplate(e.currentTarget.innerHTML)}
                    />
                  </div>
               </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-white shrink-0">
              <button onClick={() => setIsEditorOpen(false)} className="px-6 py-3 text-slate-400 font-bold uppercase text-[10px]">Batal</button>
              <button onClick={() => { setSettings({ ...settings, baTemplate: currentTemplate }); setIsEditorOpen(false); alert('Template Berita Acara berhasil disimpan!'); }} className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CetakBeritaAcara;
