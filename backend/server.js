import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sequelize from './config/db.js';
import authRouter from './routes/authRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import ticketRouter from './routes/ticketRoutes.js';
import userRouter from './routes/userRoutes.js';

const app = express();

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

// Базовые настройки безопасности
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Ограничитель запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 500
});
app.use(limiter);

// Парсинг данных
app.use(express.json());
app.use(cookieParser());

// Роуты
app.use('/api/auth', authRouter);
app.use('/api/messages', messageRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/users', userRouter);

// Инициализация БД и запуск сервера
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
})();
