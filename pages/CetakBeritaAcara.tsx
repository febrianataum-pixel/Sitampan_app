
import React, { useState, useRef } from 'react';
import { useInventory } from '../App';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
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
  Download,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Loader2,
  Archive,
  FolderArchive,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { OutboundTransaction, MONTHS, formatIndoDate } from '../types';

declare var html2pdf: any;

const terbilang = (num: number): string => {
  const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let res = "";
  if (num < 12) {
    res = words[num];
  } else if (num < 20) {
    res = words[num - 10] + " Belas";
  } else if (num < 100) {
    const main = words[Math.floor(num / 10)] + " Puluh";
    const rest = words[num % 10];
    res = rest ? main + " " + rest : main;
  } else if (num < 2000) {
    res = "Seribu " + terbilang(num - 1000);
  } else if (num < 10000) {
    const main = words[Math.floor(num / 1000)] + " Ribu";
    const rest = terbilang(num % 1000);
    res = rest ? main + " " + rest : main;
  }
  return res.trim();
};

const formatHariTanggalTahunIndo = (dateStr: string): string => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;
  
  const dayName = days[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const monthName = months[dateObj.getMonth() + 1];
  const yearNum = dateObj.getFullYear();
  
  return `Hari ${dayName}, Tanggal ${terbilang(dateNum)} Bulan ${monthName} Tahun ${terbilang(yearNum)}`;
};

type SortKey = 'tanggal' | 'penerima' | 'alamat';

