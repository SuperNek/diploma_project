import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { validationResult } from 'express-validator';
import { generateAuthToken, setAuthCookie, clearAuthCookie } from '../middleware/authMiddleware.js';

// Вспомогательные функции валидации
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

export const getLogin = (req, res) => {
  // Если пользователь уже авторизован, перенаправляем на главную
  if (req.cookies.accessToken) {
    return res.redirect('/');
  }
  
  // Получаем сообщения об ошибках
  const errorMessages = req.flash('error');
  const errors = [];
  
  // Если есть сообщение об ошибке, добавляем его в массив ошибок
  if (errorMessages && errorMessages.length > 0) {
    if (Array.isArray(errorMessages)) {
      errors.push(...errorMessages);
    } else {
      errors.push(errorMessages);
    }
  }
  
  res.render('auth/login', {
    title: 'Вход в систему',
    errors: errors,
    message: errors.length > 0 ? errors[0] : null,
    success: req.flash('success')[0] || null,
    formData: req.flash('formData')[0] || {}
  });
};

export const getRegister = (req, res) => {
  // Если пользователь уже авторизован, перенаправляем на главную
  if (req.cookies.accessToken) {
    return res.redirect('/');
  }
  
  // Получаем сообщения об ошибках
  const errorMessages = req.flash('error');
  const errors = [];
  
  // Если есть сообщение об ошибке, добавляем его в массив ошибок
  if (errorMessages && errorMessages.length > 0) {
    if (Array.isArray(errorMessages)) {
      errors.push(...errorMessages);
    } else {
      errors.push(errorMessages);
    }
  }
  
  res.render('auth/register', {
    title: 'Регистрация',
    errors: errors,
    message: errors.length > 0 ? errors[0] : null,
    success: req.flash('success')[0] || null,
    formData: req.flash('formData')[0] || {}
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName, phone, agreeTerms } = req.body;
    
    // Сохраняем введенные данные для повторного отображения в форме
    const formData = { email, fullName, phone, agreeTerms: agreeTerms === 'on' };
    
    // Валидация полей
    const errors = [];
    
    if (!email || !validateEmail(email)) {
      errors.push('Пожалуйста, введите корректный email');
    }
    
    if (!password || !validatePassword(password)) {
      errors.push('Пароль должен содержать минимум 8 символов');
    }
    
    if (password !== confirmPassword) {
      errors.push('Пароли не совпадают');
    }
    
    if (!fullName || fullName.trim().length < 2) {
      errors.push('Пожалуйста, введите ваше полное имя');
    }
    
    if (!phone || phone.trim().length < 5) {
      errors.push('Пожалуйста, введите корректный номер телефона');
    }
    
    if (!agreeTerms) {
      errors.push('Вы должны принять условия использования');
    }
    
    if (errors.length > 0) {
      req.flash('error', errors);
      req.flash('formData', formData);
      return res.redirect('/auth/register');
    }
    
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      errors.push('Пользователь с таким email уже зарегистрирован');
      req.flash('error', errors);
      req.flash('formData', formData);
      return res.redirect('/auth/register');
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      role: 'user' // По умолчанию обычный пользователь
    });
    
    // Устанавливаем пользователя в сессию (без пароля)
    const userData = user.get({ plain: true });
    delete userData.password; // Удаляем пароль из сессии
    req.session.user = userData;
    
    // Генерируем токен и устанавливаем куки
    const token = generateAuthToken(user);
    setAuthCookie(res, token);
    
    // Устанавливаем пользователя в res.locals (уже без пароля)
    res.locals.user = userData;
    res.locals.isAuthenticated = true;
    
    // Перенаправляем на страницу заявок
    req.flash('success', 'Регистрация прошла успешно! Добро пожаловать!');
    res.redirect('/tickets');
    
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Произошла ошибка при регистрации');
    res.redirect('/auth/register');
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    
    // Сохраняем введенные данные для повторного отображения в форме
    const formData = { email, remember: remember === 'on' };
    
    // Валидация полей
    const errors = [];
    if (!email) errors.push('Пожалуйста, введите email');
    if (!password) errors.push('Пожалуйста, введите пароль');
    
    if (errors.length > 0) {
      req.flash('error', errors);
      req.flash('formData', formData);
      return res.redirect('/auth/login');
    }
    
    // Проверяем, существует ли пользователь
    const user = await User.findOne({ where: { email } });
    if (!user) {
      errors.push('Неверный email или пароль');
      req.flash('error', errors);
      req.flash('formData', formData);
      return res.redirect('/auth/login');
    }
    
    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      errors.push('Неверный email или пароль');
      req.flash('error', errors);
      req.flash('formData', formData);
      return res.redirect('/auth/login');
    }
    
    // Генерируем токен
    const token = generateAuthToken(user);
    
    // Устанавливаем пользователя в сессию (без пароля)
    const userData = user.get({ plain: true });
    delete userData.password; // Удаляем пароль из сессии
    req.session.user = userData;
    
    // Устанавливаем куки с токеном
    setAuthCookie(res, token);
    
    // Устанавливаем пользователя в res.locals
    res.locals.user = userData;
    res.locals.isAuthenticated = true;
    
    // Перенаправляем на домашнюю страницу или в админ-панель
    const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/tickets';
    req.flash('success', 'Вы успешно вошли в систему');
    res.redirect(redirectTo);
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Для API запросов возвращаем JSON
    if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
      return res.status(500).json({ message: 'Ошибка при входе в систему' });
    }
    
    // Для веб-запросов перенаправляем на страницу входа с сообщением об ошибке
    req.flash('error', 'Произошла ошибка при входе в систему');
    return res.redirect('/auth/login');
  }
};

