# 🐧 Pengwin - AI English Learning Platform
# Install & Running document
## 🛠️ Yêu cầu hệ thống
* **Python:** v3.12+ (Hỗ trợ chuẩn `datetime.UTC`)
* **Node.js:** v18.x hoặc mới hơn
* **Cơ sở dữ liệu:** SQLite (Đã tích hợp sẵn trong dự án)

---

##  Hướng dẫn cài đặt và Khởi chạy

### 1. Backend (FastAPI)
Di chuyển vào thư mục backend:
```bash
cd backend/lingai
### 2. Cài đặt các thư viện cần thiết:

Bash
pip install fastapi uvicorn sqlalchemy pydantic-settings python-multipart passlib[bcrypt] python-jose[cryptography] httpx email-validator pandas
Khởi chạy server:

Bash
python -m uvicorn app.main:app --reload
API Swagger UI: http://127.0.0.1:8000/docs
### 3. Frontend (ReactJS)
Di chuyển vào thư mục frontend:

Bash
cd lingai-frontend
Cài đặt package và khởi chạy:

Bash
npm install
npm start
Giao diện: http://localhost:3000
