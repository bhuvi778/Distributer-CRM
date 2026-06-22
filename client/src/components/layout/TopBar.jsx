import { MessageCircle, Plus, UserCircle } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-[52px] bg-white border-b border-[#e4e4e4] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex items-center justify-end px-3 gap-5">
      <button type="button" className="h-8 w-[34px] rounded-[2px] bg-[#174bb8] text-white flex items-center justify-center hover:bg-[#123f9e]" title="Add">
        <Plus size={21} strokeWidth={1.8} />
      </button>
      <button type="button" className="h-7 px-3 rounded-full bg-[#27b45d] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#209e50]">
        <MessageCircle size={13} />
        Help ?
      </button>
      <button type="button" className="h-7 px-2.5 rounded bg-black text-white flex flex-col items-start justify-center leading-none min-w-[96px]" title="Google Play">
        <span className="text-[6px] uppercase tracking-wide">Get it on</span>
        <span className="text-xs font-semibold">Google Play</span>
      </button>
      <button type="button" className="text-black hover:text-[#174bb8]" title="Profile">
        <UserCircle size={28} strokeWidth={1.7} />
      </button>
    </header>
  );
}