// Выход пользователя
export const logout = (req, res) => {
  try {
    // Clear user data
    if (res.locals) {
      res.locals.user = null;
      res.locals.isAuthenticated = false;
    }

    // If session exists, destroy it
    if (req.session) {
      return req.session.destroy((err) => {
        // Clear cookies after session is destroyed
        clearAuthCookie(res);
        res.clearCookie('connect.sid', { path: '/' });
        
        if (err) {
          console.error('Ошибка при уничтожении сессии:', err);
          return res.redirect('/');
        }
        
        // Create a new session for flash message
        req.session = null;
        
        // Use a simple redirect with a query parameter for success message
        res.redirect('/?logout=success');
      });
    }
    
    // If no session, just clear cookies and redirect
    clearAuthCookie(res);
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/');
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear cookies on error
    clearAuthCookie(res);
    res.clearCookie('connect.sid', { path: '/' });
    
    // Redirect with error parameter
    res.redirect('/?logout=error');
  }
};

// Middleware для проверки аутентификации
export const requireAuth = async (req, res, next) => {
  try {
    // Проверяем наличие пользователя в сессии
    if (req.session && req.session.user) {
      // Устанавливаем пользователя в запрос и локальные переменные
      req.user = req.session.user;
      res.locals.user = req.session.user;
      res.locals.isAuthenticated = true;
      return next();
    }
    
    // Если пользователя нет в сессии, проверяем токен
    const token = req.cookies.accessToken;
    if (!token) {
      // Сохраняем URL, на который пытался зайти пользователь
      req.session.returnTo = req.originalUrl;
      req.flash('error', 'Пожалуйста, войдите в систему для доступа к этой странице');
      return res.redirect('/auth/login');
    }
    
    // Если есть токен, но нет пользователя в сессии, пробуем загрузить пользователя
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      clearAuthCookie(res);
      req.flash('error', 'Пользователь не найден');
      return res.redirect('/auth/login');
    }
    
    // Устанавливаем пользователя в сессию и локальные переменные
    const userData = user.get({ plain: true });
    req.session.user = userData;
    req.user = userData;
    res.locals.user = userData;
    res.locals.isAuthenticated = true;
    
    // Продолжаем выполнение следующего middleware
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Для API запросов возвращаем JSON
    if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ message: 'Не авторизован' });
    }
    
    // Для веб-запросов перенаправляем на страницу входа
    req.flash('error', 'Ошибка аутентификации. Пожалуйста, войдите снова.');
    return res.redirect('/auth/login');
  }
};

// Middleware для передачи сообщений во все шаблоны
export const flashMessages = (req, res, next) => {
  // Передаем сообщения в локальные переменные шаблонов
  res.locals.messages = req.session.messages || {};
  
  // Очищаем сообщения после их использования
  if (req.session.messages) {
    req.session.messages = {};
  }
  
  next();
};