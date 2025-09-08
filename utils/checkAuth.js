import jwt from 'jsonwebtoken';



export default (req, res, next) => {
	const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

	if (token) {
		try {
			// ✅ ИСПРАВЛЕНО: decoded вместо decoced
			const decoded = jwt.verify(token, 'secret123');

			// ✅ ДОБАВЛЕНО: проверка наличия _id
			if (!decoded._id) {
				throw new Error('Invalid token payload');
			}

			req.userId = decoded._id;
			next();
		} catch (e) {
			console.error('JWT verification error:', e.message);
			return res.status(403).json({
				message: 'Нет доступа (неверный токен)'
			});
		}
	} else {
		return res.status(403).json({
			message: 'Нет доступа (токен не передан)'
		});
	}
};
