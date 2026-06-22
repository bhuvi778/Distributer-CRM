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
    name: 'Admin User',
    email: 'admin@saleson.com',
    password: 'password123',
    role: 'admin',
    permissions: ['*'],
    phone: '9876543210',
    territory: 'North India',
  },
  {
    name: 'Manufacturer User',
    email: 'manufacturer@saleson.com',
    password: 'password123',
    role: 'manufacturer',
    permissions: [],
    phone: '9876543211',
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
    name: 'Sales Executive',
    email: 'sales@saleson.com',
    password: 'password123',
    role: 'sales_executive',
    permissions: [],
    phone: '9876543212',
    territory: 'Delhi NCR',
    targetAmount: 500000,
    lastLocation: { lat: 28.6139, lng: 77.2090, updatedAt: new Date() },
  },
];

const ensureDemoUsers = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Add it to server/.env before running this script.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  for (const account of demoUsers) {
    const user = await User.findOne({ email: account.email }).select('+password');

    if (user) {
      user.name = account.name;
      user.password = account.password;
      user.role = account.role;
      user.permissions = account.permissions;
      user.phone = account.phone;
      user.territory = account.territory;
      user.targetAmount = account.targetAmount || 0;
      user.lastLocation = account.lastLocation;
      user.isActive = true;
      user.useCustomAccess = false;
      await user.save();
      console.log(`Updated ${account.email}`);
    } else {
      await User.create(account);
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
