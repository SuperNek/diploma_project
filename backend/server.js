import express from 'express';
import ejs from 'ejs';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import './models/index.js';
import { initAdminUser } from './seeders/initAdmin.js';
import authRouter from './routes/authRoutes.js';
import profileRouter from './routes/profileRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import ticketRouter from './routes/ticketRoutes.js';
import userRouter from './routes/userRoutes.js';
import { requireAuth } from './middleware/authMiddleware.js';
import { requireRole } from './middleware/roleMiddleware.js';
import { notFoundHandler, errorHandler } from './utils/errors.js';

// Инициализация приложения
const app = express();

// Получаем __dirname в ES модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка переменных окружения
dotenv.config({ path: path.join(__dirname, '../.env') });

// Настройка движка представлений
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware для статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Парсинг данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Flash сообщения (должно быть после настройки сессий)
app.use(flash());

// Передача flash-сообщений в шаблоны
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.user = req.user || null;
    next();
});

// Настройка сессий
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false, 
    saveUninitialized: false, 
    cookie: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', 
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    },
    // Добавляем имя куки, чтобы избежать конфликтов
    name: 'support-system.sid',
    // В продакшене используем хранилище сессий в PostgreSQL
    store: process.env.NODE_ENV === 'production' ? (() => {
        const pg = require('pg');
        const pgSession = require('connect-pg-simple')(session);
        const pgPool = new pg.Pool({
            connectionString: process.env.DATABASE_URL
        });
        return new pgSession({
            pool: pgPool,
            tableName: 'user_sessions',
            createTableIfMissing: true
        });
    })() : undefined
};

// Session middleware - must be before routes
app.use(session(sessionConfig));
app.use(flash());

// Middleware для установки пользователя из сессии в res.locals
app.use((req, res, next) => {
    // Установка пользователя из сессии
    if (req.session && req.session.user) {
        // Create a clean user object without sensitive data
        const { password, ...userWithoutPassword } = req.session.user;
        res.locals.user = userWithoutPassword;
        res.locals.isAuthenticated = true;
        // Also set on req for API routes
        req.user = userWithoutPassword;
    } else {
        res.locals.user = null;
        res.locals.isAuthenticated = false;
        req.user = null;
    }
    
    // Установка flash-сообщений
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    
    next();
});

// В продакшене используем хранилище сессий в PostgreSQL
if (process.env.NODE_ENV === 'production') {
    const pgSession = (await import('connect-pg-simple')).default;
    const pg = (await import('pg')).default;
    
    const pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    sessionConfig.store = new (pgSession(session))({
        pool: pgPool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    });
}

app.use(session(sessionConfig));

// Flash сообщения
app.use(flash());

// Глобальные переменные для шаблонов
app.use((req, res, next) => {
    // Установка пользователя и флага аутентификации
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = !!req.user;
    
    // Установка flash-сообщений
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    
    // Логируем flash-сообщения для отладки
    if (res.locals.success && res.locals.success.length > 0) {
        console.log('Flash success:', res.locals.success);
    }
    if (res.locals.error && res.locals.error.length > 0) {
        console.log('Flash error:', res.locals.error);
    }
    
    next();
});

// Роуты
app.use('/auth', authRouter);
app.use('/profile', requireAuth, profileRouter);
app.use('/admin', [requireAuth, requireRole('admin')], adminRouter);
app.use('/messages', requireAuth, messageRouter);
app.use('/tickets', ticketRouter);
app.use('/users', userRouter);

// Root route
app.get('/', (req, res) => {
    const user = req.session.user || req.user;
    
    if (user) {
        // Redirect based on user role
        if (user.role === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/tickets');
        }
    }

    // For unauthenticated users, show the home page
    res.render('index', { 
        title: 'Главная',
        user: null,
        isAuthenticated: false
    });
});

// Роут для редиректа аутентифицированных пользователей на страницу заявок
app.get('/home', requireAuth, (req, res) => {
    res.redirect('/tickets');
});

// Профиль пользователя
app.get('/profile', requireAuth, (req, res) => {
    res.render('profile', {
        title: 'Мой профиль',
        user: req.user
    });
});

// Админ панель
app.get('/admin/dashboard', requireRole('admin'), (req, res) => {
    res.render('admin/dashboard', {
        title: 'Панель администратора'
    });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Страница не найдена',
        message: 'Запрашиваемая страница не существует.'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).render('error', {
        title: 'Ошибка сервера',
        message: 'Произошла непредвиденная ошибка на сервере.',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Функция для проверки соединения с БД
const checkDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Подключение к БД успешно установлено');
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения к БД:', error);
        return false;
    }
};

// Функция для синхронизации моделей с БД
const syncDatabase = async () => {
    try {
        // Отключаем синхронизацию с alter, так как SQLite плохо с этим работает
        // Вместо этого будем использовать миграции для изменений схемы
        await sequelize.sync({ force: false });
        console.log('✅ Модели синхронизированы с БД');
        return true;
    } catch (error) {
        console.error('❌ Ошибка синхронизации моделей с БД:', error);
        return false;
    }
};

// Функция для запуска сервера
const startServer = () => {
    const PORT = process.env.PORT || 3000;
    return new Promise((resolve) => {
        const server = app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`🌐 Откройте в браузере: http://localhost:${PORT}`);
            resolve(server);
        });
    });
};

// Основная функция инициализации
const initializeApp = async () => {
    try {
        // Проверяем подключение к БД
        const isDbConnected = await checkDatabaseConnection();
        if (!isDbConnected) {
            throw new Error('Не удалось подключиться к БД');
        }
        
        // Синхронизируем модели с БД
        const isDbSynced = await syncDatabase();
        if (!isDbSynced) {
            throw new Error('Не удалось синхронизировать модели с БД');
        }
        
        // Инициализируем администратора
        await initAdminUser();
        
        // Запускаем сервер
        await startServer();
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации приложения:', error);
        process.exit(1); // Завершаем процесс с ошибкой
    }
};

// Обработка 404 ошибки
app.use(notFoundHandler);

// Обработка ошибок
app.use(errorHandler);

// Запускаем приложение
initializeApp();
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Необработанное отклонение промиса:', reason);
    // Логируем ошибку и продолжаем работу
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Непойманное исключение:', error);
    // Завершаем процесс с ошибкой (в продакшене можно перезапустить процесс с помощью PM2)
    process.exit(1);
});
