import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/use-debounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update until the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');

    rerender({ value: 'b' });

    // Before the timeout fires, the value should still be the old one
    expect(result.current).toBe('a');

    // Advance time by 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('b');
  });

  it('resets the timer when the value changes within the delay window', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      jest.advanceTimersByTime(250);
    });
    // Still the old value because 500ms hasn't passed
    expect(result.current).toBe('a');

    rerender({ value: 'c' });
    act(() => {
      jest.advanceTimersByTime(250);
    });
    // Timer was reset, still not enough
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe('c');
  });

  it('works with non-string values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 0 },
    });

    rerender({ value: 42 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe(42);
  });
});
