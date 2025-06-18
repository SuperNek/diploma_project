import { Ticket, User, Message } from '../models/index.js';
import { Op } from 'sequelize';

// Создание новой заявки (веб-форма)
export const createTicket = async (req, res) => {
  try {
    console.log('Создание заявки. Данные формы:', req.body);
    
    const { title, description, contactName, contactPhone, tid } = req.body;
    
    // Валидация данных
    const errors = [];
    
    if (!title || title.trim().length < 5) {
      errors.push('Тема заявки должна содержать минимум 5 символов');
    }
    
    if (!description || description.trim().length < 10) {
      errors.push('Описание проблемы должно содержать минимум 10 символов');
    }
    
    if (!contactName || contactName.trim().length < 2) {
      errors.push('Укажите ваше имя');
    }
    
    if (!contactPhone || !/^\+?[\d\s-]{10,}$/.test(contactPhone)) {
      errors.push('Укажите корректный номер телефона');
    }
    
    if (!tid || tid.trim().length === 0) {
      errors.push('Укажите Terminal ID (TID)');
    }
    
    if (errors.length > 0) {
      console.log('Ошибки валидации:', errors);
      return res.render('tickets/new', {
        error: errors[0], // Показываем только первую ошибку
        errors, // Или можно показать все ошибки
        title: title || '',
        description: description || '',
        contactName: contactName || '',
        contactPhone: contactPhone || '',
        tid: tid || '',
        user: req.user
      });
    }
    
    // Создаем заявку с обязательными полями
    const ticket = await Ticket.create({
      tid: tid.trim(),
      title: title.trim(),
      description: description.trim(),
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      userId: req.user.id,
      status: 'new'
    });
    
    // Используем flash-сообщение
    req.flash('success', 'Заявка успешно создана!');
    
    // Редирект на страницу заявки
    return res.redirect(`/tickets/${ticket.id}`);
    
  } catch (error) {
    console.error('Ошибка при создании заявки:', error);
    res.status(500).render('tickets/new', {
      title: 'Создание заявки',
      error: 'Произошла ошибка при создании заявки. Пожалуйста, попробуйте снова.',
      title: req.body.title || '',
      description: req.body.description || '',
      user: req.user
    });
  }
};

// Получение списка заявок для API
export const getTicketsApi = async (req, res) => {
  try {
    const where = { userId: req.user.id };
    
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } }
      ];
    }
    
    const tickets = await Ticket.findAll({
      where,
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'email', 'fullName'] 
        },
        { 
          model: User, 
          as: 'Expert',
          attributes: ['id', 'email', 'fullName'] 
        },
        {
          model: Message,
          as: 'messages',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const ticketsWithMessageCount = tickets.map(ticket => {
      const ticketJson = ticket.toJSON();
      ticketJson.messageCount = ticketJson.messages ? ticketJson.messages.length : 0;
      delete ticketJson.messages;
      return ticketJson;
    });
    
    res.json(ticketsWithMessageCount);
  } catch (error) {
    console.error('Ошибка при получении заявок (API):', error);
    res.status(500).json({ error: 'Не удалось получить заявки' });
  }
};

// Отображение страницы с заявками
export const getTickets = async (req, res) => {
  try {
    let where = {};
    
    // Получаем заявки в зависимости от роли пользователя
    if (req.user.role === 'admin' || req.user.role === 'coordinator') {
        // Для админов и координаторов показываем все заявки
        where = {};
    } else if (req.user.role === 'expert') {
        // Для экспертов показываем назначенные им заявки
        where.expertId = req.user.id;
    } else {
        // Для обычных пользователей показываем только их заявки
        where.userId = req.user.id;
    }
    
    // Применяем фильтры, если они есть
    if (req.query.status && req.query.status !== 'all') {
      where.status = req.query.status;
    }
    
    // Фильтр по типу заявки
    if (req.query.type && req.query.type !== 'all') {
      where.type = req.query.type;
    }
    
    if (req.query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } },
        { tid: { [Op.like]: `%${req.query.search}%` } }
      ];
    }
    
    // Получаем заявки с информацией о пользователе, эксперте и сообщениях
    const tickets = await Ticket.findAll({
      where,
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'email', 'fullName'] 
        },
        { 
          model: User, 
          as: 'Expert',
          attributes: ['id', 'email', 'fullName'],
          required: false
        },
        {
          model: Message,
          as: 'messages',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Форматируем данные для отображения
    const formattedTickets = tickets.map(ticket => {
      const ticketData = ticket.toJSON();
      return {
        ...ticketData,
        messageCount: ticketData.messages ? ticketData.messages.length : 0,
        createdAt: new Date(ticketData.createdAt).toLocaleString('ru-RU'),
        statusText: getStatusText(ticketData.status)
      };
    });
    
    // Получаем список экспертов для назначения
    const experts = await User.findAll({
      where: { role: 'expert' },
      attributes: ['id', 'fullName', 'email'],
      order: [['fullName', 'ASC']]
    });

    // Рендерим страницу с заявками
    res.render('tickets', {
      experts,
      title: req.user.role === 'coordinator' || req.user.role === 'admin' ? 'Все заявки' : 'Мои заявки',
      tickets: formattedTickets,
      user: req.user,
      currentStatus: req.query.status || 'all',
      currentType: req.query.type || 'all',
      searchQuery: req.query.search || ''
    });
    
  } catch (error) {
    console.error('Ошибка при загрузке страницы заявок:', error);
    res.status(500).render('error', {
      title: 'Ошибка',
      message: 'Не удалось загрузить заявки. Пожалуйста, попробуйте позже.'
    });
  }
};

