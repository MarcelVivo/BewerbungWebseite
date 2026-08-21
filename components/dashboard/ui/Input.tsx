import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const FIELD_CLS = 'w-full rounded-lg bg-dash-bg border border-dash-border focus:border-dash-gold focus:ring-1 focus:ring-dash-gold outline-none px-3 py-2.5 text-sm text-dash-textBright placeholder-dash-textDim transition-colors disabled:opacity-40';

type FieldWrapperProps = { label?: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode };

function FieldWrapper({ label, error, hint, required, children }: FieldWrapperProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-dash-textMuted mb-1.5">
          {label}{required && <span className="text-dash-gold"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-dash-textDim">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, hint, required, ...props }, ref) => (
  <FieldWrapper label={label} error={error} hint={hint} required={required}>
    <input ref={ref} className={cn(FIELD_CLS, error && 'border-red-500/50', className)} {...props} />
  </FieldWrapper>
));
Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, error, hint, required, ...props }, ref) => (
  <FieldWrapper label={label} error={error} hint={hint} required={required}>
    <textarea ref={ref} className={cn(FIELD_CLS, 'resize-none', error && 'border-red-500/50', className)} {...props} />
  </FieldWrapper>
));
Textarea.displayName = 'Textarea';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; hint?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, hint, required, children, ...props }, ref) => (
  <FieldWrapper label={label} error={error} hint={hint} required={required}>
    <select ref={ref} className={cn(FIELD_CLS, error && 'border-red-500/50', className)} {...props}>
      {children}
    </select>
  </FieldWrapper>
));
Select.displayName = 'Select';
