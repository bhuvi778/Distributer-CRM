import { Download, Plus, RefreshCw } from 'lucide-react';

export default function PageHeader({ title, description, onAdd, onRefresh, onExport, loading, addLabel = 'Add New' }) {
  return (
    <div className="so-titlebar">
      <div className="flex flex-col justify-center min-w-0">
        <div className="max-w-3xl">
          <h1 className="so-title">{title}</h1>
          {description && (
            <p className="text-[#667085] mt-0.5 text-xs leading-snug truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="so-actions">
          {onRefresh && (
            <button onClick={onRefresh} className="so-btn-secondary !px-3" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
          {onExport && (
            <button onClick={onExport} className="so-btn-secondary">
              <Download size={14} /> Export
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="so-btn-primary">
              <Plus size={14} /> {addLabel}
            </button>
          )}
      </div>
    </div>
  );
}
