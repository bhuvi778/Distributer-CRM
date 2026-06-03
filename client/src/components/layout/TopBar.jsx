import { useState, useRef, useEffect } from 'react';
import { Bell, User, Crown, Shield, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Static demo notifications — in real app these would come from API
const DEMO_NOTIFICATIONS = [
  { id: 1, title: 'New Order Received', message: 'Sharma General Store placed an order of ₹9,555', time: '2 min ago', read: false, type: 'order' },
  { id: 2, title: 'Payment Collected', message: 'Amit Sharma collected ₹5,000 from Gupta Traders', time: '15 min ago', read: false, type: 'payment' },
  { id: 3, title: 'Low Stock Alert', message: 'Basmati Rice 5kg — only 12 units left', time: '1 hr ago', read: false, type: 'alert' },
  { id: 4, title: 'New Lead Added', message: 'Priya added a new lead: Mehta Stores, Mumbai', time: '2 hrs ago', read: true, type: 'lead' },
  { id: 5, title: 'Delivery Completed', message: 'DC-00003 delivered to Patel Super Mart', time: '3 hrs ago', read: true, type: 'delivery' },
];

const TYPE_COLOR = {
  order: 'bg-blue-100 text-blue-600',
  payment: 'bg-green-100 text-green-600',
  alert: 'bg-orange-100 text-orange-600',
  lead: 'bg-purple-100 text-purple-600',
  delivery: 'bg-teal-100 text-teal-600',
};

export default function TopBar() {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const removeNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const getRoleIcon = () => {
    if (user?.role === 'super_admin') return <Crown size={14} className="text-yellow-500" />;
    if (user?.role === 'admin') return <Shield size={14} className="text-blue-600" />;
    return <User size={14} className="text-white" />;
  };

  const getRoleBg = () => {
    if (user?.role === 'super_admin') return 'bg-yellow-100';
    if (user?.role === 'admin') return 'bg-blue-100';
    return 'bg-[#1e88e5]';
  };

  const getRoleLabel = () => {
    const map = { super_admin: 'Super Admin', admin: 'Admin', sales_executive: 'Sales', retailer: 'Retailer', manager: 'Manager', accountant: 'Accountant' };
    return map[user?.role] || 'User';
  };

  return (
    <header className="sticky top-0 z-30 h-[48px] bg-white border-b border-[#e0e0e0] flex items-center justify-between px-4 gap-2">
      {/* Left — role badge */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          user?.role === 'super_admin' ? 'bg-yellow-100 text-yellow-800' :
          user?.role === 'admin'       ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-700'
        }`}>
          {getRoleLabel()}
        </span>
      </div>

      {/* Right — notification + user */}
      <div className="flex items-center gap-1">

        {/* ── Notification Bell ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 text-[#757575] hover:bg-[#f5f5f5] rounded transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-[340px] bg-white border border-[#e0e0e0] rounded-lg shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <span className="text-sm font-semibold text-[#333]">
                  Notifications {unreadCount > 0 && <span className="ml-1 text-xs font-normal text-[#9e9e9e]">({unreadCount} unread)</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#1e88e5] hover:underline flex items-center gap-1">
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f5f5f5]">
                {notifications.length === 0 && (
                  <p className="text-center text-sm text-[#9e9e9e] py-8">No notifications</p>
                )}
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors ${!n.read ? 'bg-[#f0f7ff]' : ''}`}
                    onClick={() => markRead(n.id)}
                  >
                    {/* Type dot */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${TYPE_COLOR[n.type] || 'bg-gray-100 text-gray-600'}`}>
                      {n.type?.[0]?.toUpperCase()}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-[#333]' : 'font-medium text-[#555]'}`}>{n.title}</p>
                      <p className="text-xs text-[#757575] mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-[#9e9e9e] mt-1">{n.time}</p>
                    </div>
                    {/* Remove */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotif(n.id); }}
                      className="flex-shrink-0 p-1 text-[#bdbdbd] hover:text-[#616161] hover:bg-[#f0f0f0] rounded self-start"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[#f0f0f0] text-center">
                  <button className="text-xs text-[#1e88e5] hover:underline">View all notifications</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User Avatar ── */}
        <button
          type="button"
          className="flex items-center gap-2 p-1.5 pl-2 pr-3 text-[#333] hover:bg-[#f5f5f5] rounded border border-[#e0e0e0] ml-1 transition-colors"
        >
          <div className={`w-7 h-7 ${getRoleBg()} rounded-full flex items-center justify-center`}>
            {getRoleIcon()}
          </div>
          <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
        </button>

      </div>
    </header>
  );
}
