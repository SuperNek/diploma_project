import { ForbiddenError } from '../utils/errors.js';

/**
 * Middleware для проверки роли пользователя
 * @param {string|string[]} roles - Разрешенные роли (может быть строкой или массивом строк)
 * @returns {Function} Middleware функция
 */
export const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            // Проверяем, что пользователь аутентифицирован
            if (!req.user) {
                req.flash('error', 'Требуется авторизация');
                return res.redirect('/auth/login');
            }

            // Если передан массив ролей, проверяем, есть ли у пользователя хотя бы одна из них
            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            const hasRequiredRole = allowedRoles.includes(req.user.role);

            if (!hasRequiredRole) {
                req.flash('error', 'У вас недостаточно прав для доступа к этому разделу');
                return res.redirect('/');
            }

            // Если все проверки пройдены, переходим к следующему middleware
            next();
        } catch (error) {
            console.error('Ошибка при проверке роли пользователя:', error);
            req.flash('error', 'Произошла ошибка при проверке прав доступа');
            res.redirect('/');
        }
    };
};

/**
 * Middleware для проверки, что пользователь является владельцем ресурса или администратором
 * @param {string} modelName - Название модели Sequelize
 * @param {string} idParam - Название параметра с ID в запросе (по умолчанию 'id')
 * @returns {Function} Middleware функция
 */
export const isOwnerOrAdmin = (modelName, idParam = 'id') => {
    return async (req, res, next) => {
        try {
            // Проверяем, что пользователь аутентифицирован
            if (!req.user) {
                req.flash('error', 'Требуется авторизация');
                return res.redirect('/auth/login');
            }

            // Админы имеют доступ ко всему
            if (req.user.role === 'admin') {
                return next();
            }

            // Получаем ID ресурса из параметров запроса
            const resourceId = req.params[idParam];
            if (!resourceId) {
                throw new Error('Не указан ID ресурса');
            }

            // Ищем ресурс в базе данных
            const model = req.app.get('models')[modelName];
            if (!model) {
                throw new Error(`Модель ${modelName} не найдена`);
            }

            const resource = await model.findByPk(resourceId);
            if (!resource) {
                throw new Error('Ресурс не найден');
            }

            // Проверяем, является ли пользователь владельцем ресурса
            if (resource.userId !== req.user.id) {
                req.flash('error', 'У вас нет прав для доступа к этому ресурсу');
                return res.redirect('/');
            }

            // Если все проверки пройдены, переходим к следующему middleware
            next();
        } catch (error) {
            console.error('Ошибка при проверке прав доступа к ресурсу:', error);
            req.flash('error', 'Произошла ошибка при проверке прав доступа');
            res.redirect('/');
        }
    };
};
