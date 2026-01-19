
export const exportToCSV = (data: any[], fileName: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];
  
  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target?.result as string;
        if (text.startsWith('\ufeff')) text = text.substring(1);

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length === 0) {
          resolve([]);
          return;
        }

        const firstLineCells = lines[0].split(',').map(c => c.trim().replace(/"/g, ''));
        
        // Deteksi Header lebih ketat: Harus ada kata KODE dan NAMA di baris pertama
        const hasHeader = firstLineCells.some(cell => /KODE|CODE/i.test(cell)) && 
                          firstLineCells.some(cell => /NAMA|NAME|BARANG/i.test(cell));

        if (hasHeader) {
          const headers = firstLineCells.map(h => h.toUpperCase().replace(/\s+/g, '_'));
          const result = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, i) => {
              if (header) obj[header] = values[i];
            });
            return obj;
          });
          resolve(result);
        } else {
          // Jika TIDAK ADA Header, gunakan pemetaan kolom index (COLUMN_0, COLUMN_1, dst)
          const result = lines.map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            // Kita petakan sampai 10 kolom sebagai cadangan
            for (let i = 0; i < 10; i++) {
              obj[`COLUMN_${i}`] = values[i] || '';
            }
            return obj;
          });
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
