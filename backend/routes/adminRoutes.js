import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { 
    getDashboard, 
    getUsers,
    createUser, 
    updateUserRole, 
    deleteUser 
} from '../controllers/adminController.js';

const router = express.Router();

// Защищаем все маршруты аутентификацией и правами администратора
router.use(requireAuth);
router.use(requireAdmin);

// Главная страница админ-панели
router.get('/', getDashboard);

// Управление пользователями
router.get('/users', getUsers);

// Создание пользователя
router.post('/users', createUser);

// Обновление роли пользователя
router.post('/users/:userId/role', updateUserRole);

// Удаление пользователя
router.delete('/users/:userId', deleteUser);

export default router;
