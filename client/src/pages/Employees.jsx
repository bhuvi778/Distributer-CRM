import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Edit2, RefreshCw, Shield, Check, Upload, Settings, X } from 'lucide-react';
import api from '../api/axios';
import SlidePanel from '../components/common/SlidePanel';
import { useAuth } from '../context/AuthContext';
import {
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  USER_ROLES,
  getRoleDefaultModuleIds,
  getRoleDefaultActions,
  pathsFromModuleIds,
  moduleIdsFromPaths,
} from '../config/roles';

// Roles visible in Add/Edit — not super_admin or admin (they have their own pages)
const ALLOWED_ROLES = USER_ROLES.filter(
  (r) => !['super_admin', 'admin'].includes(r.value),
);

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'sales_rep',
  jobTitle: '',
  department: '',
  employeeId: '',
  useCustomAccess: false,
  allowedModules: pathsFromModuleIds(getRoleDefaultModuleIds('sales_rep')),
  permissions: getRoleDefaultActions('sales_rep'),
  isActive: true,
});

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const parseLine = (line) => line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = Object.fromEntries(headers.map((h, idx) => [h, cells[idx] || '']));
    return {
      name: row.name,
      email: row.email,
      password: row.password,
      phone: row.phone,
      role: row.role || row.usertype || 'employee',
      jobTitle: row.jobtitle,
      department: row.department,
      employeeId: row.employeeid,
      isActive: !['inactive', 'false', 'no'].includes(String(row.status || '').toLowerCase()),
    };
  });
};

