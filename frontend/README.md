# Pengwin Frontend

React SPA káº¿t ná»‘i tháº­t vá»›i Pengwin Backend (FastAPI + SQLite).

## Tech Stack

- **React 18** + React Router v6
- **Fetch API** â€” gá»i backend REST
- **Google Fonts** â€” Outfit + DM Serif Display
- **CSS Variables** â€” dark theme nháº¥t quÃ¡n

## CÃ i Ä‘áº·t & Cháº¡y

```bash
# Äáº£m báº£o backend Ä‘ang cháº¡y táº¡i http://localhost:8000
# Trong thÆ° má»¥c pengwin-frontend:

npm install
npm start
# â†’ http://localhost:3000
```

## Cáº¥u trÃºc

```
src/
â”œâ”€â”€ api/
â”‚   â””â”€â”€ client.js          # Táº¥t cáº£ API calls (auth, users, questions, review, chat, admin)
â”œâ”€â”€ context/
â”‚   â”œâ”€â”€ AuthContext.js     # Global user state + JWT
â”‚   â””â”€â”€ ToastContext.js    # Toast notifications
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ Layout.js          # Sidebar navigation
â”‚   â””â”€â”€ Layout.css
â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ Login.js / Register.js   # Auth
â”‚   â”œâ”€â”€ Dashboard.js             # Trang chÃ­nh
â”‚   â”œâ”€â”€ Skills.js                # Chá»n ká»¹ nÄƒng
â”‚   â”œâ”€â”€ Practice.js              # Quiz flow
â”‚   â”œâ”€â”€ Review.js                # Spaced repetition
â”‚   â”œâ”€â”€ Progress.js              # CEFR level track
â”‚   â”œâ”€â”€ Chat.js                  # AI writing coach
â”‚   â”œâ”€â”€ Profile.js               # Há»“ sÆ¡ cÃ¡ nhÃ¢n
â”‚   â”œâ”€â”€ CreatorQuestions.js      # Creator: quáº£n lÃ½ cÃ¢u há»i
â”‚   â”œâ”€â”€ CreatorLessons.js        # Creator: quáº£n lÃ½ bÃ i há»c
â”‚   â”œâ”€â”€ AdminDashboard.js        # Admin: stats
â”‚   â”œâ”€â”€ AdminUsers.js            # Admin: quáº£n lÃ½ users
â”‚   â””â”€â”€ AdminContent.js          # Admin: duyá»‡t ná»™i dung
â””â”€â”€ index.css              # Global dark theme
```

## Pages theo Role

| Page | Student | Creator | Admin |
|------|---------|---------|-------|
| Dashboard, Skills, Practice, Review | âœ“ | âœ“ | âœ“ |
| Progress, Chat, Profile | âœ“ | âœ“ | âœ“ |
| Creator / Questions & Lessons | â€” | âœ“ | âœ“ |
| Admin / Dashboard, Users, Content | â€” | â€” | âœ“ |

## TÃ i khoáº£n Demo (sau khi cháº¡y seed.py)

| Role | Email | Password |
|------|-------|----------|
| Student | an@pengwin.com | student123 |
| Creator | creator@pengwin.com | creator123 |
| Admin | admin@pengwin.com | admin123 |

## Biáº¿n mÃ´i trÆ°á»ng

Táº¡o `.env` trong thÆ° má»¥c root:
```
REACT_APP_API_URL=http://localhost:8000
```

## LÆ°u Ã½ vá» AI Chat

Trang Chat gá»i trá»±c tiáº¿p `https://api.anthropic.com/v1/messages`.
Trong mÃ´i trÆ°á»ng production, cáº§n proxy qua backend Ä‘á»ƒ báº£o vá»‡ API key.
Hiá»‡n táº¡i backend cung cáº¥p endpoint `/api/chat/system-prompt` Ä‘á»ƒ láº¥y system prompt.



cÃ¡ch cháº¡y: di chuyá»ƒn vÃ o folder frontend >> npm install >> npm start

