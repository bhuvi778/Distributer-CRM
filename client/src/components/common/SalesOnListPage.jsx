import { Download, Settings, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * SalesOn-style list page shell — title bar, filters, table area
 */
export default function SalesOnListPage({
  title,
  children,
  onAdd,
  onImport,
  onSettings,
  toolbar,
  filters,
  pagination,
  totalCount = 0,
  pageStart = 1,
  pageEnd = 0,
}) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded min-h-[calc(100vh-80px)]">
      {/* Title row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0]">
        <h1 className="text-base font-semibold text-[#333]">{title}</h1>
        <div className="flex items-center gap-2">
          {onSettings && (
            <button type="button" onClick={onSettings} className="btn-icon" title="Settings">
              <Settings size={16} />
            </button>
          )}
          {onImport && (
            <button type="button" onClick={onImport} className="btn-secondary !py-1.5 !text-sm">
              <Download size={15} /> Import
            </button>
          )}
          {toolbar}
          {onAdd && (
            <button type="button" onClick={onAdd} className="btn-add" title="Add New">
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      {(filters || pagination) && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#e0e0e0] bg-[#fafafa]">
          {filters}
          {pagination !== false && (
            <div className="ml-auto flex items-center gap-2 text-sm text-[#757575]">
              <span>{pageStart} - {pageEnd || totalCount} of {totalCount}</span>
              <button type="button" className="btn-icon !w-7 !h-7"><ChevronLeft size={14} /></button>
              <button type="button" className="btn-icon !w-7 !h-7"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

export function SalesOnFilterSelect({ label, value, onChange, options = [] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field !w-auto !py-1.5 !text-sm min-w-[140px]"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

export function SalesOnSearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field !w-48 !py-1.5 !text-sm"
    />
  );
}
