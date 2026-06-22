import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'DistriFlow' },
  gstin: String,
  pan: String,
  address: String,
  phone: String,
  email: String,
  logo: String,
  signature: String,
  qrCode: String,
  stateOfSupply: String,
  businessType: { type: String, default: 'MANUFACTURER' },
  timezone: String,
  currency: { type: String, default: 'INR' },
  fiscalYearStart: { type: String, default: '04-01' },
  officeHours: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  bankDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  defaultGstRate: { type: Number, default: 18 },
  taxRates: [{
    name: String,
    rate: Number,
    type: { type: String, default: 'GST' },
    isDefault: { type: Boolean, default: false },
  }],
  invoicePrefix: { type: String, default: 'INV' },
  defaultPaymentTerms: { type: String, default: '30 days' },
  mobileApp: {
    enabled: { type: Boolean, default: true },
    salesOrder: { type: Boolean, default: true },
    production: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    liveLocation: { type: Boolean, default: true },
  },
  tallyIntegration: {
    enabled: { type: Boolean, default: false },
    serverUrl: String,
    companyName: String,
    busyEnabled: { type: Boolean, default: false },
    busyServerUrl: String,
    busyCompanyName: String,
    lastSync: Date,
  },
  thirdPartyIntegrations: {
    smsProvider: String,
    whatsappProvider: String,
    emailProvider: String,
    apiKey: String,
    webhookUrl: String,
  },
  notifications: {
    salesOrder: {
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    invoice: {
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    paymentReceived: {
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
  },
  mobileAppSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  templateSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  notificationSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  whatsappEnabled: { type: Boolean, default: false },
  roles: mongoose.Schema.Types.Mixed,
  rights: mongoose.Schema.Types.Mixed,
  partySettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  transactionSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  userSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  defaultTransactionState: { type: String, default: 'draft' },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
