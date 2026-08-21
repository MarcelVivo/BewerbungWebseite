import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalProps = {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

export default function Modal({ onClose, title, children, footer, size = 'md' }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn('relative w-full bg-dash-surface rounded-2xl border border-dash-border shadow-2xl max-h-[90vh] flex flex-col', SIZE[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-dash-border flex-shrink-0">
          <h2 className="font-display text-lg text-dash-textBright">{title}</h2>
          <button onClick={onClose} className="text-dash-textMuted hover:text-dash-textBright transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-6 py-4 border-t border-dash-border flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
