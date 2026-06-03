
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
  Download,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
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
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:106px; color:#000; text-align:left;">
            <span style="visibility:hidden; display:inline-block; user-select:none;">Blora, [tanggal]</span><br>
            PIHAK KEDUA<br><br><br><br><br>
            <b>[Nama_penerima]</b>
          </td>
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:130px; color:#000; text-align:left;">
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
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:106px; color:#000; text-align:left;">
            <span style="visibility:hidden; display:inline-block; user-select:none;">Blora, [tanggal]</span><br>
            Petugas Logistik<br><br><br><br><br>
            <b>[Nama_petugaslogistik]</b><br>
            [NIP_petugaslogistik]
          </td>
          <td align="left" width="50%" style="vertical-align:top; padding-bottom:40px; padding-left:130px; color:#000; text-align:left;">
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
      .replace(/\[nama_sk_petugas\]/g, petugasNamaSk);
    
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
            <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-ios-secondary-light dark:bg-ios-secondary-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-ios font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm"><Printer size={16}/> Cetak Langsung</button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex-2 sm:flex-none bg-ios-blue-light dark:bg-ios-blue-dark text-white px-6 py-2.5 rounded-ios font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">{isGenerating ? 'PROSES...' : 'UNDUH PDF A4'}</button>
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

      <div className="bg-ios-secondary-light dark:bg-ios-secondary-dark rounded-ios-lg shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden theme-transition">
        <div className="px-6 py-4 bg-ios-secondary-light dark:bg-ios-secondary-dark border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Daftar Berita Acara & SPPB
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filter Bulan */}
            <div className="flex-1 sm:flex-initial min-w-[160px]">
              <select
                className="w-full text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-ios px-3 py-2 outline-none focus:ring-2 focus:ring-ios-blue-light/10 text-slate-800 dark:text-slate-200"
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
              <button
                type="button"
                onClick={() => setFilterMonth('All')}
                className="px-3 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-100 transition-all rounded-ios font-bold text-[10px] uppercase flex items-center gap-1.5 border border-red-100 dark:border-red-900/30"
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[10px] border-b dark:border-white/5 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('tanggal')}><div className="flex items-center gap-2">Tanggal {renderSortIcon('tanggal')}</div></th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('penerima')}><div className="flex items-center gap-2">Nama Penerima {renderSortIcon('penerima')}</div></th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('alamat')}><div className="flex items-center gap-2">Tujuan {renderSortIcon('alamat')}</div></th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {sortedOutbound.map((o, idx) => (
                <tr key={o.id} className="hover:bg-ios-blue-light/5 dark:hover:bg-ios-blue-dark/5 transition-colors group">
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-300 dark:text-slate-700">{idx + 1}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{formatIndoDate(o.tanggal)}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 italic">{o.penerima}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{o.alamat || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setDocType('BA'); setSelectedTx(o); }} className="text-ios-blue-light dark:text-ios-blue-dark font-bold bg-ios-blue-light/10 dark:bg-ios-blue-dark/10 px-3 py-1.5 rounded-ios text-[10px] uppercase hover:bg-ios-blue-light dark:hover:bg-ios-blue-dark hover:text-white transition-all">BA</button>
                      <button onClick={() => { setDocType('SPPB'); setSelectedTx(o); }} className="text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-ios text-[10px] uppercase hover:bg-emerald-500 hover:text-white transition-all">SPPB</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
