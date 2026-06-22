import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Headphones, Rocket, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canAccessPath } from '../../config/roles';
import { getSalesOnNav, isNavActive, isGroupOpen } from '../../config/salesonNav';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const nav = useMemo(() => getSalesOnNav(user, canAccessPath), [user]);
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    nav.forEach((item) => {
      if (item.type === 'group' && isGroupOpen(location.pathname, item)) {
        setOpenGroups((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  }, [location.pathname, nav]);

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[250px] bg-white border-r border-[#e2e2e2] z-40 flex flex-col">
      <div className="h-[65px] px-7 border-b border-[#ededed] flex items-center">
        <Link to="/app/dashboard" className="flex items-center gap-3 no-underline">
          <span className="so-logo-mark" aria-hidden="true" />
          <span className="text-[30px] font-semibold text-[#174bb8] tracking-tight leading-none">SalesOn</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map((item) => {
          if (item.type === 'link') {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`so-nav-link ${active ? 'so-nav-link-active' : ''}`}>
                <Icon size={18} strokeWidth={1.55} className={active ? 'text-[#174bb8]' : 'text-[#303030]'} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          }

          const Icon = item.icon;
          const groupActive = isNavActive(location.pathname, item);
          const isOpen = openGroups[item.id] ?? false;

          return (
            <div key={item.id} className="mb-2">
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                className={`so-nav-group-btn ${groupActive ? 'so-nav-group-btn-active' : ''}`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={1.55} className={groupActive ? 'text-[#174bb8]' : 'text-[#303030]'} />
                  <span>{item.label}</span>
                </span>
                {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              {isOpen && (
                <div className="py-1">
                  {item.items.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`so-nav-sub ${location.pathname === sub.path ? 'so-nav-sub-active' : ''}`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[#ededed] bg-white">
        <div className="mx-1.5 my-3 rounded-md bg-[#e60000] text-white px-3 py-3 flex gap-2 items-center text-sm font-semibold leading-snug">
          <Rocket size={21} />
          <span>Pro Trial plan expires in 7 days | Upgrade Now</span>
        </div>
        {canAccessPath(user, '/app/settings') && (
          <Link to="/app/settings" className={`so-nav-link ${location.pathname === '/app/settings' ? 'so-nav-link-active' : ''}`}>
            <Settings size={18} strokeWidth={1.55} />
            <span>Settings</span>
          </Link>
        )}
        <div className="h-[52px] px-8 border-t border-[#ededed] flex items-center gap-2 text-[#174bb8] font-semibold">
          <Headphones size={23} />
          <span>+91 8092856577</span>
        </div>
      </div>
    </aside>
  );
}
