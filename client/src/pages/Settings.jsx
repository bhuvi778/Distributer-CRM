import { useState, useEffect } from 'react';
import { Bell, Building2, Link2, RefreshCw, Save, Shield, Smartphone, Tags } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';

const DEFAULTS = {
  companyName: 'DistriFlow',
  gstin: '',
  pan: '',
  address: '',
  phone: '',
  email: '',
  defaultGstRate: 18,
  invoicePrefix: 'INV',
  defaultPaymentTerms: '30 days',
  defaultTransactionState: 'draft',
  taxRates: [
    { name: 'GST 0%', rate: 0, type: 'GST', isDefault: false },
    { name: 'GST 5%', rate: 5, type: 'GST', isDefault: false },
    { name: 'GST 12%', rate: 12, type: 'GST', isDefault: false },
    { name: 'GST 18%', rate: 18, type: 'GST', isDefault: true },
    { name: 'GST 28%', rate: 28, type: 'GST', isDefault: false },
  ],
  mobileApp: { enabled: true, salesOrder: true, production: true, reports: true, liveLocation: true },
  rights: { salesOrder: 'admin, manager, sales_rep', production: 'admin, manager, manufacturer', reports: 'admin, manager, accountant' },
  thirdPartyIntegrations: { smsProvider: '', whatsappProvider: '', emailProvider: '', apiKey: '', webhookUrl: '' },
  tallyIntegration: { enabled: false, serverUrl: '', companyName: '', busyEnabled: false, busyServerUrl: '', busyCompanyName: '', lastSync: null },
  notifications: {
    salesOrder: { sms: false, whatsapp: true, email: true },
    invoice: { sms: false, whatsapp: true, email: true },
    paymentReceived: { sms: true, whatsapp: true, email: true },
  },
};

const TABS = [
  { id: 'company', label: 'Company Details', icon: Building2 },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone },
  { id: 'rights', label: 'Rights', icon: Shield },
  { id: 'integrations', label: '3rd Party Integrations', icon: Link2 },
  { id: 'tally', label: 'Tally/Busy', icon: RefreshCw },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'tax', label: 'Tax Rates', icon: Tags },
];

const mergeSettings = (value = {}) => ({
  ...DEFAULTS,
  ...value,
  taxRates: value.taxRates?.length ? value.taxRates : DEFAULTS.taxRates,
  mobileApp: { ...DEFAULTS.mobileApp, ...(value.mobileApp || {}) },
  rights: { ...DEFAULTS.rights, ...(value.rights || {}) },
  thirdPartyIntegrations: { ...DEFAULTS.thirdPartyIntegrations, ...(value.thirdPartyIntegrations || {}) },
  tallyIntegration: { ...DEFAULTS.tallyIntegration, ...(value.tallyIntegration || {}) },
  notifications: {
    salesOrder: { ...DEFAULTS.notifications.salesOrder, ...(value.notifications?.salesOrder || {}) },
    invoice: { ...DEFAULTS.notifications.invoice, ...(value.notifications?.invoice || {}) },
    paymentReceived: { ...DEFAULTS.notifications.paymentReceived, ...(value.notifications?.paymentReceived || {}) },
  },
});

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded border border-surface-100 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    </label>
  );
}

