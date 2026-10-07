const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticate, authorize, authorizeAction } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authenticate);

// View routes - accessible by ADMIN_MENU, ADMIN_CS, SUPER_ADMIN, PEMILIK
router.get('/', authorize('ADMIN_MENU', 'ADMIN_CS'), menuController.getAllMenus);
router.get('/categories', authorize('ADMIN_MENU', 'ADMIN_CS'), menuController.getMenuCategories);
router.get('/:id', authorize('ADMIN_MENU', 'ADMIN_CS'), menuController.getMenuById);

// Action routes - only ADMIN_MENU and SUPER_ADMIN
router.post('/', authorizeAction('ADMIN_MENU'), upload.single('image'), menuController.createMenu);
router.put('/:id', authorizeAction('ADMIN_MENU'), upload.single('image'), menuController.updateMenu);
router.delete('/:id', authorizeAction('ADMIN_MENU'), menuController.deleteMenu);

module.exports = router;

