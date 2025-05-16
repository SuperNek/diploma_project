import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  updateMessage,
  deleteMessage,
  markAsRead 
} from '../controllers/messageController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:ticketId', auth, getMessages);
router.post('/:ticketId', auth, sendMessage);
router.put('/:messageId', auth, updateMessage);
router.delete('/:messageId', auth, deleteMessage);
router.patch('/:messageId/read', auth, markAsRead);

export default router;
