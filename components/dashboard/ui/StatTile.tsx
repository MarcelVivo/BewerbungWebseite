import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Card from './Card';

type StatTileProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; direction: 'up' | 'down' };
  className?: string;
};

export default function StatTile({ label, value, icon, trend, className }: StatTileProps) {
  return (
    <Card padding="md" className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-dash-textDim">{label}</p>
        <p className="mt-1.5 font-display text-2xl text-dash-textBright leading-none">{value}</p>
        {trend && (
          <p className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trend.direction === 'up' ? 'text-green-400' : 'text-red-400')}>
            {trend.direction === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {trend.value}
          </p>
        )}
      </div>
      {icon && (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-dash-gold/10 border border-dash-gold/20 flex items-center justify-center text-dash-gold">
          {icon}
        </div>
      )}
    </Card>
  );
}
