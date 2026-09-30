import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  DoorOpen, 
  Sparkles,
  Camera,
  CheckCircle2,
  Package
} from 'lucide-react';

interface QrPintuGudangModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  warehouseName?: string;
}

export const QrPintuGudangModal: React.FC<QrPintuGudangModalProps> = ({
  isOpen,
  onClose,
  appName = 'SITAMPAN',
  warehouseName = 'Gudang Logistik BPBD'
}) => {
  const DEFAULT_VERCEL_URL = 'https://sitampan-app.vercel.app/#/ambil-barang';
  const [selectedUrlType, setSelectedUrlType] = useState<'vercel' | 'current'>('vercel');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const currentHostUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#/ambil-barang`
    : DEFAULT_VERCEL_URL;

  const targetUrl = selectedUrlType === 'vercel' ? DEFAULT_VERCEL_URL : currentHostUrl;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(targetUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then((url: string) => setQrDataUrl(url))
        .catch((err: any) => console.error('Gagal generate QR Code:', err));
    }
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-Pintu-Gudang-${appName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <DoorOpen size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                Barcode / QR Code Pintu Gudang
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-500/20">
                  Scan Ambil Barang
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tempelkan QR Code ini di pintu gudang untuk pengisian formulir instan.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          
          {/* URL Mode Selector */}
          <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Pilihan URL Tujuan Barcode:</span>
              <div className="flex bg-slate-200/70 dark:bg-white/10 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedUrlType('vercel')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedUrlType === 'vercel'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Vercel Live App
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUrlType('current')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedUrlType === 'current'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Domain Saat Ini
                </button>
              </div>
            </div>

            {/* Target URL Display with Copy */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="flex-1 font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate select-all px-2">
                {targetUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span className="text-emerald-500">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg transition-all"
                title="Coba Buka di Tab Baru"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Printable Poster Preview Area */}
          <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900/40 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
            
            {/* Poster Header */}
            <div className="mb-4 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                <DoorOpen size={12} /> PINTU GUDANG LOGISTIK
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {appName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                SCAN BARCODE UNTUK PENGAMBILAN LOGISTIK KEBENCANAAN
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-indigo-600/20 my-2">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Pintu Gudang" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400">
                  Membuat QR Code...
                </div>
              )}
            </div>

            {/* Step-by-Step Instructions */}
            <div className="mt-4 w-full max-w-md grid grid-cols-3 gap-2 text-left">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Buka Kamera HP</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Arahkan lensa ke QR Code</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Isi Formulir</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Pilih barang & jumlahnya</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">3</div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Foto Penyaluran</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Otomatis masuk dokumentasi</p>
              </div>
            </div>

            {/* Direct URL note */}
            <p className="mt-4 text-[10px] text-slate-400 font-mono break-all">
              Link Langsung: {targetUrl}
            </p>
          </div>

          {/* Tips for Best Results */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
            <Sparkles size={18} className="shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold">Tips Penempelan di Pintu Gudang:</p>
              <p className="text-[11px] mt-0.5 leading-relaxed text-amber-700 dark:text-amber-400">
                Cetak poster dalam ukuran kertas <b>A4</b> atau stiker tebal, lalu tempelkan di dekat gagang pintu gudang pada ketinggian pandangan mata (140-160 cm) agar petugas dapat memindai dengan cepat dari HP saat mengambil barang.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            Tutup
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Download size={15} />
              <span>Unduh Gambar PNG</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Cetak Poster Pintu Gudang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print-Only Styles and Layout for Clean High-Resolution Poster Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-poster, #printable-qr-poster * {
            visibility: visible;
          }
          #printable-qr-poster {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white !important;
            color: black !important;
            padding: 20mm;
            z-index: 999999;
          }
        }
      `}</style>

      {/* Print Target Element */}
      <div id="printable-qr-poster" className="hidden">
        <div style={{ textAlign: 'center', maxWidth: '170mm', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '12px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {appName}
            </h1>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', fontWeight: 'bold' }}>
              SISTEM INFORMASI TATA KELOLA LOGISTIK KEBENCANAAN
            </p>
          </div>

          <div style={{ margin: '15px 0' }}>
            <span style={{ 
              display: 'inline-block',
              background: '#4338ca', 
              color: 'white', 
              padding: '6px 18px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              PINTU GUDANG LOGISTIK
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '12px 0 6px 0', color: '#0f172a' }}>
              SCAN UNTUK PENGAMBILAN LOGISTIK KEBENCANAAN
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Setiap kali mengambil barang logistik keluar dari gudang, harap scan barcode di bawah ini menggunakan kamera HP Anda.
            </p>
          </div>

          {qrDataUrl && (
            <div style={{ margin: '20px auto', display: 'inline-block', padding: '16px', border: '3px solid #0f172a', borderRadius: '16px' }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
            </div>
          )}

          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', margin: '10px 0' }}>
            {targetUrl}
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '12px', 
            marginTop: '25px', 
            textAlign: 'left',
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '20px'
          }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '12px', color: '#1e293b' }}>1. Scan Barcode</strong>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0' }}>
                Buka kamera smartphone dan arahkan ke QR Code di atas.
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '12px', color: '#1e293b' }}>2. Isi Formulir</strong>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0' }}>
                Tulis nama penerima & pilih barang beserta jumlah yang diambil.
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '12px', color: '#1e293b' }}>3. Foto Penyaluran</strong>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0' }}>
                Ambil foto penyaluran barang, foto otomatis masuk kolom dokumentasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
