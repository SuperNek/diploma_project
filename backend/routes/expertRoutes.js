import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { 
  getExpertTickets,
  updateTicketStatus,
  addExpertComment 
} from '../controllers/expertController.js';

const router = express.Router();

// Применяем аутентификацию и проверку роли для всех маршрутов
router.use(requireAuth);
router.use(requireRole('expert'));

// Панель эксперта
router.get('/dashboard', getExpertTickets);

// Обновление статуса заявки
router.patch('/tickets/:id/status', updateTicketStatus);

// Добавление комментария к заявке
router.post('/tickets/:id/comments', addExpertComment);

export default router;
