// controllers/commentController.js
import PostModel from '../models/Post.js';
import CommentModel from '../models/Comment.js';
import mongoose from 'mongoose';



// controllers/comments.js
export const getByPostId = async (req, res) => {
	try {
		const { post, page = 1, limit = 10, sort = 'new' } = req.query; // ← добавили sort

		let filter = {};
		if (post) {
			if (!mongoose.Types.ObjectId.isValid(post)) {
				return res.status(400).json({ message: 'Некорректный ID поста' });
			}
			filter.post = post;
		}

		const skip = (page - 1) * limit;

		// Определяем порядок сортировки
		const sortOption = sort === 'old' ? { createdAt: 1 } : { createdAt: -1 };

		const comments = await CommentModel.find(filter)
			.populate('user', 'fullName avatarUrl')
			.sort(sortOption)
			.skip(skip)
			.limit(limit)
			.exec();

		const total = await CommentModel.countDocuments(filter);
		const commentsWithCounts = comments.map(comment => comment.toJSON());

		res.json({
			items: commentsWithCounts, // ← теперь с likesCount и dislikesCount
			total,
			page: parseInt(page),
			limit: parseInt(limit),
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

		const { text, post, parentComment } = req.body; // ← добавили parentComment

		// Проверяем, существует ли пост
		const postDoc = await PostModel.findById(post);
		if (!postDoc) {
			return res.status(404).json({ message: 'Пост не найден' });
		}

		// Если указан parentComment — проверяем, существует ли он
		if (parentComment) {
			const parent = await CommentModel.findById(parentComment);
			if (!parent) {
				return res.status(404).json({ message: 'Родительский комментарий не найден' });
			}
		}

		const doc = new CommentModel({
			text,
			user: req.userId,
			post,
			parentComment: parentComment || null, // ← сохраняем
		});

		const comment = await doc.save();
		console.log('Comment saved:', comment);

		// Увеличиваем счётчик комментариев в посте
		await PostModel.findByIdAndUpdate(post, {
			$inc: { commentsCount: 1 }
		});

		const populatedComment = await comment.populate('user', 'fullName avatarUrl');

		res.status(201).json(populatedComment);
	} catch (err) {
		console.error('Comment creation error:', err);
		res.status(500).json({ message: 'Не удалось создать комментарий' });
	}
};

// PUT /comments/:id
export const update = async (req, res) => {
	try {
		const commentId = req.params.id;
		const { text } = req.body;

		if (!text || typeof text !== 'string' || text.trim().length === 0) {
			return res.status(400).json({ message: 'Текст комментария не может быть пустым' });
		}

		// Найти комментарий
		const comment = await CommentModel.findById(commentId);
		if (!comment) {
			return res.status(404).json({ message: 'Комментарий не найден' });
		}

		// Проверка: только автор может редактировать
		if (String(comment.user._id) !== String(req.userId)) {
			return res.status(403).json({ message: 'Нет прав на редактирование' });
		}

		// Обновляем текст
		comment.text = text.trim();
		await comment.save();

		// Возвращаем обновлённый комментарий с пользователем
		const populatedComment = await comment.populate('user', 'fullName avatarUrl');

		res.json(populatedComment);
	} catch (err) {
		console.error('Ошибка при редактировании комментария:', err);
		res.status(500).json({ message: 'Не удалось обновить комментарий' });
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


// POST /comments/:id/like
export const likeComment = async (req, res) => {
	try {
		const commentId = req.params.id;
		const userId = req.userId;

		const comment = await CommentModel.findById(commentId);
		if (!comment) {
			return res.status(404).json({ message: 'Комментарий не найден' });
		}

		// Проверяем, не ставил ли пользователь уже лайк
		const alreadyLiked = comment.likes.includes(userId);
		const alreadyDisliked = comment.dislikes.includes(userId);

		if (alreadyLiked) {
			// Убираем лайк
			comment.likes = comment.likes.filter(id => id.toString() !== userId);
		} else {
			// Добавляем лайк
			comment.likes.push(userId);
			// Если был дизлайк — убираем его
			if (alreadyDisliked) {
				comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);
			}
		}

		await comment.save();

		res.json({
			likes: comment.likes.length,
			dislikes: comment.dislikes.length,
			userAction: alreadyLiked ? 'none' : 'liked',
		});
	} catch (err) {
		console.error('Ошибка при лайке комментария:', err);
		res.status(500).json({ message: 'Не удалось поставить лайк' });
	}
};

// POST /comments/:id/dislike
export const dislikeComment = async (req, res) => {
	try {
		const commentId = req.params.id;
		const userId = req.userId;

		const comment = await CommentModel.findById(commentId);
		if (!comment) {
			return res.status(404).json({ message: 'Комментарий не найден' });
		}

		const alreadyLiked = comment.likes.includes(userId);
		const alreadyDisliked = comment.dislikes.includes(userId);

		if (alreadyDisliked) {
			// Убираем дизлайк
			comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);
		} else {
			// Добавляем дизлайк
			comment.dislikes.push(userId);
			// Если был лайк — убираем его
			if (alreadyLiked) {
				comment.likes = comment.likes.filter(id => id.toString() !== userId);
			}
		}

		await comment.save();

		res.json({
			likes: comment.likes.length,
			dislikes: comment.dislikes.length,
			userAction: alreadyDisliked ? 'none' : 'disliked',
		});
	} catch (err) {
		console.error('Ошибка при дизлайке комментария:', err);
		res.status(500).json({ message: 'Не удалось поставить дизлайк' });
	}
};
