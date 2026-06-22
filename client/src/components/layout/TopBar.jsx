import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MessageCircle, Plus, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const createSections = [
  [
    ['Sales Invoice', '/app/sales/invoices?create=1'],
    ['Sales Order', '/app/sales/orders?create=1'],
    ['Estimate', '/app/sales/estimates?create=1'],
    ['Delivery Challan', '/app/sales/delivery-challans?create=1'],
    ['Sales Return', '/app/sales/returns?create=1'],
  ],
  [
    ['Purchase Order', '/app/purchases/orders?create=1'],
    ['Purchase Invoice', '/app/purchases/invoices?create=1'],
    ['Purchase Return', '/app/purchases/returns?create=1'],
  ],
  [
    ['Payment In', '/app/payments/in?create=1'],
    ['Payment Out', '/app/payments/out?create=1'],
  ],
  [
    ['Item', '/app/inventory/items?create=1'],
    ['Price List', '/app/inventory/price-list?create=1'],
  ],
  [
    ['Customer', '/app/parties/customers?create=1'],
    ['Supplier', '/app/parties/suppliers?create=1'],
  ],
  [
    ['User', '/app/employees?create=1'],
  ],
];

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, ref]);
}

export default function TopBar() {
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const createRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useOutsideClose(createRef, () => setCreateOpen(false));
  useOutsideClose(profileRef, () => setProfileOpen(false));

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-[52px] bg-white border-b border-[#e4e4e4] shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex items-center justify-end px-3 gap-7">
      <div ref={createRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setCreateOpen((value) => !value);
            setProfileOpen(false);
          }}
          className="h-8 w-[34px] rounded-[2px] bg-[#174bb8] text-white flex items-center justify-center hover:bg-[#123f9e]"
          title="Add"
        >
          <Plus size={21} strokeWidth={1.8} />
        </button>
        {createOpen && (
          <div className="absolute right-[-82px] top-[38px] z-50 w-[206px] bg-white py-2 shadow-[0_14px_34px_rgba(15,23,42,0.18)]">
            {createSections.map((section, sectionIndex) => (
              <div key={`create-section-${sectionIndex}`} className={sectionIndex > 0 ? 'border-t border-[#eeeeee] pt-2 mt-2' : ''}>
                {section.map(([label, path]) => (
                  <Link
                    key={label}
                    to={path}
                    onClick={() => setCreateOpen(false)}
                    className="block px-6 py-[9px] text-[16px] leading-5 text-[#2a2a2a] no-underline hover:bg-[#f5f7fb]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <a
        href="https://wa.me/918092856577"
        target="_blank"
        rel="noreferrer"
        className="h-7 px-3 rounded-full bg-[#27b45d] text-white text-xs font-semibold flex items-center gap-1.5 no-underline hover:bg-[#209e50]"
      >
        <MessageCircle size={13} />
        Help ?
      </a>

      <div ref={profileRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setProfileOpen((value) => !value);
            setCreateOpen(false);
          }}
          className="text-black hover:text-[#174bb8]"
          title="Profile"
        >
          <UserCircle size={28} strokeWidth={1.7} />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-[38px] z-50 w-[154px] bg-white py-2 shadow-[0_14px_34px_rgba(15,23,42,0.18)]">
            <Link
              to="/app/account"
              onClick={() => setProfileOpen(false)}
              className="block px-5 py-[11px] text-[16px] text-[#2a2a2a] no-underline hover:bg-[#f5f7fb]"
            >
              My Account
            </Link>
            <Link
              to="/app/subscription"
              onClick={() => setProfileOpen(false)}
              className="block px-5 py-[11px] text-[16px] text-[#2a2a2a] no-underline hover:bg-[#f5f7fb]"
            >
              Subscription
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-5 py-[11px] text-left text-[16px] text-[#2a2a2a] hover:bg-[#f5f7fb]"
            >
              <LogOut size={15} strokeWidth={1.8} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
