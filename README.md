# 🎬 WatchlistID

[![React Native](https://img.shields.io/badge/React_Native-v0.81.x-61dafb?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo SDK 54](https://img.shields.io/badge/Expo_SDK-54-000000?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/KevinKautsarr/watchlistid/actions/workflows/ci.yml/badge.svg)](https://github.com/KevinKautsarr/watchlistid/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> Pelacak Film & Seri TV Sosial Premium Lintas Platform (iOS, Android, Web) yang Dibangun dengan Expo, React Native, dan Supabase.
>
> 🌐 **Akses Versi Web:** [watchlistid.vercel.app](https://watchlistid.vercel.app/)

---

## 📖 Ringkasan (Overview)

**WatchlistID** adalah platform sosial cinematic database modern yang dirancang untuk membantu pecinta film melacak, mengulas, dan mendiskusikan film serta acara televisi favorit mereka. Dibangun di atas **Expo SDK 54** dan **React Native**, aplikasi ini menghadirkan antarmuka pengguna hibrida yang sangat responsif, lancar, dan berestetika premium (*dark mode glassmorphism*) baik di perangkat seluler maupun web.

Didukung oleh backend **Supabase** dengan keamanan tingkat tinggi (Row Level Security) dan integrasi **TMDB API**, WatchlistID tidak hanya berfungsi sebagai perpustakaan pribadi untuk mengelola daftar tontonan (*Watchlist* dan *Diary*), tetapi juga sebagai jejaring sosial dinamis yang menghubungkan pengguna melalui aktivitas interaksi sosial, ulasan, pengikut (*followers*), dan umpan aktivitas komunitas (*Activity Feed*).

---

## ✨ Fitur Unggulan

- 🎬 **Integrasi Database Sinematik Global (TMDB)** — Jelajahi ribuan film dan acara TV dengan informasi lengkap (detail pemeran, kru, trailer video YouTube, genre, dan skor rating popularitas).
- 📅 **Log & Buku Diary Tontonan Pintar** — Catat film yang ditonton dengan tanggal tertentu, rating bintang personal (skala 5-bintang dengan micro-interaksi haptic), dan penanda spoiler.
- 💬 **Mesin Ulasan Sosial & Likers** — Tulis ulasan lengkap dengan format Markdown, sembunyikan spoiler, dan sukai (*like*) ulasan dari sesama anggota komunitas.
- 👥 **Jejaring Sosial (Follow/Unfollow)** — Cari profil pengguna lain secara aman, ikuti teman, dan pantau aktivitas terbaru mereka melalui tab *Activity Feed* yang diperbarui secara real-time.
- 🔐 **Autentikasi Lapis Ganda & Captcha** — Login aman menggunakan Email/Password atau Google OAuth, diproteksi dengan verifikasi Cloudflare Turnstile CAPTCHA untuk mencegah bot spam.
- 🌐 **Desain Lintas Platform Responsif** — Navigasi disesuaikan secara dinamis: menggunakan tab bar animasi modern untuk aplikasi seluler, dan bilah navigasi desktop yang elegan untuk browser web.
- 📶 **Perlindungan Mode Offline (Offline Guard)** — Sistem pemantau jaringan terintegrasi yang menjaga keamanan data lokal dan memberikan peringatan visual yang anggun ketika perangkat kehilangan koneksi internet.
- 🗺️ **Dukungan Multi-bahasa (Localization)** — Mendukung pengubahan bahasa secara dinamis (Bahasa Indonesia & Bahasa Inggris) di seluruh komponen aplikasi.

---

## 🛠 Tech Stack

Aplikasi ini menggunakan teknologi modern terbaik untuk memastikan performa tinggi dan keamanan maksimal:

- **Framework Utama**: [React Native](https://reactnative.dev/) `0.81` & [Expo SDK 54](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Database & Backend**: [Supabase](https://supabase.com/) (PostgreSQL dengan RLS, Triggers, Realtime Channels, Storage Bucket untuk foto profil)
- **Penyedia API**: [The Movie Database (TMDB)](https://www.themoviedb.org/)
- **Penyimpanan Lokal**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) untuk cache watchlist dan rating offline
- **Desain UI/UX**: [Lucide React Native](https://lucide.dev/), [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- **Toleransi Masalah**: Custom `ErrorBoundary` untuk menangkap crash rendering di sisi runtime klien

---

## 🚀 Memulai (Getting Started)

### Prasyarat (Prerequisites)

Pastikan perangkat Anda sudah terinstal:
- **Node.js** (versi `20.x` atau lebih tinggi)
- **npm** atau **yarn**
- Aplikasi **Expo Go** pada ponsel Anda (tersedia di Google Play Store & iOS App Store) untuk pratinjau native.

### Langkah Instalasi

1. **Kloning Repositori**:
   ```bash
   git clone https://github.com/KevinKautsarr/watchlistid.git
   cd watchlistid
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Buat file bernama `.env` di root direktori proyek, lalu lengkapi variabel berikut:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_CLOUDFLARE_SITE_KEY=your-cloudflare-turnstile-site-key
   ```
   > **Catatan:** Kunci TMDB **tidak** disimpan di klien. Aplikasi memanggil TMDB
   > melalui Supabase Edge Function (`tmdb-proxy`); set kuncinya sebagai secret
   > fungsi: `supabase secrets set TMDB_API_KEY=your-tmdb-api-key`.

4. **Jalankan Server Pengembangan**:
   ```bash
   npm start
   # atau
   npx expo start
   ```

5. **Pindai Kode QR**:
   - Untuk **iOS**: Pindai QR code menggunakan aplikasi Kamera bawaan.
   - Untuk **Android**: Pindai QR code melalui aplikasi **Expo Go**.
   - Tekan tombol `w` di terminal untuk membukanya langsung di browser web lokal.

---

## ⚙️ Variabel Konfigurasi (Configuration)

| Variabel Lingkungan | Deskripsi | Wajib |
|---------------------|-----------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL Endpoint dari proyek Supabase Anda. | Ya |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Kunci anonim Supabase untuk interaksi database sisi klien. | Ya |
| `EXPO_PUBLIC_CLOUDFLARE_SITE_KEY` | Kunci situs Cloudflare Turnstile untuk validasi Captcha. | Ya |
| `TMDB_API_KEY` *(secret Edge Function, bukan `EXPO_PUBLIC`)* | Kunci API TMDB — disimpan di sisi server pada Supabase Edge Function `tmdb-proxy`. | Ya |

---

## 📂 Struktur Folder Proyek

```text
MovieWatchlist/
├── app/                  # Routing berbasis file (Expo Router): tabs, auth, detail film & profil
├── assets/               # Ikon aplikasi, aset brand, font, dan gambar statis
├── components/           # Komponen UI modular
│   ├── auth/             # Verifikasi Captcha dan formulir autentikasi
│   ├── common/           # Komponen global reusable (Toast, Avatar, PosterCard, SafeImage)
│   ├── home/             # Hero carousel, baris media, dan baris genre
│   ├── movie/            # LogModal, DiaryCard, ulasan, cast, dan detail aksi film
│   ├── navigation/       # Sidebar desktop dan tab bar seluler
│   ├── profile/          # Edit profil, statistik, tab view, dan header
│   └── search/           # Header pencarian, filter, dan kartu hasil
├── context/              # State global (Auth, Language, Social, Watchlist, Notification)
├── hooks/                # React Hooks kustom (useMovieDetail, useProfileData, useSearchQuery)
├── screens/              # Implementasi layar utama yang dirender oleh rute di app/
├── services/             # TMDB API client dan implementasi caching data
├── types/                # Definisi tipe TypeScript & pemetaan skema Supabase
├── utils/                # Fungsi pembantu (format tanggal, mapper error auth, ekspor CSV)
├── supabase/             # Migrasi SQL, konfigurasi CLI, dan Edge Function `tmdb-proxy`
├── __tests__/            # Unit & component tests (Jest + Testing Library)
├── .github/workflows/    # Continuous Integration (type-check, lint, dan test otomatis)
└── package.json          # Manajemen dependensi dan skrip CLI
```

---

## 🔐 Keamanan Database (Security Blueprint)

Proyek ini menerapkan keamanan ketat di level backend menggunakan PostgreSQL Row Level Security (RLS) di Supabase. Skema kanonik dikelola sebagai migrasi yang dapat direproduksi di [`supabase/migrations/`](supabase/migrations/) (snapshot ringkas juga tersedia di [`supabase_schema.sql`](supabase_schema.sql)):
- Tabel `profiles`, `followers`, `movie_logs`, `reviews`, dan `watchlist` diproteksi secara individual.
- Aksi `INSERT` / `UPDATE` / `DELETE` hanya diizinkan jika `auth.uid() = user_id`.
- Kueri penambahan nama lengkap dan foto profil dikelola melalui Trigger Functions Supabase untuk menjamin konsistensi data.

---

## ✅ Pengujian & Kualitas Kode

Kualitas kode dijaga oleh gerbang otomatis yang berjalan pada setiap *push* dan *pull request* melalui **GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

| Perintah | Tujuan |
|----------|--------|
| `npx tsc --noEmit` | Pemeriksaan tipe TypeScript (mode strict, target nol error) |
| `npm run lint` | Analisis statik dengan ESLint (konfigurasi Expo) |
| `npm test` | Unit & component test (Jest + React Native Testing Library) |
| `npm run test:coverage` | Laporan cakupan pengujian (*coverage report*) |

---

## 🤝 Kontribusi

Kontribusi selalu diterima dengan hangat! Jika Anda ingin meningkatkan fungsionalitas aplikasi ini:

1. Lakukan **Fork** pada repositori ini.
2. Buat cabang fitur baru Anda (`git checkout -b feature/FiturKeren`).
3. Lakukan commit untuk perubahan Anda (`git commit -m 'Menambahkan fitur baru yang luar biasa'`).
4. Lakukan Push ke cabang Anda (`git push origin feature/FiturKeren`).
5. Buat **Pull Request** baru di repositori utama.

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi **MIT License** - lihat file [LICENSE](LICENSE) untuk informasi lebih lanjut.

---

*Dibuat dengan dedikasi penuh dan ❤️ untuk kemajuan industri perangkat lunak Indonesia.*
