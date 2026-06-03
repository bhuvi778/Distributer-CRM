import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canAccessPath } from '../../config/roles';
import { getSalesOnNav, isNavActive, isGroupOpen } from '../../config/salesonNav';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const nav = useMemo(() => getSalesOnNav(user, canAccessPath), [user]);

  const [openGroups, setOpenGroups] = useState({});

  // Auto-open the group that matches current path
  useEffect(() => {
    nav.forEach((item) => {
      if (item.type === 'group' && isGroupOpen(location.pathname, item)) {
        setOpenGroups((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  }, [location.pathname, nav]);

  // Toggle: close all others, open the clicked one (accordion behavior)
  const toggleGroup = (id) => {
    setOpenGroups((prev) => {
      const isCurrentlyOpen = prev[id];
      // Close all, then toggle the clicked one
      const allClosed = Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {});
      return { ...allClosed, [id]: !isCurrentlyOpen };
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-white border-r border-[#e0e0e0] z-40 flex flex-col shadow-sm">
      {/* Logo — SalesOn style */}
      <div className="px-4 py-3.5 border-b border-[#e0e0e0]">
        <Link to="/app/dashboard" className="flex items-center gap-2 no-underline">
          <span className="text-[22px] font-bold text-[#1e88e5] tracking-tight leading-none">SalesOn</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {nav.map((item) => {
          if (item.type === 'link') {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`so-nav-link ${active ? 'so-nav-link-active' : ''}`}
              >
                <Icon size={17} strokeWidth={1.75} className={active ? 'text-[#1e88e5]' : 'text-[#616161]'} />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="so-badge-new">{item.badge}</span>}
              </Link>
            );
          }

          const Icon = item.icon;
          const groupActive = isNavActive(location.pathname, item);
          const isOpen = openGroups[item.id] ?? false;

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                className={`so-nav-group-btn w-full ${groupActive ? 'so-nav-group-btn-active' : ''}`}
              >
                <span className="flex items-center gap-2.5 flex-1">
                  <Icon size={17} strokeWidth={1.75} className={groupActive ? 'text-[#1e88e5]' : 'text-[#616161]'} />
                  <span>{item.label}</span>
                </span>
                {isOpen ? <ChevronDown size={15} className="text-[#9e9e9e]" /> : <ChevronRight size={15} className="text-[#9e9e9e]" />}
              </button>
              {isOpen && (
                <div className="bg-[#fafafa] border-b border-[#f0f0f0]">
                  {item.items.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`so-nav-sub block ${location.pathname === sub.path ? 'so-nav-sub-active' : ''}`}
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

      <div className="border-t border-[#e0e0e0] mt-auto">
        {canAccessPath(user, '/app/settings') && (
          <Link
            to="/app/settings"
            className={`so-nav-link ${location.pathname === '/app/settings' ? 'so-nav-link-active' : ''}`}
          >
            <Settings size={17} strokeWidth={1.75} className="text-[#616161]" />
            <span>Settings</span>
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="so-nav-link w-full border-0 bg-transparent cursor-pointer text-left"
        >
          <LogOut size={17} strokeWidth={1.75} className="text-[#616161]" />
          <span>Logout</span>
        </button>
        <p className="px-4 pb-3 pt-1 text-[11px] text-[#9e9e9e]">+91 8092856577</p>
      </div>
    </aside>
  );
}
