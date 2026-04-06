# LingAI Backend

English learning platform API — FastAPI + SQLite

## Tech Stack

- **FastAPI** — web framework
- **SQLite** — database (zero config)
- **SQLAlchemy** — ORM
- **JWT** — authentication
- **Passlib/bcrypt** — password hashing
- **SM-2 algorithm** — spaced repetition

---

## Project Structure

```
lingai/
├── app/
│   ├── main.py               # FastAPI app entry point
│   ├── core/
│   │   ├── config.py         # Settings (env vars)
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   └── security.py       # JWT + password hashing + auth deps
│   ├── models/
│   │   └── user.py           # All SQLAlchemy models
│   ├── schemas/
│   │   └── schemas.py        # All Pydantic schemas
│   ├── routers/
│   │   ├── auth.py           # POST /api/auth/register, /login
│   │   ├── users.py          # GET /api/users/me, /dashboard, /progress
│   │   ├── lessons.py        # CRUD /api/lessons
│   │   ├── questions.py      # CRUD + practice /api/questions
│   │   ├── review.py         # Spaced repetition /api/review
│   │   ├── chat.py           # AI chat history /api/chat
│   │   └── admin.py          # Admin panel /api/admin
│   └── services/
│       ├── spaced_repetition.py  # SM-2 algorithm
│       └── streak.py             # Streak tracking
├── tests/
│   └── test_api.py           # Full test suite (40+ tests)
├── seed.py                   # Dev data seeder
├── requirements.txt
└── README.md
```

---

## Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Seed sample data
python seed.py

# 4. Run the server
uvicorn app.main:app --reload
```

Server runs at: **http://localhost:8000**

Interactive API docs: **http://localhost:8000/docs**

---

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT) |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users/me` | Own profile |
| GET | `/api/users/me/dashboard` | Streak + skill summary + due reviews |
| GET | `/api/users/me/progress` | All 4 skill profiles |

### Lessons
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/lessons` | All (student+) |
| POST | `/api/lessons` | Creator, Admin |
| PUT | `/api/lessons/{id}` | Creator (own), Admin |
| DELETE | `/api/lessons/{id}` | Creator (own), Admin |
| PATCH | `/api/lessons/{id}/moderate` | Admin only |

### Questions
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/questions` | Creator, Admin |
| POST | `/api/questions` | Creator, Admin |
| PUT/DELETE | `/api/questions/{id}` | Creator (own), Admin |
| PATCH | `/api/questions/{id}/moderate` | Admin only |
| POST | `/api/questions/practice/start` | Student+ |
| POST | `/api/questions/practice/submit` | Student+ |

### Review (Spaced Repetition)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/review/due` | Cards due today |
| POST | `/api/review/submit` | Submit review result (again/hard/good/easy) |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/history` | Conversation history |
| POST | `/api/chat/send` | Save user message |
| POST | `/api/chat/ai-response` | Save AI reply |
| GET | `/api/chat/system-prompt` | Get tutor system prompt |
| DELETE | `/api/chat/history` | Clear history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System analytics |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/{id}/role` | Change role |
| PATCH | `/api/admin/users/{id}/ban` | Ban/unban |
| GET | `/api/admin/content/pending/questions` | Pending questions |
| GET | `/api/admin/content/pending/lessons` | Pending lessons |

---

## Running Tests

```bash
pytest tests/test_api.py -v
```

40+ tests covering:
- Auth (register, login, duplicate, bad password)
- Role-based access control
- Lesson & question CRUD + moderation
- Practice session + answer submission
- Skill profile updates + level-up logic
- Spaced repetition card creation + SM-2 algorithm
- Streak tracking
- Admin user management + analytics
- AI chat history

---

## Roles

| Role | Permissions |
|------|-------------|
| `student` | Practice, review, chat, view own profile |
| `creator` | + Create lessons & questions (pending approval) |
| `admin` | + Approve/reject content, manage users |

---

## Spaced Repetition (SM-2)

After each practice, a `ReviewCard` is created. When reviewing:

| Grade | Meaning | Effect |
|-------|---------|--------|
| `again` | Forgot completely | Reset to 1 day |
| `hard` | Remembered with effort | Slow growth |
| `good` | Correct with hesitation | Normal growth |
| `easy` | Perfect recall | Fast growth + ease boost |

Level up triggers when: **questions_done ≥ 50 AND accuracy ≥ 75%**

---

## Environment Variables

Create a `.env` file to override defaults:

```env
SECRET_KEY=your-very-long-random-secret-key
DATABASE_URL=sqlite:///./lingai.db
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```
