import bcrypt from 'bcryptjs';
import { User, Ticket } from '../models/index.js';

/**
 * Отображение главной страницы админ-панели
 */
export const getDashboard = async (req, res) => {
    try {
        // Получаем статистику по пользователям
        const userCount = await User.count();
        const expertCount = await User.count({ where: { role: 'expert' } });
        const coordinatorCount = await User.count({ where: { role: 'coordinator' } });
        
        // Получаем статистику по заявкам
        const ticketCount = await Ticket.count();
        const newTickets = await Ticket.count({ where: { status: 'new' } });
        const inProgressTickets = await Ticket.count({ where: { status: 'in_progress' } });
        const resolvedTickets = await Ticket.count({ where: { status: 'resolved' } });
        const closedTickets = await Ticket.count({ where: { status: 'closed' } });

        // Получаем последние заявки
        const recentTickets = await Ticket.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'email']
            }]
        });

        res.render('admin/dashboard', {
            title: 'Панель администратора',
            user: req.user,
            stats: {
                userCount,
                expertCount,
                coordinatorCount,
                ticketCount,
                newTickets,
                inProgressTickets,
                resolvedTickets,
                closedTickets
            },
            recentTickets
        });
    } catch (error) {
        console.error('Ошибка при загрузке админ-панели:', error);
        req.flash('error', 'Произошла ошибка при загрузке панели администратора');
        res.redirect('/');
    }
};

/**
 * Управление пользователями
 */
export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'email', 'fullName', 'phone', 'role', 'createdAt']
        });

        res.render('admin/users', {
            title: 'Управление пользователями',
            user: req.user,
            users,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке списка пользователей:', error);
        req.flash('error', 'Произошла ошибка при загрузке списка пользователей');
        res.redirect('/admin');
    }
};

/**
 * Создание нового пользователя
 */
export const createUser = async (req, res) => {
    try {
        const { email, password, fullName, phone, role } = req.body;

        // Простая валидация
        if (!email || !password || !fullName) {
            req.flash('error', 'Пожалуйста, заполните все обязательные поля');
            return res.redirect('/admin/users');
        }

        // Проверяем, существует ли пользователь с таким email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            req.flash('error', 'Пользователь с таким email уже существует');
            return res.redirect('/admin/users');
        }

        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создаем пользователя
        await User.create({
            email,
            password: hashedPassword,
            fullName,
            phone: phone || '+70000000000', // Простое значение по умолчанию
            role: role || 'user'
        });

        req.flash('success', 'Пользователь успешно создан');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Ошибка при создании пользователя:', error);
        req.flash('error', 'Произошла ошибка при создании пользователя');
        res.redirect('/admin/users');
    }
};

/**
 * Изменение роли пользователя
 */
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Находим пользователя
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        // Проверяем, что админ не меняет свою роль
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Вы не можете изменить свою роль'
            });
        }

        // Обновляем роль
        user.role = role || 'user';
        await user.save();

        res.json({
            success: true,
            message: 'Роль пользователя успешно обновлена'
        });
    } catch (error) {
        console.error('Ошибка при обновлении роли пользователя:', error);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при обновлении роли пользователя'
        });
    }
};

/**
 * Удаление пользователя
 */
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Проверяем, что пользователь не удаляет сам себя
        if (req.user.id === parseInt(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Вы не можете удалить самого себя'
            });
        }

        // Проверяем, есть ли у пользователя связанные заявки
        const userTickets = await Ticket.count({ where: { userId } });
        if (userTickets > 0) {
            return res.status(400).json({
                success: false,
                message: 'Невозможно удалить пользователя с активными заявками'
            });
        }

        // Удаляем пользователя
        const result = await User.destroy({
            where: { id: userId }
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            message: 'Пользователь успешно удален'
        });
    } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при удалении пользователя'
        });
    }
};
