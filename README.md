# 🎬 WatchListID

![WatchListID Hero](https://via.placeholder.com/1200x400/112D4E/FFFFFF?text=WatchListID)

> Aplikasi basis data sinematik premium bergaya IMDb, dibangun dengan **React Native**, **Expo SDK 51**, dan **Supabase**.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**WatchListID** adalah aplikasi *mobile* profesional yang berfungsi sebagai pangkalan data film komprehensif dan jejaring sosial bagi pecinta film. Aplikasi ini menggunakan sistem navigasi modern **Expo Router** dan backend **Supabase** yang kuat untuk memberikan pengalaman pengguna yang responsif dan aman.

---

## ✨ Fitur Utama

*   **Pangkalan Data Film (TMDB Integration)**: Menampilkan ribuan metadata film (Trailer, Cast, Kru, Skor Popularitas) secara *real-time*.
*   **Movie Diary & Log**: Catat setiap film yang kamu tonton dengan tanggal, rating, dan ulasan pribadi.
*   **Review System (Social)**: Berikan ulasan pada film dan sukai ulasan dari pengguna lain.
*   **Social Engine**: Cari pengguna lain, ikuti teman, dan pantau aktivitas mereka di *Activity Feed*.
*   **Smart Watchlist**: Manajemen daftar tontonan dengan filter sortir dan sinkronisasi cloud otomatis.
*   **Robust Authentication**: Login aman dengan Email/Password atau Google OAuth, dilengkapi Cloudflare Turnstile CAPTCHA.
*   **Security Hardening**: Proteksi data tingkat database dengan Supabase Row Level Security (RLS) dan validasi input yang ketat.

## 🛠 Teknologi yang Digunakan

*   **Framework**: React Native & Expo (SDK 51)
*   **Bahasa**: TypeScript (Strict Mode)
*   **Routing**: Expo Router (File-based routing)
*   **State Management**: React Context API (Auth, Watchlist, Social, Notification)
*   **Backend & Auth**: Supabase (PostgreSQL, Auth, Realtime)
*   **Keamanan**: Cloudflare Turnstile, Supabase RLS Triggers
*   **UI/UX**: Lucide React Native, Expo Image, Animated Svg Tab Bar
*   **Markdown**: react-native-markdown-display (untuk konten legal/bio)

## 🚀 Cara Menjalankan Aplikasi

### Prasyarat
*   Node.js (LTS)
*   Aplikasi **Expo Go** di HP
*   Akun Supabase & TMDB API Key

### Instalasi & Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/username/WatchListID.git
   cd WatchListID
   npm install
   ```

2. **Environment Variables**
   Buat file `.env` di direktori utama dan isi kredensial berikut:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
   EXPO_PUBLIC_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_key
   ```

3. **Jalankan**
   ```bash
   npx expo start
   ```

---

## 📂 Struktur Proyek Utama

```
WatchListID/
├── app/                  # Expo Router (tabs, layout, auth, movie detail)
├── components/           # Komponen UI (auth, movie, navigation, common)
├── context/              # Global Contexts (.tsx)
├── screens/              # Core Screen Logic (.tsx)
├── services/             # TMDB API & Cache Services
├── types/                # TypeScript Definitions & Supabase Types
├── utils/                # Helper functions (authErrors, export, dll)
├── assets/               # Gambar, font, dan ikon
└── supabase_schema.sql   # SQL Blueprint untuk Database
```

---
*Dibuat dengan ❤️ untuk kemajuan Ekosistem Digital Indonesia.*
