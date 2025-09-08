// routes/comments.js
import { Router } from 'express';
import { getByPostId, create } from '../controllers/CommentController.js';
import checkAuth from '../utils/checkAuth.js';

const router = Router();

// Получить комментарии поста
router.get('/', getByPostId);

// Создать комментарий (только для авторизованных)
router.post('/', checkAuth, create);

export default router;
