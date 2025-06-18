import express from 'express';
import { 
    getLogin, 
    getRegister, 
    register, 
    login, 
    logout
} from '../controllers/authController.js';

const router = express.Router();

// Middleware to ensure session is available
const ensureSession = (req, res, next) => {
    if (!req.session) {
        console.error('Session not available in auth routes');
        return res.status(500).send('Session not available');
    }
    next();
};

// Apply session check to all auth routes
router.use(ensureSession);

// Страницы аутентификации
router.get('/login', getLogin);
router.get('/register', getRegister);

// Обработка форм
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

export default router;
