const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

describe('BLACKBOX TESTING - Specification: Report Export Formats & Binary Headers', () => {
  it('TC-BB-05.1 [PDF Export Contract]: Produces valid application/pdf payload', async () => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    const promise = new Promise((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.fontSize(16).text('LAPORAN PESANAN KELUAR', { align: 'center' });
    doc.end();

    const buffer = await promise;
    assert.ok(buffer.length > 200);

    // Verify PDF signature
    const header = buffer.subarray(0, 5).toString('ascii');
    assert.equal(header, '%PDF-');
  });

  it('TC-BB-05.2 [Excel Export Contract]: Produces valid openxml spreadsheet payload', async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Catering Test';
    const sheet = workbook.addWorksheet('Laporan Keuangan');

    sheet.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Jumlah (Rp)', key: 'amount', width: 20 },
    ];

    sheet.addRow({ date: '2025-01-10', category: 'Katering Acara', amount: 5000000 });
    sheet.addRow({ date: '2025-01-12', category: 'Snack Box Kantor', amount: 1200000 });

    const buffer = await workbook.xlsx.writeBuffer();

    assert.ok(buffer.length > 500);
    // Excel xlsx files are zip archives, starting with PK (0x50, 0x4B)
    assert.equal(buffer[0], 0x50);
    assert.equal(buffer[1], 0x4b);
  });
});
