import { Ticket, Message, User } from '../models/index.js';
import { Op } from 'sequelize';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Получить список заявок, назначенных эксперту
 */
export const getExpertTickets = async (req, res) => {
    try {
        const { status } = req.query;
        const where = { expertId: req.user.id };
        
        if (status && status !== 'all') {
            where.status = status;
        }
        
        const tickets = await Ticket.findAll({
            where,
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['id', 'fullName', 'email'] 
                },
                {
                    model: Message,
                    as: 'messages',
                    attributes: ['id'],
                    required: false
                }
            ],
            order: [['updatedAt', 'DESC']]
        });
        
        // Форматируем даты для отображения
        const formattedTickets = tickets.map(ticket => ({
            ...ticket.get({ plain: true }),
            createdAt: format(ticket.createdAt, 'dd MMMM yyyy, HH:mm', { locale: ru }),
            updatedAt: format(ticket.updatedAt, 'dd MMMM yyyy, HH:mm', { locale: ru }),
            messagesCount: ticket.messages?.length || 0
        }));
        
        res.render('expert/dashboard', {
            title: 'Мои заявки',
            tickets: formattedTickets,
            currentStatus: status || 'all',
            user: req.user
        });
        
    } catch (error) {
        console.error('Ошибка при получении заявок эксперта:', error);
        req.flash('error', 'Произошла ошибка при загрузке заявок');
        res.redirect('back');
    }
};

/**
 * Обновить статус заявки
 */
export const updateTicketStatus = async (req, res) => {
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
};

/**
 * Добавить комментарий к заявке
 */
export const addExpertComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Текст комментария не может быть пустым' });
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
        
        // Создаем сообщение
        const message = await Message.create({
            text,
            ticketId: ticket.id,
            userId: req.user.id,
            isSystem: false
        });
        
        // Обновляем дату обновления заявки
        await ticket.update({ updatedAt: new Date() });
        
        // Получаем данные отправителя
        const sender = await User.findByPk(req.user.id, {
            attributes: ['id', 'fullName', 'email']
        });
        
        res.json({
            success: true,
            message: {
                ...message.get({ plain: true }),
                user: sender,
                formattedDate: format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: ru })
            }
        });
        
    } catch (error) {
        console.error('Ошибка при добавлении комментария:', error);
        res.status(500).json({ error: 'Ошибка при добавлении комментария' });
    }
};

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
