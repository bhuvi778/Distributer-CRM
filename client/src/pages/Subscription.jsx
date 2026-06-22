import { Download } from 'lucide-react';

const formatPlanDate = (date) => date.toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).replace(',', '');

export default function Subscription() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const startText = formatPlanDate(start);
  const endText = formatPlanDate(end);

  return (
    <div className="min-h-[calc(100vh-52px)] bg-white px-2 py-4">
      <section className="border-b border-[#d8dce2] px-4 pb-6">
        <h1 className="mb-5 text-[28px] font-normal text-[#111827]">Credits</h1>
        <div className="grid grid-cols-3 gap-20 px-6">
          {['SMS', 'Whatsapp', 'Mail'].map((name) => (
            <div
              key={name}
              className="flex h-[86px] items-center justify-center rounded-[8px] border-b-[7px] border-[#174bb8] bg-white text-[17px] font-semibold text-[#174bb8] shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-8">
        <h2 className="border-b border-[#d8dce2] pb-4 text-[28px] font-normal text-[#111827]">Subscription</h2>
        <div className="py-7 text-[22px] text-[#111827]">Active plan</div>
        <div className="grid min-h-[158px] grid-cols-[1fr_360px] items-center bg-[#f1f4fc] px-9">
          <div>
            <div className="text-[28px] font-bold text-[#174bb8]">Pro Trial</div>
            <div className="mt-1 text-[20px] font-semibold text-[#174bb8]">2 users</div>
            <div className="mt-6 text-[16px] text-[#111827]">
              <span className="text-[#8a93a2]">Start date: </span>{startText}
              <span className="mx-3 text-[#c9ced8]">|</span>
              <span className="text-[#8a93a2]">End date: </span>{endText}
            </div>
          </div>
          <div className="flex flex-col items-start justify-center gap-9 pl-8">
            <span className="text-[16px] font-medium text-red-600">6 days left</span>
            <button type="button" className="rounded-[3px] bg-[#174bb8] px-3 py-2 text-[18px] font-semibold text-white hover:bg-[#123f9e]">
              Upgrade
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pt-9">
        <h2 className="mb-5 text-[22px] font-normal text-[#111827]">Payment History</h2>
        <table className="w-full border-collapse bg-white text-left text-[15px]">
          <thead>
            <tr className="h-[64px] bg-[#eef1f9] text-[16px] font-semibold">
              <th className="px-4">Plan name</th>
              <th className="px-4">User</th>
              <th className="px-4">End date</th>
              <th className="px-4">Amount</th>
              <th className="px-4">Download</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-[54px] border-b border-[#edf0f4]">
              <td className="px-4">Pro Trial</td>
              <td className="px-4">2</td>
              <td className="px-4">{endText}</td>
              <td className="px-4">₹ 0.00</td>
              <td className="px-4 text-[#11b927]"><Download size={22} strokeWidth={2} /></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
