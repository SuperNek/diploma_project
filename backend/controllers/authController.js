import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

// Вспомогательные функции валидации
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

// Конфигурация токенов
const TOKEN_CONFIG = {
  accessExpires: '15m',
  refreshExpires: '7d',
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: TOKEN_CONFIG.accessExpires }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    { expiresIn: TOKEN_CONFIG.refreshExpires }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;
    
    // Валидация
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }
    
    // Проверка существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      role: role || 'user'
    });
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Устанавливаем cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 минут
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
    });
    
    res.status(201).json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.fullName
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Устанавливаем cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 минут
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
    });
    
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.fullName
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.sendStatus(403);
    
    const { accessToken } = generateTokens(user);
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });
    
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(403);
  }
};

export const logout = async (req, res) => {
  try {
    // Очищаем JWT cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Middleware для проверки активности
export const activityMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) return res.sendStatus(401);
    
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.sendStatus(403);
    
    req.user = user;
    next();
  } catch (error) {
    res.sendStatus(403);
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Нет пользователя' });
    }
    const { id, email, role, fullName } = req.user;
    return res.status(200).json({ user: { id, email, role, fullName } });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка проверки' });
  }
};