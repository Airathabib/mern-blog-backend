import PostModel from "../models/Post.js"
import CommentModel from "../models/Comment.js";

export const create = async (req, res) => {
	console.log('🚀 req.userId in create controller:', req.userId);

	try {
		const doc = new PostModel({
			title: req.body.title,
			text: req.body.text,
			imageUrl: req.body.imageUrl,
			tags: req.body.tags.split(','),
			user: req.userId,
		});

		const post = await doc.save();
		res.json(post);
	} catch (err) {
		console.log('❌ Error creating post:', err);

		// Обработка ошибки уникальности
		if (err.code === 11000) {
			return res.status(400).json({
				message: 'Пост с таким текстом уже существует',
			});
		}

		res.status(500).json({
			message: 'Не удалось создать статью',
		});
	}
};


// controllers/posts.js
export const getLastTags = async (req, res) => {
	try {
		const { sort = 'new' } = req.query; // ← добавили sort

		const tags = await PostModel.aggregate([
			{ $unwind: '$tags' },
			{ $group: { _id: '$tags', count: { $sum: 1 } } },
			{ $sort: sort === 'popular' ? { count: -1 } : { _id: -1 } }, // ← сортировка
			{ $limit: 10 },
			{ $project: { _id: 0, name: '$_id', count: 1 } },
		]);

		res.json(tags);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Ошибка при получении тегов' });
	}
};

// controllers/posts.js

export const getAll = async (req, res) => {
	try {
		const { sort = "new", tag, tags } = req.query; // tags = "react,js"

		const filters = {};

		// Фильтр по одному тегу
		if (tag) {
			filters.tags = { $in: [tag] };
		}

		// Фильтр по нескольким тегам
		if (tags) {
			const tagList = tags.split(",").filter(Boolean);
			filters.tags = { $all: tagList }; // пост должен содержать ВСЕ теги
		}

		const sortBy = sort === "popular" ? { viewsCount: -1 } : { createdAt: -1 };

		const posts = await PostModel.find(filters)
			.populate("user")
			.sort(sortBy)
			.exec();

		res.json(posts);
	} catch (err) {
		res.status(500).json({ message: "Ошибка при получении постов" });
	}
};


export const getOne = async (req, res) => {
	try {
		const postId = req.params.id;

		const doc = await PostModel.findByIdAndUpdate(
			postId,
			{ $inc: { viewsCount: 1 } },
			{ new: true }
		).populate('user', 'fullName avatarUrl'); // ← исправлено

		if (!doc) {
			return res.status(404).json({ message: 'Пост не найден' });
		}

		res.json(doc);
	} catch (err) {
		console.error('Ошибка в getOne:', err);
		res.status(500).json({ message: 'Ошибка при получении поста' });
	}
};

// удаление поста и комментов
export const remove = async (req, res) => {
	try {
		const postId = req.params.id;

		// Удаляем комментарии — ИСПРАВЛЕНО: { post: postId }
		const commentResult = await CommentModel.deleteMany({ post: postId });
		console.log(`🗑️ Удалено ${commentResult.deletedCount} комментариев для поста ${postId}`);

		// Удаляем пост
		const postDoc = await PostModel.findOneAndDelete({ _id: postId });

		if (!postDoc) {
			return res.status(404).json({
				message: 'Статья не найдена',
			});
		}

		// Возвращаем _id удалённого поста
		res.json({
			_id: postDoc._id,
			message: 'Статья и все её комментарии успешно удалены',
		});
	} catch (err) {
		console.error('❌ Ошибка при удалении поста:', err);
		res.status(500).json({
			message: 'Произошла ошибка при удалении статьи',
		});
	}
};


//редактирование поста
export const update = async (req, res) => {
	try {
		const postId = req.params.id;
		await PostModel.updateOne({
			_id: postId,
		}, {
			title: req.body.title,
			text: req.body.text,
			imageUrl: req.body.imageUrl,
			tags: req.body.tags.split(','),
			user: req.userId,
		},);
		res.json({
			success: true,
			message: 'Статья успешно изменена'
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: 'Произошла ошибка при изменении статьи'
		});
	}
}
