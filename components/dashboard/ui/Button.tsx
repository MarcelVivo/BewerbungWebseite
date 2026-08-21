import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

const VARIANT = {
  primary: 'bg-dash-gold text-dash-bg font-bold hover:bg-dash-goldHover shadow-sm shadow-dash-gold/20',
  secondary: 'border border-dash-border bg-dash-surface text-dash-textSubtle hover:border-dash-gold/40 hover:text-dash-textBright',
  ghost: 'text-dash-textMuted hover:text-dash-textBright hover:bg-dash-surface',
  danger: 'border border-red-500/25 text-red-400 hover:bg-red-500/10',
};

const SIZE = { sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-4 py-2.5 text-sm gap-2' };

export default function Button({
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
