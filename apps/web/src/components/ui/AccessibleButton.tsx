import * as React from 'react';
import { Button, ButtonProps } from './button';
import { aria, keyboardHandlers } from '@/utils/accessibility';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  /**
   * ARIA label for the button (required if button has no visible text)
   */
  ariaLabel?: string;
  /**
   * ARIA describedby ID
   */
  ariaDescribedBy?: string;
  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;
  /**
   * Loading text to show
   */
  loadingText?: string;
}

/**
 * Accessible Button component with built-in ARIA attributes and keyboard support
 * Use this instead of regular Button when you need better accessibility
 */
export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      ariaLabel,
      ariaDescribedBy,
      isLoading,
      loadingText,
      disabled,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        onClick={onClick}
        className={className}
        {...aria.label(ariaLabel || '')}
        {...(ariaDescribedBy && aria.describedBy(ariaDescribedBy))}
        {...aria.busy(isLoading || false)}
        {...props}
        onKeyDown={keyboardHandlers.onEnter(() => {
          if (!isDisabled && onClick) {
            onClick({} as React.MouseEvent<HTMLButtonElement>);
          }
        })}
      >
        {isLoading ? (
          <>
            <span className="sr-only">{loadingText || 'Loading'}</span>
            <span aria-hidden="true">{loadingText || 'Loading...'}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;

