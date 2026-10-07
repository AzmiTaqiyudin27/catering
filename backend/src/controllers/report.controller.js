const prisma = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Get dashboard data
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Income this month
    const incomeThisMonth = await prisma.income.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    // Expense this month
    const expenseThisMonth = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    // Orders this month
    const ordersThisMonth = await prisma.orderIn.count({
      where: {
        orderDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Total menu
    const totalMenus = await prisma.menu.count({
      where: { isAvailable: true },
    });

    // Total employees
    const totalEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    // Low stock ingredients
    const allIngredients = await prisma.ingredient.findMany();
    const lowStockCount = allIngredients.filter(
      (ing) => parseFloat(ing.stock) <= parseFloat(ing.minStock)
    ).length;

    // Recent orders
    const recentOrders = await prisma.orderIn.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // Recent activities
    const recentActivities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    });

    // Orders by status
    const ordersByStatus = await prisma.orderIn.groupBy({
      by: ['status'],
      _count: true,
      _sum: { totalAmount: true },
    });

    // Monthly cashflow for last 6 months
    const monthlyCashflow = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mName = d.toLocaleDateString('id-ID', { month: 'short' });

      const [mInc, mExp] = await Promise.all([
        prisma.income.aggregate({
          where: { date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
      ]);

      const inc = parseFloat(mInc._sum.amount || 0);
      const exp = parseFloat(mExp._sum.amount || 0);
      monthlyCashflow.push({
        month: mName,
        income: inc,
        expense: exp,
        profit: inc - exp,
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          incomeThisMonth: parseFloat(incomeThisMonth._sum.amount || 0),
          expenseThisMonth: parseFloat(expenseThisMonth._sum.amount || 0),
          profit: parseFloat(incomeThisMonth._sum.amount || 0) - parseFloat(expenseThisMonth._sum.amount || 0),
          ordersThisMonth,
          totalMenus,
          totalEmployees,
          lowStockCount,
        },
        monthlyCashflow,
        ordersByStatus,
        recentOrders,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data dashboard.',
      error: error.message,
    });
  }
};

// Export finance report to Excel
const exportFinanceExcel = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Catering System';
    workbook.created = new Date();

    if (type === 'income' || type === 'all') {
      const incomes = await prisma.income.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' },
      });

      const incomeSheet = workbook.addWorksheet('Pemasukan');
      incomeSheet.columns = [
        { header: 'Tanggal', key: 'date', width: 15 },
        { header: 'Deskripsi', key: 'description', width: 30 },
        { header: 'Kategori', key: 'category', width: 20 },
        { header: 'Jumlah', key: 'amount', width: 20 },
        { header: 'Catatan', key: 'notes', width: 30 },
        { header: 'Dibuat Oleh', key: 'createdBy', width: 20 },
      ];

      incomes.forEach(income => {
        incomeSheet.addRow({
          date: new Date(income.date).toLocaleDateString('id-ID'),
          description: income.description,
          category: income.category,
          amount: parseFloat(income.amount),
          notes: income.notes || '-',
          createdBy: income.user.name,
        });
      });

      // Add total row
      const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      incomeSheet.addRow({});
      incomeSheet.addRow({ description: 'TOTAL PEMASUKAN', amount: totalIncome });
    }

    if (type === 'expense' || type === 'all') {
      const expenses = await prisma.expense.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' },
      });

      const expenseSheet = workbook.addWorksheet('Pengeluaran');
      expenseSheet.columns = [
        { header: 'Tanggal', key: 'date', width: 15 },
        { header: 'Deskripsi', key: 'description', width: 30 },
        { header: 'Kategori', key: 'category', width: 20 },
        { header: 'Jumlah', key: 'amount', width: 20 },
        { header: 'Catatan', key: 'notes', width: 30 },
        { header: 'Dibuat Oleh', key: 'createdBy', width: 20 },
      ];

      expenses.forEach(expense => {
        expenseSheet.addRow({
          date: new Date(expense.date).toLocaleDateString('id-ID'),
          description: expense.description,
          category: expense.category,
          amount: parseFloat(expense.amount),
          notes: expense.notes || '-',
          createdBy: expense.user.name,
        });
      });

      const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      expenseSheet.addRow({});
      expenseSheet.addRow({ description: 'TOTAL PENGELUARAN', amount: totalExpense });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=laporan-keuangan-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export finance excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export laporan.',
      error: error.message,
    });
  }
};

