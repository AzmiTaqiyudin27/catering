# 🍱 Catering Management System

Sistem manajemen catering lengkap dengan fitur multi-role untuk mengelola pesanan, menu, keuangan, dan karyawan.

## ✨ Fitur Utama

### 👥 Role Pengguna
- **Pemilik**: Monitoring aktivitas semua admin
- **Super Admin**: Full akses semua fitur + kelola user
- **Admin Keuangan**: CRUD pemasukan & pengeluaran
- **Admin Customer Service**: CRUD pesanan masuk & keluar
- **Admin Menu & Bahan**: CRUD menu & stok bahan
- **Admin SDM**: CRUD data karyawan

### 📋 Modul
- 📊 **Dashboard** - Ringkasan data & statistik
- 💰 **Keuangan** - Pemasukan, pengeluaran, rekapitulasi
- 📦 **Pesanan** - Pesanan masuk, keluar, rekapitulasi
- 🍽️ **Menu & Bahan** - Menu, stok bahan, rekapitulasi
- 👷 **SDM** - Data karyawan
- 📝 **Log Aktivitas** - Monitoring aktivitas admin

### 🔧 Fitur Tambahan
- ✅ Upload gambar untuk menu & karyawan
- ✅ Export laporan ke Excel
- ✅ Dashboard analytics dengan chart
- ✅ Notifikasi stok rendah

## 🛠️ Teknologi

### Backend
- Node.js + Express.js
- Prisma ORM
- PostgreSQL (Neon DB / Supabase) & MySQL compatible
- Supabase Storage (Cloud file uploads CDN)
- JWT Authentication
- bcrypt password hashing

### Frontend
- React.js + Vite
- Tailwind CSS
- React Router
- Recharts (untuk grafik)
- Axios

## 🚀 Panduan Deployment (Neon DB, Supabase, Vercel)
Untuk panduan langkah demi langkah mendeploy aplikasi ini ke cloud gratis menggunakan **Neon DB**, **Supabase Storage**, dan **Vercel**, silakan baca panduan lengkap di:
👉 [**DEPLOYMENT.md**](./DEPLOYMENT.md)

## 📁 Struktur Folder

```
catering-web/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

## 🚀 Instalasi & Setup

### Prerequisites
- Node.js v18+
- XAMPP (MySQL running)
- npm atau yarn

### 1️⃣ Setup Database

1. Buka XAMPP dan start MySQL
2. Buat database baru dengan nama `catering_db`

### 2️⃣ Setup Backend

```bash
cd backend

# Copy file environment
copy env.txt .env

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Jalankan migrasi database
npm run prisma:migrate

# (Opsional) Seed data awal
npm run seed

# Jalankan server
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 3️⃣ Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 🔐 Akun Demo

Setelah menjalankan seed, Anda bisa login dengan akun berikut:

| Role | Email | Password |
|------|-------|----------|
| Pemilik | pemilik@catering.com | password123 |
| Super Admin | superadmin@catering.com | password123 |
| Admin Keuangan | keuangan@catering.com | password123 |
| Admin CS | cs@catering.com | password123 |
| Admin Menu | menu@catering.com | password123 |
| Admin SDM | sdm@catering.com | password123 |

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Registrasi
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Ganti password

### Users (Super Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Keuangan
- `GET /api/incomes` - List pemasukan
- `POST /api/incomes` - Tambah pemasukan
- `GET /api/expenses` - List pengeluaran
- `POST /api/expenses` - Tambah pengeluaran

### Pesanan
- `GET /api/orders-in` - List pesanan masuk
- `POST /api/orders-in` - Tambah pesanan
- `GET /api/orders-out` - List pesanan keluar

### Menu & Bahan
- `GET /api/menus` - List menu
- `POST /api/menus` - Tambah menu (dengan upload gambar)
- `GET /api/ingredients` - List bahan
- `POST /api/ingredients` - Tambah bahan

### Karyawan
- `GET /api/employees` - List karyawan
- `POST /api/employees` - Tambah karyawan

### Reports
- `GET /api/reports/dashboard` - Data dashboard
- `GET /api/reports/export/finance` - Export keuangan ke Excel
- `GET /api/reports/export/orders` - Export pesanan ke Excel

## 🎨 Screenshots

Coming soon...

## 📄 License

MIT License

---

Made with ❤️ for Catering Business Management

