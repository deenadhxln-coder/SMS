import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredUser, getStoredToken } from '../../packages/auth/src/index.js';

describe('Auth Store localStorage Safety Tests', () => {
  beforeEach(() => {
    // Create mock localStorage
    const store = {};
    global.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
  });

  it('1. Returns null safely when localStorage is empty', () => {
    expect(getStoredUser()).toBeNull();
    expect(getStoredToken()).toBeNull();
  });

  it('2. Returns parsed user object when localStorage contains valid JSON', () => {
    const validUser = { id: 'u1', name: 'Admin', role: 'School Admin' };
    localStorage.setItem('sms_user', JSON.stringify(validUser));
    localStorage.setItem('sms_token', 'sample_valid_token_123');

    expect(getStoredUser()).toEqual(validUser);
    expect(getStoredToken()).toBe('sample_valid_token_123');
  });

  it('3. Safely returns null without throwing SyntaxError when localStorage contains malformed/corrupted JSON', () => {
    localStorage.setItem('sms_user', '{{invalid_json_corrupted_string...>>>');
    
    // Must not throw error and must return null
    expect(() => getStoredUser()).not.toThrow();
    expect(getStoredUser()).toBeNull();
  });
});
