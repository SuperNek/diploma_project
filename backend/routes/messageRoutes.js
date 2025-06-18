import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  updateMessage,
  deleteMessage,
  markAsRead 
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Защищаем все маршруты аутентификацией
router.use(requireAuth);

router.get('/:ticketId', getMessages);
router.post('/:ticketId', sendMessage);
router.put('/:messageId', updateMessage);
router.delete('/:messageId', deleteMessage);
router.patch('/:messageId/read', markAsRead);

export default router;
