import { Router } from 'express';
import { signup, login, logout } from '../controllers/auth.controller.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', verifyJwt, logout);

export default router;
