/**
 * Tests: utils/dateFormatter.ts — formatHumanDate
 * Pure function. Date-only inputs are used to stay timezone-independent
 * (they are parsed and read back in local time, so the day never shifts).
 */
import { formatHumanDate } from '../../utils/dateFormatter';

describe('formatHumanDate', () => {
  it('returns an empty string for missing input', () => {
    expect(formatHumanDate('')).toBe('');
    expect(formatHumanDate(null)).toBe('');
    expect(formatHumanDate(undefined)).toBe('');
  });

  it('formats a date-only string in English (default locale)', () => {
    expect(formatHumanDate('2026-06-19')).toBe('Jun 19, 2026');
    expect(formatHumanDate('2026-06-19', 'en')).toBe('Jun 19, 2026');
  });

  it('formats a date-only string in Indonesian', () => {
    expect(formatHumanDate('2026-06-19', 'id')).toBe('19 Juni 2026');
    expect(formatHumanDate('2026-01-01', 'id')).toBe('1 Januari 2026');
  });

  it('returns the original string when it cannot be parsed as a date', () => {
    expect(formatHumanDate('not-a-date')).toBe('not-a-date');
  });
});
