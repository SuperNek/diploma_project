import { Ticket, User, Message } from '../models/index.js';
import { Op } from 'sequelize';

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || title.trim().length < 5) {
      return res.status(400).json({ error: 'Title must be at least 5 characters' });
    }
    
    const ticket = await Ticket.create({
      title,
      description,
      userId: req.user.id,
      status: 'open'
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Для обычных пользователей показываем только их тикеты
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    }
    
    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'fullName'] },
        { model: User, as: 'expert', attributes: ['id', 'email', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tickets' });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'fullName'] },
        { model: User, as: 'expert', attributes: ['id', 'email', 'fullName'] },
        { model: Message, include: [User] }
      ]
    });
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Проверка прав доступа
    if (
      req.user.role === 'user' && 
      ticket.userId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get ticket' });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Проверка прав
    if (ticket.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No permission to update this ticket' });
    }
    
    await ticket.update({ title, description });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

export const assignExpert = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    const expert = await User.findByPk(req.body.expertId);
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!expert || expert.role !== 'expert') {
      return res.status(400).json({ error: 'Invalid expert' });
    }
    
    await ticket.update({ 
      expertId: expert.id,
      status: 'in_progress' 
    });
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign expert' });
  }
};

export const closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Проверка прав (только автор, эксперт или админ)
    if (
      ticket.userId !== req.user.id && 
      ticket.expertId !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'No permission to close this ticket' });
    }
    
    await ticket.update({ status: 'closed' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to close ticket' });
  }
};
