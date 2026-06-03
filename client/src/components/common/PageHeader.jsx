import { Download, Plus, RefreshCw } from 'lucide-react';

export default function PageHeader({ title, description, onAdd, onRefresh, onExport, loading, addLabel = 'Add New' }) {
  return (
    <div className="mb-5 pb-5 border-b border-surface-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-xl font-semibold text-surface-900">{title}</h1>
          {description && (
            <p className="text-surface-500 mt-1 text-sm leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRefresh && (
            <button onClick={onRefresh} className="btn-secondary !px-3 !py-2" title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
          {onExport && (
            <button onClick={onExport} className="btn-secondary !py-2">
              <Download size={15} /> Export
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="btn-primary !py-2">
              <Plus size={16} /> {addLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
