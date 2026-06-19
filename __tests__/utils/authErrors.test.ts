/**
 * Tests: utils/authErrors.ts — mapAuthError
 * Pure function: maps Supabase auth error codes to friendly Indonesian messages.
 */
import { mapAuthError } from '../../utils/authErrors';

describe('mapAuthError', () => {
  it('returns an empty string for a null/undefined error', () => {
    expect(mapAuthError(null)).toBe('');
    expect(mapAuthError(undefined)).toBe('');
  });

  it('maps known auth error codes to localized messages', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toBe(
      'Email atau password salah. Silakan coba lagi.'
    );
    expect(mapAuthError({ code: 'user_already_registered' })).toBe(
      'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
    );
    expect(mapAuthError({ code: 'too_many_requests' })).toBe(
      'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.'
    );
  });

  it('detects invalid_credentials from the message when no code is present', () => {
    expect(mapAuthError({ message: 'AuthApiError: invalid_credentials' })).toBe(
      'Email atau password salah. Silakan coba lagi.'
    );
  });

  it('falls back to the raw message when the code is unknown', () => {
    expect(mapAuthError({ message: 'Something unexpected' })).toBe('Something unexpected');
  });

  it('falls back to a generic message when there is no code or message', () => {
    expect(mapAuthError({})).toBe('Terjadi kesalahan pada sistem autentikasi.');
  });
});
