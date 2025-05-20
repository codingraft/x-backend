import express from 'express';
import { getMe, login, logout, signUp } from '../controllers/auth.controller.js';
import { protectedRoute } from '../middlewares/protectedRoute.js';
const router = express.Router();

router.get('/me',protectedRoute as any, getMe as any);
router.post('/signup', signUp as any);
router.post('/login', login as any);
router.post('/logout', logout as any);

export default router;