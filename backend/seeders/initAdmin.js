import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

/**
 * Создает администратора по умолчанию, если его не существует
 * @returns {Promise<void>}
 */
export const initAdminUser = async () => {
    try {
        // Проверяем, есть ли уже администратор
        const adminExists = await User.findOne({ where: { role: 'admin' } });
        
        if (!adminExists) {
            // Хешируем пароль
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password_admin', salt);
            
            // Создаем администратора
            await User.create({
                email: 'admin@example.com',
                password: hashedPassword,
                fullName: 'Example Admin',
                phone: '+1234567890',
                role: 'admin'
            });
            
            console.log('✅ Администратор по умолчанию создан');
            console.log('📧 Email: admin@example.com');
            console.log('🔑 Пароль: password_admin');
        } else {
            console.log('ℹ️ Администратор уже существует в базе данных');
        }
    } catch (error) {
        console.error('❌ Ошибка при создании администратора по умолчанию:', error);
    }
};
