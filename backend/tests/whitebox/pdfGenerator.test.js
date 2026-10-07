const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const PDFDocument = require('pdfkit');

describe('WHITEBOX TESTING - PDFKit Document Generation & Stream Pipelines', () => {
  it('Branch 1: Successfully generates valid PDF binary buffer', async () => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    const bufferPromise = new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Write header & sample table
    doc.fontSize(20).text('LAPORAN CATERING SISTEM', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Tipe: KEUANGAN', { align: 'center' });
    doc.text('Periode: 2025-01-01 s/d 2025-01-31', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text('RINGKASAN KEUANGAN', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text('Total Pemasukan: Rp 15.000.000 (10 transaksi)');
    doc.text('Total Pengeluaran: Rp 5.000.000 (5 transaksi)');
    doc.text('Keuntungan Bersih: Rp 10.000.000');

    doc.end();

    const pdfBuffer = await bufferPromise;
    assert.ok(pdfBuffer.length > 500, 'PDF buffer must not be empty');
    // PDF Magic Number signature: '%PDF-'
    assert.equal(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  it('Branch 2: Generates Employee table in PDF stream', async () => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    const bufferPromise = new Promise((resolve) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(18).text('DATA KARYAWAN', { align: 'center' });
    doc.moveDown();

    const employees = [
      { employeeId: 'EMP0001', name: 'Budi Santoso', position: 'Chef', department: 'Dapur' },
      { employeeId: 'EMP0002', name: 'Siti Rahayu', position: 'Admin', department: 'Kantor' },
    ];

    employees.forEach((emp, idx) => {
      doc.fontSize(10).text(`${idx + 1}. [${emp.employeeId}] ${emp.name} - ${emp.position} (${emp.department})`);
    });

    doc.end();

    const buffer = await bufferPromise;
    assert.ok(buffer.length > 300);
    assert.equal(buffer.subarray(0, 5).toString('ascii'), '%PDF-');
  });
});
