import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const demoUsers = [
  {
    name: 'Super Admin',
    email: 'superadmin@saleson.com',
    password: 'password123',
    role: 'super_admin',
    permissions: ['*'],
    phone: '9876543000',
  },
  {
    name: 'Distributor User',
    email: 'distributor@saleson.com',
    password: 'password123',
    role: 'distributor',
    permissions: [],
    phone: '9876543214',
  },
  {
    name: 'Sales Representative',
    email: 'salesrep@saleson.com',
    password: 'password123',
    role: 'sales_rep',
    permissions: [],
    phone: '9876543212',
    territory: 'Delhi NCR',
    targetAmount: 500000,
    lastLocation: { lat: 28.6139, lng: 77.2090, updatedAt: new Date() },
  },
];

const oldDemoEmails = [
  'admin@saleson.com',
  'manufacturer@saleson.com',
  'sales@saleson.com',
  'priya@saleson.com',
];

const ensureDemoUsers = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Add it to server/.env before running this script.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({ email: { $in: oldDemoEmails } });

  const created = new Map();

  for (const account of demoUsers) {
    const user = await User.findOne({ email: account.email }).select('+password');
    const payload = { ...account };
    if (account.role === 'distributor') {
      payload.createdBy = created.get('super_admin');
    }
    if (account.role === 'sales_rep') {
      payload.createdBy = created.get('distributor');
    }

    if (user) {
      user.name = payload.name;
      user.password = payload.password;
      user.role = payload.role;
      user.permissions = payload.permissions;
      user.phone = payload.phone;
      user.territory = payload.territory;
      user.targetAmount = payload.targetAmount || 0;
      user.lastLocation = payload.lastLocation;
      user.createdBy = payload.createdBy;
      user.isActive = true;
      user.useCustomAccess = false;
      await user.save();
      console.log(`Updated ${account.email}`);
      created.set(account.role, user._id);
    } else {
      const next = await User.create(payload);
      created.set(account.role, next._id);
      console.log(`Created ${account.email}`);
    }
  }

  await mongoose.disconnect();
  console.log('Demo users are ready.');
};

ensureDemoUsers().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
