# Pengwin Microservice Roadmap

## Mục tiêu

Giữ frontend hiện tại hoạt động ổn định trong khi tách backend monolith thành các microservice nhỏ hơn để phù hợp môn Kiến trúc hướng dịch vụ và Điện toán đám mây.

Nguyên tắc chính:

- Frontend chỉ gọi qua một lớp API adapter duy nhất.
- Mỗi domain nghiệp vụ có ranh giới rõ ràng.
- Databricks chỉ dùng cho batch analytics / recommendation / ETL, không gánh toàn bộ app.
- Deploy frontend riêng trên Vercel, backend service riêng theo từng khối.

## Current API Contract

Frontend hiện đang đi qua [frontend/src/api/client.js](../frontend/src/api/client.js), nên đây là contract trung tâm cần giữ ổn định.

### Auth / User

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/users/me/dashboard`
- `GET /api/users/me/progress`

### Content / Learning

- `GET /api/lessons`
- `GET /api/lessons/{id}`
- `POST /api/lessons`
- `PUT /api/lessons/{id}`
- `DELETE /api/lessons/{id}`
- `PATCH /api/lessons/{id}/moderate`
- `GET /api/questions`
- `POST /api/questions`
- `PUT /api/questions/{id}`
- `DELETE /api/questions/{id}`
- `PATCH /api/questions/{id}/moderate`
- `POST /api/questions/practice/start`
- `POST /api/questions/practice/submit`
- `GET /api/recommendations`

### Review / Spaced Repetition

- `GET /api/review/due`
- `GET /api/review/srs`
- `GET /api/review/mistakes`
- `GET /api/review/recent-mistakes`
- `POST /api/review/submit`

### Chat / AI

- `GET /api/chat/history`
- `POST /api/chat/send`
- `POST /api/chat/generate`
- `POST /api/chat/ai-response`
- `GET /api/chat/system-prompt`
- `DELETE /api/chat/history`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/users/overview`
- `GET /api/admin/reports/failed-tags`
- `PATCH /api/admin/users/{id}/role`
- `PATCH /api/admin/users/{id}/ban`
- `GET /api/admin/content/pending/lessons`

## Target Service Split

### 1. Identity Service

Ownership:

- register/login
- current user
- profile/dashboard/progress summary

### 2. Learning Content Service

Ownership:

- lessons
- questions
- practice session start/submit
- moderation for lessons/questions

### 3. Review Service

Ownership:

- due cards
- SRS state
- mistakes and recent mistakes
- review submit

### 4. Chat Service

Ownership:

- conversation history
- AI generation
- AI response persistence
- system prompt

### 5. Analytics / Recommendation Service

Ownership:

- recommendation generation
- learning trend aggregation
- Databricks batch jobs / notebooks

## Recommended First Move

To keep the frontend stable while preparing microservices, do the work in this order:

1. Freeze the current API contract in the frontend adapter.
2. Split the backend logically on paper first, then by folder.
3. Extract Chat Service or Identity Service first because the frontend dependency surface is small and easy to validate.
4. Keep Databricks for analytics only, and expose its results through the backend API layer.
5. Only after the contract is stable, start moving one domain at a time into separate deployable services.

## Frontend Stability Rules

- Do not let pages call backend URLs directly.
- Keep all requests inside `frontend/src/api/client.js` or modules imported from it.
- If an endpoint moves, update one adapter only.
- Keep response shapes backwards compatible during the transition.

## Databricks Free-Friendly Scope

Use Databricks free/community for:

- batch notebook processing
- log aggregation
- recommendation generation
- feature engineering for learning analytics
- exporting computed results back to the backend database

Do not use Databricks free/community for:

- hosting the whole backend
- serving realtime app traffic
- replacing the API gateway

## Validation Checklist

- Frontend still logs in and loads dashboard.
- Practice page still starts sessions and submits answers.
- Chat page still loads and sends messages.
- Review pages still pull due/mistake data.
- The new service boundaries do not change the frontend request contract until the replacement service is ready.

## Current Progress

- Auth, chat, questions, review, lessons, admin, users, and flashcards logic are now extracted into service modules.
- Existing API routes remain unchanged and continue to call the service layer.
- Verified with static checks plus focused tests for lessons/admin and full-system user flow.
- Flashcards router is now also a thin wrapper around its service layer.
- Recommendation and analytics logic now live in `app.services.analytics_service`, with `app.services.recommendation` kept as a compatibility shim.
- A Databricks batch scaffold now exists in `docs/databricks/recommendation_batch.py`.

## Next Step

- Wire Databricks outputs back into the backend as an optional batch source.
- Add a small contract test around flashcards if you want extra safety before deployment.
