const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { deleteFromStorage } = require('../services/storage.service');

// Register
const register = async (req, res) => {
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

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        role: role || 'ADMIN_CS',
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

    // Log activity
    await logActivity(user.id, 'CREATE', 'AUTH', `User ${user.name} melakukan registrasi akun`);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi.',
      error: error.message,
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi admin.',
      });
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Buat JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log activity
    await logActivity(user.id, 'LOGIN', 'AUTH', `User ${user.name} login ke sistem`);

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          avatar: user.avatar,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login.',
      error: error.message,
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data user.',
      error: error.message,
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    let avatar;
    if (req.file) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { avatar: true },
      });
      if (currentUser?.avatar) {
        await deleteFromStorage(currentUser.avatar);
      }
      avatar = req.file.publicUrl || (req.file.filename.startsWith('http') ? req.file.filename : `/uploads/avatars/${req.file.filename}`);
    }

    const updateData = { name, phone, address };
    if (avatar) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });

    await logActivity(user.id, 'UPDATE', 'PROFILE', `User ${user.name} mengubah profil`);

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil.',
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verifikasi password lama
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini salah.',
      });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    await logActivity(user.id, 'UPDATE', 'AUTH', `User ${user.name} mengubah password`);

    res.json({
      success: true,
      message: 'Password berhasil diubah.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password.',
      error: error.message,
    });
  }
};

// Logout (invalidate on client side)
const logout = async (req, res) => {
  try {
    await logActivity(req.user.id, 'LOGOUT', 'AUTH', `User ${req.user.name} logout dari sistem`);

    res.json({
      success: true,
      message: 'Logout berhasil.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat logout.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
};

