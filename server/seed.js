import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Outlet from './models/Outlet.js';
import Product from './models/Product.js';
import Route from './models/Route.js';
import SalesOrder from './models/SalesOrder.js';
import Invoice from './models/Invoice.js';
import Payment from './models/Payment.js';
import Inventory from './models/Inventory.js';
import Target from './models/Target.js';
import Settings from './models/Settings.js';
import Attendance from './models/Attendance.js';

dotenv.config();

const hashedPassword = async (password) => bcrypt.hash(password, 12);

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  await Promise.all([
    User.deleteMany(), Outlet.deleteMany(), Product.deleteMany(), Route.deleteMany(),
    SalesOrder.deleteMany(), Invoice.deleteMany(), Payment.deleteMany(),
    Inventory.deleteMany(), Target.deleteMany(), Settings.deleteMany(), Attendance.deleteMany(),
  ]);

  console.log('Creating users...');

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@saleson.com',
    password: 'password123',
    role: 'super_admin',
    permissions: ['*'],
    phone: '9876543000',
  });

  const admin1 = await User.create({
    name: 'Admin User',
    email: 'admin@saleson.com',
    password: 'password123',
    role: 'admin',
    permissions: ['*'],
    phone: '9876543210',
    territory: 'North India',
    createdBy: superAdmin._id,
  });

  await User.create({
    name: 'Manufacturer User',
    email: 'manufacturer@saleson.com',
    password: 'password123',
    role: 'manufacturer',
    permissions: [],
    phone: '9876543211',
    createdBy: superAdmin._id,
  });

  await User.create({
    name: 'Distributor User',
    email: 'distributor@saleson.com',
    password: 'password123',
    role: 'distributor',
    permissions: [],
    phone: '9876543214',
    createdBy: admin1._id,
  });

  const salesExec1 = await User.create({
    name: 'Sales Executive',
    email: 'sales@saleson.com',
    password: 'password123',
    role: 'sales_executive',
    phone: '9876543212',
    territory: 'Delhi NCR',
    targetAmount: 500000,
    lastLocation: { lat: 28.6139, lng: 77.2090, updatedAt: new Date() },
    createdBy: admin1._id,
  });

  const salesExec2 = await User.create({
    name: 'Priya Singh',
    email: 'priya@saleson.com',
    password: 'password123',
    role: 'sales_executive',
    phone: '9876543213',
    territory: 'Mumbai',
    targetAmount: 450000,
    lastLocation: { lat: 19.0760, lng: 72.8777, updatedAt: new Date() },
    createdBy: admin1._id,
  });

  const products = await Product.insertMany([
    { name: 'Premium Basmati Rice 5kg', sku: 'RICE-001', category: 'Grocery', hsnCode: '1006', gstRate: 5, mrp: 650, sellingPrice: 580, purchasePrice: 480, stock: 500 },
    { name: 'Sunflower Oil 1L', sku: 'OIL-001', category: 'Grocery', hsnCode: '1512', gstRate: 5, mrp: 180, sellingPrice: 165, purchasePrice: 140, stock: 800 },
    { name: 'Detergent Powder 1kg', sku: 'DET-001', category: 'FMCG', hsnCode: '3402', gstRate: 18, mrp: 120, sellingPrice: 105, purchasePrice: 85, stock: 600 },
    { name: 'Biscuit Pack 200g', sku: 'BIS-001', category: 'FMCG', hsnCode: '1905', gstRate: 12, mrp: 40, sellingPrice: 35, purchasePrice: 28, stock: 1200 },
    { name: 'Mineral Water 1L', sku: 'WAT-001', category: 'Beverages', hsnCode: '2201', gstRate: 12, mrp: 20, sellingPrice: 18, purchasePrice: 12, stock: 2000 },
    { name: 'Tea Premium 500g', sku: 'TEA-001', category: 'Grocery', hsnCode: '0902', gstRate: 5, mrp: 350, sellingPrice: 320, purchasePrice: 260, stock: 400 },
  ]);

  const route1 = await Route.create({
    name: 'Delhi Route A',
    code: 'DL-A',
    area: 'South Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    assignedReps: [salesExec1._id],
    estimatedDistance: 45,
  });

  const route2 = await Route.create({
    name: 'Mumbai Route B',
    code: 'MH-B',
    area: 'Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    assignedReps: [salesExec2._id],
    estimatedDistance: 38,
  });

  console.log('Creating outlets with retailer login...');

  const outlets = await Outlet.insertMany([
    {
      name: 'Sharma General Store',
      code: 'OUT-001',
      type: 'retailer',
      contactPerson: 'Ramesh Sharma',
      phone: '9811000001',
      email: 'ramesh@sharma.com',
      gstin: '07AABCS1234A1Z5',
      address: { street: '12, Main Market', city: 'New Delhi', state: 'Delhi', pincode: '110017' },
      location: { lat: 28.5244, lng: 77.2066 },
      route: route1._id,
      assignedTo: salesExec1._id,
      outstandingBalance: 15000,
      creditLimit: 50000,
      loginEmail: 'retailer1@distriFlow.com',
      loginPassword: await hashedPassword('retailer123'),
    },
    {
      name: 'Gupta Traders',
      code: 'OUT-002',
      type: 'wholesaler',
      contactPerson: 'Suresh Gupta',
      phone: '9811000002',
      email: 'suresh@gupta.com',
      gstin: '07AABCG5678B2Z6',
      address: { street: '45, Wholesale Market', city: 'New Delhi', state: 'Delhi', pincode: '110006' },
      location: { lat: 28.6562, lng: 77.2410 },
      route: route1._id,
      assignedTo: salesExec1._id,
      outstandingBalance: 45000,
      creditLimit: 200000,
    },
    {
      name: 'Patel Super Mart',
      code: 'OUT-003',
      type: 'retailer',
      contactPerson: 'Vijay Patel',
      phone: '9811000003',
      email: 'vijay@patel.com',
      gstin: '27AABCP9012C3Z7',
      address: { street: '78, Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
      location: { lat: 19.1197, lng: 72.8464 },
      route: route2._id,
      assignedTo: salesExec2._id,
      outstandingBalance: 8500,
      creditLimit: 75000,
      loginEmail: 'retailer2@distriFlow.com',
      loginPassword: await hashedPassword('retailer123'),
    },
    {
      name: 'City Distributors',
      code: 'OUT-004',
      type: 'distributor',
      contactPerson: 'Anil Mehta',
      phone: '9811000004',
      email: 'anil@city.com',
      gstin: '27AABCD3456D4Z8',
      address: { street: '23, Industrial Area', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      location: { lat: 18.9388, lng: 72.8354 },
      route: route2._id,
      assignedTo: salesExec2._id,
      outstandingBalance: 120000,
      creditLimit: 500000,
    },
    {
      name: 'Pune Retail Shop',
      code: 'OUT-005',
      type: 'retailer',
      contactPerson: 'Mahesh Kumar',
      phone: '9811000005',
      email: 'mahesh@pune.com',
      gstin: '27AABCS5678E4Z9',
      address: { street: '56, Market Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
      location: { lat: 18.5204, lng: 73.8567 },
      assignedTo: salesExec1._id,
      outstandingBalance: 25000,
      creditLimit: 100000,
      loginEmail: 'retailer3@distriFlow.com',
      loginPassword: await hashedPassword('retailer123'),
    },
  ]);

  await Route.findByIdAndUpdate(route1._id, { outlets: [outlets[0]._id, outlets[1]._id] });
  await Route.findByIdAndUpdate(route2._id, { outlets: [outlets[2]._id, outlets[3]._id] });
  await User.findByIdAndUpdate(salesExec1._id, { assignedRoutes: [route1._id] });
  await User.findByIdAndUpdate(salesExec2._id, { assignedRoutes: [route2._id] });

  for (const p of products) {
    await Inventory.create({ product: p._id, quantity: p.stock, availableQty: p.stock, warehouse: 'Main' });
  }

  const order1 = await SalesOrder.create({
    outlet: outlets[0]._id,
    salesRep: salesExec1._id,
    route: route1._id,
    items: [
      { product: products[0]._id, productName: products[0].name, sku: products[0].sku, quantity: 10, rate: 580, gstRate: 5, amount: 5800 },
      { product: products[1]._id, productName: products[1].name, sku: products[1].sku, quantity: 20, rate: 165, gstRate: 5, amount: 3300 },
    ],
    subtotal: 9100,
    taxTotal: 455,
    grandTotal: 9555,
    status: 'delivered',
  });

  const invoice1 = await Invoice.create({
    type: 'sales',
    outlet: outlets[0]._id,
    salesRep: salesExec1._id,
    salesOrder: order1._id,
    items: order1.items,
    subtotal: 9100,
    cgstTotal: 227.5,
    sgstTotal: 227.5,
    taxTotal: 455,
    grandTotal: 9555,
    paidAmount: 5000,
    balanceDue: 4555,
    status: 'partial',
    gstin: outlets[0].gstin,
  });

  await Payment.create({
    outlet: outlets[0]._id,
    invoice: invoice1._id,
    collectedBy: salesExec1._id,
    amount: 5000,
    mode: 'upi',
    referenceNo: 'UPI123456',
    status: 'approved',
  });

  await Target.create({
    title: 'May 2026 Sales Target',
    type: 'revenue',
    period: 'monthly',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-05-31'),
    companyTarget: 2000000,
    assignments: [
      { user: salesExec1._id, targetAmount: 500000 },
      { user: salesExec2._id, targetAmount: 450000 },
    ],
  });

  const today = new Date();
  await Attendance.create({
    user: superAdmin._id,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000),
    status: 'present',
  });

  console.log('\n✅ Seed completed!');
  console.log('\nLogin credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Super Admin:      superadmin@saleson.com / password123');
  console.log('  Admin:            admin@saleson.com / password123');
  console.log('  Manufacturer:     manufacturer@saleson.com / password123');
  console.log('  Distributor:      distributor@saleson.com / password123');
  console.log('  Sales Executive:  sales@saleson.com / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🟡  Retailer 1:   retailer1@distriFlow.com / retailer123');
  console.log('  🟡  Retailer 2:   retailer2@distriFlow.com / retailer123');
  console.log('  🟡  Retailer 3:   retailer3@distriFlow.com / retailer123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