const CetakBeritaAcara: React.FC = () => {
  const { products, outbound, settings, setSettings } = useInventory();
  const [selectedTx, setSelectedTx] = useState<OutboundTransaction | null>(null);
  const [docType, setDocType] = useState<'BA' | 'SPPB'>('BA');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingDoc, setIsDownloadingDoc] = useState(false);
  const [downloadingTxId, setDownloadingTxId] = useState<string | null>(null);
  const [zipProgress, setZipProgress] = useState<{
    title: string;
    label: string;
    current: number;
    total: number;
  } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [filterMonth, setFilterMonth] = useState<string>('All');

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'tanggal',
    direction: 'desc'
  });

  const defaultBA = `
    <div style="display:flex; align-items:center; border-bottom:3.5px double #000; padding-bottom:10px; margin-bottom:20px; width:100%; font-family: Arial, sans-serif;">
      <div style="width:15%; text-align:left;">[logo_app]</div>
      <div style="width:85%; text-align:center; padding-right:15%;">
        <div style="margin:0; font-size:14px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#000;">PEMERINTAH KABUPATEN BLORA</div>
        <div style="margin:2px 0 0 0; font-size:16px; font-weight:bold; text-transform:uppercase; line-height:1.2; color:#000;">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN</div>
        <div style="margin:0 0 2px 0; font-size:16px; font-weight:bold; text-transform:uppercase; line-height:1.2; color:#000;">DAN PERLINDUNGAN ANAK</div>
        <div style="margin:3px 0; font-size:9px; font-weight:normal; color:#000;">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</div>
        <div style="margin:0; font-size:9px; font-weight:normal; color:#000;">Website : dinsos.blorakab.go.id / E-mail : dinsosp3a.bla.com</div>
      </div>
    </div>
    
    <div style="text-align:center; margin-bottom:25px; font-family: Arial, sans-serif;">
      <h3 style="text-decoration:underline; font-size:15px; margin:0; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">BERITA ACARA SERAH TERIMA</h3>
    </div>
    
    <p style="font-size:12px; line-height:1.6; margin-bottom:15px; font-family: Arial, sans-serif;">Pada hari ini <b>[hari_tanggal_tahun]</b>, yang bertandatangan di bawah ini masing-masing :</p>
    
    <table style="width:100%; font-size:12px; margin-bottom:12px; border-collapse:collapse; font-family: Arial, sans-serif;">
      <tr><td width="100" style="padding:2px 0; vertical-align:top;">Nama</td><td width="15" style="padding:2px 0; vertical-align:top;">:</td><td style="font-weight:bold; padding:2px 0; vertical-align:top;">[nama_kabid]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">NIP</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="font-weight:bold; padding:2px 0; vertical-align:top;">[NIP_kabid]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">Jabatan</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="padding:2px 0; vertical-align:top;">[Jabatan_kabid]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">Instansi</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="padding:2px 0; vertical-align:top;">[Instansi_kabid]</td></tr>
    </table>
    <p style="font-size:12px; margin-bottom:20px; font-family: Arial, sans-serif;">Selanjutnya disebut sebagai <b><i>PIHAK KESATU</i></b>.</p>

    <p style="font-size:12px; margin-bottom:5px; font-family: Arial, sans-serif;">Yang menerima bantuan :</p>
    <table style="width:100%; font-size:12px; margin-bottom:12px; border-collapse:collapse; font-family: Arial, sans-serif;">
      <tr><td width="100" style="padding:2px 0; vertical-align:top;">Nama</td><td width="15" style="padding:2px 0; vertical-align:top;">:</td><td style="font-weight:bold; padding:2px 0; vertical-align:top;">[Nama_penerima]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">Alamat</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="padding:2px 0; vertical-align:top;">[Alamat_penerima]</td></tr>
    </table>
    <p style="font-size:12px; margin-bottom:20px; font-family: Arial, sans-serif;">Selanjutnya disebut sebagai <b><i>PIHAK KEDUA</i></b>.</p>

    <p style="font-size:12px; line-height:1.6; margin-bottom:15px; font-family: Arial, sans-serif;">Dengan ini menerangkan bahwa <b>PIHAK KESATU</b> telah menyerahkan Barang Bantuan Logistik Kebencanaan kepada <b>PIHAK KEDUA</b> dan <b>PIHAK KEDUA</b> telah menerima barang tersebut dari <b>PIHAK KESATU</b> dalam keadaan baik dan lengkap berupa :</p>
    
    [table barang]
    
    <p style="font-size:12px; line-height:1.6; margin-top:20px; margin-bottom:30px; font-family: Arial, sans-serif;">Demikian Berita Acara Serah Terima ini dibuat, untuk dipergunakan sebagaimana mestinya.</p>
    
    <div style="margin-top:35px; font-family: Arial, sans-serif;">
      <table style="width:100%; border:none; font-size:12px; border-collapse:collapse;">
        <tr>
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:60px; color:#000; text-align:left; white-space: nowrap;">
            <span style="visibility:hidden; display:inline-block; user-select:none;">Blora, [tanggal]</span><br>
            PIHAK KEDUA<br><br><br><br><br>
            <b>[Nama_penerima]</b>
          </td>
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:90px; color:#000; text-align:left; white-space: nowrap;">
            Blora, [tanggal]<br>
            PIHAK KESATU<br><br><br><br><br>
            <b style="text-decoration:underline;">[nama_kabid]</b><br>
            NIP. [NIP_kabid]
          </td>
        </tr>
      </table>
    </div>
  `;

  const defaultSPPB = `
    <div style="display:flex; align-items:center; border-bottom:3.5px double #000; padding-bottom:10px; margin-bottom:20px; width:100%; font-family: Arial, sans-serif;">
      <div style="width:15%; text-align:left;">[logo_app]</div>
      <div style="width:85%; text-align:center; padding-right:15%;">
        <div style="margin:0; font-size:14px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#000;">PEMERINTAH KABUPATEN BLORA</div>
        <div style="margin:2px 0 0 0; font-size:16px; font-weight:bold; text-transform:uppercase; line-height:1.2; color:#000;">DINAS SOSIAL PEMBERDAYAAN PEREMPUAN</div>
        <div style="margin:0 0 2px 0; font-size:16px; font-weight:bold; text-transform:uppercase; line-height:1.2; color:#000;">DAN PERLINDUNGAN ANAK</div>
        <div style="margin:3px 0; font-size:9px; font-weight:normal; color:#000;">Jl. Pemuda No.16 A Blora 58215, No. Tlp: (0296) 5298541</div>
        <div style="margin:0; font-size:9px; font-weight:normal; color:#000;">Website : dinsos.blorakab.go.id / E-mail : dinsosp3a.bla.com</div>
      </div>
    </div>
    
    <div style="text-align:center; margin-bottom:25px; font-family: Arial, sans-serif;">
      <h3 style="text-decoration:underline; font-size:15px; margin:0; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">SURAT PERINTAH PENGELUARAN BARANG (SPPB)</h3>
    </div>
    
    <p style="font-size:12px; line-height:1.6; margin-bottom:15px; font-family: Arial, sans-serif;">Yang bertandatangan di bawah ini masing-masing :</p>
    
    <table style="width:100%; font-size:12px; margin-bottom:12px; border-collapse:collapse; font-family: Arial, sans-serif;">
      <tr><td width="100" style="padding:2px 0; vertical-align:top;">Nama</td><td width="15" style="padding:2px 0; vertical-align:top;">:</td><td style="font-weight:bold; padding:2px 0; vertical-align:top;">[nama_kabid]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">NIP</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="font-weight:bold; padding:2px 0; vertical-align:top;">[NIP_kabid]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">Jabatan</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="padding:2px 0; vertical-align:top;">[Jabatan_kabid]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">Instansi</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="padding:2px 0; vertical-align:top;">[Instansi_kabid]</td></tr>
    </table>
    <p style="font-size:12px; margin-bottom:20px; font-family: Arial, sans-serif;">Selanjutnya disebut sebagai <b><i>Pejabat Penatausahaan Barang</i></b></p>

    <p style="font-size:12px; line-height:1.6; margin-bottom:15px; font-family: Arial, sans-serif;">Berdasarkan [No_SK dan Tanggal_SK], bersama ini memerintahkan :</p>
    
    <table style="width:100%; font-size:12px; margin-bottom:12px; border-collapse:collapse; font-family: Arial, sans-serif;">
      <tr><td width="100" style="padding:2px 0; vertical-align:top;">Nama</td><td width="15" style="padding:2px 0; vertical-align:top;">:</td><td style="font-weight:bold; padding:2px 0; vertical-align:top;">[nama_petugaslogistik]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">NIP</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="font-weight:bold; padding:2px 0; vertical-align:top;">[NIP_ petugaslogistik]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">Jabatan</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="padding:2px 0; vertical-align:top;">[Jabatan_ petugaslogistik]</td></tr>
      <tr><td style="padding:2px 0; vertical-align:top;">Instansi</td><td style="padding:2px 0; vertical-align:top;">:</td><td style="padding:2px 0; vertical-align:top;">[Instansi_ petugaslogistik]</td></tr>
    </table>
    <p style="font-size:12px; margin-bottom:20px; font-family: Arial, sans-serif;">Selanjutnya disebut sebagai <b><i>Petugas Logistik</i></b></p>

    <p style="font-size:12px; line-height:1.6; margin-bottom:15px; font-family: Arial, sans-serif;">Untuk menyalurkan barang sebagai berikut :</p>
    
    [table barang]
    
    <p style="font-size:12px; line-height:1.6; margin-top:20px; margin-bottom:30px; font-family: Arial, sans-serif;">Demikian Surat Perintah Pengeluaran Barang (SPPB) ini dibuat, untuk dipergunakan sebagaimana mestinya..</p>
    
    <div style="margin-top:35px; font-family: Arial, sans-serif;">
      <table style="width:100%; border:none; font-size:12px; border-collapse:collapse;">
        <tr>
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:60px; color:#000; text-align:left; white-space: nowrap;">
            <span style="visibility:hidden; display:inline-block; user-select:none;">Blora, [tanggal]</span><br>
            Petugas Logistik<br><br><br><br><br>
            <b>[Nama_petugaslogistik]</b><br>
            [NIP_petugaslogistik]
          </td>
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:90px; color:#000; text-align:left; white-space: nowrap;">
            Blora, [tanggal]<br>
            Kepala Bidang Sosial<br><br><br><br><br>
            <b style="text-decoration:underline;">[nama_kabid]</b><br>
            [NIP_kabid]
          </td>
        </tr>
      </table>
    </div>
  `;

  const [currentTemplate, setCurrentTemplate] = useState(docType === 'BA' ? (settings.baTemplate || defaultBA) : (settings.sppbTemplate || defaultSPPB));
  const [editingDocType, setEditingDocType] = useState<'BA' | 'SPPB'>('BA');

  const handleOpenEditor = (type: 'BA' | 'SPPB') => {
    setEditingDocType(type);
    setCurrentTemplate(type === 'BA' ? (settings.baTemplate || defaultBA) : (settings.sppbTemplate || defaultSPPB));
    setIsEditorOpen(true);
  };

  const handleDownloadDocumentationJPG = async (tx: OutboundTransaction) => {
    if (!tx.images || tx.images.length === 0) {
      alert("Tidak ada foto dokumentasi untuk transaksi ini.");
      return;
    }

    try {
      setIsDownloadingDoc(true);
      setDownloadingTxId(tx.id);

      const dateDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const dateObjRaw = new Date(tx.tanggal);
      const dayName = !isNaN(dateObjRaw.getTime()) ? dateDays[dateObjRaw.getDay()] : "";
      const formattedDateLabel = dayName ? `${dayName}, ${formatIndoDate(tx.tanggal)}` : formatIndoDate(tx.tanggal);

      // Create an off-screen container matching Page 2 (Dokumentasi) layout exactly
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; // Standard A4 width in px at 96dpi
      container.style.minHeight = '1123px'; // Standard A4 height in px at 96dpi
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '50px 45px';
      container.style.boxSizing = 'border-box';
      container.style.fontFamily = "'Urbanist', Arial, Helvetica, sans-serif";
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'flex-start';
      container.style.color = '#000000';

      const imageCount = tx.images.length;
      let imgMaxHeight = '420px';
      if (imageCount === 1) {
        imgMaxHeight = '650px';
      } else if (imageCount === 2) {
        imgMaxHeight = '420px';
      } else if (imageCount >= 3) {
        imgMaxHeight = '300px';
      }

      container.innerHTML = `
        <div style="width: 100%; text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 800; margin: 0 0 14px 0; text-transform: uppercase; color: #000000; letter-spacing: 1.5px; font-family: 'Inter', Arial, sans-serif;">
            DOKUMENTASI
          </h2>
          <p style="font-size: 15px; margin: 0 0 6px 0; color: #1e293b; line-height: 1.5; font-family: 'Inter', Arial, sans-serif;">
            Penyaluran Bantuan Sosial <strong style="color: #000000; font-weight: 700;">${tx.penerima}</strong>, di <strong style="color: #000000; font-weight: 700;">${tx.alamat || '-'}</strong>
          </p>
          <p style="font-size: 13.5px; margin: 0; color: #475569; font-family: 'Inter', Arial, sans-serif;">
            ${formattedDateLabel}
          </p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 18px; width: 100%; box-sizing: border-box;">
          ${tx.images.map((imgSrc, idx) => `
            <div style="border: 1px solid #e2e8f0; padding: 10px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border-radius: 12px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: 100%; max-width: 620px;">
              <img src="${imgSrc}" style="max-height: ${imgMaxHeight}; width: auto; max-width: 100%; object-fit: contain; border-radius: 8px; display: block;" crossOrigin="anonymous" alt="Dokumentasi ${idx + 1}" />
            </div>
          `).join('')}
        </div>
      `;

      document.body.appendChild(container);

      // Ensure all images are fully loaded before rendering to canvas
      const imgElements = Array.from(container.querySelectorAll('img'));
      await Promise.all(imgElements.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Small delay for DOM layout settling
      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(container, {
        scale: 2, // 2x high resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794
      });

      const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
      const sanitizedPenerima = tx.penerima.replace(/[/\\?%*:|"<>]/g, '_').trim();
      const sanitizedTanggal = (tx.tanggal || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
      const filename = `Dokumentasi_BAST_${sanitizedPenerima}_${sanitizedTanggal}.jpg`;

      const link = document.createElement('a');
      link.href = jpgUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      document.body.removeChild(container);
    } catch (err) {
      console.error("Gagal mengunduh lembar dokumentasi JPG:", err);
      alert("Gagal mengunduh lembar dokumentasi JPG. Silakan coba lagi.");
    } finally {
      setIsDownloadingDoc(false);
      setDownloadingTxId(null);
    }
  };

  const handleDownloadImages = handleDownloadDocumentationJPG;

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="text-slate-300 dark:text-slate-600" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const filteredOutbound = outbound.filter(tx => {
    if (filterMonth !== 'All') {
      const txDate = new Date(tx.tanggal);
      if (isNaN(txDate.getTime())) return false;
      const txMonthIndex = txDate.getMonth();
      return txMonthIndex.toString() === filterMonth;
    }
    return true;
  });

  const sortedOutbound = [...filteredOutbound].sort((a, b) => {
    const key = sortConfig.key;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    if (key === 'tanggal') return (new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()) * dir;
    const valA = (a[key] || '').toString().toLowerCase();
    const valB = (b[key] || '').toString().toLowerCase();
    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });

  const renderBA = (tx: OutboundTransaction, forPdf = false) => {
    let html = docType === 'BA' 
      ? (settings.baTemplate || defaultBA) 
      : (settings.sppbTemplate || defaultSPPB);
    
    // If we are in the editor, use the currentTemplate state
    if (isEditorOpen) {
      html = currentTemplate;
    }

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
      return `<tr style="font-size:11px;"><td style="border:1px solid #000; padding:6px; text-align:center;">${idx + 1}</td><td style="border:1px solid #000; padding:6px;">${p?.namaBarang || '-'}</td><td style="border:1px solid #000; padding:6px; text-align:center;">${item.jumlah}</td><td style="border:1px solid #000; padding:6px; text-align:center;">${p?.satuan || '-'}</td><td style="border:1px solid #000; padding:6px; text-align:right;">Rp ${(p?.harga || 0).toLocaleString('id-ID')}</td><td style="border:1px solid #000; padding:6px; text-align:right; font-weight:bold;">Rp ${total.toLocaleString('id-ID')}</td></tr>`;
    }).join('');
    const tableHtml = `<table style="width:100%; border-collapse:collapse; margin:10px 0;"><thead><tr style="background-color:#fff; font-size:10px; text-transform:uppercase;"><th style="border:1px solid #000; padding:8px; width:30px;">No</th><th style="border:1px solid #000; padding:8px; text-align:left;">Nama Barang</th><th style="border:1px solid #000; padding:8px; width:60px;">Jumlah</th><th style="border:1px solid #000; padding:8px; width:80px;">Satuan</th><th style="border:1px solid #000; padding:8px; text-align:right; width:100px;">Harga</th><th style="border:1px solid #000; padding:8px; text-align:right; width:120px;">Total</th></tr></thead><tbody>${tableRows}<tr style="font-weight:bold; font-size:11px;"><td colspan="5" style="border:1px solid #000; padding:8px; text-align:right;">Grand Total</td><td style="border:1px solid #000; padding:8px; text-align:right;">Rp ${grandTotal.toLocaleString('id-ID')}</td></tr></tbody></table>`;
    const kabidNama = settings.kabidNama || "NURKHOLIS, S.Kep, MM.";
    const kabidNip = settings.kabidNip || "19680328 198803 1 004";
    const kabidJabatan = settings.kabidJabatan || "Plt. Kepala Bidang Sosial Dinsos PPPA Kab. Blora";
    const kabidInstansi = settings.kabidInstansi || "Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Blora";

    const petugasNama = settings.petugasNama || "Budi Santoso, A.Md.";
    const petugasNip = settings.petugasNip || "19850102 201001 1 003";
    const petugasJabatan = settings.petugasJabatan || "Staf Seksi Logistik Kebencanaan";
    const petugasInstansi = settings.petugasInstansi || "Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Blora";
    const petugasNoSk = settings.petugasNoSk || "-";
    const petugasTanggalSk = settings.petugasTanggalSk ? formatIndoDate(settings.petugasTanggalSk) : "-";
    const petugasTentangSk = settings.petugasTentangSk || "-";
    const petugasNamaSk = settings.petugasNamaSk || "Keputusan Kepala Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kabupaten Blora";

    const dateHariTanggalTahun = formatHariTanggalTahunIndo(tx.tanggal);

    html = html
      .replace(/\[logo_app\]/g, logoHtml)
      .replace(/\[nama_app\]/g, settings.appName || '')
      .replace(/\[subtitle_app\]/g, settings.appSubtitle || '')
      .replace(/\[nama_gudang\]/g, settings.warehouseName || '')
      .replace(/\[nama_admin\]/g, settings.adminName || '')
      .replace(/\[id_transaksi\]/g, tx.id.split('-')[0].toUpperCase())
      .replace(/\[tahun\]/g, dateObj.getFullYear().toString())
      .replace(/\[penerima\]/g, tx.penerima)
      .replace(/\[Nama_penerima\]/g, tx.penerima)
      .replace(/\[nama_penerima\]/g, tx.penerima)
      .replace(/\[alamat\]/g, tx.alamat || '-')
      .replace(/\[Alamat_penerima\]/g, tx.alamat || '-')
      .replace(/\[alamat_penerima\]/g, tx.alamat || '-')
      .replace(/\[tanggal_panjang\]/g, datePanjang)
      .replace(/\[tanggal\]/g, datePanjang)
      .replace(/\[hari_tanggal_tahun\]/g, dateHariTanggalTahun)
      .replace(/\[tabel_barang\]/g, tableHtml)
      .replace(/\[table_barang\]/g, tableHtml)
      .replace(/\[table barang\]/g, tableHtml)
      .replace(/\[nama_pihak_kesatu\]/g, kabidNama)
      .replace(/\[nama_kabid\]/g, kabidNama)
      .replace(/\[Nama_kabid\]/g, kabidNama)
      .replace(/\[Nama_Kabid\]/g, kabidNama)
      .replace(/\[nip_pihak_kesatu\]/g, kabidNip)
      .replace(/\[nip_kabid\]/g, kabidNip)
      .replace(/\[NIP_kabid\]/g, kabidNip)
      .replace(/\[jabatan_pihak_kesatu\]/g, kabidJabatan)
      .replace(/\[jabatan_kabid\]/g, kabidJabatan)
      .replace(/\[Jabatan_kabid\]/g, kabidJabatan)
      .replace(/\[instansi_pihak_kesatu\]/g, kabidInstansi)
      .replace(/\[instansi_kabid\]/g, kabidInstansi)
      .replace(/\[Instansi_kabid\]/g, kabidInstansi)
      .replace(/\[nama_petugas_logistik\]/g, petugasNama)
      .replace(/\[nip_petugas_logistik\]/g, petugasNip)
      .replace(/\[jabatan_petugas_logistik\]/g, petugasJabatan)
      .replace(/\[instansi_petugas_logistik\]/g, petugasInstansi)
      .replace(/\[nama_petugaslogistik\]/g, petugasNama)
      .replace(/\[Nama_petugaslogistik\]/g, petugasNama)
      .replace(/\[NIP_petugaslogistik\]/g, petugasNip)
      .replace(/\[NIP_ petugaslogistik\]/g, petugasNip)
      .replace(/\[Jabatan_petugaslogistik\]/g, petugasJabatan)
      .replace(/\[Jabatan_ petugaslogistik\]/g, petugasJabatan)
      .replace(/\[Instansi_petugaslogistik\]/g, petugasInstansi)
      .replace(/\[Instansi_ petugaslogistik\]/g, petugasInstansi)
      .replace(/\[No_SK dan Tanggal_SK\]/g, `${petugasNamaSk} Nomor ${petugasNoSk} Tanggal ${petugasTanggalSk} tentang ${petugasTentangSk}`)
      .replace(/\[no_sk_petugas\]/g, petugasNoSk)
      .replace(/\[tanggal_sk_petugas\]/g, petugasTanggalSk)
      .replace(/\[tentang_sk_petugas\]/g, petugasTentangSk)
      .replace(/\[nama_sk_petugas\]/g, petugasNamaSk)
      .replace(/padding-left:\s*106px/gi, "padding-left:60px; white-space:nowrap")
      .replace(/padding-left:\s*130px/gi, "padding-left:90px; white-space:nowrap");
    
    const hasImages = docType === 'BA' && tx.images && tx.images.length > 0;
    
    if (forPdf) {
      if (hasImages) {
        const imageCount = tx.images?.length || 0;
        let imgHeightStyle = "max-height: 110mm;";
        if (imageCount >= 3) {
          imgHeightStyle = "max-height: 60mm;";
        } else if (imageCount === 2) {
          imgHeightStyle = "max-height: 80mm;";
        }

        const dateDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dateObjRaw = new Date(tx.tanggal);
        const dayName = !isNaN(dateObjRaw.getTime()) ? dateDays[dateObjRaw.getDay()] : "";
        const formattedDateLabel = dayName ? `${dayName}, ${formatIndoDate(tx.tanggal)}` : formatIndoDate(tx.tanggal);

        const documentationHtml = `
          <div class="html2pdf__page-break" style="page-break-before: always; text-align: center; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; box-sizing: border-box; width: 170mm; min-height: auto; margin: 0 auto; padding-top: 0px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; color: #000; letter-spacing: 1px; text-align: center; width: 100%;">DOKUMENTASI</h2>
            <p style="font-size: 14px; margin-bottom: 6px; color: #333; line-height: 1.4; text-align: center; width: 100%;">
              Penyaluran Bantuan Sosial <strong>${tx.penerima}</strong>, di <strong>${tx.alamat || '-'}</strong>
            </p>
            <p style="font-size: 13px; margin-bottom: 30px; color: #555; text-align: center; width: 100%;">
              ${formattedDateLabel}
            </p>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; width: 100%; max-width: 100%;">
              ${(tx.images || []).map(img => `
                <div style="border: 1px solid #ddd; padding: 10px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 8px; box-sizing: border-box; display: inline-block;">
                  <img src="${img}" style="${imgHeightStyle} max-width: 100%; object-fit: contain; border-radius: 4px;" />
                </div>
              `).join('')}
            </div>
          </div>
        `;

        return `
          <div style="background: white; margin: 0; padding: 0;">
            <div style="width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; box-sizing: border-box; background: white; margin: 0; padding: 0;">
              <div style="width: 170mm; min-height: 240mm; font-family: 'Arial', sans-serif;">
                ${html}
              </div>
            </div>
            <div style="width: 210mm; height: 297mm; display: flex; align-items: flex-start; justify-content: center; box-sizing: border-box; background: white; margin: 0; padding: 25mm 0 0 0;">
              ${documentationHtml}
            </div>
          </div>
        `;
      } else {
        return `<div style="width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; background: white; margin: 0; padding: 0;"><div style="width: 170mm; min-height: 240mm; font-family: 'Arial', sans-serif;">${html}</div></div>`;
      }
    } else {
      if (hasImages) {
        const imageCount = tx.images?.length || 0;
        let imgHeightStyle = "max-height: 110mm;";
        if (imageCount >= 3) {
          imgHeightStyle = "max-height: 60mm;";
        } else if (imageCount === 2) {
          imgHeightStyle = "max-height: 80mm;";
        }

        const dateDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dateObjRaw = new Date(tx.tanggal);
        const dayName = !isNaN(dateObjRaw.getTime()) ? dateDays[dateObjRaw.getDay()] : "";
        const formattedDateLabel = dayName ? `${dayName}, ${formatIndoDate(tx.tanggal)}` : formatIndoDate(tx.tanggal);

        const documentationHtml = `
          <div class="html2pdf__page-break" style="page-break-before: always; margin-top: 50px; border-top: 2px dashed #e2e8f0; padding-top: 50px; text-align: center; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; box-sizing: border-box; width: 100%;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; color: #000; letter-spacing: 1px; text-align: center; width: 100%;">DOKUMENTASI</h2>
            <p style="font-size: 14px; margin-bottom: 6px; color: #333; line-height: 1.4; text-align: center; width: 100%;">
              Penyaluran Bantuan Sosial <strong>${tx.penerima}</strong>, di <strong>${tx.alamat || '-'}</strong>
            </p>
            <p style="font-size: 13px; margin-bottom: 30px; color: #555; text-align: center; width: 100%;">
              ${formattedDateLabel}
            </p>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; width: 100%; max-width: 100%;">
              ${(tx.images || []).map(img => `
                <div style="border: 1px solid #ddd; padding: 10px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 8px; box-sizing: border-box; display: inline-block;">
                  <img src="${img}" style="${imgHeightStyle} max-width: 100%; object-fit: contain; border-radius: 4px;" />
                </div>
              `).join('')}
            </div>
          </div>
        `;
        return `<div>${html}</div>${documentationHtml}`;
      }
      return html;
    }
  };

  const handleDownloadPDF = () => {
    if (!printAreaRef.current || !selectedTx) return;
    setIsGenerating(true);
    const container = document.createElement('div');
    container.innerHTML = renderBA(selectedTx, true);
    document.body.appendChild(container);
    const opt = { margin: 0, filename: `BAST_${selectedTx.penerima.replace(/\s+/g, '_')}.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 3, useCORS: true, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
      setIsGenerating(false);
    });
  };

  const generateDocumentationSheetBlob = async (tx: OutboundTransaction): Promise<Blob | null> => {
    if (!tx.images || tx.images.length === 0) return null;

    const dateDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dateObjRaw = new Date(tx.tanggal);
    const dayName = !isNaN(dateObjRaw.getTime()) ? dateDays[dateObjRaw.getDay()] : "";
    const formattedDateLabel = dayName ? `${dayName}, ${formatIndoDate(tx.tanggal)}` : formatIndoDate(tx.tanggal);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.minHeight = '1123px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '50px 45px';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = "'Urbanist', Arial, Helvetica, sans-serif";
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'flex-start';
    container.style.color = '#000000';

    const imageCount = tx.images.length;
    let imgMaxHeight = '420px';
    if (imageCount === 1) {
      imgMaxHeight = '650px';
    } else if (imageCount === 2) {
      imgMaxHeight = '420px';
    } else if (imageCount >= 3) {
      imgMaxHeight = '300px';
    }

    container.innerHTML = `
      <div style="width: 100%; text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: 800; margin: 0 0 14px 0; text-transform: uppercase; color: #000000; letter-spacing: 1.5px; font-family: 'Inter', Arial, sans-serif;">
          DOKUMENTASI
        </h2>
        <p style="font-size: 15px; margin: 0 0 6px 0; color: #1e293b; line-height: 1.5; font-family: 'Inter', Arial, sans-serif;">
          Penyaluran Bantuan Sosial <strong style="color: #000000; font-weight: 700;">${tx.penerima}</strong>, di <strong style="color: #000000; font-weight: 700;">${tx.alamat || '-'}</strong>
        </p>
        <p style="font-size: 13.5px; margin: 0; color: #475569; font-family: 'Inter', Arial, sans-serif;">
          ${formattedDateLabel}
        </p>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 18px; width: 100%; box-sizing: border-box;">
        ${tx.images.map((imgSrc, idx) => `
          <div style="border: 1px solid #e2e8f0; padding: 10px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border-radius: 12px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: 100%; max-width: 620px;">
            <img src="${imgSrc}" style="max-height: ${imgMaxHeight}; width: auto; max-width: 100%; object-fit: contain; border-radius: 8px; display: block;" crossOrigin="anonymous" alt="Dokumentasi ${idx + 1}" />
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(container);

    try {
      const imgElements = Array.from(container.querySelectorAll('img'));
      await Promise.all(imgElements.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
      await new Promise(r => setTimeout(r, 60));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794
      });

      return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    } catch (err) {
      console.error("Gagal generateDocumentationSheetBlob:", err);
      return null;
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  };

  const handleDownloadMonthlyBAZip = async () => {
    if (filteredOutbound.length === 0) {
      const selName = filterMonth !== 'All' ? MONTHS[parseInt(filterMonth)] : '';
      alert(`Tidak ada data transaksi pada bulan ${selName}.`);
      return;
    }

    const selName = filterMonth !== 'All' ? MONTHS[parseInt(filterMonth)] : 'Semua';
    try {
      setZipProgress({
        title: `Download ZIP Berita Acara (Bulan ${selName})`,
        label: 'Menyiapkan berkas dokumen...',
        current: 0,
        total: filteredOutbound.length
      });

      const zip = new JSZip();
      const yearStr = filteredOutbound[0]?.tanggal 
        ? new Date(filteredOutbound[0].tanggal).getFullYear().toString() 
        : new Date().getFullYear().toString();

      for (let i = 0; i < filteredOutbound.length; i++) {
        const tx = filteredOutbound[i];
        setZipProgress({
          title: `Download ZIP Berita Acara (Bulan ${selName})`,
          label: `Membuat PDF BA: ${tx.penerima} (${i + 1}/${filteredOutbound.length})...`,
          current: i + 1,
          total: filteredOutbound.length
        });

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm';
        container.style.backgroundColor = '#ffffff';
        container.innerHTML = renderBA(tx, true);
        document.body.appendChild(container);

        const imgElements = Array.from(container.querySelectorAll('img'));
        await Promise.all(imgElements.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(res => { img.onload = res; img.onerror = res; });
        }));
        await new Promise(res => setTimeout(res, 60));

        const sanitizedPenerima = (tx.penerima || 'Penerima').replace(/[/\\?%*:|"<>]/g, '_').trim();
        const sanitizedTanggal = (tx.tanggal || '').replace(/[/\\?%*:|"<>]/g, '-').trim();

        const opt = { 
          margin: 0, 
          filename: `BAST_${sanitizedPenerima}.pdf`, 
          image: { type: 'jpeg', quality: 0.98 }, 
          html2canvas: { scale: 2, useCORS: true, letterRendering: true }, 
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
        };

        const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }

        const pdfFilename = `${String(i + 1).padStart(2, '0')}_BAST_${sanitizedPenerima}_${sanitizedTanggal}.pdf`;
        zip.file(pdfFilename, pdfBlob);
      }

      setZipProgress({
        title: `Download ZIP Berita Acara (Bulan ${selName})`,
        label: 'Mengompresi seluruh berkas ke dalam file ZIP...',
        current: filteredOutbound.length,
        total: filteredOutbound.length
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `BA_Bulanan_${selName}_${yearStr}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Gagal mengunduh ZIP Berita Acara:", err);
      alert("Terjadi kendala saat menyusun file ZIP Berita Acara. Silakan coba kembali.");
    } finally {
      setZipProgress(null);
    }
  };

  const handleDownloadMonthlyPhotosZip = async () => {
    const selName = filterMonth !== 'All' ? MONTHS[parseInt(filterMonth)] : 'Semua';
    const txsWithImages = filteredOutbound.filter(tx => tx.images && tx.images.length > 0);
    if (txsWithImages.length === 0) {
      alert(`Tidak ada foto dokumentasi pada transaksi di bulan ${selName}.`);
      return;
    }

    try {
      setZipProgress({
        title: `Download ZIP Foto Dokumentasi (Bulan ${selName})`,
        label: 'Mengumpulkan foto transaksi...',
        current: 0,
        total: txsWithImages.length
      });

      const zip = new JSZip();
      const yearStr = filteredOutbound[0]?.tanggal 
        ? new Date(filteredOutbound[0].tanggal).getFullYear().toString() 
        : new Date().getFullYear().toString();

      for (let i = 0; i < txsWithImages.length; i++) {
        const tx = txsWithImages[i];
        setZipProgress({
          title: `Download ZIP Foto Dokumentasi (Bulan ${selName})`,
          label: `Mengemas foto: ${tx.penerima} (${i + 1}/${txsWithImages.length})...`,
          current: i + 1,
          total: txsWithImages.length
        });

        const sanitizedPenerima = (tx.penerima || 'Penerima').replace(/[/\\?%*:|"<>]/g, '_').trim();
        const sanitizedTanggal = (tx.tanggal || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
        const folderName = `${String(i + 1).padStart(2, '0')}_${sanitizedPenerima}_${sanitizedTanggal}`;
        const folder = zip.folder(folderName);

        // 1. Tambahkan foto-foto asli
        if (tx.images && tx.images.length > 0) {
          for (let pIdx = 0; pIdx < tx.images.length; pIdx++) {
            const imgSrc = tx.images[pIdx];
            if (imgSrc.startsWith('data:')) {
              const base64Data = imgSrc.includes(',') ? imgSrc.split(',')[1] : imgSrc;
              folder?.file(`Foto_${pIdx + 1}.jpg`, base64Data, { base64: true });
            } else if (imgSrc.startsWith('http')) {
              try {
                const res = await fetch(imgSrc);
                const blob = await res.blob();
                folder?.file(`Foto_${pIdx + 1}.jpg`, blob);
              } catch (e) {
                console.error("Gagal mengunduh foto:", imgSrc, e);
              }
            }
          }
        }

        // 2. Tambahkan lembar A4 Dokumentasi resmi
        try {
          const sheetBlob = await generateDocumentationSheetBlob(tx);
          if (sheetBlob) {
            folder?.file(`Lembar_Dokumentasi_${sanitizedPenerima}.jpg`, sheetBlob);
          }
        } catch (e) {
          console.warn("Gagal membuat lembar dokumentasi:", tx.penerima, e);
        }
      }

      setZipProgress({
        title: `Download ZIP Foto Dokumentasi (Bulan ${selName})`,
        label: 'Mengompresi foto ke dalam file ZIP...',
        current: txsWithImages.length,
        total: txsWithImages.length
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Foto_Dokumentasi_${selName}_${yearStr}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Gagal mengunduh ZIP Foto Dokumentasi:", err);
      alert("Terjadi kendala saat menyusun file ZIP foto. Silakan coba kembali.");
    } finally {
      setZipProgress(null);
    }
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
          <button onClick={() => setSelectedTx(null)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-ios-blue-light dark:hover:text-ios-blue-dark font-bold text-xs uppercase tracking-wide transition-colors"><ArrowLeft size={18}/> KEMBALI</button>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-ios font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm cursor-pointer"><Printer size={16}/> Cetak Langsung</button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex-2 sm:flex-none bg-ios-blue-light dark:bg-ios-blue-dark text-white px-6 py-2.5 rounded-ios font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">{isGenerating ? 'PROSES...' : 'UNDUH PDF A4'}</button>
            {selectedTx.images && selectedTx.images.length > 0 && (
              <button 
                onClick={() => handleDownloadDocumentationJPG(selectedTx)} 
                disabled={isDownloadingDoc}
                className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-4 py-2.5 rounded-ios font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloadingDoc && downloadingTxId === selectedTx.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> PROSES JPG...
                  </>
                ) : (
                  <>
                    <Download size={16}/> Unduh Dokumentasi ({selectedTx.images.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-start sm:justify-center overflow-x-auto p-4 scrollbar-hide bg-slate-200/50 dark:bg-white/5 rounded-ios-lg border border-slate-300 dark:border-white/5">
          <div ref={printAreaRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl shrink-0 flex flex-col justify-start">
            <div className="w-[170mm] mx-auto text-black">
              <div dangerouslySetInnerHTML={{ __html: renderBA(selectedTx) }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedMonthName = filterMonth !== 'All' ? MONTHS[parseInt(filterMonth)] : '';
  const totalPhotosInMonth = filteredOutbound.reduce((acc, tx) => acc + (tx.images?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Berita Acara & SPPB</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Buat dokumen serah terima resmi atau surat perintah pengeluaran barang.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => handleOpenEditor('BA')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-ios font-bold text-[10px] uppercase tracking-wide shadow-sm active:scale-95 transition-all"><Settings size={16}/> Template BA</button>
          <button onClick={() => handleOpenEditor('SPPB')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-ios font-bold text-[10px] uppercase tracking-wide shadow-sm active:scale-95 transition-all"><Settings size={16}/> Template SPPB</button>
        </div>
      </div>

      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-ios-lg shadow-sm border border-white/80 dark:border-white/10 overflow-hidden theme-transition w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Daftar Berita Acara & SPPB
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Filter Bulan */}
            <div className="flex-1 sm:flex-initial min-w-[160px]">
              <select
                className="w-full text-xs font-bold bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-ios px-3 py-2 outline-none focus:ring-2 focus:ring-ios-blue-light/10 text-slate-800 dark:text-slate-200"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="All">Semua Bulan</option>
                {MONTHS.map((label, idx) => (
                  <option key={idx} value={idx.toString()}>{label}</option>
                ))}
              </select>
            </div>
            {filterMonth !== 'All' && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadMonthlyBAZip}
                  disabled={zipProgress !== null || filteredOutbound.length === 0}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-ios font-bold text-[10px] uppercase flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Download semua Berita Acara bulan ini (ZIP)"
                >
                  <FileText size={12} /> Download BA
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMonthlyPhotosZip}
                  disabled={zipProgress !== null || totalPhotosInMonth === 0}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white transition-all rounded-ios font-bold text-[10px] uppercase flex items-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Download semua Foto bulan ini (ZIP)"
                >
                  <ImageIcon size={12} /> Download Foto ({totalPhotosInMonth})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMonth('All')}
                  className="px-3 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-100 transition-all rounded-ios font-bold text-[10px] uppercase flex items-center gap-1.5 border border-red-100 dark:border-red-900/30 cursor-pointer"
                  title="Reset Filter"
                >
                  <X size={12} /> Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Banner Aksi Download Bulanan Berupa ZIP ketika Bulan Dipilih */}
        {filterMonth !== 'All' && (
          <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-blue-50/95 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <Archive size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Download Bulanan: Bulan {selectedMonthName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    {filteredOutbound.length} Dokumen
                  </span>
                  {totalPhotosInMonth > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                      {totalPhotosInMonth} Foto Dokumentasi
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Arsip otomatis Berita Acara dan Foto Dokumentasi bulan {selectedMonthName} dalam format ZIP siap unduh.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadMonthlyBAZip}
                disabled={zipProgress !== null || filteredOutbound.length === 0}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-ios flex items-center justify-center gap-2 shadow-sm shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                title={`Unduh seluruh Berita Acara bulan ${selectedMonthName} (ZIP)`}
              >
                <FileText size={15} />
                <span>Download BA (ZIP)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMonthlyPhotosZip}
                disabled={zipProgress !== null || totalPhotosInMonth === 0}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-ios flex items-center justify-center gap-2 shadow-sm shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                title={totalPhotosInMonth === 0 ? "Tidak ada foto di bulan ini" : `Unduh ${totalPhotosInMonth} foto dokumentasi (ZIP)`}
              >
                <ImageIcon size={15} />
                <span>Download Foto (ZIP)</span>
                <span className="px-1.5 py-0.5 bg-black/20 text-white rounded-full text-[10px] font-bold">
                  {totalPhotosInMonth}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-full">
            <thead className="bg-slate-50/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[10px] border-b dark:border-white/5 uppercase tracking-wide">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 w-12 text-center">No.</th>
                <th className="px-4 sm:px-6 py-3.5 cursor-pointer hover:text-slate-700 transition-colors w-[18%]" onClick={() => handleSort('tanggal')}><div className="flex items-center gap-2">Tanggal {renderSortIcon('tanggal')}</div></th>
                <th className="px-4 sm:px-6 py-3.5 cursor-pointer hover:text-slate-700 transition-colors w-[30%]" onClick={() => handleSort('penerima')}><div className="flex items-center gap-2">Nama Penerima {renderSortIcon('penerima')}</div></th>
                <th className="px-4 sm:px-6 py-3.5 cursor-pointer hover:text-slate-700 transition-colors w-[27%]" onClick={() => handleSort('alamat')}><div className="flex items-center gap-2">Tujuan {renderSortIcon('alamat')}</div></th>
                <th className="px-4 sm:px-6 py-3.5 text-center w-[25%]">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {sortedOutbound.map((o, idx) => (
                <tr key={o.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-300 dark:text-slate-700">{idx + 1}</td>
                  <td className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatIndoDate(o.tanggal)}</td>
                  <td className="px-4 sm:px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{o.penerima}</td>
                  <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{o.alamat || '-'}</td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setDocType('BA'); setSelectedTx(o); }} className="text-ios-blue-light dark:text-ios-blue-dark font-bold bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 px-3 py-1.5 rounded-ios text-[10px] uppercase hover:bg-ios-blue-light dark:hover:bg-ios-blue-dark hover:text-white transition-all cursor-pointer">BA</button>
                      <button onClick={() => { setDocType('SPPB'); setSelectedTx(o); }} className="text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-ios text-[10px] uppercase hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">SPPB</button>
                      {o.images && o.images.length > 0 ? (
                        <button 
                          onClick={() => handleDownloadDocumentationJPG(o)} 
                          disabled={isDownloadingDoc}
                          title="Unduh Dokumentasi (JPG)"
                          className="text-amber-500 font-bold bg-amber-500/10 px-3 py-1.5 rounded-ios text-[10px] uppercase hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isDownloadingDoc && downloadingTxId === o.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              PROSES...
                            </>
                          ) : (
                            <>
                              <Download size={12} />
                              FOTO ({o.images.length})
                            </>
                          )}
                        </button>
                      ) : (
                        <button 
                          disabled
                          title="Tidak Ada Dokumentasi"
                          className="text-slate-400 dark:text-slate-600 font-bold bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-ios text-[10px] uppercase opacity-50 cursor-not-allowed flex items-center gap-1"
                        >
                          <Download size={12} />
                          FOTO (0)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedOutbound.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    <p className="font-semibold text-sm">Tidak ada transaksi ditemukan pada filter bulan ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Progress ZIP */}
      {zipProgress && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse shrink-0">
                <Archive size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {zipProgress.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {zipProgress.label}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Progress Pengemasan</span>
                <span>{zipProgress.current} / {zipProgress.total}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${zipProgress.total > 0 ? (zipProgress.current / zipProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 italic">
              <Loader2 size={13} className="animate-spin text-blue-500 shrink-0" />
              <span>Harap tunggu, proses pembuatan file ZIP sedang berlangsung...</span>
            </div>
          </div>
        </div>
      )}

      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[200] flex flex-col p-4 animate-in fade-in duration-300">
          <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark w-full max-w-[1400px] mx-auto rounded-ios-lg shadow-2xl flex flex-col overflow-hidden h-full border dark:border-white/5">
            <div className="px-6 py-4 border-b dark:border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="font-bold uppercase text-slate-800 dark:text-slate-100">Editor Template {editingDocType}</h3>
                <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-ios gap-1">
                  <button 
                    onClick={() => { setEditingDocType('BA'); setCurrentTemplate(settings.baTemplate || defaultBA); }}
                    className={`px-4 py-1.5 text-[10px] font-bold rounded-ios transition-all ${editingDocType === 'BA' ? 'bg-white dark:bg-ios-secondary-dark shadow-sm text-ios-blue-light dark:text-ios-blue-dark' : 'text-slate-500'}`}
                  >
                    Berita Acara
                  </button>
                  <button 
                    onClick={() => { setEditingDocType('SPPB'); setCurrentTemplate(settings.sppbTemplate || defaultSPPB); }}
                    className={`px-4 py-1.5 text-[10px] font-bold rounded-ios transition-all ${editingDocType === 'SPPB' ? 'bg-white dark:bg-ios-secondary-dark shadow-sm text-ios-blue-light dark:text-ios-blue-dark' : 'text-slate-500'}`}
                  >
                    SPPB
                  </button>
                </div>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"><X size={24}/></button>
            </div>
            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
               <div className="w-full md:w-64 bg-slate-50 dark:bg-white/5 border-r dark:border-white/5 p-6 space-y-4 overflow-y-auto shrink-0 scrollbar-hide">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center pb-2 border-b dark:border-white/5">Placeholder Data:</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[8px] font-black text-ios-blue-light dark:text-ios-blue-dark uppercase tracking-widest mb-1.5">🔑 Dokumen Dasar</p>
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                        {['logo_app', 'penerima', 'Nama_penerima', 'alamat', 'Alamat_penerima', 'tanggal_panjang', 'tanggal', 'hari_tanggal_tahun', 'id_transaksi', 'table barang', 'tabel_barang', 'tahun'].map(tag => (
                          <button key={tag} onClick={() => insertPlaceholder(tag)} className="text-left px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-ios text-[8px] font-bold hover:border-ios-blue-light dark:text-slate-300 transition-all uppercase truncate">[{tag}]</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] font-black text-ios-blue-light dark:text-ios-blue-dark uppercase tracking-widest mb-1.5">👔 KABID SOSIAL</p>
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                        {['nama_kabid', 'NIP_kabid', 'Jabatan_kabid', 'Instansi_kabid', 'nama_pihak_kesatu', 'nip_pihak_kesatu', 'jabatan_pihak_kesatu', 'instansi_pihak_kesatu'].map(tag => (
                          <button key={tag} onClick={() => insertPlaceholder(tag)} className="text-left px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-ios text-[8px] font-bold hover:border-ios-blue-light dark:text-slate-300 transition-all uppercase truncate">[{tag}]</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">📦 PETUGAS LOGISTIK</p>
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                        {['nama_petugas_logistik', 'nip_petugas_logistik', 'jabatan_petugas_logistik', 'instansi_petugas_logistik', 'nama_petugaslogistik', 'NIP_petugaslogistik', 'NIP_ petugaslogistik', 'Jabatan_ petugaslogistik', 'Instansi_ petugaslogistik', 'No_SK dan Tanggal_SK', 'nama_sk_petugas', 'no_sk_petugas', 'tanggal_sk_petugas', 'tentang_sk_petugas'].map(tag => (
                          <button key={tag} onClick={() => insertPlaceholder(tag)} className="text-left px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-ios text-[8px] font-bold hover:border-ios-blue-light dark:text-slate-300 transition-all uppercase truncate font-mono">[{tag}]</button>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>
               <div className="flex-1 bg-slate-100 dark:bg-black overflow-auto p-4 sm:p-8 scrollbar-hide flex justify-center">
                  <div className="max-w-[210mm] w-full">
                    <div className="bg-white dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/5 p-2 flex flex-wrap gap-2 justify-center mb-6 rounded-ios shadow-sm sticky top-0 z-10">
                      <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-ios text-slate-600 dark:text-slate-300"><Bold size={18}/></button>
                      <button onClick={() => handleFormat('justifyCenter')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-ios text-slate-600 dark:text-slate-300"><AlignCenter size={18}/></button>
                    </div>
                    <div ref={editorRef} contentEditable suppressContentEditableWarning className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl outline-none shrink-0 text-black" style={{ fontFamily: 'Arial, sans-serif' }} dangerouslySetInnerHTML={{ __html: currentTemplate }} onInput={(e) => setCurrentTemplate(e.currentTarget.innerHTML)}/>
                  </div>
               </div>
            </div>
            <div className="p-6 border-t dark:border-white/5 flex justify-between items-center bg-ios-secondary-light dark:bg-ios-secondary-dark shrink-0">
              <button 
                onClick={() => {
                  if (window.confirm("Apakah Anda yakin ingin menyetel ulang template ini ke standar default? Semua penyesuaian kustom Anda untuk tipe ini akan dikembalikan ke pengaturan awal.")) {
                    const defaultTmp = editingDocType === 'BA' ? defaultBA : defaultSPPB;
                    setCurrentTemplate(defaultTmp);
                    if (editorRef.current) {
                      editorRef.current.innerHTML = defaultTmp;
                    }
                  }
                }}
                className="px-4 py-2 border border-rose-500/30 dark:border-rose-500/20 text-rose-500 hover:bg-rose-500/10 font-bold rounded-ios uppercase text-[9px] tracking-wider transition-colors"
              >
                Reset Default
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsEditorOpen(false)} className="px-6 py-2 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Batal</button>
                <button 
                  onClick={() => { 
                    if (editingDocType === 'BA') {
                      setSettings({ ...settings, baTemplate: currentTemplate });
                    } else {
                      setSettings({ ...settings, sppbTemplate: currentTemplate });
                    }
                    setIsEditorOpen(false); 
                  }} 
                  className="bg-ios-blue-light dark:bg-ios-blue-dark text-white px-10 py-2 rounded-ios font-bold text-[10px] uppercase tracking-wide"
                >
                  Simpan Template {editingDocType}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CetakBeritaAcara;
