// routes/comments.js
import { Router } from 'express';
import { getByPostId, create, remove } from '../controllers/CommentController.js';
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

router.delete('/:id', checkAuth, remove)

export default router;
