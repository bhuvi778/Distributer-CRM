import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Outlet from '../models/Outlet.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'retailer') {
      req.retailer = await Outlet.findById(decoded.id);
      if (!req.retailer) return res.status(401).json({ message: 'Retailer not found' });
      req.user = { role: 'retailer', _id: req.retailer._id, name: req.retailer.name };
    } else {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Role ${req.user.role} not authorized` });
  }
  next();
};

export const checkPermission = (permission) => (req, res, next) => {
  if (req.user.role === 'super_admin' || req.user.role === 'admin') return next();
  if (req.user.permissions?.includes(permission) || req.user.permissions?.includes('*')) {
    return next();
  }
  return res.status(403).json({ message: 'Permission denied' });
};

export const isRetailer = (req, res, next) => {
  if (req.user.role !== 'retailer') {
    return res.status(403).json({ message: 'Retailer access required' });
  }
  next();
};
