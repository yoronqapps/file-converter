import ExcelJS from 'exceljs';

/**
 * Converts between csv, json, and xlsx.
 * Strategy: parse the source into a common in-memory shape — an array of
 * row objects, e.g. [{ name: 'a', age: 1 }, ...] — then serialize that
 * into whichever target format is requested.
 */
export async function convertData(file, sourceExt, targetFormat) {
  const rows = await parseToRows(file, sourceExt);

  switch (targetFormat) {
    case 'csv':
      return rowsToCsv(rows);
    case 'json':
      return rowsToJson(rows);
    case 'xlsx':
      return rowsToXlsx(rows);
    default:
      throw new Error(`Unsupported data target format: ${targetFormat}`);
  }
}

async function parseToRows(file, sourceExt) {
  if (sourceExt === 'csv') {
    const text = await file.text();
    return csvTextToRows(text);
  }

  if (sourceExt === 'json') {
    const text = await file.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  }

  if (sourceExt === 'xlsx') {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    const rows = [];
    const headers = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = String(cell.value ?? '');
        });
        return;
      }

      const rowObj = {};
      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber] || `col${colNumber}`;
        rowObj[key] = cell.value;
      });
      rows.push(rowObj);
    });

    return rows;
  }

  throw new Error(`Cannot parse source format: ${sourceExt}`);
}

// Minimal CSV parser — handles quoted fields and commas inside quotes,
// which is the main thing that breaks naive split(',') approaches.
function csvTextToRows(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function rowsToCsv(rows) {
  if (rows.length === 0) return new Blob([''], { type: 'text/csv' });

  const headers = Object.keys(rows[0]);
  const escapeCsv = (value) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')),
  ];

  return new Blob([lines.join('\n')], { type: 'text/csv' });
}

function rowsToJson(rows) {
  return new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
}

async function rowsToXlsx(rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.addRow(headers);
    rows.forEach((row) => {
      worksheet.addRow(headers.map((h) => row[h]));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}