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
    <div className="so-module-page">
      {/* Title row */}
      <div className="so-titlebar">
        <h1 className="so-title">{title}</h1>
        <div className="so-actions">
          {onSettings && (
            <button type="button" onClick={onSettings} className="so-icon-btn !w-[46px] !h-7" title="Settings">
              <Settings size={15} />
            </button>
          )}
          {onImport && (
            <button type="button" onClick={onImport} className="so-btn-secondary">
              <Download size={14} /> Import
            </button>
          )}
          {toolbar}
          {onAdd && (
            <button type="button" onClick={onAdd} className="so-btn-primary" title="Add New">
              <Plus size={14} /> New
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      {(filters || pagination) && (
        <div className="so-filterbar">
          {filters}
          {pagination !== false && (
            <div className="ml-auto flex items-center gap-2 text-sm text-[#111827]">
              <span>{pageStart} - {pageEnd || totalCount} of {totalCount}</span>
              <button type="button" className="so-icon-btn !w-8 !h-8 text-[#174bb8]"><ChevronLeft size={13} /></button>
              <button type="button" className="so-icon-btn !w-8 !h-8 text-[#174bb8]"><ChevronRight size={13} /></button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="so-table-panel">{children}</div>
    </div>
  );
}

export function SalesOnFilterSelect({ label, value, onChange, options = [] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="so-input so-select !w-auto min-w-[140px]"
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
      className="so-input !w-48"
    />
  );
}
