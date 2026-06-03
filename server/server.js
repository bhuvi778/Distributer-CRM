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
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'DistriFlow API' }));

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
