import { Message, Ticket, User } from '../models/index.js';
import sanitizeHtml from 'sanitize-html';
import rateLimit from 'express-rate-limit';

// Лимитер для защиты от спама
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50, // максимум 50 запросов
  message: 'Too many messages, please try again later'
});

// Валидация сообщения
const validateMessage = (text) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (text.length > 2000) {
    return { isValid: false, error: 'Message too long (max 2000 chars)' };
  }
  
  return { isValid: true };
};

// Получение сообщений с пагинацией
export const getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const { count, rows: messages } = await Message.findAndCountAll({
      where: { ticketId },
      include: [{
        model: User,
        attributes: ['id', 'email', 'fullName']
      }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      messages,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      error: 'Failed to get messages',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

// Отправка сообщения
export const sendMessage = [
  messageLimiter,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      let { text, attachment } = req.body;
      
      // Валидация и очистка текста
      const validation = validateMessage(text);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      text = sanitizeHtml(text);
      
      // Проверка доступа к тикету
      const ticket = await Ticket.findByPk(ticketId);
      if (!ticket || 
          (ticket.userId !== req.user.id && ticket.expertId !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Создание сообщения
      const message = await Message.create({
        text,
        attachment,
        ticketId,
        authorId: req.user.id,
        isRead: false
      });
      
      // Добавляем информацию об авторе
      const messageWithAuthor = await Message.findByPk(message.id, {
        include: [{
          model: User,
          attributes: ['id', 'email', 'fullName']
        }]
      });
      
      res.status(201).json(messageWithAuthor);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ 
        error: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  }
];

// Редактирование сообщения
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    let { text } = req.body;
    
    // Находим сообщение
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Проверка прав
    if (message.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No permission to edit this message' });
    }
    
    // Валидация
    const validation = validateMessage(text);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }
    
    text = sanitizeHtml(text);
    
    // Обновление
    await message.update({ 
      text,
      isEdited: true,
      editedAt: new Date() 
    });
    
    res.json(message);
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ 
      error: 'Failed to update message',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

// Удаление сообщения
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Проверка прав
    if (message.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No permission to delete this message' });
    }
    
    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      error: 'Failed to delete message',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

// Отметка о прочтении
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Проверка прав (только участники тикета)
    const ticket = await Ticket.findByPk(message.ticketId);
    if (!ticket || 
        (ticket.userId !== req.user.id && ticket.expertId !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await message.update({ isRead: true });
    res.json(message);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark message',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};
