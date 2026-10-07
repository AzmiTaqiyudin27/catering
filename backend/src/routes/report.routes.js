const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Dashboard - accessible by all authenticated users
router.get('/dashboard', reportController.getDashboard);

// Export routes - role based
router.get('/export/finance', authorize('ADMIN_KEUANGAN'), reportController.exportFinanceExcel);
router.get('/export/orders', authorize('ADMIN_CS'), reportController.exportOrdersExcel);
router.get('/export/ingredients', authorize('ADMIN_MENU'), reportController.exportIngredientsExcel);
router.get('/export/employees', authorize('ADMIN_SDM'), reportController.exportEmployeesExcel);

// PDF Report - accessible by operational roles according to their report domain
router.get('/pdf', authorize('PEMILIK', 'SUPER_ADMIN', 'ADMIN_KEUANGAN', 'ADMIN_CS', 'ADMIN_MENU', 'ADMIN_SDM'), reportController.generatePDFReport);

module.exports = router;

