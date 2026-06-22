import { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  Crown,
  Edit2,
  Eye,
  FileText,
  HelpCircle,
  Link2,
  Plus,
  Search,
  Smartphone,
  Tags,
  Trash2,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const GST_RATES = [
  { name: 'GST @ 0%', taxType: 'GST', type: 'GST', rate: 0 },
  { name: 'GST @ 0.1%', taxType: 'GST', type: 'GST', rate: 0.1 },
  { name: 'GST @ 0.25%', taxType: 'GST', type: 'GST', rate: 0.25 },
  { name: 'GST @ 1.5%', taxType: 'GST', type: 'GST', rate: 1.5 },
  { name: 'GST @ 3%', taxType: 'GST', type: 'GST', rate: 3 },
  { name: 'GST @ 5%', taxType: 'GST', type: 'GST', rate: 5 },
  { name: 'GST @ 6%', taxType: 'GST', type: 'GST', rate: 6 },
  { name: 'GST @ 12%', taxType: 'GST', type: 'GST', rate: 12 },
  { name: 'GST @ 18%', taxType: 'GST', type: 'GST', rate: 18 },
  { name: 'GST @ 28%', taxType: 'GST', type: 'GST', rate: 28 },
];

const DOCUMENT_TYPES = [
  'Estimate',
  'Sales Order',
  'Sales Invoice',
  'Sales Return',
  'Delivery Challan',
  'Credit Note',
  'Goods Receipt',
  'Work Order',
  'Purchase Order',
  'Purchase Invoice',
  'Purchase Return',
];

const TEMPLATE_CARDS = ['Standard (A5 / A4)', 'Basic', 'Simple', 'Compact', 'Tally', 'Evergreen'];

const DEFAULT_NOTIFICATION_MATRIX = {
  salesOrder: [
    { label: 'Sales order created', sms: false, whatsapp: false, email: false },
    { label: 'Sales order confirmed', sms: false, whatsapp: false, email: false },
    { label: 'Sales order dispatched', sms: false, whatsapp: false, email: false },
    { label: 'Sales order delivered', sms: false, whatsapp: false, email: false },
  ],
  salesInvoice: [
    { label: 'Sales invoice created', sms: false, whatsapp: false, email: false },
    { label: 'Sales invoice confirmed', sms: false, whatsapp: false, email: false },
    { label: 'Sales invoice dispatched', sms: false, whatsapp: false, email: false },
    { label: 'Sales invoice delivered', sms: false, whatsapp: false, email: false },
  ],
  paymentReceived: [
    { label: 'Payment credit created', sms: false, whatsapp: false, email: false },
    { label: 'Payment credit approved', sms: false, whatsapp: false, email: false },
    { label: 'Payment credit rejected', sms: false, whatsapp: false, email: false },
  ],
};

const DEFAULTS = {
  companyName: 'Avopay',
  phone: '',
  email: 'bmfloveyou@gmail.com',
  address: 'Noida',
  gstin: '',
  stateOfSupply: '',
  businessType: 'MANUFACTURER',
  currency: 'INR - Indian rupee',
  timezone: '',
  logo: '',
  signature: '',
  qrCode: '',
  officeHours: {
    workingDays: [],
    start: '09:00',
    end: '17:00',
    holidays: [],
  },
  bankDetails: {
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    branchName: '',
    ifscCode: '',
  },
  mobileAppSettings: {
    attendanceMandatory: false,
    attendancePhotoMandatory: true,
    odometerReading: true,
    odometerReadingMandatory: true,
    allowAddParty: true,
    allowUpdateParty: true,
    showMapView: false,
    showRoutePlanner: false,
    visitMandatory: false,
    allowMultipleVisit: false,
    allowVisitInOut: false,
    geofenceRange: false,
    showStock: true,
    allowReplacement: false,
    allowStockOut: true,
    allowPriceUpdate: true,
    allowFreeQuantity: true,
    allowDiscount: true,
    displayImage: true,
    defaultSalesType: 'Sales Invoice',
    allowOnlyVanSale: false,
    allowWhatsappSharing: true,
    allowStatusUpdate: false,
    allowInvoiceGenerationFromOrder: false,
    autoApproval: true,
    allowPaymentDiscount: false,
    allowOtherPayment: false,
  },
  tallyIntegration: {
    enabled: false,
    busyEnabled: false,
  },
  templateSettings: {
    selectedDocument: 'Sales Order',
    selectedTemplate: 'Simple',
  },
  notificationSettings: DEFAULT_NOTIFICATION_MATRIX,
  taxRates: GST_RATES,
};

const SETTINGS_TABS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'mobile', label: 'Mobile app', icon: Smartphone },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'taxes', label: 'Taxes', icon: Tags },
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const mergeSettings = (value = {}) => {
  const notificationSettings = value.notificationSettings || {};
  return {
    ...DEFAULTS,
    ...value,
    companyName: value.companyName || DEFAULTS.companyName,
    phone: value.phone ?? DEFAULTS.phone,
    email: value.email || DEFAULTS.email,
    address: value.address || DEFAULTS.address,
    stateOfSupply: value.stateOfSupply || DEFAULTS.stateOfSupply,
    businessType: value.businessType || DEFAULTS.businessType,
    currency: value.currency || DEFAULTS.currency,
    officeHours: { ...DEFAULTS.officeHours, ...(value.officeHours || {}) },
    bankDetails: { ...DEFAULTS.bankDetails, ...(value.bankDetails || {}) },
    mobileAppSettings: { ...DEFAULTS.mobileAppSettings, ...(value.mobileAppSettings || {}) },
    tallyIntegration: { ...DEFAULTS.tallyIntegration, ...(value.tallyIntegration || {}) },
    templateSettings: { ...DEFAULTS.templateSettings, ...(value.templateSettings || {}) },
    notificationSettings: {
      salesOrder: notificationSettings.salesOrder || DEFAULT_NOTIFICATION_MATRIX.salesOrder,
      salesInvoice: notificationSettings.salesInvoice || DEFAULT_NOTIFICATION_MATRIX.salesInvoice,
      paymentReceived: notificationSettings.paymentReceived || DEFAULT_NOTIFICATION_MATRIX.paymentReceived,
    },
    taxRates: value.taxRates?.length ? value.taxRates.map((rate) => ({
      ...rate,
      taxType: rate.taxType || rate.type || 'GST',
    })) : GST_RATES,
  };
};

