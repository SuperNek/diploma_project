import express from 'express';
import { 
  createTicket, 
  getTickets,
  getTicketById,
  updateTicket,
  assignExpert,
  closeTicket 
} from '../controllers/ticketController.js';
import { auth, role } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', auth, createTicket);
router.get('/', auth, getTickets);
router.get('/:id', auth, getTicketById);
router.put('/:id', auth, updateTicket);
router.patch('/:id/assign', auth, role('admin', 'coordinator'), assignExpert);
router.patch('/:id/close', auth, closeTicket);

export default router;