function UserSettingsModal({ customFields, setCustomFields, saving, onClose, onSave }) {
  const addCustomField = () => setCustomFields((fields) => [...fields, { label: '' }]);
  const updateCustomField = (index, value) => setCustomFields((fields) => fields.map((field, idx) => (idx === index ? { ...field, label: value } : field)));
  const removeCustomField = (index) => setCustomFields((fields) => fields.filter((_, idx) => idx !== index));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[168px]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-[min(624px,calc(100vw-32px))] bg-white rounded-[3px] border border-[#d7dce5] shadow-2xl">
        <div className="h-[66px] flex items-center justify-between px-5 border-b border-[#eceff4]">
          <h2 className="text-xl font-semibold text-[#202733]">User Settings</h2>
          <button type="button" onClick={onClose} className="text-[#777] hover:text-[#111]">
            <X size={22} strokeWidth={3} />
          </button>
        </div>
        <div className="px-5 py-5 min-h-[84px] border-b border-[#eceff4]">
          {customFields.length > 0 && (
            <div className="space-y-2 mb-3">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className="so-input flex-1"
                    value={field.label}
                    onChange={(event) => updateCustomField(index, event.target.value)}
                    placeholder="Custom field name"
                  />
                  <button type="button" onClick={() => removeCustomField(index)} className="h-9 w-9 rounded-[3px] bg-[#f8fafc] text-[#111827] inline-flex items-center justify-center">
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={addCustomField} className="mx-auto flex items-center justify-center text-[#005bd3] text-base underline underline-offset-2">
            + Add custom field
          </button>
        </div>
        <div className="h-[66px] px-5 bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[34px] min-w-[122px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} disabled={saving} className="h-[34px] min-w-[104px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsDoc, setSettingsDoc] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const importRef = useRef(null);

  // Group modules by section for the permissions UI
  const moduleSections = useMemo(() => {
    const map = {};
    PERMISSION_MODULES.filter((m) => !m.adminOnly).forEach((m) => {
      if (!map[m.section]) map[m.section] = [];
      map[m.section].push(m);
    });
    return map;
  }, []);

  const selectedModuleIds = useMemo(
    () => moduleIdsFromPaths(form.allowedModules),
    [form.allowedModules],
  );

  // ── Data ──────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  const fetchUserSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettingsDoc(data);
      const fields = data?.userSettings?.customFields;
      setCustomFields(Array.isArray(fields) ? fields : JSON.parse(localStorage.getItem('userCustomFields') || '[]'));
    } catch (error) {
      setCustomFields(JSON.parse(localStorage.getItem('userCustomFields') || '[]'));
    }
  };

  useEffect(() => { fetchUserSettings(); }, []);

  const filtered = employees.filter((e) =>
    (!roleFilter || e.role === roleFilter) &&
    `${e.name} ${e.email} ${e.role} ${e.department}`.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Form helpers ──────────────────────────────────────────────
  const applyRoleDefaults = (role) => {
    const ids = getRoleDefaultModuleIds(role);
    const actions = getRoleDefaultActions(role);
    setForm((f) => ({
      ...f,
      role,
      allowedModules: pathsFromModuleIds(ids),
      permissions: actions,
      useCustomAccess: false,
    }));
  };

  const toggleModule = (moduleId) => {
    setForm((f) => {
      const ids = moduleIdsFromPaths(f.allowedModules);
      const next = ids.includes(moduleId)
        ? ids.filter((id) => id !== moduleId)
        : [...ids, moduleId];
      return { ...f, allowedModules: pathsFromModuleIds(next), useCustomAccess: true };
    });
  };

  const toggleAction = (actionId) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(actionId)
        ? f.permissions.filter((p) => p !== actionId)
        : [...f.permissions, actionId],
    }));
  };

  const selectAllInSection = (modules) => {
    setForm((f) => {
      const ids = moduleIdsFromPaths(f.allowedModules);
      const sectionIds = modules.map((m) => m.id);
      const allSelected = sectionIds.every((id) => ids.includes(id));
      const next = allSelected
        ? ids.filter((id) => !sectionIds.includes(id))
        : [...new Set([...ids, ...sectionIds])];
      return { ...f, allowedModules: pathsFromModuleIds(next), useCustomAccess: true };
    });
  };

  // ── Open add / edit ───────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setPanelOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('create') === '1' && isAdmin) {
      openAdd();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isAdmin]);

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      password: '',
      phone: emp.phone || '',
      role: emp.role,
      jobTitle: emp.jobTitle || '',
      department: emp.department || '',
      employeeId: emp.employeeId || '',
      useCustomAccess: !!emp.useCustomAccess,
      allowedModules: emp.allowedModules?.length ? emp.allowedModules : pathsFromModuleIds(getRoleDefaultModuleIds(emp.role)),
      permissions: emp.permissions || getRoleDefaultActions(emp.role),
      isActive: emp.isActive !== false,
    });
    setPanelOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.email) return alert('Name and email are required');
    if (!editing && !form.password) return alert('Password required for new user');
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) await api.put(`/employees/${editing._id}`, payload);
      else await api.post('/employees', payload);
      setPanelOpen(false);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (emp) => {
    if (!confirm(`Deactivate ${emp.name}?`)) return;
    try { await api.delete(`/employees/${emp._id}`); fetchData(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCSV(await file.text()).filter((row) => row.name && row.email);
      if (!rows.length) return alert('No valid user rows found. CSV must include name and email.');
      const { data } = await api.post('/employees/import', { rows });
      alert(`Imported ${data.imported || 0} users. Skipped ${data.skipped || 0}.`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Import failed');
    } finally {
      event.target.value = '';
    }
  };

  const roleLabel = (role) => USER_ROLES.find((r) => r.value === role)?.label || role;

  const saveUserSettings = async () => {
    const fields = customFields
      .map((field) => ({ label: field.label?.trim() || '' }))
      .filter((field) => field.label);
    setSettingsSaving(true);
    try {
      const payload = {
        ...(settingsDoc || {}),
        userSettings: { ...(settingsDoc?.userSettings || {}), customFields: fields },
      };
      const { data } = await api.put('/settings', payload);
      setSettingsDoc(data);
      setCustomFields(fields);
      localStorage.setItem('userCustomFields', JSON.stringify(fields));
      setSettingsOpen(false);
    } catch (error) {
      localStorage.setItem('userCustomFields', JSON.stringify(fields));
      setCustomFields(fields);
      setSettingsOpen(false);
    } finally {
      setSettingsSaving(false);
    }
  };

  const toggleActive = async (emp) => {
    try {
      await api.put(`/employees/${emp._id}`, { isActive: emp.isActive === false });
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update status');
    }
  };

  return (
    <div className="so-module-page">
      {/* Header */}
      <div className="so-titlebar">
        <h1 className="so-title">Users</h1>
        {isAdmin && (
          <div className="so-actions">
            <button type="button" onClick={() => setSettingsOpen(true)} className="h-10 w-16 rounded-[3px] border border-[#6b7280] bg-white text-[#6b7280] inline-flex items-center justify-center shadow-[0_0_0_2px_rgba(15,23,42,0.12)]">
              <Settings size={20} />
            </button>
            <button type="button" onClick={() => importRef.current?.click()} className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm">
              <Upload size={15} /> Import
            </button>
            <button type="button" onClick={openAdd} className="so-btn-primary text-sm">+ New</button>
            <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
          </div>
        )}
      </div>

      {/* Search / filters */}
      <div className="so-filterbar">
        <div className="so-search-group">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="so-input"
          />
          <button type="button" onClick={fetchData} className="so-search-button"><Search size={18} /></button>
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="so-input so-select w-[240px]">
          <option value="">Select User type</option>
          {USER_ROLES.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="so-table-panel min-h-[556px]">
        <table className="so-table so-users-table">
          <thead>
            <tr>
              <th className="w-[130px]">Id</th><th>User Name</th><th>Mobile</th><th>Email</th>
              <th>Role</th><th>Status</th>
              {isAdmin && <th className="w-[80px]"></th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">No users found</td></tr>
            )}
            {filtered.map((emp, idx) => (
              <tr key={emp._id}>
                <td>{idx + 1}</td>
                <td><button type="button" onClick={() => openEdit(emp)} className="text-[#006dff] hover:underline">{emp.name}</button></td>
                <td>{emp.phone || ''}</td>
                <td>{emp.email || ''}</td>
                <td><span className="so-badge so-badge-info capitalize">{roleLabel(emp.role)}</span></td>
                <td>
                  <button type="button" onClick={() => toggleActive(emp)} className={`so-switch ${emp.isActive !== false ? 'so-switch-on' : ''}`} aria-label="Toggle user status" />
                </td>
                <td className="text-[#757575]">{emp.department || '—'}</td>
                <td className="hidden">
                  {emp.useCustomAccess ? (
                    <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded w-fit">
                      <Shield size={11} /> Custom ({emp.allowedModules?.length || 0} modules)
                    </span>
                  ) : (
                    <span className="text-xs text-[#757575]">Role defaults</span>
                  )}
                </td>
                <td className="hidden">
                  <span className={`so-badge ${emp.isActive !== false ? 'so-badge-success' : 'so-badge-danger'}`}>
                    {emp.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {isAdmin && (
                  <td>
                    <button type="button" onClick={() => openEdit(emp)} className="so-icon-btn !w-10 !h-10" title="Edit"><Edit2 size={16} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Slide Panel ── */}
      {settingsOpen && (
        <UserSettingsModal
          customFields={customFields}
          setCustomFields={setCustomFields}
          saving={settingsSaving}
          onClose={() => setSettingsOpen(false)}
          onSave={saveUserSettings}
        />
      )}

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? `Edit — ${editing.name}` : 'Add New User'}
        width="w-[600px]"
      >
        <div className="space-y-5">

          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="so-label">Full Name *</label>
                <input className="so-input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div>
                <label className="so-label">Email *</label>
                <input type="email" className="so-input w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
              </div>
              <div>
                <label className="so-label">{editing ? 'New Password (optional)' : 'Password *'}</label>
                <input type="password" className="so-input w-full" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div>
                <label className="so-label">Phone</label>
                <input className="so-input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
              </div>
              <div>
                <label className="so-label">Role *</label>
                <select
                  className="so-input w-full"
                  value={form.role}
                  onChange={(e) => applyRoleDefaults(e.target.value)}
                >
                  {ALLOWED_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="so-label">Job Title</label>
                <input className="so-input w-full" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Field Executive" />
              </div>
              <div>
                <label className="so-label">Department</label>
                <input className="so-input w-full" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Sales" />
              </div>
              <div>
                <label className="so-label">Employee ID</label>
                <input className="so-input w-full" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP-001" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-[#1e88e5]" />
                <label htmlFor="isActive" className="so-label mb-0 cursor-pointer">Active — user can login</label>
              </div>
            </div>
          </div>

          {/* Sidebar Permissions */}
          <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] border-b border-[#e0e0e0]">
              <div>
                <p className="text-sm font-semibold text-[#333]">Sidebar Access Control</p>
                <p className="text-xs text-[#757575] mt-0.5">Select exactly which sidebar items this user can see</p>
              </div>
              <button
                type="button"
                onClick={() => applyRoleDefaults(form.role)}
                className="so-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Reset to role defaults"
              >
                <RefreshCw size={12} /> Reset to {USER_ROLES.find(r => r.value === form.role)?.label} defaults
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto p-4 space-y-5">
              {Object.entries(moduleSections).map(([section, modules]) => {
                const sectionIds = modules.map((m) => m.id);
                const allChecked = sectionIds.every((id) => selectedModuleIds.includes(id));
                const someChecked = sectionIds.some((id) => selectedModuleIds.includes(id));

                return (
                  <div key={section}>
                    {/* Section header with select-all */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                        onChange={() => selectAllInSection(modules)}
                        className="w-3.5 h-3.5 accent-[#1e88e5]"
                      />
                      <p className="text-xs font-semibold text-[#555] uppercase tracking-wider">{section}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 ml-5">
                      {modules.map((m) => (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer border transition-all ${
                            selectedModuleIds.includes(m.id)
                              ? 'bg-[#e3f2fd] border-[#90caf9] text-[#1565c0]'
                              : 'bg-white border-[#e0e0e0] text-[#555] hover:border-[#1e88e5] hover:bg-[#f5f5f5]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedModuleIds.includes(m.id)}
                            onChange={() => toggleModule(m.id)}
                            className="hidden"
                          />
                          <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedModuleIds.includes(m.id) ? 'bg-[#1e88e5] border-[#1e88e5]' : 'border-[#bdbdbd]'
                          }`}>
                            {selectedModuleIds.includes(m.id) && <Check size={9} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className="text-xs font-medium">{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected count */}
            <div className="px-4 py-2.5 bg-[#f8f9fa] border-t border-[#e0e0e0] flex items-center justify-between">
              <span className="text-xs text-[#757575]">
                <span className="font-semibold text-[#1e88e5]">{selectedModuleIds.length}</span> modules selected
              </span>
              {form.useCustomAccess && (
                <span className="text-xs text-purple-600 flex items-center gap-1">
                  <Shield size={11} /> Custom access active
                </span>
              )}
            </div>
          </div>

          {/* Action Permissions */}
          <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-[#f8f9fa] border-b border-[#e0e0e0]">
              <p className="text-sm font-semibold text-[#333]">Action Permissions</p>
              <p className="text-xs text-[#757575] mt-0.5">What actions this user can perform</p>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {PERMISSION_ACTIONS.map((a) => (
                <label key={a.id} className={`flex items-start gap-3 p-2.5 rounded cursor-pointer border transition-all ${
                  form.permissions.includes(a.id)
                    ? 'bg-[#e8f5e9] border-[#a5d6a7]'
                    : 'bg-white border-[#e0e0e0] hover:border-[#a5d6a7]'
                }`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    form.permissions.includes(a.id) ? 'bg-[#43a047] border-[#43a047]' : 'border-[#bdbdbd]'
                  }`} onClick={() => toggleAction(a.id)}>
                    {form.permissions.includes(a.id) && <Check size={9} className="text-white" strokeWidth={3} />}
                  </div>
                  <div onClick={() => toggleAction(a.id)} className="flex-1">
                    <p className="text-sm font-medium text-[#333]">{a.label}</p>
                    <p className="text-xs text-[#757575] mt-0.5">{a.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={handleSave} disabled={saving} className="so-btn-primary flex-1">
              {saving ? 'Saving…' : editing ? 'Update User' : 'Create User'}
            </button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
