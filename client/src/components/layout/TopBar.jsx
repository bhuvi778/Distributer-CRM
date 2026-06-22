import { MessageCircle, Plus, UserCircle } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-[64px] bg-white border-b border-[#e4e4e4] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex items-center justify-end px-4 gap-7">
      <button type="button" className="h-10 w-[42px] rounded-[2px] bg-[#174bb8] text-white flex items-center justify-center hover:bg-[#123f9e]" title="Add">
        <Plus size={26} strokeWidth={1.8} />
      </button>
      <button type="button" className="h-8 px-4 rounded-full bg-[#27b45d] text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-[#209e50]">
        <MessageCircle size={15} />
        Help ?
      </button>
      <button type="button" className="h-8 px-3 rounded bg-black text-white flex flex-col items-start justify-center leading-none min-w-[118px]" title="Google Play">
        <span className="text-[6px] uppercase tracking-wide">Get it on</span>
        <span className="text-sm font-semibold">Google Play</span>
      </button>
      <button type="button" className="text-black hover:text-[#174bb8]" title="Profile">
        <UserCircle size={34} strokeWidth={1.7} />
      </button>
    </header>
  );
}
