import express from 'express';
import { register, login, logout, refreshToken, checkAuth } from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/check', auth, checkAuth);

export default router;
