import { ForbiddenError } from '../utils/errors.js';

export const requireCoordinator = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    
    if (req.user.ole !== 'coordinator' && req.user.role !== 'admin') {
        if (req.accepts('json')) {
            throw new ForbiddenError('Доступ запрещен. Требуются права координатора.');
        }
        req.flash('error', 'Доступ запрещен. Требуются права координатора.');
        return res.redirect('back');
    }
    
    next();
};

export const requireCoordinatorOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    
    if (req.user.role !== 'coordinator' && req.user.role !== 'admin') {
        if (req.accepts('json')) {
            throw new ForbiddenError('Доступ запрещен. Требуются права координатора или администратора.');
        }
        req.flash('error', 'Доступ запрещен. Требуются права координатора или администратора.');
        return res.redirect('back');
    }
    
    next();
};
