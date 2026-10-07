# 🚀 Panduan Deployment: Neon DB + Supabase + Vercel

Panduan langkah demi langkah untuk mendeploy **Catering Management System** secara gratis dan modern dengan arsitektur:
- **Database**: [Neon DB](https://neon.tech) (Serverless PostgreSQL dengan Connection Pooling)
- **File Storage**: [Supabase Storage](https://supabase.com) (Penyimpanan gambar Menu, Karyawan, Avatar di CDN Cloud)
- **Hosting Web & Serverless API**: [Vercel](https://vercel.com) (Fullstack Frontend React + Backend Express Serverless)

---

## 📑 Daftar Isi
1. [Langkah 1: Setup Database di Neon DB](#1-setup-database-di-neon-db)
2. [Langkah 2: Setup Storage di Supabase](#2-setup-storage-di-supabase)
3. [Langkah 3: Migrasi Skema & Seeding Data ke Neon](#3-migrasi-skema--seeding-data-ke-neon)
4. [Langkah 4: Deploy Aplikasi ke Vercel](#4-deploy-aplikasi-ke-vercel)
5. [Langkah 5: Verifikasi & Login](#5-verifikasi--login)
6. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. Setup Database di Neon DB

1. Buka [neon.tech](https://neon.tech) dan **Sign In / Sign Up** (bisa menggunakan akun GitHub/Google).
2. Klik **Create Project**.
   - **Name**: `catering-db` (atau nama pilihan Anda)
   - **Postgres version**: `16` (default)
   - **Region**: Pilih yang terdekat (contoh: `ap-southeast-1` Singapore atau `us-east-1`)
3. Setelah project dibuat, di halaman **Dashboard**, lihat bagian **Connection Details**.
4. Pilih opsi **Pooled connection** (pastikan toggle *Pooled connection* aktif).
5. Salin connection string yang berformat seperti berikut:
   ```env
   postgresql://neondb_owner:npg_xxxxxxx@ep-cool-fog-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   > 💡 **Penting**: Simpan string ini untuk `DATABASE_URL` di Vercel dan saat seeding database.

---

## 2. Setup Storage di Supabase

Supabase digunakan khusus untuk menyimpan file gambar (foto menu makanan, foto karyawan, avatar profil), sehingga gambar tersimpan permanen dan cepat diakses melalui CDN cloud (tidak hilang saat Vercel serverless container restart).

1. Buka [supabase.com](https://supabase.com) dan login.
2. Buat project baru (**New Project**):
   - **Name**: `catering-storage`
   - **Database Password**: Buat password acak yang aman
   - **Region**: Pilih region terdekat (contoh: `Singapore`)
3. Tunggu hingga project selesai di-provisioning.
4. **Buat Storage Bucket**:
   - Di sidebar kiri, klik icon **Storage**.
   - Klik **New bucket**.
   - Masukkan **Bucket Name**: `catering`
   - Aktifkan toggle **Public bucket** (**Wajib ON** agar gambar dapat ditampilkan di web tanpa token privat).
   - Klik **Save**.
5. **Ambil Kredensial API**:
   - Klik menu **Project Settings** (icon gerigi) di sidebar kiri -> **API**.
   - Salin **Project URL** (contoh: `https://abcdefghijklmn.supabase.co`).
   - Salin **anon public key** (token panjang di bawah kolom `anon public`).

---

## 3. Migrasi Skema & Seeding Data ke Neon

Sebelum menghubungkan ke Vercel, lakukan inisialisasi tabel dan akun default ke Neon DB dari komputer lokal Anda:

1. Buka terminal di folder proyek:
   ```bash
   cd backend
   ```
2. Buat atau sesuaikan file `.env` di dalam folder `backend`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:password_anda@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="rahasia-super-aman-ganti-ini-12345"
   ```
3. Dorong skema database ke Neon (membuat semua tabel):
   ```bash
   npm run db:push
   ```
   *(Atau `npx prisma db push`)*
4. Masukkan data awal (akun default, menu sampel, bahan, dan karyawan):
   ```bash
   npm run seed
   ```
   Output sukses akan menampilkan:
   ```text
   🌱 Seeding database...
   ✅ Users seeded successfully!
   ✅ Menus seeded successfully!
   ✅ Ingredients seeded successfully!
   ✅ Employees seeded successfully!
   🎉 Database seeding completed!
   ```

---

## 4. Deploy Aplikasi ke Vercel

Proyek ini telah dikonfigurasi secara otomatis dengan `vercel.json` dan entrypoint `api/index.js` sehingga **Frontend dan Backend dapat berjalan dalam 1 domain di Vercel (Monorepo)** tanpa masalah CORS.

### Langkah Deploy:
1. Pastikan seluruh perubahan kode telah di-commit dan di-push ke GitHub:
   ```bash
   git add .
   git commit -m "feat: setup deployment for neon, supabase, and vercel"
   git push origin main
   ```
2. Buka [vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
3. Klik tombol **Add New...** -> **Project**.
4. Cari dan pilih repository **CateringApp** -> klik **Import**.
5. Di halaman konfigurasi Vercel:
   - **Framework Preset**: Pilih **Other** (atau biarkan auto-detect).
   - **Root Directory**: Biarkan `./` (root).
   - **Build Command**: Biarkan default (`npm run build`).
   - **Output Directory**: Biarkan default (`frontend/dist`).
6. Buka bagian **Environment Variables** dan tambahkan variabel berikut:

| Key | Value / Contoh | Deskripsi |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:xxx@ep-xxx-pooler.neon.tech/neondb?sslmode=require` | Connection string Neon (Pooled) |
| `JWT_SECRET` | `catering-secret-key-prod-random-token-987` | Kunci enkripsi token login |
| `JWT_EXPIRES_IN` | `7d` | Durasi token (7 hari) |
| `NODE_ENV` | `production` | Environment mode |
| `SUPABASE_URL` | `https://abcdefghijklmn.supabase.co` | URL Project Supabase Anda |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Anon Public Key Supabase |
| `SUPABASE_BUCKET` | `catering` | Nama bucket Supabase (public) |
| `VITE_API_URL` | `""` (kosongkan) | Biarkan kosong agar request `/api` ke domain yang sama |

7. Klik tombol **Deploy**! 🚀
8. Tunggu hingga proses build selesai (sekitar 1-2 menit). Vercel akan menghasilkan URL live (contoh: `https://catering-app.vercel.app`).

---

## 5. Verifikasi & Login

Setelah deployment selesai, buka URL aplikasi Vercel Anda dan login menggunakan salah satu akun default hasil seeding:

| Role | Email | Password |
|---|---|---|
| **Pemilik** | `pemilik@catering.com` | `password123` |
| **Super Admin** | `superadmin@catering.com` | `password123` |
| **Admin Keuangan** | `keuangan@catering.com` | `password123` |
| **Admin Customer Service** | `cs@catering.com` | `password123` |
| **Admin Menu** | `menu@catering.com` | `password123` |
| **Admin SDM** | `sdm@catering.com` | `password123` |

> 🔒 **Tips Keamanan**: Setelah login pertama kali, segera ganti password akun melalui halaman **Profil** di pojok kanan atas.

---

## 6. Troubleshooting & FAQ

### Q: Gambar yang saya upload tidak muncul atau error 500?
- Pastikan bucket `catering` di Supabase diset sebagai **Public Bucket**.
- Periksa apakah `SUPABASE_URL` dan `SUPABASE_ANON_KEY` sudah diisi dengan benar di Environment Variables Vercel.

### Q: Terjadi error database "too many connections" saat request tinggi?
- Pastikan connection string Neon yang dimasukkan di Vercel menggunakan opsi **Pooled Connection** (terdapat subdomain `-pooler` pada host Neon).

### Q: Ingin redeploy setelah melakukan update kode?
- Cukup lakukan `git push` ke branch utama di GitHub. Vercel akan otomatis melakukan rebuild dan redeploy dalam hitungan detik.
