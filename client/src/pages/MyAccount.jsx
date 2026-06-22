import { useAuth } from '../context/AuthContext';

const titleCase = (value) => String(value || '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

export default function MyAccount() {
  const { user } = useAuth();
  const details = [
    ['Name', user?.name || 'Bhuvi'],
    ['Email', user?.email || 'bmfloveyou@gmail.com'],
    ['Mobile', user?.mobile || user?.phone || ''],
    ['Role', titleCase(user?.role || 'Admin')],
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#eef1f5]">
      <div className="flex h-[64px] items-center border-b border-[#d8dce2] bg-white px-5 shadow-[0_2px_7px_rgba(15,23,42,0.08)]">
        <h1 className="text-[28px] font-normal text-[#0a0f18]">My Account</h1>
      </div>

      <section className="m-1 border border-[#d6dce5] bg-white shadow-[0_2px_7px_rgba(15,23,42,0.14)]">
        <div className="flex h-[55px] items-center border-b border-[#dde2ea] bg-[#eef1f9] px-5 text-[20px] font-semibold text-[#111827]">
          User details
        </div>
        <div>
          {details.map(([label, value]) => (
            <div key={label} className="grid min-h-[60px] grid-cols-[240px_1fr] items-center border-b border-[#edf0f4] px-7 last:border-b-0">
              <div className="text-[16px] font-semibold text-[#7b8492]">{label}</div>
              <div className="text-[15px] text-[#0f172a]">{value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
