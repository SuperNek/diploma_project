import express from 'express';
import { 
  getUserProfile,
  updateUserProfile,
  getUserTickets,
  getUsers
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Защищаем все маршруты аутентификацией
router.use(requireAuth);

router.get('/me', getUserProfile);
router.put('/me', updateUserProfile);
router.get('/me/tickets', getUserTickets);
router.get('/', getUsers);

export default router;