export default function SettingsPage() {
  const { can, isSalesRep, isAccountant, isDistributor } = useAuth();
  const canEdit = can('companySettings');
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('company');
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(mergeSettings(r.data))).catch(console.error);
  }, []);

  if (!settings) return <div className="animate-pulse text-center py-20">Loading settings...</div>;

  const update = (field, value) => setSettings((p) => ({ ...p, [field]: value }));
  const nested = (group, field, value) => setSettings((p) => ({ ...p, [group]: { ...(p[group] || {}), [field]: value } }));
  const notification = (event, mode, value) => setSettings((p) => ({
    ...p,
    notifications: {
      ...p.notifications,
      [event]: { ...(p.notifications?.[event] || {}), [mode]: value },
    },
  }));

  const handleSave = async () => {
    const { data } = await api.put('/settings', settings);
    setSettings(mergeSettings(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTallySync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/settings/tally-sync');
      alert(data.message);
      const { data: updated } = await api.get('/settings');
      setSettings(mergeSettings(updated));
    } catch {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const addTaxRate = () => update('taxRates', [...settings.taxRates, { name: '', rate: 0, type: 'GST', isDefault: false }]);
  const updateTaxRate = (idx, field, value) => update('taxRates', settings.taxRates.map((rate, i) => (
    i === idx ? { ...rate, [field]: value } : field === 'isDefault' && value ? { ...rate, isDefault: false } : rate
  )));
  const removeTaxRate = (idx) => update('taxRates', settings.taxRates.filter((_, i) => i !== idx));

  return (
    <div>
      <PageHeader
        title="Settings"
        description={canEdit ? 'Configure company, app rights, integrations, notifications and tax defaults' : 'View company settings. Contact admin to change configuration.'}
      />

      {!canEdit && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          {isSalesRep && 'Sales Rep portal is read-only for company settings.'}
          {isAccountant && 'Finance portal settings are read-only. Contact admin for changes.'}
          {isDistributor && 'Distributor portal has limited settings access.'}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm ${activeTab === id ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-surface-100 text-surface-800/70'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        {activeTab === 'company' && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Building2 size={18} /> Company Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'companyName', label: 'Company Name' },
                { key: 'gstin', label: 'GSTIN' },
                { key: 'pan', label: 'PAN' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'address', label: 'Address', full: true },
              ].map(({ key, label, type, full }) => (
                <div key={key} className={full ? 'sm:col-span-2' : ''}>
                  <Field label={label}>
                    <input type={type || 'text'} value={settings[key] || ''} onChange={(e) => update(key, e.target.value)} className="input-field" disabled={!canEdit} />
                  </Field>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mobile' && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Smartphone size={18} /> Mobile App</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle label="Enable Mobile App" checked={settings.mobileApp.enabled} onChange={(v) => nested('mobileApp', 'enabled', v)} disabled={!canEdit} />
              <Toggle label="Sales Order" checked={settings.mobileApp.salesOrder} onChange={(v) => nested('mobileApp', 'salesOrder', v)} disabled={!canEdit} />
              <Toggle label="Production" checked={settings.mobileApp.production} onChange={(v) => nested('mobileApp', 'production', v)} disabled={!canEdit} />
              <Toggle label="Report" checked={settings.mobileApp.reports} onChange={(v) => nested('mobileApp', 'reports', v)} disabled={!canEdit} />
              <Toggle label="Live Location" checked={settings.mobileApp.liveLocation} onChange={(v) => nested('mobileApp', 'liveLocation', v)} disabled={!canEdit} />
            </div>
          </div>
        )}

        {activeTab === 'rights' && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={18} /> Rights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['salesOrder', 'Sales Order Rights'],
                ['production', 'Production Rights'],
                ['reports', 'Report Rights'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea rows={4} value={settings.rights?.[key] || ''} onChange={(e) => nested('rights', key, e.target.value)} className="input-field" disabled={!canEdit} />
                </Field>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Link2 size={18} /> 3rd Party Integrations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['smsProvider', 'SMS Provider'],
                ['whatsappProvider', 'WhatsApp Provider'],
                ['emailProvider', 'Email Provider'],
                ['apiKey', 'API Key'],
                ['webhookUrl', 'Webhook URL'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input value={settings.thirdPartyIntegrations?.[key] || ''} onChange={(e) => nested('thirdPartyIntegrations', key, e.target.value)} className="input-field" disabled={!canEdit} />
                </Field>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tally' && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><RefreshCw size={18} /> Tally/Busy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Toggle label="Enable Tally Sync" checked={settings.tallyIntegration?.enabled} onChange={(v) => nested('tallyIntegration', 'enabled', v)} disabled={!canEdit} />
              <Toggle label="Enable Busy Sync" checked={settings.tallyIntegration?.busyEnabled} onChange={(v) => nested('tallyIntegration', 'busyEnabled', v)} disabled={!canEdit} />
              <Field label="Tally Server URL">
                <input value={settings.tallyIntegration?.serverUrl || ''} onChange={(e) => nested('tallyIntegration', 'serverUrl', e.target.value)} className="input-field" placeholder="http://localhost:9000" disabled={!canEdit} />
              </Field>
              <Field label="Tally Company Name">
                <input value={settings.tallyIntegration?.companyName || ''} onChange={(e) => nested('tallyIntegration', 'companyName', e.target.value)} className="input-field" disabled={!canEdit} />
              </Field>
              <Field label="Busy Server URL">
                <input value={settings.tallyIntegration?.busyServerUrl || ''} onChange={(e) => nested('tallyIntegration', 'busyServerUrl', e.target.value)} className="input-field" disabled={!canEdit} />
              </Field>
              <Field label="Busy Company Name">
                <input value={settings.tallyIntegration?.busyCompanyName || ''} onChange={(e) => nested('tallyIntegration', 'busyCompanyName', e.target.value)} className="input-field" disabled={!canEdit} />
              </Field>
            </div>
            <div className="flex items-center gap-4 mt-4">
              {canEdit && (
                <button onClick={handleTallySync} disabled={syncing} className="btn-accent">
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync with Tally Now'}
                </button>
              )}
              {settings.tallyIntegration?.lastSync && (
                <p className="text-sm text-surface-800/50">Last synced: {new Date(settings.tallyIntegration.lastSync).toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell size={18} /> Notifications</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="table-header">Event</th>
                    <th className="table-header">SMS</th>
                    <th className="table-header">WhatsApp</th>
                    <th className="table-header">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {[
                    ['salesOrder', 'Sales Order'],
                    ['invoice', 'Invoice'],
                    ['paymentReceived', 'Payment Received'],
                  ].map(([event, label]) => (
                    <tr key={event}>
                      <td className="table-cell font-medium">{label}</td>
                      {['sms', 'whatsapp', 'email'].map((mode) => (
                        <td key={mode} className="table-cell">
                          <input type="checkbox" checked={!!settings.notifications?.[event]?.[mode]} onChange={(e) => notification(event, mode, e.target.checked)} disabled={!canEdit} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Tags size={18} /> Tax Rates</h3>
              {canEdit && <button onClick={addTaxRate} className="btn-secondary !py-2">Add Tax Rate</button>}
            </div>
            <div className="space-y-3">
              <Field label="Default GST Rate (%)">
                <input type="number" value={settings.defaultGstRate} onChange={(e) => update('defaultGstRate', Number(e.target.value))} className="input-field max-w-xs" disabled={!canEdit} />
              </Field>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50">
                    <tr><th className="table-header">Name</th><th className="table-header">Rate %</th><th className="table-header">Type</th><th className="table-header">Default</th><th className="table-header"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {settings.taxRates.map((rate, idx) => (
                      <tr key={idx}>
                        <td className="table-cell"><input value={rate.name || ''} onChange={(e) => updateTaxRate(idx, 'name', e.target.value)} className="input-field !py-2" disabled={!canEdit} /></td>
                        <td className="table-cell"><input type="number" value={rate.rate ?? 0} onChange={(e) => updateTaxRate(idx, 'rate', Number(e.target.value))} className="input-field !py-2 w-24" disabled={!canEdit} /></td>
                        <td className="table-cell"><input value={rate.type || 'GST'} onChange={(e) => updateTaxRate(idx, 'type', e.target.value)} className="input-field !py-2 w-28" disabled={!canEdit} /></td>
                        <td className="table-cell"><input type="checkbox" checked={!!rate.isDefault} onChange={(e) => updateTaxRate(idx, 'isDefault', e.target.checked)} disabled={!canEdit} /></td>
                        <td className="table-cell text-right">{canEdit && <button onClick={() => removeTaxRate(idx)} className="text-red-600 text-xs">Remove</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end pt-5 mt-5 border-t border-surface-100">
            <button onClick={handleSave} className="btn-primary"><Save size={16} /> {saved ? 'Saved!' : 'Save Changes'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
