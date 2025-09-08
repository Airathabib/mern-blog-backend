// controllers/comments.js
import CommentModel from '../models/Comment.js';

// GET /comments?post=postId
export const getByPostId = async (req, res) => {
	try {
		const { post } = req.query;
		if (!post) {
			return res.status(400).json({ message: 'Не указан post' });
		}

		const comments = await CommentModel.find({ post })
			.populate('user', 'fullName avatarUrl')
			.sort({ createdAt: -1 })
			.exec();

		res.json(comments);

	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Ошибка при получении комментариев' });
	}
};

// POST /comments
export const create = async (req, res) => {
	try {
		console.log('Creating comment:', req.body); // 🔍 Что пришло
		console.log('User ID from token:', req.userId); // 🔍 Проверка авторизации

		const doc = new CommentModel({
			text: req.body.text,
			user: req.userId,
			post: req.body.post,
		});

		const comment = await doc.save();
		console.log('Comment saved:', comment); // 🔍 Успешное сохранение

		const populatedComment = await CommentModel.findById(comment._id)
			.populate('user', 'fullName avatarUrl');

		res.status(201).json(populatedComment);
	} catch (err) {
		console.error('Comment creation error:', err); // 🔍 Ошибка
		res.status(500).json({ message: 'Не удалось создать комментарий' });
	}
};
