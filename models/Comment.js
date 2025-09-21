// models/Comment.js
import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	post: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Post',
		required: true,
	},
	parentComment: { // ← новое поле
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Comment',
		default: null,
	},
	commentsCount: {
		type: Number,
		default: 0,
	},
	likes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	}],
	dislikes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	}],
}, {
	timestamps: true,
});

CommentSchema.virtual('likesCount').get(function () {
	return this.likes?.length || 0;
});

CommentSchema.virtual('dislikesCount').get(function () {
	return this.dislikes?.length || 0;
});

// Важно: добавь { virtuals: true } в toJSON и toObject
CommentSchema.set('toJSON', { virtuals: true });
CommentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Comment', CommentSchema);
