import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-5xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-[3px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[#d7dce5]`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#d7dce5] bg-white">
          <h2 className="text-lg font-semibold text-[#101828]">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f1f4fc] rounded transition-colors text-[#667085]">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
