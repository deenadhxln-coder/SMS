/**
 * Lightweight, zero-dependency client-side CSV export utility.
 * 
 * Features:
 * - RFC 4180 compliant escaping (handles double quotes, commas, newlines).
 * - Prepends UTF-8 Byte Order Mark (\uFEFF) for immediate Excel compatibility.
 * - Handles null, undefined, numeric, and Unicode string values safely.
 * - Generates clean date-stamped filenames (e.g. students_export_2026-09-03.csv).
 * - Safe against empty or invalid datasets.
 * 
 * @param {Array<Object>} data Array of data row objects
 * @param {Array<{ key?: string, label: string, accessor?: (row: Object) => any }>} columns Column descriptors
 * @param {string} filenameBase Base name for downloaded file (e.g. "students_export")
 * @returns {boolean} True if export succeeded, false if data was empty/invalid
 */
export const exportToCSV = (data = [], columns = [], filenameBase = 'export') => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  if (!Array.isArray(columns) || columns.length === 0) {
    return false;
  }

  // Helper to escape individual cell content
  const escapeCell = (val) => {
    if (val === null || val === undefined) {
      return '""';
    }
    const str = String(val);
    // If contains quote, comma, newline, or carriage return, escape quotes and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Build CSV Header row
  const headerRow = columns.map((col) => escapeCell(col.label || col.header || col.key)).join(',');

  // Build CSV Data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        let cellVal;
        if (typeof col.accessor === 'function') {
          cellVal = col.accessor(row);
        } else if (col.key) {
          cellVal = row[col.key];
        } else {
          cellVal = '';
        }
        return escapeCell(cellVal);
      })
      .join(',');
  });

  // Prepend UTF-8 BOM so Excel opens accented & special characters seamlessly
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');

  // Trigger browser file download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenameBase}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