// Вспомогательная функция для получения текста статуса
function getStatusText(status) {
  const statuses = {
    'new': 'Новая',
    'in_progress': 'В работе',
    'resolved': 'Решена',
    'closed': 'Закрыта'
  };
  return statuses[status] || status;
}

// Показать форму создания новой заявки
export const showNewTicketForm = (req, res) => {
  res.render('tickets/new', {
    title: 'Создание заявки',
    user: req.user,
    error: null,  // Явно указываем, что ошибок нет
    title: '',   // Пустые значения для полей формы
    description: ''
  });
};

// Показать страницу заявки
export const showTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'email', 'fullName'] 
        },
        { 
          model: User, 
          as: 'Expert', 
          attributes: ['id', 'email', 'fullName'] 
        },
        { 
          model: Message,
          as: 'messages',
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'email', 'fullName']
          }],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Ошибка',
        message: 'Заявка не найдена'
      });
    }

    // Проверка прав доступа
    if (req.user.role === 'user' && ticket.userId !== req.user.id) {
      return res.status(403).render('error', {
        title: 'Доступ запрещен',
        message: 'У вас нет прав для просмотра этой заявки'
      });
    }

    // Форматируем даты для отображения
    const formattedTicket = ticket.toJSON();
    formattedTicket.createdAt = new Date(ticket.createdAt).toLocaleString('ru-RU');
    formattedTicket.updatedAt = new Date(ticket.updatedAt).toLocaleString('ru-RU');
    formattedTicket.statusText = getStatusText(ticket.status);

    res.render('tickets/detail', {
      title: `Заявка #${ticket.id}`,
      ticket: formattedTicket,
      user: req.user,
      isOwner: ticket.userId === req.user.id,
      isExpert: ticket.expertId === req.user.id,
      // Flash-сообщения уже доступны в res.locals благодаря middleware
      success: req.flash('success')[0] || null,
      error: req.flash('error')[0] || null
    });

  } catch (error) {
    console.error('Ошибка при загрузке заявки:', error);
    res.status(500).render('error', {
      title: 'Ошибка',
      message: 'Не удалось загрузить заявку. Пожалуйста, попробуйте позже.'
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'email', 'fullName'] 
        },
        { 
          model: User, 
          as: 'Expert', 
          attributes: ['id', 'email', 'fullName'] 
        },
        { 
          model: Message, 
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'email', 'fullName']
          }]
        }
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

export const assignCoordinator = async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    // Проверяем, что пользователь имеет право назначать координатора
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    // Проверяем, что координатор существует
    const coordinator = await User.findOne({
      where: { id: coordinatorId, role: 'coordinator' }
    });
    
    if (!coordinator) {
      return res.status(400).json({ error: 'Указанный координатор не найден' });
    }
    
    ticket.coordinatorId = coordinatorId;
    await ticket.save();
    
    // Отправляем уведомление координатору
    await Message.create({
      content: `Вам назначена заявка #${ticket.id}`,
      ticketId: ticket.id,
      userId: req.user.id,
      isSystem: true
    });
    
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Ошибка при назначении координатора:', error);
    res.status(500).json({ error: 'Не удалось назначить координатора' });
  }
};

export const assignExpert = async (req, res) => {
  try {
    const { expertId } = req.body;
    
    // Находим заявку без включения ассоциаций, чтобы избежать проблем
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    // Проверяем, что пользователь имеет право назначать эксперта
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    // Проверяем, что эксперт существует
    const expert = await User.findOne({
      where: { id: expertId, role: 'expert' },
      attributes: ['id', 'fullName', 'email']
    });
    
    if (!expert) {
      return res.status(400).json({ error: 'Указанный эксперт не найден' });
    }
    
    // Обновляем заявку
    await ticket.update({ 
      expertId: expert.id,
      status: 'in_progress' 
    });
    
    // Создаем системное сообщение о назначении эксперта
    await Message.create({
      text: `Назначен эксперт: ${expert.fullName}`,
      ticketId: ticket.id,
      userId: req.user.id,
      isSystem: true
    });
    
    // Возвращаем обновленную заявку с информацией о назначенном эксперте
    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { 
          model: User, 
          as: 'Expert', 
          attributes: ['id', 'fullName'] 
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    res.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error('Ошибка при назначении эксперта:', error);
    res.status(500).json({ error: 'Не удалось назначить эксперта' });
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
