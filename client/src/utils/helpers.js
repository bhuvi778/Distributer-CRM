export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

export const statusColors = {
  draft: 'bg-surface-100 text-surface-600 border border-surface-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-amber-50 text-amber-700 border border-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  returned: 'bg-orange-50 text-orange-700 border border-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border border-amber-200',
  overdue: 'bg-red-50 text-red-700 border border-red-200',
  sent: 'bg-blue-50 text-blue-700 border border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  absent: 'bg-red-50 text-red-700 border border-red-200',
  late: 'bg-orange-50 text-orange-700 border border-orange-200',
  open: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  closed: 'bg-surface-100 text-surface-600 border border-surface-200',
  loading: 'bg-blue-50 text-blue-700 border border-blue-200',
  on_route: 'bg-violet-50 text-violet-700 border border-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  planned: 'bg-surface-100 text-surface-600 border border-surface-200',
};

export const getStatusBadge = (status) => statusColors[status] || 'bg-gray-100 text-gray-700';
