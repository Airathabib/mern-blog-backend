import { body } from "express-validator";

export const loginValidation = [
	body('email', 'Неверный формат почты').isEmail(),
	body('password', 'Пароль должен быть минимум 5 символов').isLength({ min: 5 }), ,
];

export const registerValidation = [
	body('email', 'Неверный формат почты').isEmail(),
	body('password', 'Пароль должен быть минимум 5 символов').isLength({ min: 5 }),
	body('fullName', 'Укажите имя').isLength({ min: 3 }),
	body('avatarUrl', 'Неверная ссыдка на аватарку').optional().isURL(),
];

export const postCreateValidation = [
	body('title', 'Введите заголовок статьи').isLength({ min: 3 }).isString(),
	body('text', 'Введите текст статьи').isLength({ min: 5 }).isString(),
	body('tags', 'Неверный формат тегов').optional().isString(),
	body('imageUrl', 'Неверная ссылка на изображение').optional().isString(),
];


export const commentCreateValidation = [
	body('text')
		.trim()
		.notEmpty().withMessage('Текст комментария не может быть пустым')
		.isString().withMessage('Текст должен быть строкой')
		.isLength({ min: 7, max: 500 }).withMessage('Текст должен быть от 1 до 500 символов'),

	body('post')
		.notEmpty().withMessage('ID поста обязателен')
		.isMongoId().withMessage('Некорректный ID поста'),
];
