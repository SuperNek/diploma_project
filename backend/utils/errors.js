/**
 * Базовый класс для пользовательских ошибок
 */
class CustomError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Ошибка аутентификации (401 Unauthorized)
 */
export class UnauthorizedError extends CustomError {
    constructor(message = 'Требуется аутентификация') {
        super(message, 401);
    }
}

/**
 * Ошибка доступа (403 Forbidden)
 */
export class ForbiddenError extends CustomError {
    constructor(message = 'Доступ запрещен') {
        super(message, 403);
    }
}

/**
 * Ошибка "Не найдено" (404 Not Found)
 */
export class NotFoundError extends CustomError {
    constructor(message = 'Ресурс не найден') {
        super(message, 404);
    }
}

/**
 * Ошибка валидации (422 Unprocessable Entity)
 */
export class ValidationError extends CustomError {
    constructor(errors, message = 'Ошибка валидации') {
        super(message, 422);
        this.errors = errors;
    }
}

/**
 * Обработчик ошибок для Express
 */
export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Если заголовки уже были отправлены, передаем ошибку следующему обработчику
    if (res.headersSent) {
        return next(err);
    }

    // Устанавливаем статус ошибки
    const statusCode = err.statusCode || 500;
    
    // Формируем ответ в зависимости от типа ошибки
    if (req.accepts('json')) {
        // JSON ответ
        res.status(statusCode).json({
            success: false,
            error: {
                message: err.message || 'Внутренняя ошибка сервера',
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
                ...(err.errors && { errors: err.errors })
            }
        });
    } else {
        // HTML ответ
        res.status(statusCode).render('error', {
            title: `Ошибка ${statusCode}`,
            statusCode,
            message: err.message || 'Внутренняя ошибка сервера',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
};

/**
 * Middleware для обработки 404 ошибок
 */
export const notFoundHandler = (req, res) => {
    res.status(404);
    
    // respond with html page
    if (req.accepts('html')) {
        return res.render('errors/404', { 
            title: 'Страница не найдена',
            url: req.originalUrl 
        });
    }
    
    // respond with json
    if (req.accepts('json')) {
        return res.json({ 
            success: false, 
            error: { message: 'Страница не найдена' } 
        });
    }
    
    // default to plain-text. send()
    res.type('txt').send('Страница не найдена');
};
