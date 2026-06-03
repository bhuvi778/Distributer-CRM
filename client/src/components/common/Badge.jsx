import { getStatusBadge } from '../../utils/helpers';

const variantStyles = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-surface-100 text-surface-600 border border-surface-200',
};

export default function Badge({ status, label, variant, children }) {
  const cls = variant
    ? variantStyles[variant] || variantStyles.neutral
    : getStatusBadge(status);
  const content = label || status?.replace(/_/g, ' ');

  return (
    <span className={`badge ${cls}`}>
      {children || content}
    </span>
  );
}
