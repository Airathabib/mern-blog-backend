import express from 'express';

import mongoose from 'mongoose';

import { registerValidation, loginValidation, postCreateValidation } from './validations.js';

import { checkAuth, handleValidationErrors } from './utils/index.js';

import { UserController, PostController } from './controllers/index.js';

import commentsRouter from './routes/comments.js';

import fs from 'fs';

import cors from 'cors';

import multer from 'multer';

mongoose.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log('DB ok!')
	})
	.catch((err) => {
		console.log('DB error', err);
	})

const app = express();

const storage = multer.diskStorage({
	destination: (_, __, cb) => {
		if (!fs.existsSync('uploads')) {
			fs.mkdir('uploads')
		}
		cb(null, 'uploads')
	},
	filename: (_, file, cb) => {
		cb(null, file.originalname)
	},
});


const upload = multer({
	storage
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors());

app.use('/uploads', express.static('uploads'));

app.use('/comments', commentsRouter);

app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
	res.json({
		url: `/uploads/${req.file.originalname}`,
	})
})

app.get('/tags', PostController.getLastTags);
app.get('/posts/tags', PostController.getLastTags);

app.get('/posts', PostController.getAll);
app.get('/posts/:id', PostController.getOne);
app.post(
	'/posts',
	checkAuth,
	postCreateValidation,
	handleValidationErrors,
	PostController.create);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.patch(
	'/posts/:id',
	checkAuth,
	postCreateValidation,
	handleValidationErrors,
	PostController.update);


const PORT = process.env.PORT || 4444;

app.listen(PORT, (err) => {
	if (err) {
		return console.log(err);
	}

	console.log('Server OK!');
});


