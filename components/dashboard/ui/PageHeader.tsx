import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

export default function PageHeader({ title, subtitle, actions, backHref, backLabel = 'Zurück' }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        {backHref && (
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-dash-textMuted hover:text-dash-textBright transition-colors mb-2">
            <ArrowLeft size={13} /> {backLabel}
          </Link>
        )}
        <h1 className="font-display text-2xl text-dash-textBright">{title}</h1>
        {subtitle && <p className="text-sm text-dash-textMuted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}
