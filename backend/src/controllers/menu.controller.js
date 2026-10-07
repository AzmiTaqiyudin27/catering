const prisma = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { paginate, paginationResponse } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');
const { deleteFromStorage } = require('../services/storage.service');

// Get all menus
const getAllMenus = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, isAvailable } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.menu.count({ where }),
    ]);

    res.json({
      success: true,
      ...paginationResponse(menus, total, parseInt(page), parseInt(limit)),
    });
  } catch (error) {
    console.error('Get all menus error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data menu.',
      error: error.message,
    });
  }
};

// Get menu by ID
const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error('Get menu by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data menu.',
      error: error.message,
    });
  }
};

// Create menu
const createMenu = async (req, res) => {
  try {
    const { name, description, category, price, isAvailable } = req.body;
    const image = req.file
      ? (req.file.publicUrl || (req.file.filename.startsWith('http') ? req.file.filename : `/uploads/menus/${req.file.filename}`))
      : null;

    const menu = await prisma.menu.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        image,
        isAvailable: isAvailable === 'true' || isAvailable === true,
        createdBy: req.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    await logActivity(
      req.user.id,
      'CREATE',
      'MENU',
      `${req.user.name} menambah menu: ${name}`
    );

    res.status(201).json({
      success: true,
      message: 'Menu berhasil ditambahkan.',
      data: menu,
    });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambah menu.',
      error: error.message,
    });
  }
};

// Update menu
const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, isAvailable } = req.body;

    const existingMenu = await prisma.menu.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingMenu) {
      return res.status(404).json({
        success: false,
        message: 'Menu tidak ditemukan.',
      });
    }

    let image = existingMenu.image;
    if (req.file) {
      // Delete old image if exists
      if (existingMenu.image) {
        await deleteFromStorage(existingMenu.image);
      }
      image = req.file.publicUrl || (req.file.filename.startsWith('http') ? req.file.filename : `/uploads/menus/${req.file.filename}`);
    }

    const menu = await prisma.menu.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        category,
        price: price ? parseFloat(price) : undefined,
        image,
        isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    await logActivity(
      req.user.id,
      'UPDATE',
      'MENU',
      `${req.user.name} mengubah menu: ${menu.name}`
    );

    res.json({
      success: true,
      message: 'Menu berhasil diperbarui.',
      data: menu,
    });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui menu.',
      error: error.message,
    });
  }
};

// Delete menu
const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const existingMenu = await prisma.menu.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingMenu) {
      return res.status(404).json({
        success: false,
        message: 'Menu tidak ditemukan.',
      });
    }

    // Delete image if exists
    if (existingMenu.image) {
      await deleteFromStorage(existingMenu.image);
    }

    await prisma.menu.delete({
      where: { id: parseInt(id) },
    });

    await logActivity(
      req.user.id,
      'DELETE',
      'MENU',
      `${req.user.name} menghapus menu: ${existingMenu.name}`
    );

    res.json({
      success: true,
      message: 'Menu berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus menu.',
      error: error.message,
    });
  }
};

// Get menu categories
const getMenuCategories = async (req, res) => {
  try {
    const categories = await prisma.menu.groupBy({
      by: ['category'],
      _count: true,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get menu categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil kategori menu.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuCategories,
};

