import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '@/hooks/usePersistedState';

describe('usePersistedState', () => {
  const TEST_KEY = 'test_key';
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks and restore all spies
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should initialize with default value when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedState(TEST_KEY, 'default'));
    
    expect(result.current[0]).toBe('default');
  });

  it('should initialize with stored value when available', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify('stored'));
    
    const { result } = renderHook(() => usePersistedState(TEST_KEY, 'default'));
    
    expect(result.current[0]).toBe('stored');
  });

  it('should persist value to localStorage when updated', () => {
    const { result } = renderHook(() => usePersistedState(TEST_KEY, 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });
    
    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('updated'));
  });

  it('should remove from localStorage when set to initial value', () => {
    const { result } = renderHook(() => usePersistedState(TEST_KEY, 'initial'));
    
    act(() => {
      result.current[1]('changed');
    });
    
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('changed'));
    
    act(() => {
      result.current[1]('initial');
    });
    
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });

  it('should remove from localStorage when set to empty string', () => {
    const { result } = renderHook(() => usePersistedState(TEST_KEY, ''));
    
    act(() => {
      result.current[1]('value');
    });
    
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('value'));
    
    act(() => {
      result.current[1]('');
    });
    
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });

  it('should remove from localStorage when set to null', () => {
    const { result } = renderHook(() => usePersistedState<string | null>(TEST_KEY, null));
    
    act(() => {
      result.current[1]('value');
    });
    
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('value'));
    
    act(() => {
      result.current[1](null);
    });
    
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });

  it('should handle localStorage errors gracefully on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => usePersistedState(TEST_KEY, 'default'));
    
    expect(result.current[0]).toBe('default');
  });

  it('should handle localStorage errors gracefully on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => usePersistedState(TEST_KEY, 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });
    
    // Should update state even if localStorage fails
    expect(result.current[0]).toBe('updated');
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorage.setItem(TEST_KEY, 'invalid json');
    
    const { result } = renderHook(() => usePersistedState(TEST_KEY, 'default'));
    
    expect(result.current[0]).toBe('default');
  });

  it('should work with different types (number)', () => {
    const { result } = renderHook(() => usePersistedState<number>(TEST_KEY, 0));
    
    act(() => {
      result.current[1](42);
    });
    
    expect(result.current[0]).toBe(42);
    expect(localStorage.getItem(TEST_KEY)).toBe('42');
  });

  it('should work with different types (object)', () => {
    const defaultObj = { foo: 'bar' };
    const { result } = renderHook(() => usePersistedState(TEST_KEY, defaultObj));
    
    act(() => {
      result.current[1]({ foo: 'baz' });
    });
    
    expect(result.current[0]).toEqual({ foo: 'baz' });
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify({ foo: 'baz' }));
  });

  it('should work with different types (boolean)', () => {
    const { result } = renderHook(() => usePersistedState<boolean>(TEST_KEY, false));
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(TEST_KEY)).toBe('true');
  });
});
