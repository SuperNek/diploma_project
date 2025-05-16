import { User, Ticket } from '../models/index.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
  try {
    // Возвращаем профиль текущего пользователя
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { 
          model: Ticket,
          as: 'tickets',
          attributes: ['id', 'title', 'status', 'createdAt']
        }
      ]
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, phone, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Обновляем основные данные
    user.fullName = fullName || user.fullName;
    user.phone = phone || user.phone;
    
    // Если нужно обновить пароль
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      user.password = await bcrypt.hash(newPassword, 10);
    }
    
    await user.save();
    
    // Возвращаем обновленные данные без пароля
    const userData = user.get({ plain: true });
    delete userData.password;
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'expert', attributes: ['id', 'fullName'] },
        { 
          model: Message, 
          order: [['createdAt', 'ASC']],
          limit: 1,
          separate: true
        }
      ]
    });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user tickets' });
  }
};

export const getUsers = async (req, res) => {
  try {
    // Только для администратора
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      where: { role: ['expert', 'user'] },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};
