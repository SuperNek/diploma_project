import express from 'express';
import { 
  createTicket, 
  getTickets,
  getTicketById,
  updateTicket,
  assignExpert,
  assignCoordinator,
  closeTicket,
  getTicketsApi,
  showNewTicketForm,
  showTicket
} from '../controllers/ticketController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireCoordinatorOrAdmin } from '../middleware/coordinatorMiddleware.js';
import { Ticket, User, Message } from '../models/index.js';

// Вспомогательная функция для получения текста статуса
function getStatusText(status) {
    const statuses = {
        'open': 'Открыта',
        'in_progress': 'В работе',
        'on_hold': 'На паузе',
        'resolved': 'Решена',
        'closed': 'Закрыта'
    };
    return statuses[status] || status;
}

const router = express.Router();

// Применяем аутентификацию для всех маршрутов
router.use(requireAuth);

// API маршруты
router.post('/api/tickets', createTicket);
router.get('/api/tickets', getTicketsApi);
router.get('/api/tickets/:id', getTicketById);
router.put('/api/tickets/:id', updateTicket);
router.patch('/api/tickets/:id/assign', assignExpert);
router.patch('/api/tickets/:id/assign-coordinator', requireCoordinatorOrAdmin, assignCoordinator);
router.patch('/api/tickets/:id/close', closeTicket);
router.patch('/api/tickets/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['in_progress', 'on_hold', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }
        
        const ticket = await Ticket.findOne({
            where: { id, expertId: req.user.id },
            include: [
                { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
                { model: User, as: 'Expert', attributes: ['id', 'fullName', 'email'] }
            ]
        });
        
        if (!ticket) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        
        // Обновляем статус
        ticket.status = status;
        await ticket.save();
        
        // Создаем системное сообщение об изменении статуса
        await Message.create({
            text: `Статус изменен на: ${getStatusText(status)}`,
            ticketId: ticket.id,
            userId: req.user.id,
            isSystem: true
        });
        
        res.json({
            success: true,
            ticket: {
                ...ticket.get({ plain: true }),
                statusText: getStatusText(ticket.status)
            }
        });
        
    } catch (error) {
        console.error('Ошибка при обновлении статуса заявки:', error);
        res.status(500).json({ error: 'Ошибка при обновлении статуса заявки' });
    }
});

// Веб-маршруты
// Сначала определяем маршрут для отображения конкретной заявки
router.get('/:id(\\d+)', showTicket);  // Только числовые ID

// Затем маршрут для создания новой заявки
router.route('/new')
  .get(showNewTicketForm)    // Показать форму создания заявки
  .post(createTicket);      // Обработать отправку формы

// И только потом корневой маршрут для списка заявок
router.get('/', getTickets);

export default router;