function Field({ label, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[15px] font-medium text-slate-900">
        {required && <span className="text-red-500">* </span>}
        {label}
      </span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`h-10 w-full border border-[#cfd6df] bg-white px-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 ${props.className || ''}`}
    />
  );
}

function SelectField({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`h-10 w-full border border-[#cfd6df] bg-white px-3 text-[15px] text-slate-900 outline-none focus:border-blue-500 ${className}`}
    >
      {children}
    </select>
  );
}

function SettingsSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`so-settings-switch ${checked ? 'so-settings-switch-on' : ''}`}
      aria-pressed={checked}
    />
  );
}

function SaveButton({ saved, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 min-w-[64px] items-center justify-center rounded-[2px] bg-[#1749bd] px-4 text-sm font-semibold text-white hover:bg-[#123d9b] disabled:opacity-60"
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

function UploadBox({ label }) {
  return (
    <div>
      <div className="mb-1.5 text-[15px] font-medium text-slate-900">{label}</div>
      <button
        type="button"
        className="flex h-[130px] w-[130px] flex-col items-center justify-center gap-4 border border-dashed border-slate-300 bg-white text-[18px] text-slate-900"
      >
        <Plus size={15} />
        <span>Upload</span>
      </button>
    </div>
  );
}

function AccordionSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-[#d7dce3] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-full items-center gap-3 border-b border-[#d7dce3] bg-[#fbfbfc] px-5 text-left text-[16px] font-medium text-slate-900"
      >
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        {title}
      </button>
      {open && <div className="p-5">{children}</div>}
    </section>
  );
}

function PremiumIcon() {
  return <Crown size={30} className="mr-9 text-[#b98805] drop-shadow-sm" fill="#d99c13" />;
}

function MobileRow({ label, checked, onChange, disabled, premium = false, help = true, children }) {
  return (
    <div className="grid min-h-[58px] grid-cols-[220px_1fr] items-center gap-4">
      <div className="flex items-center justify-end text-right text-[15px] font-medium text-slate-900">
        {premium && <PremiumIcon />}
        <span>{label}</span>
        {help && <HelpCircle size={15} className="ml-1 text-slate-500" />}
        <span className="mx-1">:</span>
      </div>
      {children || <SettingsSwitch checked={checked} onChange={onChange} disabled={disabled} />}
    </div>
  );
}

function TemplatePreview({ name, selected, onSelect }) {
  const dense = name === 'Compact' || name === 'Tally';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex h-[500px] flex-col border bg-white text-left transition ${selected ? 'border-[6px] border-[#1749bd]' : 'border-[#e5e7eb]'}`}
    >
      <div className="flex flex-1 items-center justify-center bg-white px-6 pt-8">
        <div className={`relative w-full max-w-[230px] border border-slate-700 bg-white p-3 text-[5px] text-slate-900 shadow-sm ${dense ? 'max-w-[250px]' : ''}`}>
          <div className="mb-2 flex justify-between border-b border-slate-800 pb-2">
            <div className="flex gap-2">
              <div className="h-7 w-7 bg-[#111c4e]" />
              <div>
                <div className="font-bold">Punia Industries Pvt Ltd</div>
                <div>K-99, Site-IV, UPSIDC, Kasna</div>
                <div>GSTIN: 29PJHPI1234K1Z8</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">TAX INVOICE</div>
              <div>Invoice # INV-001</div>
              <div>Due Date 06-04-2024</div>
            </div>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="border border-slate-400 p-1">
              <div className="font-bold">BILL TO</div>
              <div>Narayan Enterprises</div>
              <div>C-70, New Anaj Mandi</div>
            </div>
            <div className="border border-slate-400 p-1">
              <div className="font-bold">SHIP TO</div>
              <div>Narayan Enterprises</div>
              <div>Hisar, Haryana</div>
            </div>
          </div>
          <div className="border border-slate-800">
            <div className="grid grid-cols-[1fr_26px_26px_30px] bg-slate-100 font-bold">
              <span className="border-r border-slate-500 p-1">Items</span>
              <span className="border-r border-slate-500 p-1">Qty</span>
              <span className="border-r border-slate-500 p-1">Rate</span>
              <span className="p-1">Amount</span>
            </div>
            {['Ashirvaad Atta 10 Kg', 'Haldiram Bhujia Sev', 'Premium Cashew'].map((item) => (
              <div key={item} className="grid grid-cols-[1fr_26px_26px_30px] border-t border-slate-300">
                <span className="border-r border-slate-300 p-1">{item}</span>
                <span className="border-r border-slate-300 p-1">10</span>
                <span className="border-r border-slate-300 p-1">450</span>
                <span className="p-1">4500</span>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="border border-slate-400 p-1">
              <div className="font-bold">Bank Details</div>
              <div>HDFC Bank</div>
              <div>IFSC: HDFC000123</div>
            </div>
            <div className="border border-slate-400 p-1 text-right">
              <div>Taxable Amount 15000.00</div>
              <div>GST 18% 2700.00</div>
              <div className="font-bold">Grand Total 17700.00</div>
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="h-9 w-9 border border-slate-700" />
            <div className="text-right">
              <div className="mb-1 h-5 w-12 border-b border-slate-700" />
              <div>Authorised Signature</div>
            </div>
          </div>
          <div className="absolute inset-0 hidden items-center justify-center bg-black/25 text-sm font-semibold text-white group-hover:flex">
            <Eye size={16} className="mr-1" /> Preview
          </div>
        </div>
      </div>
      <div className="border-t border-[#e5e7eb] px-7 py-7 text-[20px] font-medium text-slate-900">{name}</div>
    </button>
  );
}

function NotificationsTable({ title, rows, onToggle, disabled }) {
  return (
    <section className="mb-11">
      <h3 className="mb-3 text-[18px] font-semibold text-slate-900">{title}</h3>
      <table className="w-full border border-[#d7dce3] text-[14px]">
        <thead>
          <tr className="bg-[#f0f3fb]">
            <th className="h-12 border border-[#d7dce3] font-semibold" />
            <th className="h-12 border border-[#d7dce3] font-semibold">SMS</th>
            <th className="h-12 border border-[#d7dce3] font-semibold">Whatsapp</th>
            <th className="h-12 border border-[#d7dce3] font-semibold">Email</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label}>
              <td className="h-11 border border-[#d7dce3] text-center">{row.label}</td>
              {['sms', 'whatsapp', 'email'].map((mode) => (
                <td key={mode} className="h-11 border border-[#d7dce3] text-center">
                  <input
                    type="checkbox"
                    checked={!!row[mode]}
                    disabled={disabled}
                    onChange={(event) => onToggle(index, mode, event.target.checked)}
                    className="h-4 w-4 accent-[#1749bd]"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function SettingsPage() {
  const { can } = useAuth();
  const canEdit = typeof can === 'function' ? can('companySettings') : true;
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  useEffect(() => {
    api.get('/settings').then((response) => setSettings(mergeSettings(response.data || {}))).catch(() => setSettings(mergeSettings()));
  }, []);

  if (!settings) return <div className="py-20 text-center text-sm text-slate-500">Loading settings...</div>;

  const update = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));
  const nested = (group, field, value) => setSettings((prev) => ({ ...prev, [group]: { ...(prev[group] || {}), [field]: value } }));
  const updateOfficeDay = (day) => setSettings((prev) => {
    const current = prev.officeHours?.workingDays || [];
    return {
      ...prev,
      officeHours: {
        ...prev.officeHours,
        workingDays: current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
      },
    };
  });
  const updateNotification = (section, index, mode, value) => setSettings((prev) => ({
    ...prev,
    notificationSettings: {
      ...prev.notificationSettings,
      [section]: prev.notificationSettings[section].map((row, rowIndex) => (
        rowIndex === index ? { ...row, [mode]: value } : row
      )),
    },
  }));
  const handleSave = async () => {
    const { data } = await api.put('/settings', settings);
    setSettings(mergeSettings(data || settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const persistNext = async (next) => {
    setSettings(next);
    if (!canEdit) return;
    const { data } = await api.put('/settings', next);
    setSettings(mergeSettings(data || next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const editTaxRate = (index) => {
    const nextName = window.prompt('Tax name', settings.taxRates[index]?.name || '');
    if (!nextName) return;
    persistNext({
      ...settings,
      taxRates: settings.taxRates.map((rate, rateIndex) => (rateIndex === index ? { ...rate, name: nextName } : rate)),
    });
  };
  const deleteTaxRate = (index) => persistNext({ ...settings, taxRates: settings.taxRates.filter((_, rateIndex) => rateIndex !== index) });
  const createTaxRate = () => persistNext({ ...settings, taxRates: [...settings.taxRates, { name: 'GST @ 0%', taxType: 'GST', type: 'GST', rate: 0 }] });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex h-[70px] items-center border-b border-[#d6dbe2] bg-white px-5">
        <h1 className="text-[26px] font-medium">Settings</h1>
      </div>

      <div className="grid min-h-[calc(100vh-70px)] grid-cols-[250px_1fr] bg-white">
        <aside className="border-r border-[#d6dbe2] bg-[#fbfbfc]">
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex h-[73px] w-full items-center gap-4 border-b border-[#e5e7eb] px-8 text-left text-[18px] font-medium transition ${
                activeTab === id
                  ? 'border-r-[3px] border-r-[#1749bd] bg-white text-[#0f4fc8]'
                  : 'text-slate-900 hover:bg-white'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <main className="relative min-w-0 bg-white">
          <div className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-[#e7e9ee] bg-white px-16">
            <h2 className="text-[24px] font-semibold">
              {activeTab === 'company' && 'Company details'}
              {activeTab === 'mobile' && 'Mobile app settings'}
              {activeTab === 'integrations' && 'Third party Integrations'}
              {activeTab === 'templates' && 'Select Template'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'taxes' && 'Tax Rates'}
            </h2>
            {activeTab === 'taxes' ? (
              <button type="button" onClick={createTaxRate} disabled={!canEdit} className="so-btn-primary text-sm">
                Create Tax
              </button>
            ) : (
              <SaveButton saved={saved} onClick={handleSave} disabled={!canEdit} />
            )}
          </div>

          {activeTab === 'company' && (
            <div className="mx-auto max-w-[1290px] space-y-0 p-8">
              <AccordionSection title="Basic details">
                <div className="grid grid-cols-2 gap-x-5 gap-y-7">
                  <Field label="Name" required>
                    <Input value={settings.companyName || ''} onChange={(event) => update('companyName', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="Mobile" required>
                    <Input value={settings.phone || ''} onChange={(event) => update('phone', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="Email">
                    <Input value={settings.email || ''} onChange={(event) => update('email', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="Address">
                    <Input value={settings.address || ''} onChange={(event) => update('address', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="State of supply">
                    <SelectField value={settings.stateOfSupply || ''} onChange={(event) => update('stateOfSupply', event.target.value)} disabled={!canEdit}>
                      <option value="">Select State</option>
                      <option>Delhi</option>
                      <option>Haryana</option>
                      <option>Uttar Pradesh</option>
                      <option>Maharashtra</option>
                    </SelectField>
                  </Field>
                  <Field label="GSTIN">
                    <Input value={settings.gstin || ''} onChange={(event) => update('gstin', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="Type">
                    <div className="flex h-10 items-center px-3 text-[15px] font-medium">{settings.businessType || 'MANUFACTURER'}</div>
                  </Field>
                  <Field label="Currency">
                    <SelectField value={settings.currency || 'INR - Indian rupee'} onChange={(event) => update('currency', event.target.value)} disabled={!canEdit}>
                      <option>INR - Indian rupee</option>
                      <option>USD - United States dollar</option>
                    </SelectField>
                  </Field>
                  <Field label="Timezone">
                    <SelectField value={settings.timezone || ''} onChange={(event) => update('timezone', event.target.value)} disabled={!canEdit}>
                      <option value="">Select Time Zone</option>
                      <option>Asia/Calcutta</option>
                      <option>UTC</option>
                    </SelectField>
                  </Field>
                </div>
              </AccordionSection>

              <AccordionSection title="Upload logo and signature">
                <div className="grid grid-cols-2 gap-20">
                  <UploadBox label="Upload logo" />
                  <UploadBox label="Upload Signature" />
                </div>
              </AccordionSection>

              <AccordionSection title="Office working hours">
                <div className="space-y-7">
                  <div>
                    <div className="mb-4 text-[15px] font-medium">Working days</div>
                    <div className="flex flex-wrap gap-6">
                      {DAY_NAMES.map((day) => (
                        <label key={day} className="flex items-center gap-2 text-[15px]">
                          <input type="checkbox" checked={(settings.officeHours?.workingDays || []).includes(day)} onChange={() => updateOfficeDay(day)} disabled={!canEdit} className="h-5 w-5 accent-[#1749bd]" />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 text-[15px] font-medium">Work timings</div>
                    <div className="inline-flex h-10 w-[352px] items-center border border-[#cfd6df] bg-white">
                      <input value={settings.officeHours?.start || '09:00'} onChange={(event) => nested('officeHours', 'start', event.target.value)} disabled={!canEdit} className="h-full w-1/2 px-4 outline-none" />
                      <span className="text-slate-400">→</span>
                      <input value={settings.officeHours?.end || '17:00'} onChange={(event) => nested('officeHours', 'end', event.target.value)} disabled={!canEdit} className="h-full w-1/2 px-4 outline-none" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 text-[15px] font-medium">Holidays</div>
                    <button type="button" className="h-10 w-[624px] border border-slate-500 text-[15px] text-slate-600">Add holiday</button>
                  </div>
                </div>
              </AccordionSection>

              <AccordionSection title="Bank details">
                <div className="grid grid-cols-2 gap-x-5 gap-y-7">
                  <Field label="Account number">
                    <Input value={settings.bankDetails?.accountNumber || ''} onChange={(event) => nested('bankDetails', 'accountNumber', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="Account holder name">
                    <Input value={settings.bankDetails?.accountHolderName || ''} onChange={(event) => nested('bankDetails', 'accountHolderName', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="Bank name">
                    <SelectField value={settings.bankDetails?.bankName || ''} onChange={(event) => nested('bankDetails', 'bankName', event.target.value)} disabled={!canEdit}>
                      <option value="">Select bank</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>State Bank of India</option>
                    </SelectField>
                  </Field>
                  <Field label="Branch name">
                    <Input value={settings.bankDetails?.branchName || ''} onChange={(event) => nested('bankDetails', 'branchName', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <Field label="IFSC code">
                    <Input value={settings.bankDetails?.ifscCode || ''} onChange={(event) => nested('bankDetails', 'ifscCode', event.target.value)} disabled={!canEdit} />
                  </Field>
                  <UploadBox label="Upload QR Code" />
                </div>
              </AccordionSection>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="mx-auto max-w-[1150px] px-10 py-16">
              <div className="space-y-10">
                <section className="border-b border-[#e5e7eb] pb-9">
                  <h3 className="mb-6 text-[15px] font-medium text-slate-600">Attendance</h3>
                  <MobileRow label="Attendance mandatory" checked={settings.mobileAppSettings.attendanceMandatory} onChange={(value) => nested('mobileAppSettings', 'attendanceMandatory', value)} disabled={!canEdit} />
                  <MobileRow label="Attendance photo mandatory" checked={settings.mobileAppSettings.attendancePhotoMandatory} onChange={(value) => nested('mobileAppSettings', 'attendancePhotoMandatory', value)} disabled={!canEdit} />
                  <MobileRow label="Odometer reading" checked={settings.mobileAppSettings.odometerReading} onChange={(value) => nested('mobileAppSettings', 'odometerReading', value)} disabled={!canEdit} />
                  <MobileRow label="Odometer reading mandatory" checked={settings.mobileAppSettings.odometerReadingMandatory} onChange={(value) => nested('mobileAppSettings', 'odometerReadingMandatory', value)} disabled={!canEdit} />
                </section>
                <section className="border-b border-[#e5e7eb] pb-9">
                  <h3 className="mb-6 text-[15px] font-medium text-slate-600">Party Information</h3>
                  <MobileRow label="Allow add party" checked={settings.mobileAppSettings.allowAddParty} onChange={(value) => nested('mobileAppSettings', 'allowAddParty', value)} disabled={!canEdit} />
                  <MobileRow label="Allow update party" checked={settings.mobileAppSettings.allowUpdateParty} onChange={(value) => nested('mobileAppSettings', 'allowUpdateParty', value)} disabled={!canEdit} />
                  <MobileRow premium label="Show map view" checked={settings.mobileAppSettings.showMapView} onChange={(value) => nested('mobileAppSettings', 'showMapView', value)} disabled={!canEdit} />
                  <MobileRow premium label="Show route planner" checked={settings.mobileAppSettings.showRoutePlanner} onChange={(value) => nested('mobileAppSettings', 'showRoutePlanner', value)} disabled={!canEdit} />
                </section>
                <section className="border-b border-[#e5e7eb] pb-9">
                  <h3 className="mb-6 text-[15px] font-medium text-slate-600">Mark Visit Information</h3>
                  <MobileRow label="Visit mandatory" checked={settings.mobileAppSettings.visitMandatory} onChange={(value) => nested('mobileAppSettings', 'visitMandatory', value)} disabled={!canEdit} />
                  <MobileRow premium label="Allow multiple visit" checked={settings.mobileAppSettings.allowMultipleVisit} onChange={(value) => nested('mobileAppSettings', 'allowMultipleVisit', value)} disabled={!canEdit} />
                  <MobileRow premium label="Allow visit IN/OUT" checked={settings.mobileAppSettings.allowVisitInOut} onChange={(value) => nested('mobileAppSettings', 'allowVisitInOut', value)} disabled={!canEdit} />
                  <MobileRow premium label="Geofence range" checked={settings.mobileAppSettings.geofenceRange} onChange={(value) => nested('mobileAppSettings', 'geofenceRange', value)} disabled={!canEdit} />
                </section>
                <section className="border-b border-[#e5e7eb] pb-9">
                  <h3 className="mb-6 text-[15px] font-medium text-slate-600">Items Information</h3>
                  {[
                    ['showStock', 'Show stock'],
                    ['allowReplacement', 'Allow replacement'],
                    ['allowStockOut', 'Allow stock out'],
                    ['allowPriceUpdate', 'Allow price update'],
                    ['allowFreeQuantity', 'Allow Free Quantity'],
                    ['allowDiscount', 'Allow Discount'],
                    ['displayImage', 'Display image'],
                  ].map(([key, label]) => (
                    <MobileRow key={key} label={label} checked={settings.mobileAppSettings[key]} onChange={(value) => nested('mobileAppSettings', key, value)} disabled={!canEdit} />
                  ))}
                </section>
                <section className="border-b border-[#e5e7eb] pb-9">
                  <h3 className="mb-6 text-[15px] font-medium text-slate-600">Transaction Information</h3>
                  <MobileRow label="Default Sales Type" help={false}>
                    <SelectField className="max-w-[283px]" value={settings.mobileAppSettings.defaultSalesType} onChange={(event) => nested('mobileAppSettings', 'defaultSalesType', event.target.value)} disabled={!canEdit}>
                      <option>Sales Invoice</option>
                      <option>Sales Order</option>
                    </SelectField>
                  </MobileRow>
                  <MobileRow label="Allow only van sale" checked={settings.mobileAppSettings.allowOnlyVanSale} onChange={(value) => nested('mobileAppSettings', 'allowOnlyVanSale', value)} disabled={!canEdit} />
                  <MobileRow label="Allow Whatsapp sharing" checked={settings.mobileAppSettings.allowWhatsappSharing} onChange={(value) => nested('mobileAppSettings', 'allowWhatsappSharing', value)} disabled={!canEdit} />
                  <MobileRow label="Allow status update" checked={settings.mobileAppSettings.allowStatusUpdate} onChange={(value) => nested('mobileAppSettings', 'allowStatusUpdate', value)} disabled={!canEdit} />
                  <MobileRow label="Allow invoice generation from order" checked={settings.mobileAppSettings.allowInvoiceGenerationFromOrder} onChange={(value) => nested('mobileAppSettings', 'allowInvoiceGenerationFromOrder', value)} disabled={!canEdit} />
                </section>
                <section>
                  <h3 className="mb-6 text-[15px] font-medium text-slate-600">Payment Information</h3>
                  <MobileRow label="Auto Approval" checked={settings.mobileAppSettings.autoApproval} onChange={(value) => nested('mobileAppSettings', 'autoApproval', value)} disabled={!canEdit} />
                  <MobileRow label="Allow payment discount" checked={settings.mobileAppSettings.allowPaymentDiscount} onChange={(value) => nested('mobileAppSettings', 'allowPaymentDiscount', value)} disabled={!canEdit} />
                  <MobileRow label="Allow other payment" checked={settings.mobileAppSettings.allowOtherPayment} onChange={(value) => nested('mobileAppSettings', 'allowOtherPayment', value)} disabled={!canEdit} />
                </section>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="mx-auto max-w-[1150px] px-10 py-16">
              <div className="border-y border-[#eef0f2] py-8">
                <div className="mx-auto flex max-w-[280px] items-center justify-between py-5">
                  <span className="text-[15px] font-medium">Tally <HelpCircle size={15} className="inline text-slate-500" /> :</span>
                  <SettingsSwitch checked={settings.tallyIntegration.enabled} onChange={(value) => nested('tallyIntegration', 'enabled', value)} disabled={!canEdit} />
                </div>
                <div className="mx-auto flex max-w-[280px] items-center justify-between py-5">
                  <span className="text-[15px] font-medium">Busy <HelpCircle size={15} className="inline text-slate-500" /> :</span>
                  <SettingsSwitch checked={settings.tallyIntegration.busyEnabled} onChange={(value) => nested('tallyIntegration', 'busyEnabled', value)} disabled={!canEdit} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="px-16 py-8">
              <div className="relative mb-8 w-[290px]">
                <button
                  type="button"
                  onClick={() => setTemplateOpen((value) => !value)}
                  className="flex h-11 w-full items-center justify-between border border-blue-400 bg-white px-3 text-left text-[15px] shadow-[0_0_4px_rgba(59,130,246,0.65)]"
                >
                  <span>{settings.templateSettings.selectedDocument}</span>
                  <ChevronDown size={17} className="text-slate-400" />
                </button>
                {templateOpen && (
                  <div className="absolute left-0 top-11 z-30 w-full bg-white shadow-xl">
                    <div className="flex h-10 items-center border border-blue-300 px-3 text-slate-400">
                      <span className="flex-1">{settings.templateSettings.selectedDocument}</span>
                      <Search size={15} />
                    </div>
                    <div className="max-h-[336px] overflow-y-auto border-x border-b border-[#e5e7eb]">
                      {DOCUMENT_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            nested('templateSettings', 'selectedDocument', type);
                            setTemplateOpen(false);
                          }}
                          className={`block h-10 w-full px-4 text-left text-[15px] hover:bg-[#eef2f7] ${type === settings.templateSettings.selectedDocument ? 'bg-[#dff3fb] font-semibold' : ''}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-[#eef0f2] pt-12">
                <h3 className="mb-10 text-center text-[24px] font-semibold">{settings.templateSettings.selectedDocument}</h3>
                <div className="grid grid-cols-3 gap-12">
                  {TEMPLATE_CARDS.map((name) => (
                    <TemplatePreview
                      key={name}
                      name={name}
                      selected={settings.templateSettings.selectedTemplate === name}
                      onSelect={() => nested('templateSettings', 'selectedTemplate', name)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="px-8 py-12">
              <NotificationsTable
                title="Sales Order"
                rows={settings.notificationSettings.salesOrder}
                onToggle={(index, mode, value) => updateNotification('salesOrder', index, mode, value)}
                disabled={!canEdit}
              />
              <NotificationsTable
                title="Sales Invoice"
                rows={settings.notificationSettings.salesInvoice}
                onToggle={(index, mode, value) => updateNotification('salesInvoice', index, mode, value)}
                disabled={!canEdit}
              />
              <NotificationsTable
                title="Payment Received"
                rows={settings.notificationSettings.paymentReceived}
                onToggle={(index, mode, value) => updateNotification('paymentReceived', index, mode, value)}
                disabled={!canEdit}
              />
            </div>
          )}

          {activeTab === 'taxes' && (
            <div className="px-16 py-9">
              <h3 className="mb-3 text-[18px] font-semibold">GST</h3>
              <div className="max-w-[1198px] border border-[#d7dce3]">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-[#f0f3fb]">
                      <th className="h-14 border-r border-[#d7dce3] px-4 text-left text-[15px] font-semibold">Name</th>
                      <th className="h-14 border-r border-[#d7dce3] px-4 text-left text-[15px] font-semibold">Tax Type</th>
                      <th className="h-14 border-r border-[#d7dce3] px-4 text-left text-[15px] font-semibold">Rate(%)</th>
                      <th className="h-14 px-4 text-left text-[15px] font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {settings.taxRates.map((rate, index) => (
                      <tr key={`${rate.name}-${index}`} className="border-t border-[#e5e7eb]">
                        <td className="h-16 px-5">{rate.name}</td>
                        <td className="h-16 px-5">{rate.taxType || rate.type || 'GST'}</td>
                        <td className="h-16 px-5">{rate.rate}</td>
                        <td className="h-16 px-5">
                          <div className="flex gap-8">
                            <button type="button" onClick={() => editTaxRate(index)} className="text-slate-900" title="Edit tax">
                              <Edit2 size={17} />
                            </button>
                            <button type="button" onClick={() => deleteTaxRate(index)} className="text-slate-900" title="Delete tax">
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute right-2 top-20 hidden h-[calc(100%-96px)] w-4 flex-col items-center justify-between text-slate-400 lg:flex">
            <ChevronDown size={18} className="rotate-180" />
            <div className="h-[70%] w-2 rounded-full bg-slate-400" />
            <ChevronDown size={18} />
          </div>
        </main>
      </div>
    </div>
  );
}
