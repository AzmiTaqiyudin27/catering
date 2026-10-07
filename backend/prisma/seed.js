const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create default users for each role
  const users = [
    {
      name: 'Pemilik Catering',
      email: 'pemilik@catering.com',
      password: hashedPassword,
      phone: '081234567890',
      address: 'Jl. Contoh No. 1, Jakarta',
      role: 'PEMILIK',
    },
    {
      name: 'Super Admin',
      email: 'superadmin@catering.com',
      password: hashedPassword,
      phone: '081234567891',
      address: 'Jl. Contoh No. 2, Jakarta',
      role: 'SUPER_ADMIN',
    },
    {
      name: 'Admin Keuangan',
      email: 'keuangan@catering.com',
      password: hashedPassword,
      phone: '081234567892',
      address: 'Jl. Contoh No. 3, Jakarta',
      role: 'ADMIN_KEUANGAN',
    },
    {
      name: 'Admin Customer Service',
      email: 'cs@catering.com',
      password: hashedPassword,
      phone: '081234567893',
      address: 'Jl. Contoh No. 4, Jakarta',
      role: 'ADMIN_CS',
    },
    {
      name: 'Admin Menu',
      email: 'menu@catering.com',
      password: hashedPassword,
      phone: '081234567894',
      address: 'Jl. Contoh No. 5, Jakarta',
      role: 'ADMIN_MENU',
    },
    {
      name: 'Admin SDM',
      email: 'sdm@catering.com',
      password: hashedPassword,
      phone: '081234567895',
      address: 'Jl. Contoh No. 6, Jakarta',
      role: 'ADMIN_SDM',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('✅ Users seeded successfully!');

  // Create sample menus
  const menuUser = await prisma.user.findFirst({ where: { role: 'ADMIN_MENU' } });
  
  const menus = [
    { name: 'Nasi Kotak Ayam Goreng', description: 'Nasi kotak dengan lauk ayam goreng, sayur, dan sambal', category: 'Makanan', price: 25000, isAvailable: true },
    { name: 'Nasi Kotak Rendang', description: 'Nasi kotak dengan lauk rendang, sayur, dan sambal', category: 'Makanan', price: 30000, isAvailable: true },
    { name: 'Nasi Kotak Ayam Bakar', description: 'Nasi kotak dengan lauk ayam bakar, sayur, dan sambal', category: 'Makanan', price: 28000, isAvailable: true },
    { name: 'Snack Box Standard', description: 'Kue basah, kue kering, dan minuman', category: 'Snack', price: 15000, isAvailable: true },
    { name: 'Snack Box Premium', description: 'Kue premium, sandwich, dan minuman', category: 'Snack', price: 25000, isAvailable: true },
    { name: 'Es Teh Manis', description: 'Es teh manis segar', category: 'Minuman', price: 5000, isAvailable: true },
    { name: 'Air Mineral', description: 'Air mineral botol', category: 'Minuman', price: 4000, isAvailable: true },
  ];

  for (const menu of menus) {
    const existing = await prisma.menu.findFirst({ where: { name: menu.name } });
    if (!existing) {
      await prisma.menu.create({
        data: {
          ...menu,
          createdBy: menuUser.id,
        },
      });
    }
  }

  console.log('✅ Menus seeded successfully!');

  // Create sample ingredients
  const ingredients = [
    { name: 'Beras', category: 'Bahan Pokok', stock: 100, unit: 'kg', minStock: 20, price: 12000, supplier: 'Toko Beras Jaya' },
    { name: 'Ayam', category: 'Protein', stock: 50, unit: 'kg', minStock: 10, price: 35000, supplier: 'Peternakan Ayam Sejahtera' },
    { name: 'Daging Sapi', category: 'Protein', stock: 30, unit: 'kg', minStock: 5, price: 120000, supplier: 'Pasar Daging Utama' },
    { name: 'Minyak Goreng', category: 'Bahan Pokok', stock: 40, unit: 'liter', minStock: 10, price: 15000, supplier: 'Toko Sembako ABC' },
    { name: 'Gula Pasir', category: 'Bahan Pokok', stock: 25, unit: 'kg', minStock: 5, price: 14000, supplier: 'Toko Sembako ABC' },
    { name: 'Tepung Terigu', category: 'Bahan Pokok', stock: 30, unit: 'kg', minStock: 10, price: 10000, supplier: 'Toko Sembako ABC' },
  ];

  for (const ingredient of ingredients) {
    const existing = await prisma.ingredient.findFirst({ where: { name: ingredient.name } });
    if (!existing) {
      await prisma.ingredient.create({
        data: {
          ...ingredient,
          createdBy: menuUser.id,
        },
      });
    }
  }

  console.log('✅ Ingredients seeded successfully!');

  // Create sample employees
  const sdmUser = await prisma.user.findFirst({ where: { role: 'ADMIN_SDM' } });

  const employees = [
    { employeeId: 'EMP001', name: 'Budi Santoso', email: 'budi@example.com', phone: '081111111111', address: 'Jl. Melati No. 1', position: 'Chef', department: 'Dapur', joinDate: new Date('2023-01-15'), salary: 5000000, status: 'ACTIVE' },
    { employeeId: 'EMP002', name: 'Siti Rahayu', email: 'siti@example.com', phone: '081222222222', address: 'Jl. Mawar No. 2', position: 'Asisten Chef', department: 'Dapur', joinDate: new Date('2023-03-20'), salary: 3500000, status: 'ACTIVE' },
    { employeeId: 'EMP003', name: 'Ahmad Hidayat', email: 'ahmad@example.com', phone: '081333333333', address: 'Jl. Anggrek No. 3', position: 'Driver', department: 'Operasional', joinDate: new Date('2023-02-10'), salary: 3000000, status: 'ACTIVE' },
    { employeeId: 'EMP004', name: 'Dewi Lestari', email: 'dewi@example.com', phone: '081444444444', address: 'Jl. Dahlia No. 4', position: 'Admin', department: 'Kantor', joinDate: new Date('2023-04-01'), salary: 3500000, status: 'ACTIVE' },
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { employeeId: employee.employeeId },
      update: {},
      create: {
        ...employee,
        createdBy: sdmUser.id,
      },
    });
  }

  console.log('✅ Employees seeded successfully!');
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

