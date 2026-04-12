# Pengwin Backend

English learning platform API â€” FastAPI + SQLite

## Tech Stack

- **FastAPI** â€” web framework
- **SQLite** â€” database (zero config)
- **SQLAlchemy** â€” ORM
- **JWT** â€” authentication
- **Passlib/bcrypt** â€” password hashing
- **SM-2 algorithm** â€” spaced repetition

---

## Project Structure

```
pengwin/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ main.py               # FastAPI app entry point
â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â”œâ”€â”€ config.py         # Settings (env vars)
â”‚   â”‚   â”œâ”€â”€ database.py       # SQLAlchemy engine + session
â”‚   â”‚   â””â”€â”€ security.py       # JWT + password hashing + auth deps
â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â””â”€â”€ user.py           # All SQLAlchemy models
â”‚   â”œâ”€â”€ schemas/
â”‚   â”‚   â””â”€â”€ schemas.py        # All Pydantic schemas
â”‚   â”œâ”€â”€ routers/
â”‚   â”‚   â”œâ”€â”€ auth.py           # POST /api/auth/register, /login
â”‚   â”‚   â”œâ”€â”€ users.py          # GET /api/users/me, /dashboard, /progress
â”‚   â”‚   â”œâ”€â”€ lessons.py        # CRUD /api/lessons
â”‚   â”‚   â”œâ”€â”€ questions.py      # CRUD + practice /api/questions
â”‚   â”‚   â”œâ”€â”€ review.py         # Spaced repetition /api/review
â”‚   â”‚   â”œâ”€â”€ chat.py           # AI chat history /api/chat
â”‚   â”‚   â””â”€â”€ admin.py          # Admin panel /api/admin
â”‚   â””â”€â”€ services/
â”‚       â”œâ”€â”€ spaced_repetition.py  # SM-2 algorithm
â”‚       â””â”€â”€ streak.py             # Streak tracking
â”œâ”€â”€ tests/
â”‚   â””â”€â”€ test_api.py           # Full test suite (40+ tests)
â”œâ”€â”€ seed.py                   # Dev data seeder
â”œâ”€â”€ requirements.txt
â””â”€â”€ README.md
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

Level up triggers when: **questions_done â‰¥ 50 AND accuracy â‰¥ 75%**

---

## Environment Variables

Create a `.env` file to override defaults:

```env
SECRET_KEY=your-very-long-random-secret-key
DATABASE_URL=sqlite:///./lingai.db
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

