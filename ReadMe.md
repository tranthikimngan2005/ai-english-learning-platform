# PROJECT PROPOSAL

## THÔNG TIN CHUNG

### Nhóm thực hiện

* **Thành viên 1:** Trần Quốc Sang – 23715111 (Trưởng nhóm)
* **Thành viên 2:** Võ Thanh Nhã – 23709251
* **Thành viên 3:** Trần Thị Kim Ngân – 23719511

### Repository

* **GitHub:** https://github.com/tranthikimngan2005/ai-english-learning-platform

---

## TÓM TẮT DỰ ÁN

**Pengwin** là nền tảng học tiếng Anh trực tuyến tích hợp trí tuệ nhân tạo. Hệ thống được xây dựng theo hướng học tập cá nhân hóa, kết hợp micro-learning, practice theo kỹ năng, ôn tập lặp lại ngắt quãng, streak tạo động lực và AI chat tutor để hỗ trợ luyện viết, luyện hội thoại và phản hồi ngôn ngữ theo ngữ cảnh.

### Mục tiêu

* Xây dựng nền tảng học tiếng Anh trực tuyến đa vai trò.
* Hỗ trợ học ngắn, dễ tiếp thu, theo từng kỹ năng.
* Cung cấp môi trường luyện tập có chấm điểm và phản hồi tức thì.
* Theo dõi tiến độ học tập và gợi ý nội dung cần ôn tập.
* Tăng động lực học đều bằng streak và review thông minh.

### Chức năng chính

1. **Quản lý người dùng:** Đăng ký, đăng nhập, phân quyền và hồ sơ cá nhân.
2. **Micro-learning:** Bài học ngắn theo các kỹ năng Reading, Listening, Writing, Speaking.
3. **Practice / Quiz System:** Làm bài tập, chấm điểm tự động, lưu lịch sử làm bài.
4. **Smart Streak:** Theo dõi chuỗi học tập hàng ngày.
5. **AI Conversation Tutor:** Luyện hội thoại và hỗ trợ sửa lỗi ngôn ngữ.
6. **Analytics & Recommendation:** Dashboard phân tích tiến độ và gợi ý ôn tập.

---

## PHÂN TÍCH VÀ THIẾT KẾ

### 1. Actors & Use Cases

* **Student:** Đăng ký/đăng nhập, xem dashboard, làm practice, review, chat AI, xem profile.
* **Creator:** Tạo và quản lý lesson, question, nội dung học.
* **Admin:** Duyệt nội dung, quản lý người dùng, kiểm soát hệ thống.

### 2. Kiến trúc hệ thống

* **Frontend:** React 18 + React Router v6.
* **Backend:** FastAPI + Python 3.11/3.12, tổ chức theo router/service.
* **Database:** SQLite qua SQLAlchemy.
* **Bảo mật:** JWT, Passlib/Bcrypt, CORS.
* **AI:** Cấu hình provider như Groq/Gemini/OpenAI theo biến môi trường.

### 3. Các mô-đun nghiệp vụ chính

* Authentication: đăng ký, đăng nhập, phân quyền.
* Lessons / Questions: quản lý nội dung học và câu hỏi.
* Practice: tạo session luyện tập và chấm đáp án.
* Review: cơ chế spaced repetition và ôn tập thẻ đến hạn.
* Recommendation: gợi ý câu hỏi cần ôn dựa trên lỗi trước đó.
* Chat: lưu lịch sử hội thoại AI.
* Streak: theo dõi số ngày học liên tục.

### 4. Thiết kế cơ sở dữ liệu

Các bảng chính trong hệ thống:

* `users`: thông tin người dùng, vai trò, trạng thái hoạt động.
* `skill_profiles`: tiến độ theo từng kỹ năng của người học.
* `lessons`: nội dung bài học.
* `questions`: bộ câu hỏi, passage, answer, explanation.
* `question_attempts`: lịch sử làm bài.
* `review_cards`: thẻ ôn tập theo SM-2-like.
* `user_error_tracks`: theo dõi lỗi sai để đề xuất ôn lại.
* `streaks`: chuỗi học tập.
* `chat_messages`: lịch sử chat AI.

### 5. Quan hệ dữ liệu

* `users` 1 - n `skill_profiles`
* `users` 1 - 1 `streaks`
* `users` 1 - n `chat_messages`
* `users` 1 - n `question_attempts`
* `users` 1 - n `review_cards`
* `users` 1 - n `user_error_tracks`
* `users` 1 - n `questions` qua `creator_id`
* `lessons` 1 - n `questions`
* `questions` 1 - n `question_attempts`
* `questions` 1 - n `review_cards`
* `questions` 1 - n `user_error_tracks`

