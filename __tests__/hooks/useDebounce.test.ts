/**
 * Tests: hooks/useDebounce.ts
 * Deterministic via fake timers — verifies the value only settles after the delay.
 */
import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('a', 500));
    expect(result.current).toBe('a');
  });

  it('updates only after the delay elapses', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebounce(v, 500), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'b' });
    expect(result.current).toBe('a'); // not yet

    act(() => { jest.advanceTimersByTime(499); });
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('b');
  });

  it('keeps only the latest value when changes happen within the delay window', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebounce(v, 500), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'b' });
    act(() => { jest.advanceTimersByTime(300); });
    rerender({ v: 'c' }); // resets the timer
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe('a'); // 600ms elapsed but timer was reset at 300ms

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('c');
  });
});
