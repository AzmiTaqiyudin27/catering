const prisma = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { paginate, paginationResponse } = require('../utils/helpers');

// Get all ingredients
const getAllIngredients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, lowStock } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { supplier: { contains: search } },
      ];
    }
    
    if (category) {
      where.category = category;
    }

    if (lowStock === 'true') {
      const allIngredients = await prisma.ingredient.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const filtered = allIngredients.filter(
        (ing) => parseFloat(ing.stock) <= parseFloat(ing.minStock)
      );

      const paginated = filtered.slice(skip, skip + take);

      return res.json({
        success: true,
        ...paginationResponse(
          paginated,
          filtered.length,
          parseInt(page),
          parseInt(limit)
        ),
      });
    }

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
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
      prisma.ingredient.count({ where }),
    ]);

    res.json({
      success: true,
      ...paginationResponse(
        ingredients,
        total,
        parseInt(page),
        parseInt(limit)
      ),
    });
  } catch (error) {
    console.error('Get all ingredients error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data bahan.',
      error: error.message,
    });
  }
};

// Get ingredient by ID
const getIngredientById = async (req, res) => {
  try {
    const { id } = req.params;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Bahan tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    console.error('Get ingredient by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data bahan.',
      error: error.message,
    });
  }
};

// Create ingredient
const createIngredient = async (req, res) => {
  try {
    const { name, category, stock, unit, minStock, price, supplier, notes } = req.body;

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category,
        stock: parseFloat(stock),
        unit,
        minStock: parseFloat(minStock),
        price: parseFloat(price),
        supplier,
        notes,
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
      'INGREDIENT',
      `${req.user.name} menambah bahan: ${name} - ${stock} ${unit}`
    );

    res.status(201).json({
      success: true,
      message: 'Bahan berhasil ditambahkan.',
      data: ingredient,
    });
  } catch (error) {
    console.error('Create ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambah bahan.',
      error: error.message,
    });
  }
};

// Update ingredient
const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, stock, unit, minStock, price, supplier, notes } = req.body;

    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingIngredient) {
      return res.status(404).json({
        success: false,
        message: 'Bahan tidak ditemukan.',
      });
    }

    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: {
        name,
        category,
        stock: stock ? parseFloat(stock) : undefined,
        unit,
        minStock: minStock ? parseFloat(minStock) : undefined,
        price: price ? parseFloat(price) : undefined,
        supplier,
        notes,
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
      'INGREDIENT',
      `${req.user.name} mengubah bahan: ${ingredient.name}`
    );

    res.json({
      success: true,
      message: 'Bahan berhasil diperbarui.',
      data: ingredient,
    });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui bahan.',
      error: error.message,
    });
  }
};

// Delete ingredient
const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;

    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingIngredient) {
      return res.status(404).json({
        success: false,
        message: 'Bahan tidak ditemukan.',
      });
    }

    await prisma.ingredient.delete({
      where: { id: parseInt(id) },
    });

    await logActivity(
      req.user.id,
      'DELETE',
      'INGREDIENT',
      `${req.user.name} menghapus bahan: ${existingIngredient.name}`
    );

    res.json({
      success: true,
      message: 'Bahan berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus bahan.',
      error: error.message,
    });
  }
};

// Get ingredient summary/recap
const getIngredientSummary = async (req, res) => {
  try {
    // Total bahan
    const total = await prisma.ingredient.count();

    // Per kategori
    const byCategory = await prisma.ingredient.groupBy({
      by: ['category'],
      _count: true,
      _sum: { stock: true },
    });

    // Bahan dengan stok rendah
    const allIngredients = await prisma.ingredient.findMany();
    const lowStock = allIngredients.filter(
      (ing) => parseFloat(ing.stock) <= parseFloat(ing.minStock)
    );

    // Total nilai stok
    const totalValue = allIngredients.reduce((acc, ing) => {
      return acc + parseFloat(ing.stock) * parseFloat(ing.price);
    }, 0);

    res.json({
      success: true,
      data: {
        total,
        byCategory,
        lowStockCount: lowStock.length,
        lowStockItems: lowStock,
        totalValue,
      },
    });
  } catch (error) {
    console.error('Get ingredient summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil rekapitulasi bahan.',
      error: error.message,
    });
  }
};

// Get ingredient categories
const getIngredientCategories = async (req, res) => {
  try {
    const categories = await prisma.ingredient.groupBy({
      by: ['category'],
      _count: true,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get ingredient categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil kategori bahan.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getIngredientSummary,
  getIngredientCategories,
};

