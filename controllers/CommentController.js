// controllers/commentController.js
import PostModel from '../models/Post.js';
import CommentModel from '../models/Comment.js';
import mongoose from 'mongoose';



// controllers/comments.js
export const getByPostId = async (req, res) => {
	try {
		const { post } = req.query;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;

		let filter = {};
		if (post) {
			filter.post = post;
		}

		const skip = (page - 1) * limit;

		const comments = await CommentModel.find(filter)
			.populate('user', 'fullName avatarUrl')
			.sort({ createdAt: -1 })
			.skip(skip) 
			.limit(limit)
			.exec();

		const total = await CommentModel.countDocuments(filter);

		res.json({
			items: comments,
			total,
			page,
			limit,
			pages: Math.ceil(total / limit),
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Ошибка при получении комментариев' });
	}
};


// POST /comments
export const create = async (req, res) => {
	try {
		console.log('Creating comment:', req.body);
		console.log('User ID from token:', req.userId);

		// Проверяем, существует ли пост
		const post = await PostModel.findById(req.body.post);
		if (!post) {
			return res.status(404).json({ message: 'Пост не найден' });
		}

		if (!mongoose.Types.ObjectId.isValid(req.body.post)) {
			return res.status(400).json({ message: 'Некорректный ID поста' });
		}


		const doc = new CommentModel({
			text: req.body.text,
			user: req.userId,
			post: req.body.post,
		});

		const comment = await doc.save();
		console.log('Comment saved:', comment);

		// ✅ Увеличиваем счётчик комментариев в посте
		await PostModel.findByIdAndUpdate(req.body.post, {
			$inc: { commentsCount: 1 }
		});

		const populatedComment = await CommentModel.findById(comment._id)
			.populate('user', 'fullName avatarUrl');

		res.status(201).json(populatedComment);
	} catch (err) {
		console.error('Comment creation error:', err);
		res.status(500).json({ message: 'Не удалось создать комментарий' });
	}
};


// DELETE /comments/:id
export const remove = async (req, res) => {
	try {
		const commentId = req.params.id;

		// Найти комментарий и получить post._id до удаления
		const comment = await CommentModel.findById(commentId).populate('post', '_id');
		if (!comment) {
			return res.status(404).json({ message: 'Комментарий не найден' });
		}

		// Проверка: только автор комментария может удалить
		if (String(comment.user._id) !== String(req.userId)) {
			return res.status(403).json({ message: 'Нет прав на удаление' });
		}

		const postId = comment.post._id;

		// Загружаем пост, чтобы проверить текущее значение commentsCount
		const post = await PostModel.findById(postId);
		if (!post) {
			return res.status(404).json({ message: 'Пост не найден' });
		}

		// Удаляем комментарий
		await CommentModel.findByIdAndDelete(commentId);

		// Уменьшаем счётчик, только если он > 0
		if (post.commentsCount > 0) {
			await PostModel.findByIdAndUpdate(postId, {
				$inc: { commentsCount: -1 }
			});
		}

		res.json({ success: true });
	} catch (err) {
		console.error('Ошибка при удалении комментария:', err);
		res.status(500).json({ message: 'Не удалось удалить комментарий' });
	}
};
