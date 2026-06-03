import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Shield, Save } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';

export default function SettingsPage() {
  const { can, isSalesRep, isAccountant, isDistributor } = useAuth();
  const canEdit = can('companySettings');
  const [settings, setSettings] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data)).catch(console.error);
  }, []);

  const handleSave = async () => {
    await api.put('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTallySync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/settings/tally-sync');
      alert(data.message);
      const { data: updated } = await api.get('/settings');
      setSettings(updated);
    } catch (err) {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (!settings) return <div className="animate-pulse text-center py-20">Loading settings...</div>;

  const update = (field, value) => setSettings({ ...settings, [field]: value });
  const updateTally = (field, value) => setSettings({
    ...settings,
    tallyIntegration: { ...settings.tallyIntegration, [field]: value },
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        description={
          canEdit
            ? 'Configure company details, GST defaults and Tally integration'
            : 'View company settings. Contact admin to change company configuration.'
        }
      />

      {!canEdit && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          {isSalesRep && 'Sales Rep portal — sirf profile view. Company settings admin/manager change karte hain.'}
          {isAccountant && 'Finance portal — company settings read-only. Changes ke liye admin se contact karein.'}
          {isDistributor && 'Distributor portal — limited settings access.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Settings size={18} /> Company Details</h3>
          <div className="space-y-4">
            {[
              { key: 'companyName', label: 'Company Name' },
              { key: 'gstin', label: 'GSTIN' },
              { key: 'pan', label: 'PAN' },
              { key: 'address', label: 'Address', full: true },
              { key: 'phone', label: 'Phone' },
              { key: 'email', label: 'Email', type: 'email' },
            ].map(({ key, label, type, full }) => (
              <div key={key} className={full ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium mb-1.5">{label}</label>
                <input
                  type={type || 'text'}
                  value={settings[key] || ''}
                  onChange={(e) => update(key, e.target.value)}
                  className="input-field"
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={18} /> Transaction Defaults</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Default GST Rate (%)</label>
              <input type="number" value={settings.defaultGstRate} onChange={(e) => update('defaultGstRate', Number(e.target.value))} className="input-field" disabled={!canEdit} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default Payment Terms</label>
              <input value={settings.defaultPaymentTerms} onChange={(e) => update('defaultPaymentTerms', e.target.value)} className="input-field" disabled={!canEdit} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default Transaction State</label>
              <select value={settings.defaultTransactionState} onChange={(e) => update('defaultTransactionState', e.target.value)} className="input-field" disabled={!canEdit}>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="sent">Sent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Invoice Prefix</label>
              <input value={settings.invoicePrefix} onChange={(e) => update('invoicePrefix', e.target.value)} className="input-field" disabled={!canEdit} />
            </div>
            {canEdit && (
              <button onClick={handleSave} className="btn-primary w-full">
                <Save size={16} /> {saved ? 'Saved!' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><RefreshCw size={18} /> Tally Integration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <input type="checkbox" checked={settings.tallyIntegration?.enabled} onChange={(e) => updateTally('enabled', e.target.checked)} disabled={!canEdit} />
                Enable Tally Sync
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tally Server URL</label>
              <input value={settings.tallyIntegration?.serverUrl || ''} onChange={(e) => updateTally('serverUrl', e.target.value)} className="input-field" placeholder="http://localhost:9000" disabled={!canEdit} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tally Company Name</label>
              <input value={settings.tallyIntegration?.companyName || ''} onChange={(e) => updateTally('companyName', e.target.value)} className="input-field" disabled={!canEdit} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {canEdit && (
              <button onClick={handleTallySync} disabled={syncing} className="btn-accent">
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync with Tally Now'}
              </button>
            )}
            {settings.tallyIntegration?.lastSync && (
              <p className="text-sm text-surface-800/50">
                Last synced: {new Date(settings.tallyIntegration.lastSync).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
