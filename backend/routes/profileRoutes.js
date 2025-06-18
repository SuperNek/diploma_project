import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Защищенный маршрут профиля
router.get('/profile', requireAuth, (req, res) => {
    res.render('profile', {
        title: 'Мой профиль',
        user: req.user
    });
});

export default router;
