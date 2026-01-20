
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

  // Template Default yang sudah disesuaikan agar Kop lebih presisi ke kiri
  const defaultBA = `
    <div style="display:flex; align-items:center; border-bottom:3px solid #000; padding-bottom:10px; margin-bottom:20px; width:100%;">
      <div style="width:15%; text-align:left;">[logo_app]</div>
      <div style="width:85%; text-align:center; padding-right:15%;">
        <h2 style="margin:0; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; font-weight:normal;">Pemerintah Kabupaten Blora</h2>
        <h1 style="margin:0; font-size:18px; text-transform:uppercase; font-weight:bold; line-height:1.2;">[nama_app]</h1>
        <p style="margin:2px 0; font-size:10px; font-weight:bold;">[subtitle_app]</p>
        <p style="margin:0; font-size:9px;">[nama_gudang]</p>
      </div>
    </div>
    
    <div style="text-align:center; margin-bottom:25px;">
      <h3 style="text-decoration:underline; font-size:15px; margin:0; font-weight:bold; text-transform:uppercase;">BERITA ACARA SERAH TERIMA</h3>
      <p style="margin:5px 0 0 0; font-size:11px;">Nomor: [id_transaksi]/BAST/[tahun]</p>
    </div>
    
    <p style="font-size:12px; line-height:1.5; margin-bottom:15px;">Pada hari ini <b>[tanggal_panjang]</b>, yang bertandatangan di bawah ini masing-masing :</p>
    
    <table style="width:100%; font-size:12px; margin-bottom:10px; border-collapse:collapse;">
      <tr><td width="100" style="padding:2px 0;">Nama</td><td width="15">:</td><td style="font-weight:bold;">[nama_pihak_kesatu]</td></tr>
      <tr><td style="padding:2px 0;">NIP</td><td>:</td><td style="font-weight:bold;">[nip_pihak_kesatu]</td></tr>
      <tr><td style="padding:2px 0;">Jabatan</td><td>:</td><td>[jabatan_pihak_kesatu]</td></tr>
      <tr><td style="padding:2px 0;">Instansi</td><td>:</td><td>[nama_app]</td></tr>
    </table>
    <p style="font-size:12px; margin-bottom:20px;">Selanjutnya disebut sebagai <b><i>PIHAK KESATU</i></b>.</p>

    <p style="font-size:12px; margin-bottom:5px;">Yang menerima bantuan</p>
    <table style="width:100%; font-size:12px; margin-bottom:10px; border-collapse:collapse;">
      <tr><td width="100" style="padding:2px 0;">Penerima</td><td width="15">:</td><td style="font-weight:bold;">[penerima]</td></tr>
      <tr><td style="padding:2px 0;">Alamat</td><td>:</td><td>[alamat]</td></tr>
    </table>
    <p style="font-size:12px; margin-bottom:20px;">Selanjutnya disebut sebagai <b><i>PIHAK KEDUA</i></b>.</p>

    <p style="font-size:12px; line-height:1.5; margin-bottom:15px;">Dengan ini menerangkan bahwa <b>PIHAK KESATU</b> telah menyerahkan Barang Bantuan Logistik Kebencanaan kepada <b>PIHAK KEDUA</b> dan <b>PIHAK KEDUA</b> telah menerima barang tersebut dari <b>PIHAK KESATU</b> dalam keadaan baik dan lengkap berupa :</p>
    
    [tabel_barang]
    
    <p style="font-size:12px; line-height:1.5; margin-top:20px;">Demikian Berita Acara Serah Terima ini dibuat, untuk dipergunakan sebagaimana mestinya.</p>
    
    <div style="margin-top:40px;">
      <div style="text-align:right; font-size:12px; margin-bottom:5px;">[tanggal_panjang]</div>
      <table style="width:100%; border:none; font-size:12px;">
        <tr>
          <td align="center" width="50%" style="vertical-align:top;">
            PIHAK KEDUA,<br><br><br><br><br>
            <b>( [penerima] )</b>
          </td>
          <td align="center" width="50%" style="vertical-align:top;">
            PIHAK KESATU,<br><br><br><br><br>
            <div style="display:inline-block; text-align:left;">
              <b style="text-decoration:underline;">[nama_pihak_kesatu]</b><br>
              <b>[nip_pihak_kesatu]</b>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  const [currentTemplate, setCurrentTemplate] = useState(settings.baTemplate || defaultBA);

  const renderBA = (tx: OutboundTransaction, forPdf = false) => {
    let html = currentTemplate;
    const dateObj = new Date(tx.tanggal);
    const datePanjang = formatIndoDate(tx.tanggal);
    
    const logoHtml = settings.logo 
      ? `<img src="${settings.logo}" style="height:75px; width:auto; object-fit:contain;" />`
      : `<div style="width:60px; height:60px; background:#f8fafc; border:1px solid #cbd5e1; display:flex; align-items:center; justify-content:center; font-size:8px; color:#94a3b8;">LOGO</div>`;

    let grandTotal = 0;
    const tableRows = tx.items.map((item, idx) => {
      const p = products.find(prod => prod.id === item.productId);
      const total = item.jumlah * (p?.harga || 0);
      grandTotal += total;
      return `
        <tr style="font-size:11px;">
          <td style="border:1px solid #000; padding:6px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:6px;">${p?.namaBarang || '-'}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${item.jumlah}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${p?.satuan || '-'}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">Rp ${(p?.harga || 0).toLocaleString('id-ID')}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right; font-weight:bold;">Rp ${total.toLocaleString('id-ID')}</td>
        </tr>`;
    }).join('');

    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:10px 0;">
        <thead>
          <tr style="background-color:#fff; font-size:10px; text-transform:uppercase;">
            <th style="border:1px solid #000; padding:8px; width:30px;">No</th>
            <th style="border:1px solid #000; padding:8px; text-align:left;">Nama Barang</th>
            <th style="border:1px solid #000; padding:8px; width:60px;">Jumlah</th>
            <th style="border:1px solid #000; padding:8px; width:80px;">Satuan</th>
            <th style="border:1px solid #000; padding:8px; text-align:right; width:100px;">Harga</th>
            <th style="border:1px solid #000; padding:8px; text-align:right; width:120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="font-weight:bold; font-size:11px;">
            <td colspan="5" style="border:1px solid #000; padding:8px; text-align:right;">Grand Total</td>
            <td style="border:1px solid #000; padding:8px; text-align:right;">Rp ${grandTotal.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>`;

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
               
    // Placeholder default jika belum diisi user
    if (!settings.baTemplate) {
      html = html.replace(/\[nama_pihak_kesatu\]/g, "NURKHOLIS, S.Kep, MM.")
                 .replace(/\[jabatan_pihak_kesatu\]/g, "Plt. Kepala Bidang Sosial Dinsos PPPA Kab. Blora")
                 .replace(/\[nip_pihak_kesatu\]/g, "19680328 198803 1 004");
    }

    // Wrap untuk PDF agar konten berada di tengah halaman (Horizontal & Vertikal)
    if (forPdf) {
      return `
        <div style="width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; background: white; margin: 0; padding: 0;">
          <div style="width: 170mm; min-height: 240mm; font-family: 'Arial', sans-serif;">
            ${html}
          </div>
        </div>
      `;
    }
               
    return html;
  };

  const handleDownloadPDF = () => {
    if (!printAreaRef.current || !selectedTx) return;
    setIsGenerating(true);
    
    // Create hidden element for clean export
    const container = document.createElement('div');
    container.innerHTML = renderBA(selectedTx, true);
    document.body.appendChild(container);

    const opt = {
      margin: 0,
      filename: `BAST_${selectedTx.penerima.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
      setIsGenerating(false);
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

  if (selectedTx) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <button onClick={() => setSelectedTx(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={18}/> KEMBALI
          </button>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              <Printer size={16}/> Cetak Langsung
            </button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex-2 sm:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
              <Download size={16}/> {isGenerating ? 'PROSES...' : 'UNDUH PDF A4'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-700 text-xs flex items-center gap-3 no-print">
           <div className="p-2 bg-blue-600 text-white rounded-lg"><Eye size={14}/></div>
           <p>Pratinjau Berita Acara (Layout A4). Konten akan otomatis berada di tengah halaman saat diunduh.</p>
        </div>

        <div className="flex justify-start sm:justify-center overflow-x-auto p-4 scrollbar-hide bg-slate-200/50 rounded-2xl border border-slate-300">
          <div ref={printAreaRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl shrink-0 flex items-center justify-center">
            <div className="w-[170mm]">
              <div dangerouslySetInnerHTML={{ __html: renderBA(selectedTx) }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Berita Acara</h2>
          <p className="text-slate-500 text-sm font-medium">Buat dokumen serah terima resmi (Format A4).</p>
        </div>
        <button onClick={() => setIsEditorOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          <Settings size={18}/> Atur Template
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
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Belum ada data transaksi keluar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex flex-col p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[1400px] mx-auto rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden h-full">
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
               <h3 className="font-bold uppercase text-slate-800">Editor Template Berita Acara</h3>
               <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
               <div className="w-full md:w-64 bg-slate-50 border-r p-6 space-y-4 overflow-y-auto shrink-0 scrollbar-hide">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Placeholder Data:</p>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {['logo_app', 'penerima', 'alamat', 'tanggal_panjang', 'id_transaksi', 'tabel_barang', 'tahun'].map(tag => (
                      <button key={tag} onClick={() => insertPlaceholder(tag)} className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-bold hover:border-blue-500 transition-all uppercase">[{tag}]</button>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Penandatangan (Custom):</p>
                    <div className="grid grid-cols-1 gap-2">
                      {['nama_pihak_kesatu', 'jabatan_pihak_kesatu', 'nip_pihak_kesatu'].map(tag => (
                        <button key={tag} onClick={() => insertPlaceholder(tag)} className="text-left px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-[9px] font-bold hover:border-blue-500 transition-all uppercase text-blue-700">[{tag}]</button>
                      ))}
                    </div>
                    <p className="mt-2 text-[8px] text-slate-400 leading-tight italic">Gunakan tag di atas, lalu ketik manual detailnya di area pratinjau.</p>
                  </div>
               </div>
               <div className="flex-1 bg-slate-100 overflow-auto p-4 sm:p-8 scrollbar-hide flex justify-center">
                  <div className="max-w-[210mm] w-full">
                    <div className="bg-white border border-slate-200 p-2 flex flex-wrap gap-2 justify-center mb-6 rounded-2xl shadow-sm sticky top-0 z-10">
                      <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><Bold size={18}/></button>
                      <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><Italic size={18}/></button>
                      <button onClick={() => handleFormat('underline')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><Underline size={18}/></button>
                      <div className="w-px h-6 bg-slate-200 mx-1"></div>
                      <button onClick={() => handleFormat('justifyLeft')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><AlignLeft size={18}/></button>
                      <button onClick={() => handleFormat('justifyCenter')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><AlignCenter size={18}/></button>
                      <button onClick={() => handleFormat('justifyFull')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"><AlignJustify size={18}/></button>
                    </div>
                    <div 
                      ref={editorRef} 
                      contentEditable 
                      suppressContentEditableWarning 
                      className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl outline-none shrink-0" 
                      style={{ fontFamily: 'Arial, sans-serif' }}
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
