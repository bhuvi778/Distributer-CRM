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

const TEMPLATE_CARDS = ['Standard (A5/A4)', 'Basic', 'Simple', 'Compact', 'Tally', 'Evergreen'];

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

function UploadBox({ label, disabled }) {
  return (
    <div>
      <div className="mb-1.5 text-[15px] font-medium text-slate-900">{label}</div>
      <button
        type="button"
        disabled={disabled}
        className="flex h-[130px] w-[130px] flex-col items-center justify-center gap-4 border border-dashed border-slate-300 bg-white text-[18px] text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
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

const previewItems = [
  ['1', 'Aashirvaad Atta 10 Kg', '0351', '12%', '10 Pack', '420.00', '4200.00'],
  ['2', 'Haldiram Bhujia Sev', '0421', '12%', '20 Packs', '140.00', '2800.00'],
  ['3', 'Premium Mehboob Cashew', '0675', '12%', '40 Box', '220.00', '8800.00'],
];

const compactItems = [
  ...previewItems,
  ['4', 'Haldiram Navratan Mixture', '0421', '12%', '45 Box', '220.00', '9900.00'],
  ['5', 'Aashirvaad Cow Ghee 500gm', '0421', '12%', '40 Box', '190.00', '7600.00'],
  ['6', 'Haldiram All-in-one Mixture', '0421', '12%', '20 Pcs', '145.00', '29200.00'],
  ['7', 'Premium Mehboob Walnuts 250gm', '0675', '12%', '50 Box', '210.00', '10500.00'],
  ['8', 'Premium Seeds Dates 500gm', '0675', '12%', '40 Box', '185.00', '7400.00'],
  ['9', 'Britannia Whole Wheat Bread', '0025', '5%', '50 Pcs', '55.00', '2750.00'],
];

function MiniLogo() {
  return (
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center bg-[#11174a] text-[4px] font-bold text-white">
      <div className="mb-0.5 h-4 w-4 rotate-45 border-2 border-[#f59e0b]" />
      COMPANY
    </div>
  );
}

function MiniSignature() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-1 h-9 w-14 rounded-[45%] border-b-2 border-black border-l border-r rotate-[-12deg]" />
      <div className="text-[5px]">Authorised Signature</div>
    </div>
  );
}

function MiniQr() {
  return (
    <div className="grid h-12 w-12 grid-cols-5 grid-rows-5 gap-[1px] bg-white p-1">
      {Array.from({ length: 25 }).map((_, index) => (
        <span key={index} className={(index * 7) % 4 === 0 || index < 2 || index > 21 ? 'bg-black' : 'bg-white'} />
      ))}
    </div>
  );
}

function CompanyBlock({ centered = false }) {
  return (
    <div className={centered ? 'text-center' : ''}>
      <div className="text-[8px] font-bold">Punia Industries Pvt Ltd</div>
      <div>K-999, Site-40, UPSIDC, Industrial Area, Greater Noida</div>
      <div><b>Mobile:</b> 9940048111</div>
      <div><b>GSTIN:</b> 29RPLPM2981K1Z0</div>
    </div>
  );
}

function PartyBox({ title = 'Bill To' }) {
  return (
    <div className="border border-black p-1">
      <div className="uppercase">{title}</div>
      <div className="font-bold">Narayan Enterprises</div>
      <div># 6 - C, New Ram Nagar, Ambala Cantt - 133 001, Haryana</div>
      <div>GSTIN: 28AUVPJ981F1YA</div>
    </div>
  );
}

function SimpleItems({ rows = previewItems, fullTax = false, tally = false }) {
  const cols = tally
    ? 'grid-cols-[16px_1fr_28px_30px_38px_28px_25px_36px]'
    : fullTax
      ? 'grid-cols-[16px_1fr_30px_25px_36px_32px_36px]'
      : 'grid-cols-[16px_1fr_34px_32px_34px_34px]';
  const headers = tally
    ? ['#', 'Items', 'HSN', 'Qty', 'Rate Incl.', 'Rate', 'per', 'Amount']
    : fullTax
      ? ['#', 'Items', 'HSN', 'Tax', 'Qty', 'Rate', 'Amount']
      : ['#', 'Items', 'MRP', 'Qty', 'Rate', 'Amount'];

  return (
    <div className="border border-black">
      <div className={`grid ${cols} bg-[#f2f4fa] text-center font-bold`}>
        {headers.map((item) => <span key={item} className="border-r border-black p-0.5 last:border-r-0">{item}</span>)}
      </div>
      {rows.map((row) => (
        <div key={`${row[0]}-${row[1]}`} className={`grid ${cols} min-h-[15px] border-t border-slate-300`}>
          {(tally
            ? [row[0], row[1], row[2], row[4], row[5], row[5], 'Pack', row[6]]
            : fullTax
              ? [row[0], row[1], row[2], row[3], row[4], row[5], row[6]]
              : [row[0], row[1], row[5], row[4], row[5], row[6]]
          ).map((value, index) => (
            <span key={`${value}-${index}`} className={`${index === 1 ? 'font-bold text-left' : 'text-right'} border-r border-slate-300 p-0.5 last:border-r-0`}>
              {value}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function TaxSummary() {
  return (
    <div className="border border-black">
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] bg-[#f2f4fa] text-center font-bold">
        {['HSN/SAC', 'Taxable Value', 'SGST', 'CGST', 'Total Tax'].map((item) => (
          <span key={item} className="border-r border-black p-0.5 last:border-r-0">{item}</span>
        ))}
      </div>
      {['0351', '0421', '0675'].map((code, index) => (
        <div key={code} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] border-t border-slate-300">
          <span className="border-r border-slate-300 p-0.5">{code}</span>
          <span className="border-r border-slate-300 p-0.5 text-right">{[4200, 2800, 8800][index]}</span>
          <span className="border-r border-slate-300 p-0.5 text-right">6%</span>
          <span className="border-r border-slate-300 p-0.5 text-right">6%</span>
          <span className="p-0.5 text-right">{[504, 336, 1056][index]}</span>
        </div>
      ))}
    </div>
  );
}

function TermsBankFooter({ qr = false }) {
  return (
    <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] border-x border-b border-black">
      <div className="border-r border-black p-1">
        <b>Terms and Conditions</b>
        <div>1. Goods once sold cannot be taken back or exchanged.</div>
        <div>2. Subject to local jurisdiction</div>
      </div>
      <div className="border-r border-black p-1">
        <b>Bank Details</b>
        <div>Account No: 50210076812438</div>
        <div>IFSC: HDFC0000239</div>
        <div>Branch: Gandhi Road</div>
        {qr && <MiniQr />}
      </div>
      <MiniSignature />
    </div>
  );
}

function StandardTemplate() {
  return (
    <div className="border border-black bg-white text-[5px] leading-[1.15]">
      <div className="grid grid-cols-[64px_1fr_86px] border-b border-black">
        <div className="p-2"><MiniLogo /></div>
        <div className="border-r border-black p-1"><CompanyBlock /></div>
        <div className="p-1">
          <div><b>Invoice # :</b> INV-0001</div>
          <div><b>Invoice Date :</b> 06-02-2024</div>
          <div><b>Due Date:</b> 06-04-2024</div>
        </div>
      </div>
      <div className="grid grid-cols-2">
        <PartyBox title="Bill To" />
        <PartyBox title="Ship To" />
      </div>
      <div className="border-x border-black">
        <div className="grid grid-cols-[14px_1fr_25px_30px_26px_27px_27px_32px_32px_38px] bg-[#f2f4fa] text-center font-bold">
          {['#', 'Items', 'HSN', 'MRP', 'Qty', 'Free', 'Rate', 'Disc', 'CGST', 'Amount'].map((item) => (
            <span key={item} className="border-r border-black p-0.5 last:border-r-0">{item}</span>
          ))}
        </div>
        {previewItems.map((row) => (
          <div key={row[1]} className="grid min-h-[18px] grid-cols-[14px_1fr_25px_30px_26px_27px_27px_32px_32px_38px] border-t border-slate-300">
            {[row[0], row[1], row[2], '460.00', row[4], '0', row[5], '0', '252.00', row[6]].map((value, index) => (
              <span key={`${value}-${index}`} className={`${index === 1 ? 'font-bold text-left' : 'text-right'} border-r border-slate-300 p-0.5 last:border-r-0`}>{value}</span>
            ))}
          </div>
        ))}
        {['Taxable Amount', 'SGST', 'CGST', 'Round Off', 'Grand Total'].map((row, index) => (
          <div key={row} className="grid grid-cols-[1fr_54px] border-t border-slate-300">
            <span className="p-0.5 pl-4 font-bold">{row}</span>
            <span className="border-l border-slate-300 p-0.5 text-right font-bold">{['Rs 15,800', 'Rs 948', 'Rs 948', 'Rs 0', 'Rs 17,696'][index]}</span>
          </div>
        ))}
      </div>
      <TermsBankFooter />
    </div>
  );
}

function BasicTemplate() {
  return (
    <div className="border border-black bg-white text-[5px] leading-[1.18]">
      <div className="grid grid-cols-[64px_1fr_86px] border-b border-black">
        <div className="p-2"><MiniLogo /></div>
        <div className="border-r border-black p-1"><CompanyBlock /></div>
        <div className="p-1"><b>Invoice # :</b> INV-0001<br /><b>Invoice Date:</b> 06-02-2024<br /><b>Due Date:</b> 06-04-2024</div>
      </div>
      <div className="grid grid-cols-2"><PartyBox title="Bill To" /><PartyBox title="Ship To" /></div>
      <SimpleItems fullTax={false} />
      <div className="grid grid-cols-[1fr_70px] border-x border-black text-right font-bold">
        {['Sub Total', 'Round Off', 'Grand Total'].map((row, index) => (
          <div key={row} className="contents">
            <span className="border-b border-slate-300 p-0.5">{row}</span>
            <span className="border-b border-l border-slate-300 p-0.5">{['Rs 15,800', 'Rs 0.00', 'Rs 15,800'][index]}</span>
          </div>
        ))}
      </div>
      <TermsBankFooter />
    </div>
  );
}

function SimpleTemplate() {
  return (
    <div className="border border-black bg-white text-[5px] leading-[1.12]">
      <div className="flex h-4 items-center justify-between border-b border-black bg-[#f4f4f4] px-1"><b>TAX INVOICE</b><span>Original for Recipient</span></div>
      <div className="grid grid-cols-[78px_1fr_138px] border-b border-black">
        <div className="p-2"><MiniLogo /></div>
        <div className="p-1"><CompanyBlock /></div>
        <div className="grid grid-cols-2 border-l border-black">
          {['Invoice #', 'Invoice Date', 'Place Of Supply', 'Due Date'].map((label, index) => (
            <div key={label} className="border-b border-r border-black p-1"><b>{label}</b><br />{index % 2 ? '06-02-2024' : 'INV-0001'}</div>
          ))}
          <div className="col-span-2 p-1"><b>Shipping Address</b><br /># 6 - C, New Ram Nagar, Haryana</div>
        </div>
      </div>
      <PartyBox title="Customer Details" />
      <SimpleItems fullTax />
      <div className="grid grid-cols-[1fr_120px] border-x border-b border-black">
        <div className="p-1">Total Items / Qty <b className="ml-8">3 / 70.00</b></div>
        <div className="border-l border-black p-1 text-right font-bold">Taxable Amount : Rs 15,800<br />SGST : Rs 948<br />CGST : Rs 948<br />Amount Payable : Rs 17696</div>
      </div>
      <TaxSummary />
      <div className="grid grid-cols-[1fr_70px_1fr] border-x border-b border-black">
        <div className="p-1"><b>Bank Details :</b><br />Bank: HDFC Bank<br />Account #: 50210076812438<br />Branch: Gandhi Road</div>
        <div className="flex items-center justify-center"><MiniQr /></div>
        <MiniSignature />
      </div>
      <div className="grid grid-cols-2 border-x border-b border-black"><div className="p-1"><b>Notes :</b><br />Thank you for the business</div><div className="border-l border-black p-1"><b>Terms and Conditions :</b><br />Goods once sold cannot be taken back.</div></div>
    </div>
  );
}

function CompactTemplate() {
  return (
    <div className="border border-black bg-white text-[4.5px] leading-[1.08]">
      <div className="flex h-3 items-center justify-end border-b border-black bg-[#f4f4f4] px-1">Original for Recipient</div>
      <div className="grid grid-cols-[80px_1fr] border-b border-black">
        <div className="p-2"><MiniLogo /></div>
        <div className="flex items-center justify-center p-1"><CompanyBlock centered /></div>
      </div>
      <div className="grid grid-cols-2 border-b border-black">
        <PartyBox title="Customer Details" />
        <div className="p-1"><b>Invoice # :</b> INV-0001<br /><b>Invoice Date :</b> 06-02-2024<br /><b>Due Date :</b> 06-04-2024</div>
      </div>
      <SimpleItems rows={compactItems} fullTax />
      <div className="border-x border-black p-1 text-right font-bold">Taxable Amount Rs 83150.00<br />CGST 2.5% @ 2750 Rs 68.75<br />SGST 6% @ 80400 Rs 4824.00<br />Round off Rs 0.50</div>
      <TaxSummary />
      <div className="grid grid-cols-[1fr_70px_1fr] border-x border-b border-black">
        <div className="p-1"><b>Bank Details :</b><br />Bank: HDFC Bank<br />IFSC: HDFC0000239</div>
        <div className="flex items-center justify-center"><MiniQr /></div>
        <MiniSignature />
      </div>
      <div className="grid grid-cols-2 border-x border-b border-black"><div className="p-1"><b>Notes :</b><br />Thank you for the business</div><div className="border-l border-black p-1"><b>Terms :</b><br />Subject to local jurisdiction</div></div>
    </div>
  );
}

function TallyTemplate() {
  return (
    <div className="border border-black bg-white text-[5px] leading-[1.1]">
      <div className="grid grid-cols-[92px_1fr_138px] border-b border-black">
        <div className="p-2"><MiniLogo /></div>
        <div className="border-r border-black p-1"><CompanyBlock /></div>
        <div className="grid grid-cols-2">
          {['Invoice #', 'Invoice Date', 'Delivery Note', 'Mode/Terms', 'Buyer Order No.', 'Dated', 'Dispatch Doc No.', 'Dispatched Through'].map((label, index) => (
            <div key={label} className="border-b border-r border-black p-1"><b>{label}</b><br />{index % 2 ? '06-02-2024' : index === 3 ? 'Online' : 'SO NO.1234'}</div>
          ))}
        </div>
      </div>
      <PartyBox title="Consignee (Ship to)" />
      <PartyBox title="Buyer (Bill to)" />
      <SimpleItems tally />
      <div className="border-x border-b border-black p-1"><b>Amount Chargeable (in words)</b><br />Seventeen Thousand Six Hundred and Ninety Six Only</div>
      <TaxSummary />
      <div className="grid grid-cols-[1fr_70px_1fr] border-x border-b border-black">
        <div className="p-1"><b>Bank Details :</b><br />Bank: HDFC Bank<br />Account #: 50210076812438<br />IFSC: HDFC0000239</div>
        <div className="flex items-center justify-center"><MiniQr /></div>
        <MiniSignature />
      </div>
      <div className="grid grid-cols-2 border-x border-b border-black"><div className="p-1"><b>Notes :</b><br />Thank you for the business</div><div className="border-l border-black p-1"><b>Terms and Conditions :</b><br />Interest @ 18% beyond 15 days.</div></div>
    </div>
  );
}

function EvergreenTemplate() {
  return (
    <div className="border border-black bg-white text-[5px] leading-[1.1]">
      <div className="flex h-4 items-center justify-between border-b border-black bg-[#f4f4f4] px-1"><b>TAX INVOICE</b><span>Original for Recipient</span></div>
      <div className="grid grid-cols-[1fr_76px] border-b border-black">
        <div className="p-2"><CompanyBlock /></div>
        <div className="p-2"><MiniLogo /></div>
      </div>
      <div className="grid grid-cols-3 border-b border-black text-center font-bold">
        <div className="border-r border-black p-1">Invoice Number<br />INV-0001</div>
        <div className="border-r border-black p-1">Invoice Date<br />06-02-2024</div>
        <div className="p-1">Due Date<br />06-04-2024</div>
      </div>
      <div className="grid grid-cols-2"><PartyBox title="Bill To" /><PartyBox title="Ship To" /></div>
      <SimpleItems fullTax />
      <div className="border-x border-black p-1 text-right font-bold">Taxable Amount Rs 15800.00<br />CGST 6% Rs 948.00<br />SGST 6% Rs 948.00<br />Round off Rs 0.00<br />Total Rs 17696</div>
      <TaxSummary />
      <div className="grid grid-cols-[1fr_70px_1fr] border-x border-b border-black">
        <div className="p-1"><b>Bank Details :</b><br />Bank: HDFC Bank<br />Branch: Gandhi Road</div>
        <div className="flex items-center justify-center"><MiniQr /></div>
        <MiniSignature />
      </div>
      <div className="grid grid-cols-2 border-x border-b border-black"><div className="p-1"><b>Notes :</b><br />Thank you for the business</div><div className="border-l border-black p-1"><b>Terms :</b><br />Goods once sold cannot be taken back.</div></div>
    </div>
  );
}

function TemplatePreview({ name, selected, onSelect }) {
  const templates = {
    'Standard (A5/A4)': <StandardTemplate />,
    Basic: <BasicTemplate />,
    Simple: <SimpleTemplate />,
    Compact: <CompactTemplate />,
    Tally: <TallyTemplate />,
    Evergreen: <EvergreenTemplate />,
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex h-[500px] flex-col border bg-white text-left transition ${selected ? 'border-[6px] border-[#1749bd]' : 'border-[#e5e7eb]'}`}
    >
      <div className="flex flex-1 items-start justify-center overflow-hidden bg-white px-5 pt-5">
        <div className="relative h-[390px] w-full max-w-[300px] overflow-hidden bg-white text-slate-950 shadow-sm">
          {templates[name]}
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
  const { can, user } = useAuth();
  const isFieldReadOnly = ['sales_executive', 'sales_rep'].includes(user?.role);
  const canEdit = !isFieldReadOnly && (typeof can === 'function' ? can('companySettings') : true);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const visibleTabs = isFieldReadOnly
    ? SETTINGS_TABS.filter((tab) => ['company', 'taxes'].includes(tab.id))
    : SETTINGS_TABS;

  useEffect(() => {
    api.get('/settings').then((response) => setSettings(mergeSettings(response.data || {}))).catch(() => setSettings(mergeSettings()));
  }, []);

  useEffect(() => {
    if (isFieldReadOnly && !['company', 'taxes'].includes(activeTab)) {
      setActiveTab('company');
    }
  }, [activeTab, isFieldReadOnly]);

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
    <div className="h-[calc(100vh-52px)] overflow-hidden bg-white text-slate-900">
      <div className="flex h-[70px] items-center border-b border-[#d6dbe2] bg-white px-5">
        <h1 className="text-[26px] font-medium">Settings</h1>
      </div>

      <div className="grid h-[calc(100%-70px)] grid-cols-[250px_1fr] overflow-hidden bg-white">
        <aside className="overflow-hidden border-r border-[#d6dbe2] bg-[#fbfbfc]">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
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

        <main className="relative min-w-0 overflow-y-auto bg-white">
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
              canEdit && (
              <button type="button" onClick={createTaxRate} disabled={!canEdit} className="so-btn-primary text-sm">
                Create Tax
              </button>
              )
            ) : (
              canEdit && <SaveButton saved={saved} onClick={handleSave} disabled={!canEdit} />
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
                  <UploadBox label="Upload logo" disabled={!canEdit} />
                  <UploadBox label="Upload Signature" disabled={!canEdit} />
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
                    <button type="button" disabled={!canEdit} className="h-10 w-[624px] border border-slate-500 text-[15px] text-slate-600 disabled:cursor-not-allowed disabled:opacity-60">Add holiday</button>
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
                  <UploadBox label="Upload QR Code" disabled={!canEdit} />
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
                      {canEdit && <th className="h-14 px-4 text-left text-[15px] font-semibold" />}
                    </tr>
                  </thead>
                  <tbody>
                    {settings.taxRates.map((rate, index) => (
                      <tr key={`${rate.name}-${index}`} className="border-t border-[#e5e7eb]">
                        <td className="h-16 px-5">{rate.name}</td>
                        <td className="h-16 px-5">{rate.taxType || rate.type || 'GST'}</td>
                        <td className="h-16 px-5">{rate.rate}</td>
                        {canEdit && (
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
                        )}
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