// Export orders report to Excel
const exportOrdersExcel = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Catering System';
    workbook.created = new Date();

    if (type === 'in' || type === 'all') {
      const ordersIn = await prisma.orderIn.findMany({
        where,
        include: {
          user: { select: { name: true } },
          items: true,
        },
        orderBy: { orderDate: 'desc' },
      });

      const orderInSheet = workbook.addWorksheet('Pesanan Masuk');
      orderInSheet.columns = [
        { header: 'No. Order', key: 'orderNumber', width: 20 },
        { header: 'Tanggal Order', key: 'orderDate', width: 15 },
        { header: 'Tanggal Kirim', key: 'deliveryDate', width: 15 },
        { header: 'Pelanggan', key: 'customerName', width: 25 },
        { header: 'Telepon', key: 'customerPhone', width: 15 },
        { header: 'Alamat', key: 'customerAddress', width: 30 },
        { header: 'Total', key: 'totalAmount', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      ordersIn.forEach(order => {
        orderInSheet.addRow({
          orderNumber: order.orderNumber,
          orderDate: new Date(order.orderDate).toLocaleDateString('id-ID'),
          deliveryDate: new Date(order.deliveryDate).toLocaleDateString('id-ID'),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          totalAmount: parseFloat(order.totalAmount),
          status: order.status,
        });
      });
    }

    if (type === 'out' || type === 'all') {
      const ordersOut = await prisma.orderOut.findMany({
        where,
        include: {
          user: { select: { name: true } },
          items: true,
        },
        orderBy: { deliveryDate: 'desc' },
      });

      const orderOutSheet = workbook.addWorksheet('Pesanan Keluar');
      orderOutSheet.columns = [
        { header: 'No. Order', key: 'orderNumber', width: 20 },
        { header: 'Tanggal Order', key: 'orderDate', width: 15 },
        { header: 'Tanggal Kirim', key: 'deliveryDate', width: 15 },
        { header: 'Pelanggan', key: 'customerName', width: 25 },
        { header: 'Telepon', key: 'customerPhone', width: 15 },
        { header: 'Total', key: 'totalAmount', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      ordersOut.forEach(order => {
        orderOutSheet.addRow({
          orderNumber: order.orderNumber,
          orderDate: new Date(order.orderDate).toLocaleDateString('id-ID'),
          deliveryDate: new Date(order.deliveryDate).toLocaleDateString('id-ID'),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: parseFloat(order.totalAmount),
          status: order.status,
        });
      });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=laporan-pesanan-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export orders excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export laporan.',
      error: error.message,
    });
  }
};

// Export ingredients report to Excel
const exportIngredientsExcel = async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Catering System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Stok Bahan');
    sheet.columns = [
      { header: 'Nama Bahan', key: 'name', width: 25 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Stok', key: 'stock', width: 15 },
      { header: 'Satuan', key: 'unit', width: 10 },
      { header: 'Stok Min', key: 'minStock', width: 15 },
      { header: 'Harga/Unit', key: 'price', width: 20 },
      { header: 'Supplier', key: 'supplier', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    ingredients.forEach(ing => {
      const isLowStock = parseFloat(ing.stock) <= parseFloat(ing.minStock);
      sheet.addRow({
        name: ing.name,
        category: ing.category,
        stock: parseFloat(ing.stock),
        unit: ing.unit,
        minStock: parseFloat(ing.minStock),
        price: parseFloat(ing.price),
        supplier: ing.supplier || '-',
        status: isLowStock ? 'STOK RENDAH' : 'OK',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=laporan-stok-bahan-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export ingredients excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export laporan.',
      error: error.message,
    });
  }
};

// Export employees report to Excel
const exportEmployeesExcel = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Catering System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Data Karyawan');
    sheet.columns = [
      { header: 'ID Karyawan', key: 'employeeId', width: 15 },
      { header: 'Nama', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Telepon', key: 'phone', width: 15 },
      { header: 'Jabatan', key: 'position', width: 20 },
      { header: 'Departemen', key: 'department', width: 20 },
      { header: 'Tanggal Masuk', key: 'joinDate', width: 15 },
      { header: 'Gaji', key: 'salary', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    employees.forEach(emp => {
      sheet.addRow({
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email || '-',
        phone: emp.phone,
        position: emp.position,
        department: emp.department,
        joinDate: new Date(emp.joinDate).toLocaleDateString('id-ID'),
        salary: parseFloat(emp.salary),
        status: emp.status,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=laporan-karyawan-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export employees excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export laporan.',
      error: error.message,
    });
  }
};

// Generate PDF report
const generatePDFReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=laporan-${type}-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('LAPORAN CATERING', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tipe: ${type.toUpperCase()}`, { align: 'center' });
    if (startDate && endDate) {
      doc.text(`Periode: ${startDate} s/d ${endDate}`, { align: 'center' });
    }
    doc.moveDown(2);

    // Content based on type
    if (type === 'finance') {
      const where = {};
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const [incomes, expenses, recentIncomes, recentExpenses] = await Promise.all([
        prisma.income.aggregate({ where, _sum: { amount: true }, _count: true }),
        prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
        prisma.income.findMany({ where, orderBy: { date: 'desc' }, take: 10 }),
        prisma.expense.findMany({ where, orderBy: { date: 'desc' }, take: 10 }),
      ]);

      const totalInc = parseFloat(incomes._sum.amount || 0);
      const totalExp = parseFloat(expenses._sum.amount || 0);
      const profit = totalInc - totalExp;

      doc.fontSize(14).text('RINGKASAN KEUANGAN', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Total Pemasukan: Rp ${totalInc.toLocaleString('id-ID')} (${incomes._count} transaksi)`);
      doc.text(`Total Pengeluaran: Rp ${totalExp.toLocaleString('id-ID')} (${expenses._count} transaksi)`);
      doc.text(`Keuntungan Bersih: Rp ${profit.toLocaleString('id-ID')}`);
      doc.moveDown();

      if (recentIncomes.length > 0) {
        doc.fontSize(12).text('Sampel Pemasukan Terbaru:', { underline: true });
        doc.fontSize(10);
        recentIncomes.forEach((inc, idx) => {
          doc.text(`${idx + 1}. ${new Date(inc.date).toLocaleDateString('id-ID')} - ${inc.description} (${inc.category}): Rp ${parseFloat(inc.amount).toLocaleString('id-ID')}`);
        });
        doc.moveDown();
      }

      if (recentExpenses.length > 0) {
        doc.fontSize(12).text('Sampel Pengeluaran Terbaru:', { underline: true });
        doc.fontSize(10);
        recentExpenses.forEach((exp, idx) => {
          doc.text(`${idx + 1}. ${new Date(exp.date).toLocaleDateString('id-ID')} - ${exp.description} (${exp.category}): Rp ${parseFloat(exp.amount).toLocaleString('id-ID')}`);
        });
      }
    } else if (type === 'orders') {
      const whereIn = {};
      const whereOut = {};
      if (startDate && endDate) {
        whereIn.orderDate = { gte: new Date(startDate), lte: new Date(endDate) };
        whereOut.deliveryDate = { gte: new Date(startDate), lte: new Date(endDate) };
      }

      const [ordersIn, ordersOut, sampleIn] = await Promise.all([
        prisma.orderIn.aggregate({ where: whereIn, _sum: { totalAmount: true }, _count: true }),
        prisma.orderOut.aggregate({ where: whereOut, _sum: { totalAmount: true }, _count: true }),
        prisma.orderIn.findMany({ where: whereIn, orderBy: { orderDate: 'desc' }, take: 15 }),
      ]);

      doc.fontSize(14).text('RINGKASAN PESANAN', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Pesanan Masuk: ${ordersIn._count} transaksi (Rp ${parseFloat(ordersIn._sum.totalAmount || 0).toLocaleString('id-ID')})`);
      doc.text(`Pesanan Keluar: ${ordersOut._count} transaksi (Rp ${parseFloat(ordersOut._sum.totalAmount || 0).toLocaleString('id-ID')})`);
      doc.moveDown();

      if (sampleIn.length > 0) {
        doc.fontSize(12).text('Daftar Pesanan Masuk:', { underline: true });
        doc.fontSize(10);
        sampleIn.forEach((ord, idx) => {
          doc.text(`${idx + 1}. ${ord.orderNumber} | ${ord.customerName} | Status: ${ord.status} | Total: Rp ${parseFloat(ord.totalAmount).toLocaleString('id-ID')}`);
        });
      }
    } else if (type === 'ingredients') {
      const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
      const lowStock = ingredients.filter(i => parseFloat(i.stock) <= parseFloat(i.minStock));

      doc.fontSize(14).text('LAPORAN STOK BAHAN BAKU', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Total Jenis Bahan: ${ingredients.length}`);
      doc.text(`Bahan Stok Rendah: ${lowStock.length}`);
      doc.moveDown();

      doc.fontSize(12).text('Daftar Bahan & Status Stok:', { underline: true });
      doc.fontSize(10);
      ingredients.forEach((ing, idx) => {
        const isLow = parseFloat(ing.stock) <= parseFloat(ing.minStock);
        doc.text(`${idx + 1}. ${ing.name} (${ing.category}) - Stok: ${parseFloat(ing.stock)} ${ing.unit} (Min: ${parseFloat(ing.minStock)}) ${isLow ? '[PERLU RESTOK]' : '[OK]'}`);
      });
    } else if (type === 'employees') {
      const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
      const totalSalary = employees.reduce((sum, e) => sum + parseFloat(e.salary || 0), 0);

      doc.fontSize(14).text('LAPORAN DATA KARYAWAN', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Total Karyawan: ${employees.length}`);
      doc.text(`Estimasi Beban Gaji: Rp ${totalSalary.toLocaleString('id-ID')}`);
      doc.moveDown();

      doc.fontSize(12).text('Daftar Karyawan:', { underline: true });
      doc.fontSize(10);
      employees.forEach((emp, idx) => {
        doc.text(`${idx + 1}. [${emp.employeeId}] ${emp.name} - ${emp.position} (${emp.department}) | Status: ${emp.status}`);
      });
    }

    doc.end();
  } catch (error) {
    console.error('Generate PDF report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat generate laporan PDF.',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  exportFinanceExcel,
  exportOrdersExcel,
  exportIngredientsExcel,
  exportEmployeesExcel,
  generatePDFReport,
};

