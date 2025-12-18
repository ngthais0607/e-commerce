/**
 * Internationalization (i18n) support
 * Provides translation and localization functionality
 */

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;

interface Translations {
  [key: string]: string | Translations;
}

class I18n {
  private currentLocale: string = 'en';
  private translations: Record<string, Translations> = {};
  private fallbackLocale: string = 'en';

  /**
   * Initialize i18n with translations
   */
  init(locale: string, translations: Record<string, Translations>, fallbackLocale: string = 'en') {
    this.currentLocale = locale;
    this.translations = translations;
    this.fallbackLocale = fallbackLocale;

    // Set HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }

  /**
   * Set current locale
   */
  setLocale(locale: string) {
    this.currentLocale = locale;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-locale', locale);
    }
  }

  /**
   * Get current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Load locale from localStorage
   */
  loadSavedLocale(): string {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-locale');
      if (saved && this.translations[saved]) {
        this.setLocale(saved);
        return saved;
      }
    }
    return this.currentLocale;
  }

  /**
   * Translate a key
   */
  t(key: TranslationKey, params?: TranslationParams): string {
    const translation = this.getTranslation(key);

    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    if (!params) {
      return translation;
    }

    // Replace parameters in translation
    return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  /**
   * Get translation for a key
   */
  private getTranslation(key: TranslationKey): string | null {
    const keys = key.split('.');
    let translation: string | Translations | undefined = this.translations[this.currentLocale];

    // Navigate through nested keys
    for (const k of keys) {
      if (typeof translation === 'object' && translation !== null) {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }

    // If translation not found, try fallback locale
    if (!translation && this.currentLocale !== this.fallbackLocale) {
      translation = this.translations[this.fallbackLocale];
      for (const k of keys) {
        if (typeof translation === 'object' && translation !== null) {
          translation = translation[k];
        } else {
          return null;
        }
      }
    }

    return typeof translation === 'string' ? translation : null;
  }

  /**
   * Format number according to locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(value);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value: number, currency: string = 'USD', options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency,
      ...options,
    }).format(value);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.currentLocale, options).format(dateObj);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date | string | number): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        const rtf = new Intl.RelativeTimeFormat(this.currentLocale, { numeric: 'auto' });
        return rtf.format(-interval, unit as Intl.RelativeTimeFormatUnit);
      }
    }

    return this.t('common.justNow', {});
  }
}

// Singleton instance
export const i18n = new I18n();

// Default translations
const defaultTranslations: Record<string, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      justNow: 'Just now',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
    },
    product: {
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      outOfStock: 'Out of Stock',
      inStock: 'In Stock',
      price: 'Price',
      quantity: 'Quantity',
    },
  },
  vi: {
    common: {
      loading: 'Đang tải...',
      error: 'Đã xảy ra lỗi',
      success: 'Thành công',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      save: 'Lưu',
      delete: 'Xóa',
      edit: 'Sửa',
      add: 'Thêm',
      search: 'Tìm kiếm',
      filter: 'Lọc',
      sort: 'Sắp xếp',
      close: 'Đóng',
      back: 'Quay lại',
      next: 'Tiếp',
      previous: 'Trước',
      submit: 'Gửi',
      reset: 'Đặt lại',
      justNow: 'Vừa xong',
    },
    auth: {
      login: 'Đăng nhập',
      logout: 'Đăng xuất',
      register: 'Đăng ký',
      email: 'Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      forgotPassword: 'Quên mật khẩu?',
    },
    product: {
      addToCart: 'Thêm vào giỏ',
      buyNow: 'Mua ngay',
      outOfStock: 'Hết hàng',
      inStock: 'Còn hàng',
      price: 'Giá',
      quantity: 'Số lượng',
    },
  },
};

// Initialize with default translations
i18n.init('en', defaultTranslations, 'en');

// Load saved locale
if (typeof window !== 'undefined') {
  i18n.loadSavedLocale();
}

import React from 'react';

/**
 * React hook for translations
 */
export function useTranslation() {
  const [locale, setLocaleState] = React.useState(i18n.getLocale());

  const t = React.useCallback((key: TranslationKey, params?: TranslationParams) => {
    return i18n.t(key, params);
  }, []);

  const setLocale = React.useCallback((newLocale: string) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return {
    t,
    locale: i18n.getLocale(),
    setLocale,
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
  };
}

