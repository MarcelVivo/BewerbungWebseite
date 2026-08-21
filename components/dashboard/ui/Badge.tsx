import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold';
  size?: 'sm' | 'md';
};

const VARIANT = {
  success: 'bg-green-900/40 text-green-300',
  warning: 'bg-amber-900/40 text-amber-300',
  danger: 'bg-red-900/40 text-red-300',
  info: 'bg-sky-900/40 text-sky-300',
  neutral: 'bg-dash-border/60 text-dash-textMuted',
  gold: 'bg-dash-gold/15 text-dash-gold',
};

const SIZE = { sm: 'px-2 py-0.5 text-[11px]', md: 'px-2.5 py-1 text-xs' };

export default function Badge({ className, variant = 'neutral', size = 'sm', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap', VARIANT[variant], SIZE[size], className)}
      {...props}
    />
  );
}
