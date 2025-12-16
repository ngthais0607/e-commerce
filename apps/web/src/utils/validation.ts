/**
 * Input validation utilities
 * Provides common validation functions for forms
 */

export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Phone number validation (international format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Password strength validation
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export function validatePasswordStrength(password: string, minLength: number = 8): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= minLength) {
    score++;
  } else {
    feedback.push(`Password must be at least ${minLength} characters`);
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Password must contain at least one number');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  return {
    score,
    feedback: score < 4 ? feedback : [],
    isValid: score >= 4,
  };
}

/**
 * Credit card validation (Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s+/g, '');
  if (!/^\d+$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate required field
 */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate minimum length
 */
export function minLength(value: string | unknown[], min: number): boolean {
  if (typeof value === 'string') return value.length >= min;
  if (Array.isArray(value)) return value.length >= min;
  return false;
}

/**
 * Validate maximum length
 */
export function maxLength(value: string | unknown[], max: number): boolean {
  if (typeof value === 'string') return value.length <= max;
  if (Array.isArray(value)) return value.length <= max;
  return false;
}

/**
 * Validate number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate pattern (regex)
 */
export function matchesPattern(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

/**
 * Validate multiple rules
 */
export function validate(value: unknown, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message: string = 'This field is required'): ValidationRule => ({
    validate: isRequired,
    message,
  }),

  email: (message: string = 'Invalid email address'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && isValidEmail(value),
    message,
  }),

  phone: (message: string = 'Invalid phone number'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && isValidPhone(value),
    message,
  }),

  url: (message: string = 'Invalid URL'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && isValidUrl(value),
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return minLength(value, min);
      if (Array.isArray(value)) return minLength(value, min);
      return false;
    },
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return maxLength(value, max);
      if (Array.isArray(value)) return maxLength(value, max);
      return false;
    },
    message: message || `Must be at most ${max} characters`,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'number' && value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'number' && value <= max,
    message: message || `Must be at most ${max}`,
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && matchesPattern(value, pattern),
    message,
  }),
};

