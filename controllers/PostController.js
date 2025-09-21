import PostModel from "../models/Post.js"


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
		const { sort = 'new' } = req.query; // ← получаем sort из query

		// Определяем сортировку постов
		const sortBy = sort === 'popular'
			? { viewsCount: -1 }
			: { createdAt: -1 };

		// Получаем последние 5 постов (с сортировкой)
		const posts = await PostModel.find()
			.sort(sortBy)
			.limit(5)
			.exec();

		// Собираем все теги из постов
		const allTags = posts
			.map(post => post.tags)
			.flat(); // ← убираем .sort(sortOption)

		// Считаем количество каждого тега
		const tagCountMap = allTags.reduce((acc, tag) => {
			acc[tag] = (acc[tag] || 0) + 1;
			return acc;
		}, {});

		// Преобразуем в массив объектов и сортируем по частоте (популярности)
		const tagsWithCount = Object.entries(tagCountMap)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count) // ← сортируем по количеству
			.slice(0, 10); // топ-10

		res.json(tagsWithCount);
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: 'Не удалось получить теги' });
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


export const remove = async (req, res) => {
	try {
		const postId = req.params.id;

		// Сохраняем результат удаления в переменную
		const doc = await PostModel.findOneAndDelete({
			_id: postId
		});

		// Проверяем, был ли документ найден и удален
		if (!doc) {
			return res.status(404).json({
				message: 'Статья не найдена'
			});
		}

		res.json({
			success: true,
			message: 'Статья успешно удалена'
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: 'Произошла ошибка при удалении статьи'
		});
	}
};

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
