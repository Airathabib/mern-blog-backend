// routes/comments.js
import { Router } from 'express';
import { getByPostId, create, remove, update } from '../controllers/CommentController.js';
import { likeComment, dislikeComment } from '../controllers/CommentController.js';
import checkAuth from '../utils/checkAuth.js';
import { commentCreateValidation } from '../validations.js';
import handleValidationErrors from '../utils/handleValidationErrors.js';

const router = Router();

// Получить комментарии поста
router.get('/', getByPostId);

// Создать комментарий (только для авторизованных)

router.post(
	'/',
	checkAuth,
	commentCreateValidation,      // Добавили валидацию
	handleValidationErrors,       // Добавили обработчик ошибок
	create
);

router.put('/:id', checkAuth, update)

router.delete('/:id', checkAuth, remove)

router.post('/:id/like', checkAuth, likeComment);
router.post('/:id/dislike', checkAuth, dislikeComment);

export default router;
