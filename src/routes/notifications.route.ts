import express from 'express';
import { protectedRoute } from '../middlewares/protectedRoute.js';
import { deleteNotifications, getAllNotifications } from '../controllers/notifications.controller.js';

const router = express.Router();

router.get('/', protectedRoute as any, getAllNotifications as any);
router.delete('/', protectedRoute as any, deleteNotifications as any);

export default router;