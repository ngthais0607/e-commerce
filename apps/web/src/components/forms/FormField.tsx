import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ValidationResult } from '@/utils/validation';

interface FormFieldProps {
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  error?: string | ValidationResult;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  description?: string;
}

/**
 * Reusable form field component with validation display
 */
export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
  options,
  className,
  description,
}: FormFieldProps) {
  const errorMessage = typeof error === 'string' ? error : error?.errors?.[0];

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      placeholder,
      value: value?.toString() || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange?.(type === 'number' ? Number(e.target.value) : e.target.value);
      },
      disabled,
      className: cn(errorMessage && 'border-destructive'),
      'aria-invalid': !!errorMessage,
      'aria-describedby': errorMessage ? `${name}-error` : undefined,
    };

    switch (type) {
      case 'textarea':
        return <Textarea {...commonProps} />;
      case 'select':
        return (
          <Select
            value={value?.toString()}
            onValueChange={(val) => onChange?.(val)}
            disabled={disabled}
          >
            <SelectTrigger className={cn(errorMessage && 'border-destructive')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return <Input type={type} {...commonProps} />;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {renderInput()}
      {description && !errorMessage && (
        <p className="text-sm text-muted-foreground" id={`${name}-description`}>
          {description}
        </p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive" id={`${name}-error`} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

