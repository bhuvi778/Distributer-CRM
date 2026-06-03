import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Outlet from '../models/Outlet.js';

const generateToken = (id, type = 'user') =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    
    if (role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot create super admin accounts' });
    }
    if (role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admin can create admin accounts' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'employee', 
      phone, 
      createdBy: req.user._id 
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (user) {
      if (!(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        allowedModules: user.allowedModules,
        useCustomAccess: user.useCustomAccess,
        jobTitle: user.jobTitle,
        department: user.department,
        createdBy: user.createdBy,
        token: generateToken(user._id),
      });
    }

    const outlet = await Outlet.findOne({ loginEmail: email }).select('+loginPassword');
    if (outlet) {
      if (!(await bcrypt.compare(password, outlet.loginPassword))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (!outlet.isActive) return res.status(403).json({ message: 'Account deactivated' });
      return res.json({
        _id: outlet._id,
        name: outlet.name,
        email: outlet.loginEmail,
        role: 'retailer',
        outletId: outlet._id,
        assignedTo: outlet.assignedTo,
        outstandingBalance: outlet.outstandingBalance,
        creditLimit: outlet.creditLimit,
        token: generateToken(outlet._id, 'retailer'),
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    if (req.user.role === 'retailer') {
      const outlet = await Outlet.findById(req.user._id)
        .populate('assignedTo', 'name phone');
      return res.json({
        _id: outlet._id,
        name: outlet.name,
        email: outlet.loginEmail,
        role: 'retailer',
        outletId: outlet._id,
        assignedTo: outlet.assignedTo,
        outstandingBalance: outlet.outstandingBalance,
        creditLimit: outlet.creditLimit,
      });
    }
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('assignedRoutes', 'name code area')
      .populate('createdBy', 'name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (req.user.role === 'retailer') {
      const outlet = await Outlet.findByIdAndUpdate(req.user._id, req.body, { new: true });
      return res.json(outlet);
    }
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'super_admin') {
      filter = { role: { $ne: 'super_admin' } };
    } else if (req.user.role === 'admin') {
      filter = { role: { $nin: ['super_admin', 'admin'] } };
    }
    const users = await User.find(filter).select('-password')
      .populate('assignedRoutes', 'name')
      .populate('createdBy', 'name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot update super admin' });
    }
    if (user.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admin can update admin accounts' });
    }
    if (req.body.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot set role to super admin' });
    }
    if (req.body.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admin can set admin role' });
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }
    if (user.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admin can delete admin accounts' });
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Outlet = (await import('../models/Outlet.js')).default;
    const SalesOrder = (await import('../models/SalesOrder.js')).default;
    const Invoice = (await import('../models/Invoice.js')).default;
    const Payment = (await import('../models/Payment.js')).default;

    const admins = await User.find({ role: 'admin' });
    
    const stats = await Promise.all(admins.map(async (admin) => {
      // Get employees created by this admin
      const employeeCount = await User.countDocuments({ 
        createdBy: admin._id, 
        role: { $nin: ['super_admin', 'admin'] } 
      });

      // Get outlets assigned to this admin's reps
      const adminReps = await User.find({ 
        createdBy: admin._id, 
        role: { $in: ['sales_executive', 'sales_rep'] } 
      }).select('_id');
      
      const repIds = adminReps.map(r => r._id);
      
      const outletCount = await Outlet.countDocuments({ 
        assignedTo: { $in: repIds } 
      });

      // Get orders, invoices, payments for this admin's reps
      const orderCount = await SalesOrder.countDocuments({ 
        salesRep: { $in: repIds } 
      });
      
      const invoiceStats = await Invoice.aggregate([
        { $match: { salesRep: { $in: repIds } } },
        { $group: { _id: null, totalAmount: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]);

      const paymentStats = await Payment.aggregate([
        { $match: { collectedBy: { $in: repIds } } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      return {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        territory: admin.territory,
        isActive: admin.isActive,
        employeeCount,
        outletCount,
        orderCount,
        totalRevenue: invoiceStats[0]?.totalAmount || 0,
        totalPayments: paymentStats[0]?.totalAmount || 0,
        invoiceCount: invoiceStats[0]?.count || 0,
        paymentCount: paymentStats[0]?.count || 0
      };
    }));

    // Get system-wide stats for super admin dashboard
    const systemStats = {
      totalAdmins: admins.length,
      totalEmployees: await User.countDocuments({ role: { $nin: ['super_admin', 'admin'] } }),
      totalOutlets: await Outlet.countDocuments(),
      totalOrders: await SalesOrder.countDocuments(),
      totalRevenue: (await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]))[0]?.total || 0,
      totalPayments: (await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0
    };

    res.json({ stats, systemStats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { lastLocation: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );
    res.json(user.lastLocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
