import dotenv from 'dotenv';
import mongoose from 'mongoose';
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
import ItemOption from './models/ItemOption.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  await Promise.all([
    User.deleteMany(),
    Outlet.deleteMany(),
    Product.deleteMany(),
    Route.deleteMany(),
    SalesOrder.deleteMany(),
    Invoice.deleteMany(),
    Payment.deleteMany(),
    Inventory.deleteMany(),
    Target.deleteMany(),
    Settings.deleteMany(),
    Attendance.deleteMany(),
    ItemOption.deleteMany(),
  ]);

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@saleson.com',
    password: 'password123',
    role: 'super_admin',
    permissions: ['*'],
    phone: '9876543000',
  });

  const distributor = await User.create({
    name: 'Distributor User',
    email: 'distributor@saleson.com',
    password: 'password123',
    role: 'distributor',
    permissions: [],
    phone: '9876543214',
    createdBy: superAdmin._id,
  });

  const salesRep = await User.create({
    name: 'Sales Representative',
    email: 'salesrep@saleson.com',
    password: 'password123',
    role: 'sales_rep',
    phone: '9876543212',
    territory: 'Delhi NCR',
    targetAmount: 500000,
    lastLocation: { lat: 28.6139, lng: 77.2090, updatedAt: new Date() },
    createdBy: distributor._id,
  });

  const products = await Product.insertMany([
    { name: 'Premium Basmati Rice 5kg', sku: 'RICE-001', category: 'Grocery', hsnCode: '1006', gstRate: 5, mrp: 650, sellingPrice: 580, purchasePrice: 480, stock: 500 },
    { name: 'Sunflower Oil 1L', sku: 'OIL-001', category: 'Grocery', hsnCode: '1512', gstRate: 5, mrp: 180, sellingPrice: 165, purchasePrice: 140, stock: 800 },
    { name: 'Detergent Powder 1kg', sku: 'DET-001', category: 'FMCG', hsnCode: '3402', gstRate: 18, mrp: 120, sellingPrice: 105, purchasePrice: 85, stock: 600 },
    { name: 'Biscuit Pack 200g', sku: 'BIS-001', category: 'FMCG', hsnCode: '1905', gstRate: 12, mrp: 40, sellingPrice: 35, purchasePrice: 28, stock: 1200 },
    { name: 'Mineral Water 1L', sku: 'WAT-001', category: 'Beverages', hsnCode: '2201', gstRate: 12, mrp: 20, sellingPrice: 18, purchasePrice: 12, stock: 2000 },
    { name: 'Tea Premium 500g', sku: 'TEA-001', category: 'Grocery', hsnCode: '0902', gstRate: 5, mrp: 350, sellingPrice: 320, purchasePrice: 260, stock: 400 },
  ]);

  const route = await Route.create({
    name: 'Delhi Route A',
    code: 'DL-A',
    area: 'South Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    assignedReps: [salesRep._id],
    estimatedDistance: 45,
  });

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
      route: route._id,
      assignedTo: salesRep._id,
      outstandingBalance: 15000,
      creditLimit: 50000,
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
      route: route._id,
      assignedTo: salesRep._id,
      outstandingBalance: 45000,
      creditLimit: 200000,
    },
  ]);

  await Route.findByIdAndUpdate(route._id, { outlets: outlets.map((outlet) => outlet._id) });
  await User.findByIdAndUpdate(salesRep._id, { assignedRoutes: [route._id] });

  for (const product of products) {
    await Inventory.create({ product: product._id, quantity: product.stock, availableQty: product.stock, warehouse: 'Main' });
  }

  const order = await SalesOrder.create({
    outlet: outlets[0]._id,
    salesRep: salesRep._id,
    route: route._id,
    items: [
      { product: products[0]._id, productName: products[0].name, sku: products[0].sku, quantity: 10, rate: 580, gstRate: 5, amount: 5800 },
      { product: products[1]._id, productName: products[1].name, sku: products[1].sku, quantity: 20, rate: 165, gstRate: 5, amount: 3300 },
    ],
    subtotal: 9100,
    taxTotal: 455,
    grandTotal: 9555,
    status: 'delivered',
  });

  const invoice = await Invoice.create({
    type: 'sales',
    outlet: outlets[0]._id,
    salesRep: salesRep._id,
    salesOrder: order._id,
    items: order.items,
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
    invoice: invoice._id,
    collectedBy: salesRep._id,
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
    assignments: [{ user: salesRep._id, targetAmount: 500000 }],
  });

  const today = new Date();
  await Attendance.create({
    user: superAdmin._id,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000),
    status: 'present',
  });

  console.log('\nSeed completed!');
  console.log('\nLogin credentials:');
  console.log('  Super Admin:      superadmin@saleson.com / password123');
  console.log('  Distributor:      distributor@saleson.com / password123');
  console.log('  Sales Rep:        salesrep@saleson.com / password123\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
