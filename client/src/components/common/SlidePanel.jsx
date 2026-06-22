import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Right-side slide panel (drawer) — popups ke liye
 * Usage: <SlidePanel open={bool} onClose={fn} title="Add Item" width="w-[480px]">
 */
export default function SlidePanel({ open, onClose, title, children, width = 'w-[416px]', headerActions, hideClose = false, bodyClassName = 'p-4' }) {
  // ESC key se close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full ${width} bg-white shadow-2xl z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d7dce5] min-h-[59px]">
          <h2 className="text-xl font-semibold text-[#101828]">{title}</h2>
          <div className="flex items-center gap-3">
            {headerActions}
            {!hideClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#616161] transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </>
  );
}
