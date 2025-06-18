import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware для валидации входящих запросов
 */
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));
        
        return next(new ValidationError(
            errorMessages,
            'Ошибка валидации данных'
        ));
    }
    
    next();
};
