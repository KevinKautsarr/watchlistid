# Laporan Audit Kode Sumber WatchlistID

Laporan ini disusun oleh Senior Software Engineer & Security Auditor untuk proyek **WatchlistID** (React Native, Expo, TypeScript, Supabase). Proses audit difokuskan pada 5 dimensi utama: **Security, Bug, Kualitas Kode, Performa, dan Best Practice**.

---

## 🚨 CRITICAL (Harus Diperbaiki Sebelum Push)

### 1. Rute Reset Password Tidak Ditemukan (Broken Recovery Flow)
* **File & Baris**: [callback.tsx](file:///c:/Users/HP/Developer/MovieWatchlist/app/auth/callback.tsx#L61) dan [ForgotPasswordScreen.tsx](file:///c:/Users/HP/Developer/MovieWatchlist/screens/auth/ForgotPasswordScreen.tsx#L35-L36)
* **Deskripsi Masalah**: 
  Setelah pengguna meminta reset kata sandi, email berisi tautan pemulihan akan mengarahkan mereka kembali ke aplikasi. Di `callback.tsx`, jika tipe alur terdeteksi sebagai `recovery`, kode akan memanggil `router.replace('/auth/reset-password')`. Namun, rute `/auth/reset-password` **tidak ada di dalam struktur folder `app/auth/`**. Hal ini menyebabkan pengguna diarahkan ke halaman 404 (tidak ditemukan), sehingga fitur pemulihan akun patah total.
* **Perbaikan yang Disarankan**: 
  Buat file baru di `app/auth/reset-password.tsx` untuk menangani input password baru dan memanggil fungsi `updatePassword` dari `AuthContext`.
  
  *Contoh kode baru `app/auth/reset-password.tsx`:*
  ```typescript
  import React, { useState } from 'react';
  import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
  import { useRouter } from 'expo-router';
  import { useAuth } from '@/context/AuthContext';
  import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

  export default function ResetPasswordScreen() {
    const { updatePassword } = useAuth();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async () => {
      if (password.length < 8) {
        setError('Password minimal 8 karakter');
        return;
      }
      setLoading(true);
      const err = await updatePassword(password);
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        router.replace('/(tabs)');
      }
    };

    return (
      <View style={s.container}>
        <Text style={s.title}>Reset Password Baru</Text>
        <TextInput
          secureTextEntry
          placeholder="Password Baru"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={password}
          onChangeText={setPassword}
          style={s.input}
        />
        {error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={s.btn} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Simpan Password</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141414', justifyContent: 'center', padding: Spacing.xl },
    title: { fontSize: FontSize.xl, color: Colors.white, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
    input: { height: 50, backgroundColor: '#222', borderRadius: Radius.md, paddingHorizontal: Spacing.md, color: '#fff', marginBottom: Spacing.md },
    error: { color: Colors.primary, marginBottom: Spacing.md },
    btn: { height: 50, backgroundColor: Colors.primary, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: FontWeight.bold }
  });
  ```

---

### 2. Potensi Crash Saat Edit Profil Tanpa Bio (Null Pointer Exception)
* **File & Baris**: [ProfileEditModal.tsx](file:///c:/Users/HP/Developer/MovieWatchlist/components/profile/ProfileEditModal.tsx#L96)
* **Deskripsi Masalah**: 
  Di dalam modal edit profil, panjang teks bio ditampilkan dengan pemanggilan `{bio.length}/150`. Namun, state `bio` diinisialisasi langsung dari `initialData.bio` (`const [bio, setBio] = useState(initialData.bio);`). Karena bio bersifat nullable di database, pengguna baru yang belum mengisi bio akan memiliki `initialData.bio = null` atau `undefined`. Hal ini menyebabkan runtime crash seketika akibat error: `TypeError: Cannot read properties of null (reading 'length')` ketika modal tersebut dibuka.
* **Perbaikan yang Disarankan**: 
  Inisialisasi state `bio` dengan string kosong sebagai fallback jika bio awal kosong.
  
  ```diff
  -  const [bio, setBio] = useState(initialData.bio);
  +  const [bio, setBio] = useState(initialData.bio || '');
  ```

---

### 3. Logika Penghapusan Akun yang Tidak Efektif & Masalah RLS
* **File & Baris**: [AuthContext.tsx](file:///c:/Users/HP/Developer/MovieWatchlist/context/AuthContext.tsx#L288-L302) dan RLS di [supabase_schema.sql](file:///c:/Users/HP/Developer/MovieWatchlist/supabase_schema.sql)
* **Deskripsi Masalah**: 
  1. Fungsi `deleteAccount` memanggil `typedFrom('profiles').delete().eq('id', user.id)`. Operasi ini akan gagal karena tidak ada RLS policy `DELETE` pada tabel `profiles`.
  2. Penghapusan baris profil di sisi klien tidak menghapus akun autentikasi pengguna di tabel `auth.users`. Pengguna masih bisa masuk kembali dengan email dan sandi yang sama. SDK klien Supabase tidak memiliki izin untuk menghapus entitas dari `auth.users` secara langsung.
* **Perbaikan yang Disarankan**: 
  Buat fungsi RPC PostgreSQL dengan opsi `security definer` (dijalankan sebagai administrator) untuk menghapus data di `auth.users` dan biarkan sistem trigger menghapus profil secara otomatis (on delete cascade).
  
  *Definisi SQL RPC baru:*
  ```sql
  create or replace function public.delete_user_account()
  returns void
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    if auth.uid() is null then
      raise exception 'Not authorized';
    end if;
    
    -- Menghapus data pengguna di auth.users (akan menghapus baris profil secara cascade)
    delete from auth.users where id = auth.uid();
  end;
  $$;
  ```
  
  *Panggilan di React Native:*
  ```typescript
  const deleteAccount = async (): Promise<string | null> => {
    if (!user) return 'No user session';
    const { error } = await supabase.rpc('delete_user_account');
    if (error) return error.message;
    await signOut();
    return null;
  };
  ```

---

### 4. Pembersihan Data Lokal Destruktif pada Sign Out
* **File & Baris**: [AuthContext.tsx](file:///c:/Users/HP/Developer/MovieWatchlist/context/AuthContext.tsx#L304-L310)
* **Deskripsi Masalah**: 
  Saat pengguna melakukan sign out, sistem memanggil `AsyncStorage.clear()`. Ini adalah pembersihan yang destruktif karena akan menghapus **seluruh** data penyimpanan lokal aplikasi, termasuk data non-autentikasi seperti preferensi bahasa (`app_language`), status onboarding, cache respons, atau preferensi visual lainnya.
* **Perbaikan yang Disarankan**: 
  Hapus kunci autentikasi Supabase secara spesifik daripada membersihkan seluruh penyimpanan lokal.
  
  ```diff
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
-   await AsyncStorage.clear();
+   // Supabase SDK otomatis menghapus session token dari storage.
+   // Anda tidak perlu memanggil AsyncStorage.clear().
  };
  ```

---

### 5. Bug Logika / Salah Input Variabel pada Trigger Database
* **File & Baris**: [supabase_schema.sql](file:///c:/Users/HP/Developer/MovieWatchlist/supabase_schema.sql#L434-L467)
* **Deskripsi Masalah**: 
  Di dalam fungsi trigger database `notify_review_like()`, variabel `v_movie_title` dideklarasikan sebagai `TEXT`, namun diisi dengan nilai `movie_id` (bertipe integer) dari tabel `reviews`:
  `select movie_id into v_movie_title from public.reviews where id = new.review_id;`
  Selain kesalahan tipe data ini, variabel `v_movie_title` sama sekali tidak digunakan di dalam sisa kode fungsi trigger tersebut. Hal ini membuat trigger rentan terhadap kegagalan logis.
* **Perbaikan yang Disarankan**: 
  Hapus deklarasi dan query ke variabel `v_movie_title` jika tidak dibutuhkan untuk payload notifikasi, atau isi dengan benar menggunakan judul film sesungguhnya.
  
  ```sql
  -- Perbaikan di dalam notify_review_like()
  -- Hapus deklarasi v_movie_title TEXT jika tidak terpakai.
  ```

---

## ⚠️ WARNING (Harus Diperbaiki Sebelum Rilis)

### 1. Crash Pengunggahan Avatar pada Platform Web (Expo File System)
* **File & Baris**: [useProfileData.ts](file:///c:/Users/HP/Developer/MovieWatchlist/hooks/useProfileData.ts#L182-L186)
* **Deskripsi Masalah**: 
  Fungsi `handleUpdateAvatar` menggunakan `FileSystem.readAsStringAsync` dari library `expo-file-system` untuk membaca gambar sebagai base64. Library native ini tidak didukung di web browser normal di mana file URI yang dihasilkan oleh image picker bertipe URL blob browser (`blob:http...`). Hal ini menyebabkan fitur ganti foto profil macet total di web. Selain itu, fungsi `decode` menggunakan fungsi global `atob` yang tidak selalu tersedia secara global pada runtime mesin JS native React Native (seperti Hermes).
* **Perbaikan yang Disarankan**: 
  Gunakan pemanggilan `fetch(uri).then(r => r.blob())` untuk membaca data gambar secara universal. Metode ini didukung penuh baik di platform web maupun native, dan tidak memerlukan konversi base64 manual.
  
  ```typescript
  const handleUpdateAvatar = async (uri: string, t: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const fileName = `${user.id}-${Date.now()}.jpg`;
      
      // Membaca file secara universal menjadi Blob
      const response = await fetch(uri);
      const fileBlob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: updateError } = await typedFrom('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
      setShowCropModal(false);
    } catch (err) {
      console.error(err);
      alert(t('avatarError'));
    } finally {
      setIsSaving(false);
    }
  };
  ```

---

### 2. Query Tidak Efisien (Get All & Aggregate Client-Side)
* **File & Baris**: [LogContext.tsx](file:///c:/Users/HP/Developer/MovieWatchlist/context/LogContext.tsx#L119-L124)
* **Deskripsi Masalah**: 
  Fungsi `getAverageRating` mengambil seluruh data dari tabel `movie_logs` untuk film tertentu, lalu menghitung rata-rata secara manual di sisi aplikasi client. Jika sebuah film memiliki ribuan log/review, ini akan menarik data dalam jumlah sangat besar ke memori ponsel pengguna dan memperlambat aplikasi secara signifikan.
* **Perbaikan yang Disarankan**: 
  Panggil fungsi RPC PostgreSQL `get_avg_rating` yang sudah dideklarasikan di database untuk menghitung nilai rata-rata dan total ulasan secara instan di sisi server.
  
  ```typescript
  const getAverageRating = async (movieId: number) => {
    const { data, error } = await supabase.rpc('get_avg_rating', { p_movie_id: movieId });
    if (error || !data || data.length === 0) return { average: 0, count: 0 };
    // Kembalikan objek data pertama dari hasil RPC
    return { average: Number(data[0].average), count: Number(data[0].count) };
  };
  ```

---

### 3. Loop Pengalihan Autentikasi (Redirect Loop)
* **File & Baris**: [_layout.tsx](file:///c:/Users/HP/Developer/MovieWatchlist/app/_layout.tsx#L118-L121)
* **Deskripsi Masalah**: 
  Logika pengalihan otomatis mendeteksi sesi pengguna: jika `session` ada dan pengguna mengakses grup `/auth/*`, mereka akan langsung dipaksa pindah ke halaman utama `/(tabs)`. Namun, saat pengguna mengklik tautan pemulihan kata sandi dari email, Supabase secara otomatis masuk ke sesi aktif sementara. Ketika sistem mencoba mengarahkan pengguna ke `/auth/reset-password` (yang berada di dalam grup `auth`), mereka justru langsung ditendang paksa ke `/(tabs)` sebelum sempat mengisi kata sandi baru.
* **Perbaikan yang Disarankan**: 
  Kecualikan rute reset password dari pengalihan otomatis tersebut.
  
  ```typescript
  const inAuthGroup = segments[0] === 'auth';
  const isResetPassword = segments[1] === 'reset-password';

  if (!session && isProtectedRoute) {
    router.replace('/auth/login');
  } else if (session && inAuthGroup && !isResetPassword) {
    router.replace('/(tabs)');
  }
  ```

---

## 💡 REKOMENDASI (Nice to Have)

### 1. Pembatasan Sesi di Penyimpanan Lokal untuk SSR Web
* **File & Baris**: [supabase.ts](file:///c:/Users/HP/Developer/MovieWatchlist/supabase.ts#L20-L33)
* **Deskripsi**:
  Pemeriksaan `typeof window === 'undefined'` di `ExpoProvider` bertujuan mencegah kegagalan eksekusi AsyncStorage di sisi server (SSR) pada web. Namun, jika aplikasi native dimuat dalam mode tertentu di mana `window` bernilai `undefined`, penyimpanan sesi autentikasi akan gagal disimpan secara lokal.
* **Saran**:
  Gunakan pengecekan platform secara eksplisit daripada hanya mengandalkan variabel global `window`.
  
  ```typescript
  const ExpoProvider = {
    getItem: (key: string) => {
      if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve(null);
      return AsyncStorage.getItem(key);
    },
    // Lakukan hal yang sama untuk setItem dan removeItem
  };
  ```

---

## ✅ YANG SUDAH BAIK

1. **Bebas Error TypeScript**: Type-safety diatur dengan sangat baik di seluruh proyek. Hasil kompilasi type-check `npx tsc --noEmit` bersih 100% tanpa adanya error.
2. **Modularisasi Context**: Pemisahan context menjadi bagian-bagian kecil yang didelegasikan melalui satu composite provider (`SocialContext`) membuat sistem ulasan, log, dan pertemanan mudah dirawat tanpa merusak kompatibilitas lama.
3. **Cepat & Hemat Kuota API (TMDB Proxy Caching)**: Mekanisme in-memory cache dengan TTL dan pencegahan request ganda (`inflight`) di `services/api.ts` bekerja dengan sangat baik untuk menghindari pemanggilan TMDB berlebihan.
4. **Keamanan Konten**: Penerapan filter kata kunci NSFW secara terpusat menjamin konten yang disajikan aman bagi pengguna umum dan mematuhi regulasi ketat App Store/Google Play.
