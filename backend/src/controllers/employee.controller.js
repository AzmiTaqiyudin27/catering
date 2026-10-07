const prisma = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { paginate, paginationResponse, generateEmployeeId } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employeeId: { contains: search } },
        { position: { contains: search } },
      ];
    }
    
    if (department) {
      where.department = department;
    }
    
    if (status) {
      where.status = status;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
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
      prisma.employee.count({ where }),
    ]);

    res.json({
      success: true,
      ...paginationResponse(employees, total, parseInt(page), parseInt(limit)),
    });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data karyawan.',
      error: error.message,
    });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data karyawan.',
      error: error.message,
    });
  }
};

// Create employee
const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      position,
      department,
      joinDate,
      salary,
      status,
      notes,
    } = req.body;

    const photo = req.file ? `/uploads/employees/${req.file.filename}` : null;

    // Generate unique employee ID safely
    const allEmployees = await prisma.employee.findMany({
      select: { employeeId: true },
    });
    let maxIdNum = 0;
    allEmployees.forEach(emp => {
      const match = emp.employeeId.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxIdNum) maxIdNum = num;
      }
    });
    const employeeId = `EMP${(maxIdNum + 1).toString().padStart(4, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        email,
        phone,
        address,
        position,
        department,
        joinDate: new Date(joinDate),
        salary: parseFloat(salary),
        status: status || 'ACTIVE',
        photo,
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
      'EMPLOYEE',
      `${req.user.name} menambah karyawan: ${name} (${employeeId})`
    );

    res.status(201).json({
      success: true,
      message: 'Karyawan berhasil ditambahkan.',
      data: employee,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambah karyawan.',
      error: error.message,
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      position,
      department,
      joinDate,
      salary,
      status,
      notes,
    } = req.body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan.',
      });
    }

    let photo = existingEmployee.photo;
    if (req.file) {
      // Delete old photo if exists
      if (existingEmployee.photo) {
        const oldPhotoPath = path.join(__dirname, '../../', existingEmployee.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      photo = `/uploads/employees/${req.file.filename}`;
    }

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        address,
        position,
        department,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        salary: salary ? parseFloat(salary) : undefined,
        status,
        photo,
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
      'EMPLOYEE',
      `${req.user.name} mengubah data karyawan: ${employee.name}`
    );

    res.json({
      success: true,
      message: 'Karyawan berhasil diperbarui.',
      data: employee,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui karyawan.',
      error: error.message,
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan.',
      });
    }

    // Delete photo if exists
    if (existingEmployee.photo) {
      const photoPath = path.join(__dirname, '../../', existingEmployee.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await prisma.employee.delete({
      where: { id: parseInt(id) },
    });

    await logActivity(
      req.user.id,
      'DELETE',
      'EMPLOYEE',
      `${req.user.name} menghapus karyawan: ${existingEmployee.name}`
    );

    res.json({
      success: true,
      message: 'Karyawan berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus karyawan.',
      error: error.message,
    });
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const total = await prisma.employee.count();

    const byDepartment = await prisma.employee.groupBy({
      by: ['department'],
      _count: true,
    });

    const byStatus = await prisma.employee.groupBy({
      by: ['status'],
      _count: true,
    });

    const byPosition = await prisma.employee.groupBy({
      by: ['position'],
      _count: true,
    });

    // Total salary
    const salarySum = await prisma.employee.aggregate({
      _sum: { salary: true },
      where: { status: 'ACTIVE' },
    });

    res.json({
      success: true,
      data: {
        total,
        byDepartment,
        byStatus,
        byPosition,
        totalSalary: salarySum._sum.salary || 0,
      },
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik karyawan.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
};

