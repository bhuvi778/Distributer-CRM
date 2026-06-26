import { useMemo, useState } from 'react';
import { Megaphone, Plus, Send } from 'lucide-react';

const CHANNELS = ['WhatsApp', 'SMS', 'Email', 'In-app'];
const TEMPLATES = [
  'Festival offer',
  'Repeat purchase reminder',
  'Inactive customer winback',
  'New arrival announcement',
  'Payment due reminder',
];

const loadCampaigns = () => JSON.parse(localStorage.getItem('retailerCampaigns') || '[]');
const saveCampaigns = (campaigns) => localStorage.setItem('retailerCampaigns', JSON.stringify(campaigns));

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState(loadCampaigns);
  const [form, setForm] = useState({
    name: '',
    template: TEMPLATES[0],
    channel: CHANNELS[0],
    audience: 'All customers',
    status: 'draft',
  });

  const activeCount = useMemo(() => campaigns.filter((campaign) => campaign.status === 'active').length, [campaigns]);

  const createCampaign = () => {
    if (!form.name.trim()) return alert('Campaign name is required');
    const next = [
      { ...form, id: Date.now(), createdAt: new Date().toISOString(), status: 'active' },
      ...campaigns,
    ];
    setCampaigns(next);
    saveCampaigns(next);
    setForm((prev) => ({ ...prev, name: '' }));
  };

  const toggleStatus = (id) => {
    const next = campaigns.map((campaign) => (
      campaign.id === id
        ? { ...campaign, status: campaign.status === 'active' ? 'paused' : 'active' }
        : campaign
    ));
    setCampaigns(next);
    saveCampaigns(next);
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Campaigns</h1>
        <div className="rounded-[3px] bg-[#ecfdf5] px-3 py-2 text-sm font-semibold text-[#047857]">{activeCount} Active</div>
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-6">
        <section className="so-table-panel p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#174bb8] text-white">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#101828]">Create campaign</h2>
              <p className="text-sm text-[#667085]">Offer, reminder and review campaigns for customers.</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="so-label">Campaign name</span>
              <input className="so-input w-full" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="June refill reminder" />
            </label>
            <label className="block">
              <span className="so-label">Template</span>
              <select className="so-input so-select w-full" value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value })}>
                {TEMPLATES.map((template) => <option key={template}>{template}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="so-label">Channel</span>
              <select className="so-input so-select w-full" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
                {CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="so-label">Audience</span>
              <select className="so-input so-select w-full" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
                <option>All customers</option>
                <option>High value customers</option>
                <option>Inactive customers</option>
                <option>Customers due for refill</option>
              </select>
            </label>
            <button type="button" onClick={createCampaign} className="so-btn-primary w-full justify-center">
              <Plus size={16} /> Create & Launch
            </button>
          </div>
        </section>

        <section className="so-table-panel">
          <table className="so-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Template</th>
                <th>Channel</th>
                <th>Audience</th>
                <th>Status</th>
                <th className="w-[130px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-[#667085]">No campaigns created yet.</td></tr>
              )}
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="font-medium">{campaign.name}</td>
                  <td>{campaign.template}</td>
                  <td>{campaign.channel}</td>
                  <td>{campaign.audience}</td>
                  <td><span className={`so-badge ${campaign.status === 'active' ? 'so-badge-success' : 'so-badge-info'}`}>{campaign.status}</span></td>
                  <td>
                    <button type="button" onClick={() => toggleStatus(campaign.id)} className="so-btn-secondary text-sm">
                      <Send size={14} /> {campaign.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
