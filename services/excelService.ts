
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Menggunakan header: 1 untuk mendapatkan array of arrays (index-based)
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
