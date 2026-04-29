# 🎬 WatchListID

![WatchListID Hero](https://via.placeholder.com/1200x400/112D4E/FFFFFF?text=WatchListID)

> Aplikasi basis data sinematik premium bergaya IMDb, dibuat dengan React Native dan Expo.

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**WatchListID** adalah aplikasi *mobile* profesional yang berfungsi sebagai pangkalan data film komprehensif. Terinspirasi oleh kepadatan informasi dan arsitektur UI dari IMDb, aplikasi ini dirancang khusus untuk memanjakan penggemar film dengan estetika desain kustom (Warna `#3F72AF` & `#112D4E`), performa mutakhir, dan UX yang mulus tanpa celah.

---

## ✨ Fitur Utama

*   **Pangkalan Data Film & Aktor (TMDB)**: Ditenagai oleh TMDB API, menampilkan ribuan metadata film (Trailer, Cast, Kru, Skor Popularitas, Budget, dan Box Office) secara terperinci.
*   **Video Trailer Bawaan**: Memutar YouTube Trailer (Teaser, Featurette) secara langsung dan mulus dari *Movie Detail Screen*.
*   **Smart Watchlist & Persistent Cache**: Manajemen daftar tontonan canggih dengan filter sortir, ter-enkripsi dan tersimpan aman secara *offline* menggunakan `AsyncStorage`.
*   **Cloud Sync Ready**: Terkonfigurasi penuh dengan **Supabase** (`@supabase/supabase-js`) & Skema *Row Level Security (RLS)* untuk integrasi akun *user* di masa depan.
*   **Micro-Interactions & Haptics**: Dilengkapi efek getar haptik (*impact* & *notification*) pada setiap sentuhan krusial untuk memberikan pengalaman setara aplikasi premium.
*   **Arsitektur Layout Canggih**: Penguncian ukuran font, optimasi animasi gulir (*scroll*), kompresi gambar (*Expo Image*), dan sistem navigasi *Floating Bottom Tab* dengan *Custom Unicode Icons*.

## 🛠 Teknologi yang Digunakan

*   **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 50+)
*   **Routing**: Expo Router (`app/` directory)
*   **State Management**: React Context API (`WatchlistContext.jsx`)
*   **Storage (Local)**: `@react-native-async-storage/async-storage`
*   **Storage (Cloud)**: [Supabase](https://supabase.com/)
*   **API Pihak Ketiga**: [The Movie Database (TMDB) API v3](https://developer.themoviedb.org/docs)
*   **Modul Ekstra**: `expo-image`, `expo-haptics`, `expo-web-browser`

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
*   [Node.js](https://nodejs.org/) (versi LTS direkomendasikan)
*   Aplikasi **Expo Go** (terinstal di iOS / Android Anda)
*   [TMDB API Key](https://www.themoviedb.org/settings/api)

### Instalasi

1. **Clone repository ini**
   ```bash
   git clone https://github.com/username/WatchListID.git
   cd WatchListID
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi API Key**
   Buka file `config.js` di dalam folder utama dan masukkan TMDB API Key Anda:
   ```javascript
   export const TMDB_API_KEY = 'MASUKKAN_KUNCI_API_ANDA_DI_SINI';
   ```

4. **Jalankan Aplikasi**
   ```bash
   npx expo start --clear
   ```
   > Akan muncul *QR Code* di terminal Anda. *Scan QR Code* tersebut menggunakan aplikasi **Expo Go** di HP Anda.

---

## 📂 Struktur Proyek Utama

```
WatchListID/
├── app/                  # Expo Router navigation (tabs, layout, modals)
├── components/           # Komponen UI yang dapat digunakan kembali (Toast, dll)
├── context/              # Manajemen State Global (WatchlistContext)
├── screens/              # Halaman Aplikasi Inti
│   ├── HomeScreen.jsx
│   ├── SearchScreen.jsx
│   ├── MovieDetailScreen.jsx
│   ├── PersonDetailScreen.jsx
│   ├── WatchlistScreen.jsx
│   └── ProfileScreen.jsx
├── config.js             # Konfigurasi konstanta & kredensial API
├── supabase.js           # Konfigurasi Klien Supabase
└── supabase_schema.sql   # Blueprint untuk setup database Supabase
```

## 🏗 Roadmap Pengembangan

Silakan tinjau file `IMPLEMENTATION_PLAN.md` untuk mengetahui tahapan eksekusi dan peta jalan (*roadmap*) pengembangan yang lebih mendetail (mulai dari Fondasi UI hingga Produksi).

---
*Dibuat dengan ❤️ untuk kemajuan Ekosistem Digital Indonesia.*
