import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Middleware для проверки аутентификации пользователя
 * @throws {UnauthorizedError} Если пользователь не аутентифицирован
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Проверяем, есть ли токен в куках или заголовке Authorization
    let token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Для доступа требуется авторизация');
    }
    
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Находим пользователя в базе данных
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } // Исключаем пароль из результата
    });
    
    if (!user) {
      throw new UnauthorizedError('Пользователь не найден');
    }
    
    // Устанавливаем пользователя в запрос и локальные переменные ответа
    req.user = user;
    res.locals.user = user;
    res.locals.isAuthenticated = true;
    
    next();
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    
    // Очищаем куки при ошибке верификации
    res.clearCookie('accessToken');
    
    // Устанавливаем флаги аутентификации в false
    res.locals.user = null;
    res.locals.isAuthenticated = false;
    
    // Если это API запрос, возвращаем JSON ошибку
    if (req.xhr || req.accepts('json')) {
      return next(error);
    }
    
    // Иначе перенаправляем на страницу входа с сообщением об ошибке
    req.flash('error', error.message || 'Ошибка аутентификации. Пожалуйста, войдите снова.');
    res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
};

/**
 * Middleware для проверки, что пользователь не аутентифицирован
 * Перенаправляет на главную, если пользователь уже вошел в систему
 */
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
};

// Middleware для проверки роли пользователя
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Для доступа к этой странице требуется авторизация');
      return res.redirect('/auth/login');
    }
    
    if (!roles.includes(req.user.role)) {
      req.flash('error', 'Недостаточно прав для доступа');
      return res.redirect('/');
    }
    
    next();
  };
};

// Генерация JWT токена
export const generateAuthToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      fullName: user.fullName
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' } // Увеличиваем время жизни токена до 24 часов
  );
};

// Установка куки с токеном
export const setAuthCookie = (res, token) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  });
};

// Очистка куки аутентификации
export const clearAuthCookie = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};