---

## KẾ HOẠCH PHÁT TRIỂN

### MVP

* Hoàn thiện đăng ký/đăng nhập.
* Quản lý lessons và questions.
* Practice và lưu kết quả làm bài.
* Basic dashboard và streak.

### Beta

* AI Conversation Tutor.
* Dashboard phân tích tiến độ.
* Recommendation theo lịch sử sai sót.
* Review / spaced repetition hoàn chỉnh.

---

## KẾT QUẢ KIỂM THỬ

Các testcase đã triển khai trong `backend/lingai/tests` gồm:

* Đăng ký và đăng nhập thành công.
* Kiểm tra lỗi khi trùng email.
* Kiểm tra lỗi đăng nhập sai mật khẩu.
* Kiểm tra lưu và truy xuất câu hỏi TOEIC Part 7.
* Kiểm tra recommendation chỉ lấy câu hỏi đến hạn.
* Kiểm tra lấy 50 câu hỏi cho một session practice.

### Bảng kết quả tóm tắt

| STT | Test case | Kết quả mong đợi | Kết quả thực tế |
| --- | --- | --- | --- |
| 1 | Đăng ký tài khoản mới | Tạo user thành công | Passed |
| 2 | Đăng ký trùng email | Trả lỗi 400 | Passed |
| 3 | Đăng nhập sai mật khẩu | Trả lỗi 401 | Passed |
| 4 | Lưu và truy xuất dữ liệu Part 7 | Dữ liệu lưu đúng | Passed |
| 5 | Recommendation lọc câu đến hạn | Chỉ trả về câu đến hạn | Passed |
| 6 | Practice 50 câu | Trả về đúng 50 câu | Passed |

---

## HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY NHANH

### Cách chạy nhanh bằng script: có 2 cách

Cách 1: Nhóm đã chuẩn bị script `run_pengwin.ps1` ở thư mục gốc. Đây là cách được khuyến nghị để giảng viên chạy project nhanh trên máy của mình.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
powershell -ExecutionPolicy Bypass -File .\run_pengwin.ps1
```

Sau khi script chạy xong, truy cập:

* Frontend: http://localhost:3000
* Backend API docs: http://localhost:8000/docs

### Script sẽ tự động

* seed dữ liệu demo cho hệ thống,
* cài dependencies cần thiết,
* khởi chạy backend và frontend,
* mở sẵn môi trường để giảng viên test.

Cách 2: chạy bằng docker:
chạy lệnh
``` 
docker compose up --build -d
```
Sau khi script chạy xong, truy cập:

* Frontend: http://localhost:3000
* Backend API docs: http://localhost:8000/docs
### Tài khoản demo

| Vai trò | Username / Email | Password |
| --- | --- | --- |
| Student (User) | an@pengwin.com | student123 |
| Creator | creator@pengwin.com | creator123 |
| Admin | admin@pengwin.com | admin123 |

### Cài đặt thủ công nếu cần

1. Clone repository:

```bash
git clone https://github.com/tranthikimngan2005/ai-english-learning-platform
cd ai-english-learning-platform
```

2. Backend:

```powershell
cd backend/lingai
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Frontend:

```bash
cd frontend
npm install
npm start
```

---

## DEMO HỆ THỐNG

### Demo link

* https://github.com/tranthikimngan2005/ai-english-learning-platform

### Tài khoản dùng để demo

| Vai trò | Username / Email | Password |
| --- | --- | --- |
| Student (User) | an@pengwin.com | student123 |
| Creator | creator@pengwin.com | creator123 |
| Admin | admin@pengwin.com | admin123 |

### Cách chạy demo nhanh

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```powershell
powershell -ExecutionPolicy Bypass -File .\run_pengwin.ps1
```
***Tương thích với python 3.13.x trở xuống***
### Màn hình truy cập sau khi chạy

* Frontend: http://localhost:3000
* Backend API docs: http://localhost:8000/docs
### Deploy
```
https://vercel.com/kim-ngans-projects-e9f86c37/toeic-learning-english-cloud-sebk/J3rCZuzRAd1iEpQ7uBRbSmbGB7Ys
```
- Lưu ý: ***Tạo user mới khi sử dụng giao diện deploy***
---
