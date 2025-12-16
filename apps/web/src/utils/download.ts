/**
 * Download utilities
 * Provides functions for downloading files and data
 */

/**
 * Download a file from URL
 * 
 * @param url - File URL
 * @param filename - Optional filename
 * 
 * @example
 * downloadFile('https://example.com/file.pdf', 'document.pdf');
 */
export function downloadFile(url: string, filename?: string): void {
  const link = document.createElement('a');
  link.href = url;
  if (filename) {
    link.download = filename;
  }
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download data as file (JSON, CSV, etc.)
 * 
 * @param data - Data to download
 * @param filename - Filename with extension
 * @param mimeType - MIME type (default: application/json)
 * 
 * @example
 * downloadData({ name: 'John' }, 'user.json');
 * downloadData('name,age\nJohn,30', 'users.csv', 'text/csv');
 */
export function downloadData(
  data: string | object,
  filename: string,
  mimeType: string = 'application/json'
): void {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  downloadFile(url, filename);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Download JSON data
 */
export function downloadJSON(data: object, filename: string): void {
  downloadData(data, filename, 'application/json');
}

/**
 * Download CSV data
 * 
 * @param rows - Array of objects or array of arrays
 * @param filename - Filename
 * @param headers - Optional headers for object rows
 * 
 * @example
 * downloadCSV([{ name: 'John', age: 30 }], 'users.csv', ['name', 'age']);
 */
export function downloadCSV(
  rows: Array<Record<string, unknown>> | Array<Array<unknown>>,
  filename: string,
  headers?: string[]
): void {
  let csv = '';

  if (rows.length === 0) {
    csv = headers ? headers.join(',') : '';
  } else if (Array.isArray(rows[0])) {
    // Array of arrays
    const arrayRows = rows as Array<Array<unknown>>;
    if (headers) {
      csv += headers.join(',') + '\n';
    }
    csv += arrayRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  } else {
    // Array of objects
    const objectRows = rows as Array<Record<string, unknown>>;
    const keys = headers || Object.keys(objectRows[0] || {});
    csv += keys.join(',') + '\n';
    csv += objectRows
      .map((row) =>
        keys.map((key) => `"${String(row[key] || '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
  }

  downloadData(csv, filename, 'text/csv');
}

/**
 * Download image
 * 
 * @param imageUrl - Image URL or data URL
 * @param filename - Filename
 */
export function downloadImage(imageUrl: string, filename: string): void {
  downloadFile(imageUrl, filename);
}

/**
 * Download blob
 * 
 * @param blob - Blob object
 * @param filename - Filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}.${extension}`;
}

