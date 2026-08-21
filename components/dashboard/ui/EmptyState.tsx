type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      {icon && <div className="mx-auto mb-3 w-10 h-10 flex items-center justify-center text-dash-textDim">{icon}</div>}
      <p className="text-dash-textMuted text-sm">{title}</p>
      {description && <p className="mt-1 text-xs text-dash-textDim max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
