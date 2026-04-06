# LingAI Frontend

React SPA kết nối thật với LingAI Backend (FastAPI + SQLite).

## Tech Stack

- **React 18** + React Router v6
- **Fetch API** — gọi backend REST
- **Google Fonts** — Outfit + DM Serif Display
- **CSS Variables** — dark theme nhất quán

## Cài đặt & Chạy

```bash
# Đảm bảo backend đang chạy tại http://localhost:8000
# Trong thư mục lingai-frontend:

npm install
npm start
# → http://localhost:3000
```

## Cấu trúc

```
src/
├── api/
│   └── client.js          # Tất cả API calls (auth, users, questions, review, chat, admin)
├── context/
│   ├── AuthContext.js     # Global user state + JWT
│   └── ToastContext.js    # Toast notifications
├── components/
│   ├── Layout.js          # Sidebar navigation
│   └── Layout.css
├── pages/
│   ├── Login.js / Register.js   # Auth
│   ├── Dashboard.js             # Trang chính
│   ├── Skills.js                # Chọn kỹ năng
│   ├── Practice.js              # Quiz flow
│   ├── Review.js                # Spaced repetition
│   ├── Progress.js              # CEFR level track
│   ├── Chat.js                  # AI writing coach
│   ├── Profile.js               # Hồ sơ cá nhân
│   ├── CreatorQuestions.js      # Creator: quản lý câu hỏi
│   ├── CreatorLessons.js        # Creator: quản lý bài học
│   ├── AdminDashboard.js        # Admin: stats
│   ├── AdminUsers.js            # Admin: quản lý users
│   └── AdminContent.js          # Admin: duyệt nội dung
└── index.css              # Global dark theme
```

## Pages theo Role

| Page | Student | Creator | Admin |
|------|---------|---------|-------|
| Dashboard, Skills, Practice, Review | ✓ | ✓ | ✓ |
| Progress, Chat, Profile | ✓ | ✓ | ✓ |
| Creator / Questions & Lessons | — | ✓ | ✓ |
| Admin / Dashboard, Users, Content | — | — | ✓ |

## Tài khoản Demo (sau khi chạy seed.py)

| Role | Email | Password |
|------|-------|----------|
| Student | an@lingai.com | student123 |
| Creator | creator@lingai.com | creator123 |
| Admin | admin@lingai.com | admin123 |

## Biến môi trường

Tạo `.env` trong thư mục root:
```
REACT_APP_API_URL=http://localhost:8000
```

## Lưu ý về AI Chat

Trang Chat gọi trực tiếp `https://api.anthropic.com/v1/messages`.
Trong môi trường production, cần proxy qua backend để bảo vệ API key.
Hiện tại backend cung cấp endpoint `/api/chat/system-prompt` để lấy system prompt.



cách chạy: di chuyển vào folder frontend >> npm install >> npm start
