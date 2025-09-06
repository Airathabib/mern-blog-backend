import PostModel from "../models/Post.js"


export const create = async (req, res) => {
	try {
		const doc = new PostModel({
			title: req.body.title,
			text: req.body.text,
			imageUrl: req.body.imageUrl,
			tags: req.body.tags.split(','),
			user: req.userId,
		})
		const post = await doc.save();

		res.json(post);
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: 'Не удалось создать статью'
		});
	}
};

// controllers/posts.js
export const getLastTags = async (req, res) => {
	try {
		const posts = await PostModel.find().exec();

		// Собираем все теги
		const allTags = posts
			.map(post => post.tags)
			.flat();

		// Считаем количество
		const tagCountMap = allTags.reduce((acc, tag) => {
			acc[tag] = (acc[tag] || 0) + 1;
			return acc;
		}, {});

		// Преобразуем в массив объектов и сортируем по частоте
		const tagsWithCount = Object.entries(tagCountMap)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
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

		// Используем await для работы с промисами
		const doc = await PostModel.findOneAndUpdate(
			{ _id: postId },
			{ $inc: { viewsCount: 1 } },
			{ new: true, populate: 'user' },
			{ returnDocument: 'after' } // или new: true для старых версий
		);

		if (!doc) {
			return res.status(404).json({
				message: 'Статья не найдена'
			});
		}

		res.json(doc);
		populate('user')
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: 'Не удалось получить статью'
		});
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
