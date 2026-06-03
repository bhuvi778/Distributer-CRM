import { useState, useEffect } from 'react';
import { Target, Trophy, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import useMasterData from '../hooks/useMasterData';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency } from '../utils/helpers';

const DESCRIPTION = 'Break company goals into individual KPIs per sales rep. Set revenue/order/collection targets, track achievement %, and view leaderboard for team recognition & incentives.';

export default function Targets() {
  const { users } = useMasterData();
  const { can } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'revenue', period: 'monthly', companyTarget: 0,
    startDate: '', endDate: '', assignments: [],
  });

  const salesReps = users.filter((u) => ['sales_rep', 'manager'].includes(u.role));

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/targets');
    setTargets(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const activeTarget = targets.find((t) => t.isActive) || targets[0];

  const addAssignment = () => {
    setForm({ ...form, assignments: [...form.assignments, { user: '', target: 0, achieved: 0, percentage: 0 }] });
  };

  const updateAssignment = (idx, field, val) => {
    const assignments = [...form.assignments];
    assignments[idx] = { ...assignments[idx], [field]: val };
    if (field === 'target' || field === 'achieved') {
      const t = Number(assignments[idx].target) || 0;
      const a = Number(assignments[idx].achieved) || 0;
      assignments[idx].percentage = t > 0 ? Math.round((a / t) * 100) : 0;
    }
    setForm({ ...form, assignments });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return alert('Enter target title');
    try {
      await api.post('/targets', { ...form, isActive: true });
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating target');
    }
  };

  const exportLeaderboard = () => {
    if (!activeTarget) return;
    exportToExcel(
      activeTarget.assignments.map((a) => ({
        name: a.user?.name,
        target: a.target,
        achieved: a.achieved,
        percentage: a.percentage,
      })),
      'target_leaderboard',
      [
        { key: 'name', label: 'Sales Rep', accessor: 'name' },
        { key: 'target', label: 'Target', accessor: 'target' },
        { key: 'achieved', label: 'Achieved', accessor: 'achieved' },
        { key: 'pct', label: 'Progress %', accessor: 'percentage' },
      ]
    );
  };

  return (
    <div>
      <PageHeader title="Target Meter" description={DESCRIPTION}
        onAdd={can('manageTargets') ? () => { setForm({ title: '', type: 'revenue', period: 'monthly', companyTarget: 0, startDate: '', endDate: '', assignments: [] }); setModalOpen(true); } : undefined}
        onRefresh={fetchData} onExport={exportLeaderboard} loading={loading} addLabel="Set New Target" />

      {activeTarget ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="stat-card">
              <p className="text-sm text-surface-800/60">Company Target</p>
              <p className="text-2xl font-bold font-mono mt-1">{formatCurrency(activeTarget.companyTarget)}</p>
              <p className="text-xs text-surface-800/40 mt-1">{activeTarget.title} ({activeTarget.period})</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-surface-800/60">Total Achieved</p>
              <p className="text-2xl font-bold font-mono mt-1 text-accent-600">
                {formatCurrency(activeTarget.assignments?.reduce((s, a) => s + a.achieved, 0) || 0)}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-surface-800/60">Overall Progress</p>
              <p className="text-2xl font-bold font-mono mt-1">
                {Math.round((activeTarget.assignments?.reduce((s, a) => s + a.achieved, 0) / activeTarget.companyTarget) * 100 || 0)}%
              </p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> Team Leaderboard</h3>
            <div className="space-y-4">
              {[...(activeTarget.assignments || [])].sort((a, b) => b.percentage - a.percentage).map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>#{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">{item.user?.name || 'Team Member'}</p>
                      <p className="text-sm font-mono font-medium">{item.percentage}%</p>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-brand-500 to-accent-500 h-2 rounded-full" style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-surface-800/50">
                      <span>Achieved: {formatCurrency(item.achieved)}</span>
                      <span>Target: {formatCurrency(item.target)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : !loading && (
        <div className="glass-card p-12 text-center text-surface-800/40">
          <Target size={48} className="mx-auto mb-4 opacity-30" />
          <p>No targets set. Click "Set New Target" to create KPIs for your team.</p>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Set Sales Target" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-yellow-50 rounded-xl text-xs text-yellow-800">
            Set company-wide target → Assign individual targets to each sales rep → Track progress on leaderboard.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">Target Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. March 2026 Sales Target" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Target Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="revenue">Revenue (₹)</option>
                <option value="orders">Number of Orders</option>
                <option value="collections">Collections (₹)</option>
                <option value="visits">Outlet Visits</option>
                <option value="units">Units Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Period</label>
              <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="input-field">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Company Target (₹) *</label>
              <input type="number" value={form.companyTarget} onChange={(e) => setForm({ ...form, companyTarget: Number(e.target.value) })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Assign to Sales Reps</label>
              <button type="button" onClick={addAssignment} className="text-sm text-brand-600 flex items-center gap-1"><Plus size={14} /> Add Rep</button>
            </div>
            {form.assignments.map((a, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 mb-2 p-2 bg-surface-50 rounded-lg">
                <select value={a.user} onChange={(e) => updateAssignment(idx, 'user', e.target.value)} className="input-field !py-1.5" required>
                  <option value="">Select rep...</option>
                  {salesReps.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
                <input type="number" placeholder="Target ₹" value={a.target} onChange={(e) => updateAssignment(idx, 'target', Number(e.target.value))} className="input-field !py-1.5" />
                <input type="number" placeholder="Achieved ₹" value={a.achieved} onChange={(e) => updateAssignment(idx, 'achieved', Number(e.target.value))} className="input-field !py-1.5" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Target</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
