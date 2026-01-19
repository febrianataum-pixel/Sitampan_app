
export interface Product {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  harga: number;
}

export interface InboundEntry {
  id: string;
  productId: string;
  jumlah: number;
  bulan: string;
  tahun: number;
  tanggal: string;
}

export interface OutboundItem {
  id: string;
  productId: string;
  jumlah: number;
}

export interface OutboundTransaction {
  id: string;
  penerima: string;
  tanggal: string;
  alamat: string;
  items: OutboundItem[];
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  logo: string;
  themeColor: string;
  bgType: 'color' | 'gradient' | 'image';
  bgColor: string;
  adminName: string;
  warehouseName: string;
  baTemplate?: string;
  // Firebase Sync Config
  fbApiKey?: string;
  fbProjectId?: string;
  fbAppId?: string;
  syncEnabled?: boolean;
}

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatIndoDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};
