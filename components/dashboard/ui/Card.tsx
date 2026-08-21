import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'alt' | 'ghost';
  interactive?: boolean;
};

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6 sm:p-8' };
const VARIANT = {
  default: 'bg-dash-surface border border-dash-border',
  alt: 'bg-dash-surfaceAlt border border-dash-border',
  ghost: 'bg-transparent border border-dash-border/60',
};

export default function Card({
  className,
  padding = 'md',
  variant = 'default',
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-colors',
        VARIANT[variant],
        PADDING[padding],
        interactive && 'hover:border-dash-gold/40 cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}
