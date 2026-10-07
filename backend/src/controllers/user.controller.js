const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { paginate, paginationResponse } = require('../utils/helpers');

// Get all users (Super Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      ...paginationResponse(users, total, parseInt(page), parseInt(limit)),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data users.',
      error: error.message,
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data user.',
      error: error.message,
    });
  }
};

// Create user (Super Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    // Cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    await logActivity(req.user.id, 'CREATE', 'USER', `Super Admin membuat akun ${user.name} dengan role ${user.role}`);

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat.',
      data: user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat user.',
      error: error.message,
    });
  }
};

// Update user (Super Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, role, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    // Cek jika email diubah, apakah sudah digunakan user lain
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan user lain.',
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, phone, address, role, isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await logActivity(req.user.id, 'UPDATE', 'USER', `Super Admin mengubah data akun ${user.name}`);

    res.json({
      success: true,
      message: 'User berhasil diperbarui.',
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui user.',
      error: error.message,
    });
  }
};

// Reset password (Super Admin only)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword },
    });

    await logActivity(req.user.id, 'UPDATE', 'USER', `Super Admin mereset password akun ${existingUser.name}`);

    res.json({
      success: true,
      message: 'Password berhasil direset.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mereset password.',
      error: error.message,
    });
  }
};

// Delete user (Super Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    // Tidak boleh menghapus diri sendiri
    if (existingUser.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus akun sendiri.',
      });
    }

    // Cek apakah user memiliki relasi data transaksi / aktivitas
    const userId = parseInt(id);
    const [incomesCount, expensesCount, ordersInCount, ordersOutCount, menusCount, ingredientsCount, employeesCount, activitiesCount] = await Promise.all([
      prisma.income.count({ where: { createdBy: userId } }),
      prisma.expense.count({ where: { createdBy: userId } }),
      prisma.orderIn.count({ where: { createdBy: userId } }),
      prisma.orderOut.count({ where: { createdBy: userId } }),
      prisma.menu.count({ where: { createdBy: userId } }),
      prisma.ingredient.count({ where: { createdBy: userId } }),
      prisma.employee.count({ where: { createdBy: userId } }),
      prisma.activityLog.count({ where: { userId } }),
    ]);

    const totalRelated = incomesCount + expensesCount + ordersInCount + ordersOutCount + menusCount + ingredientsCount + employeesCount + activitiesCount;

    if (totalRelated > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await logActivity(req.user.id, 'UPDATE', 'USER', `Super Admin menonaktifkan akun ${existingUser.name} (memiliki ${totalRelated} riwayat data)`);

      return res.json({
        success: true,
        message: 'Akun memiliki riwayat data/transaksi terkait, sehingga status akun dinonaktifkan demi menjaga integritas data.',
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await logActivity(req.user.id, 'DELETE', 'USER', `Super Admin menghapus akun ${existingUser.name}`);

    res.json({
      success: true,
      message: 'User berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus user.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
};

