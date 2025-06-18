import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/**
 * Middleware для проверки прав администратора
 * @throws {UnauthorizedError} Если пользователь не аутентифицирован
 * @throws {ForbiddenError} Если у пользователя нет прав администратора
 */

export const requireAdmin = async (req, res, next) => {
    try {
        // Сначала проверяем аутентификацию
        if (!req.user) {
            throw new UnauthorizedError('Требуется авторизация');
        }

        // Проверяем, что пользователь - администратор
        if (req.user.role !== 'admin') {
            throw new ForbiddenError('У вас нет прав доступа к этому разделу');
        }

        // Если все проверки пройдены, переходим к следующему middleware
        next();
    } catch (error) {
        console.error('Ошибка при проверке прав администратора:', error);
        
        // Если это API запрос, передаем ошибку дальше
        if (req.xhr || req.accepts('json')) {
            return next(error);
        }
        
        // Иначе перенаправляем с сообщением об ошибке
        req.flash('error', error.message || 'Произошла ошибка при проверке прав доступа');
        
        // Перенаправляем на главную или на страницу входа, если пользователь не аутентифицирован
        const redirectUrl = error.statusCode === 401 ? '/auth/login' : '/';
        res.redirect(redirectUrl);
    }
};

/**
 * Middleware для проверки, что пользователь является администратором или координатором
 */
export const requireAdminOrCoordinator = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new UnauthorizedError('Требуется авторизация');
        }

        if (!['admin', 'coordinator'].includes(req.user.role)) {
            throw new ForbiddenError('Недостаточно прав для выполнения этого действия');
        }

        next();
    } catch (error) {
        console.error('Ошибка при проверке прав доступа:', error);
        
        if (req.xhr || req.accepts('json')) {
            return next(error);
        }
        
        req.flash('error', error.message || 'Недостаточно прав для выполнения этого действия');
        res.redirect(error.statusCode === 401 ? '/auth/login' : '/');
    }
};
