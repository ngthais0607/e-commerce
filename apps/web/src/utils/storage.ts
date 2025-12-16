/**
 * Storage utilities
 * Provides enhanced localStorage and sessionStorage functions
 */

type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Get storage instance
 */
function getStorage(type: StorageType): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Storage is not available');
  }
  return type === 'localStorage' ? window.localStorage : window.sessionStorage;
}

/**
 * Get item from storage with JSON parsing
 */
export function getStorageItem<T>(key: string, type: StorageType = 'localStorage'): T | null {
  try {
    const storage = getStorage(type);
    const item = storage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading ${type} key "${key}":`, error);
    return null;
  }
}

/**
 * Set item in storage with JSON stringification
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  type: StorageType = 'localStorage'
): boolean {
  try {
    const storage = getStorage(type);
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting ${type} key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from storage
 */
export function removeStorageItem(key: string, type: StorageType = 'localStorage'): boolean {
  try {
    const storage = getStorage(type);
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${type} key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all items from storage
 */
export function clearStorage(type: StorageType = 'localStorage'): void {
  try {
    const storage = getStorage(type);
    storage.clear();
  } catch (error) {
    console.error(`Error clearing ${type}:`, error);
  }
}

/**
 * Get all keys from storage
 */
export function getStorageKeys(type: StorageType = 'localStorage'): string[] {
  try {
    const storage = getStorage(type);
    return Object.keys(storage);
  } catch {
    return [];
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(type: StorageType = 'localStorage'): boolean {
  try {
    const storage = getStorage(type);
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage size in bytes (approximate)
 */
export function getStorageSize(type: StorageType = 'localStorage'): number {
  try {
    const storage = getStorage(type);
    let total = 0;
    for (const key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

