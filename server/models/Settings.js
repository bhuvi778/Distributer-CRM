import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'DistriFlow' },
  gstin: String,
  pan: String,
  address: String,
  phone: String,
  email: String,
  logo: String,
  currency: { type: String, default: 'INR' },
  fiscalYearStart: { type: String, default: '04-01' },
  defaultGstRate: { type: Number, default: 18 },
  invoicePrefix: { type: String, default: 'INV' },
  defaultPaymentTerms: { type: String, default: '30 days' },
  tallyIntegration: {
    enabled: { type: Boolean, default: false },
    serverUrl: String,
    companyName: String,
    lastSync: Date,
  },
  whatsappEnabled: { type: Boolean, default: false },
  roles: mongoose.Schema.Types.Mixed,
  defaultTransactionState: { type: String, default: 'draft' },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
