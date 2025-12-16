/**
 * Accessibility utility functions
 */

/**
 * Generate unique ID for ARIA attributes
 */
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Keyboard event handlers for accessibility
 */
export const keyboardHandlers = {
  /**
   * Handle Enter key press
   */
  onEnter: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handler();
    }
  },

  /**
   * Handle Escape key press
   */
  onEscape: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handler();
    }
  },

  /**
   * Handle Arrow key navigation
   */
  onArrowKeys: (
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ) => (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onRight?.();
        break;
    }
  },

  /**
   * Handle Tab navigation with focus trap
   */
  onTab: (onTab: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      onTab();
    }
  },
};

/**
 * ARIA attributes helpers
 */
export const aria = {
  /**
   * Create ARIA label attributes
   */
  label: (label: string) => ({
    'aria-label': label,
  }),

  /**
   * Create ARIA labelledby attributes
   */
  labelledBy: (id: string) => ({
    'aria-labelledby': id,
  }),

  /**
   * Create ARIA describedby attributes
   */
  describedBy: (id: string) => ({
    'aria-describedby': id,
  }),

  /**
   * Create ARIA live region attributes
   */
  live: (polite: boolean = true) => ({
    'aria-live': polite ? 'polite' : 'assertive',
    'aria-atomic': 'true',
  }),

  /**
   * Create ARIA busy attributes
   */
  busy: (isBusy: boolean) => ({
    'aria-busy': isBusy,
  }),

  /**
   * Create ARIA expanded attributes
   */
  expanded: (isExpanded: boolean) => ({
    'aria-expanded': isExpanded,
  }),

  /**
   * Create ARIA hidden attributes
   */
  hidden: (isHidden: boolean) => ({
    'aria-hidden': isHidden,
  }),

  /**
   * Create ARIA current attributes
   */
  current: (isCurrent: boolean | 'page' | 'step' | 'location' | 'date' | 'time') => ({
    'aria-current': isCurrent === true ? 'true' : isCurrent === false ? 'false' : isCurrent,
  }),
};

/**
 * Focus management utilities
 */
export const focus = {
  /**
   * Focus an element by selector
   */
  focusElement: (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    element?.focus();
  },

  /**
   * Focus first focusable element in container
   */
  focusFirst: (container: HTMLElement | null) => {
    if (!container) return;

    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    focusable?.focus();
  },

  /**
   * Focus last focusable element in container
   */
  focusLast: (container: HTMLElement | null) => {
    if (!container) return;

    const focusable = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).pop() as HTMLElement;
    focusable?.focus();
  },

  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement | null) => {
    if (!container) return () => {};

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  },
};

