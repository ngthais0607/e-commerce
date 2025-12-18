import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  // Handle null, undefined, or empty values
  if (price === null || price === undefined || price === '') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(0);
  }
  
  // Convert to number (handles Decimal from Prisma, strings, etc.)
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  
  // Handle NaN
  if (isNaN(numPrice)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(0);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numPrice);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatNumber(num: number | string | null | undefined): string {
  // Handle null, undefined, or empty values
  if (num === null || num === undefined || num === '') {
    return '0';
  }
  
  // Convert to number
  const numValue = typeof num === 'string' ? parseFloat(num) : Number(num);
  
  // Handle NaN
  if (isNaN(numValue)) {
    return '0';
  }
  
  // Format with dot as thousand separator
  return numValue.toLocaleString('de-DE'); // German locale uses dot as thousand separator
}