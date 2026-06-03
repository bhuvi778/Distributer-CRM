import { TrendingUp, TrendingDown } from 'lucide-react';

const iconColors = {
  brand: 'bg-brand-50 text-brand-700',
  accent: 'bg-accent-50 text-accent-700',
  orange: 'bg-orange-50 text-orange-700',
  purple: 'bg-violet-50 text-violet-700',
};

export default function StatCard({ title, value, icon: Icon, change, changeType, color = 'brand' }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-semibold mt-1.5 text-surface-900 font-mono tracking-tight">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${changeType === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {changeType === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {change}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-md flex-shrink-0 ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
