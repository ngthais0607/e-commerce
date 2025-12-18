import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className,
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={cn(containerClasses, className)} role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-muted border-t-primary',
            sizeClasses[size]
          )}
          aria-hidden="true"
        />
        {text && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {text}
          </p>
        )}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

