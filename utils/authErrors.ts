import { AuthError } from '@supabase/supabase-js';

const ERROR_MAP: Record<string, string> = {
  'invalid_credentials': 'Email atau password salah. Silakan coba lagi.',
  'user_already_registered': 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.',
  'email_not_confirmed': 'Silakan konfirmasi email kamu terlebih dahulu sebelum masuk.',
  'too_many_requests': 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.',
  'network_error': 'Koneksi internet bermasalah. Periksa jaringan kamu.',
  'invalid_grant': 'Kode verifikasi tidak valid atau sudah kedaluwarsa.',
  'captcha_failed': 'Verifikasi keamanan gagal. Silakan coba lagi.',
};

/**
 * Maps Supabase Auth errors to user-friendly Indonesian messages.
 */
export const mapAuthError = (error: AuthError | any): string => {
  if (!error) return '';
  
  // Handle Supabase error codes
  const code = error.code || (error.message?.includes('invalid_credentials') ? 'invalid_credentials' : '');
  
  return ERROR_MAP[code] || error.message || 'Terjadi kesalahan pada sistem autentikasi.';
};
