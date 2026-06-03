import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import moduleRoutes from './routes/modules.js';
import masterDataRoutes from './routes/masterData.js';
import employeeRoutes from './routes/employees.js';
import inventoryRoutes from './routes/inventory.js';
import partyRoutes from './routes/parties.js';
import salesRoutes from './routes/sales.js';
import leadRoutes from './routes/leads.js';
import routeManagementRoutes from './routes/routeManagement.js';

dotenv.config();
connectDB();

const app = express();

// CORS — allow Vercel frontend + local dev
const allowedOrigins = [
  'http://localhost:3020',
  'http://localhost:5173',
  'https://distributer-crm.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Render health checks, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development allow all
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'DistriFlow API' }));

// ONE-TIME SEED ROUTE — remove after seeding
app.get('/api/seed-now', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== 'bhupe_seed_2024') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { default: mongoose } = await import('mongoose');
    const { default: bcrypt } = await import('bcryptjs');
    const { default: User } = await import('./models/User.js');
    const { default: Outlet } = await import('./models/Outlet.js');
    const { default: Product } = await import('./models/Product.js');
    const { default: Route } = await import('./models/Route.js');
    const { default: Inventory } = await import('./models/Inventory.js');
    const { default: Target } = await import('./models/Target.js');

    await Promise.all([
      User.deleteMany({}), Outlet.deleteMany({}),
      Product.deleteMany({}), Route.deleteMany({}),
      Inventory.deleteMany({}), Target.deleteMany({}),
    ]);

    const hash = async (p) => bcrypt.hash(p, 12);

    const superAdmin = await User.create({ name: 'Super Admin', email: 'superadmin@distriflow.com', password: 'super123', role: 'super_admin', permissions: ['*'], phone: '9876543000' });
    const admin1 = await User.create({ name: 'Admin User', email: 'admin@distriflow.com', password: 'admin123', role: 'admin', permissions: ['*'], phone: '9876543210', createdBy: superAdmin._id });
    const salesExec1 = await User.create({ name: 'Amit Sharma', email: 'amit@distriflow.com', password: 'exec123', role: 'sales_executive', phone: '9876543212', createdBy: admin1._id });
    const salesExec2 = await User.create({ name: 'Priya Singh', email: 'priya@distriflow.com', password: 'exec123', role: 'sales_executive', phone: '9876543213', createdBy: admin1._id });

    const products = await Product.insertMany([
      { name: 'Premium Basmati Rice 5kg', sku: 'RICE-001', category: 'Grocery', hsnCode: '1006', gstRate: 5, mrp: 650, sellingPrice: 580, purchasePrice: 480, stock: 500 },
      { name: 'Sunflower Oil 1L', sku: 'OIL-001', category: 'Grocery', hsnCode: '1512', gstRate: 5, mrp: 180, sellingPrice: 165, purchasePrice: 140, stock: 800 },
      { name: 'Detergent Powder 1kg', sku: 'DET-001', category: 'FMCG', hsnCode: '3402', gstRate: 18, mrp: 120, sellingPrice: 105, purchasePrice: 85, stock: 600 },
    ]);

    const route1 = await Route.create({ name: 'Delhi Route A', code: 'DL-A', area: 'South Delhi', city: 'New Delhi', state: 'Delhi', assignedReps: [salesExec1._id] });

    const outlets = await Outlet.insertMany([
      { name: 'Sharma General Store', code: 'OUT-001', type: 'retailer', phone: '9811000001', address: { city: 'New Delhi', state: 'Delhi', pincode: '110017' }, route: route1._id, assignedTo: salesExec1._id, outstandingBalance: 15000, creditLimit: 50000, loginEmail: 'retailer1@distriflow.com', loginPassword: await hash('retailer123') },
      { name: 'Patel Super Mart', code: 'OUT-002', type: 'retailer', phone: '9811000003', address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400053' }, assignedTo: salesExec2._id, outstandingBalance: 8500, creditLimit: 75000, loginEmail: 'retailer2@distriflow.com', loginPassword: await hash('retailer123') },
    ]);

    for (const p of products) {
      await Inventory.create({ product: p._id, quantity: p.stock, availableQty: p.stock, warehouse: 'Main' });
    }

    res.json({
      message: '✅ Seed complete!',
      credentials: {
        superAdmin: 'superadmin@distriflow.com / super123',
        admin: 'admin@distriflow.com / admin123',
        salesExec: 'amit@distriflow.com / exec123',
        retailer1: 'retailer1@distriflow.com / retailer123',
        retailer2: 'retailer2@distriflow.com / retailer123',
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/route-management', routeManagementRoutes);
app.use('/api', moduleRoutes);

app.use((err, req, res, next) => {
  console.error(`[API Error] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DistriFlow server running on port ${PORT}`));
