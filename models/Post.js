import mongoose from "mongoose";
import CommentModel from "./Comment.js"; // ← ОБЯЗАТЕЛЬНО импортируй CommentModel

const PostSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	text: {
		type: String,
		required: true,
	},
	tags: {
		type: Array,
		default: []
	},
	viewsCount: {
		type: Number,
		default: 0,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		select: false
	},
	imageUrl: String,
	commentsCount: {
		type: Number,
		default: 0,
	},
}, {
	timestamps: true,
});

PostSchema.post('findOneAndDelete', async function (doc) {
	if (doc) {
		try {
			await CommentModel.deleteMany({ postId: doc._id });
			console.log(`✅ Комментарии для поста ${doc._id} удалены`);
		} catch (error) {
			console.error('❌ Ошибка при удалении комментариев:', error.message);
		}
	}
});

export default mongoose.model('Post', PostSchema);
