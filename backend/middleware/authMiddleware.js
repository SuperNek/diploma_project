import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const auth = async (req, res, next) => {
  try {
    // Ищем токен сначала в куках, потом в заголовке Authorization
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = await User.findByPk(decoded.id);

    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized' });
  }
};

export const role = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};
