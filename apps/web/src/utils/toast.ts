import { toast } from '@/hooks/use-toast';
import { formatErrorMessage, handleApiError } from './errorHandler';

/**
 * Toast utility functions for consistent error/success notifications
 */

/**
 * Show success toast
 */
export function showSuccess(message: string, description?: string) {
  toast({
    title: message,
    description,
    variant: 'default',
  });
}

/**
 * Show error toast from API error
 */
export function showError(error: unknown, defaultMessage?: string) {
  const apiError = handleApiError(error);
  const message = formatErrorMessage(apiError) || defaultMessage || 'An error occurred';

  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
}

/**
 * Show error toast with custom message
 */
export function showErrorMessage(message: string, description?: string) {
  toast({
    title: 'Error',
    description: description || message,
    variant: 'destructive',
  });
}

/**
 * Show info toast
 */
export function showInfo(message: string, description?: string) {
  toast({
    title: message,
    description,
    variant: 'default',
  });
}

/**
 * Show warning toast
 */
export function showWarning(message: string, description?: string) {
  toast({
    title: message,
    description,
    variant: 'default',
  });
}

/**
 * Show loading toast (returns dismiss function)
 */
export function showLoading(message: string) {
  const toastResult = toast({
    title: message,
    description: 'Please wait...',
    variant: 'default',
  });

  return {
    dismiss: () => toastResult.dismiss(),
    update: (newMessage: string) => {
      toastResult.update({
        title: newMessage,
      });
    },
  };
}

