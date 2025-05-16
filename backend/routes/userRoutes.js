import express from 'express';
import { 
  getUserProfile,
  updateUserProfile,
  getUserTickets,
  getUsers
} from '../controllers/userController.js';
import { auth, role } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', auth, getUserProfile);
router.put('/me', auth, updateUserProfile);
router.get('/me/tickets', auth, getUserTickets);
router.get('/', auth, role('admin'), getUsers);

export default router;
