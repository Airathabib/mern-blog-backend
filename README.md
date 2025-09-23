# 🦉 CommentHub— Backend

> REST API для блог-платформы с поддержкой вложенных комментариев, лайков, тегов и авторизации JWT.  
> Построен на Node.js, Express, MongoDB (Mongoose) и валидации через express-validator.

---

## 🚀 Основные эндпоинты

### 📝 Посты

- `GET /posts` — получить список постов (с пагинацией, сортировкой)
- `POST /posts` — создать пост
- `PATCH /posts/:id` — редактировать пост
- `DELETE /posts/:id` — удалить пост

### 💬 Комментарии

- `GET /comments?post=...` — получить комментарии (с пагинацией, сортировкой, вложенностью)
- `POST /comments` — добавить комментарий (с `parentComment` для ответов)
- `PUT /comments/:id` — редактировать комментарий
- `DELETE /comments/:id` — удалить комментарий
- `POST /comments/:id/like` — поставить лайк
- `POST /comments/:id/dislike` — поставить дизлайк

### 🏷️ Теги

- `GET /tags` — получить топ тегов (новые/популярные)

### 🔐 Авторизация

- `POST /auth/login` — вход
- `POST /auth/register` — регистрация
- `GET /auth/me` — проверка токена

### 🖼️ Загрузка файлов

- `POST /upload` — загрузка изображений (только для авторизованных)

---

## 🛠 Установка и запуск

```bash
npm install
npm run dev
```

# Структура проекта

src/
├── models/ # Mongoose-модели
├── controllers/ # Логика эндпоинтов
├── routes/ # Роутеры
├── middlewares/ # Проверка токена, валидация
├── validations/ # express-validator схемы
├── utils/ # Хелперы, ошибки
└── app.js # Инициализация Express
