import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-5xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/50" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-surface-200`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 bg-surface-50">
          <h2 className="text-base font-semibold text-surface-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-200 rounded-md transition-colors text-surface-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
