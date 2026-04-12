

\# SLIDE 1 - TIÊU ĐỀ



\## Nền Tảng Học Tiếng Anh Tích Hợp Trí Tuệ Nhân Tạo: PENGWIN

\### Học phần: Phát triển ứng dụng Web



\- \*\*Nhóm thực hiện:\*\* Pengwin AI Team

\- \*\*Sinh viên:\*\*

&#x20; - Trần Quốc Sang - 23715111 (Trưởng nhóm)

&#x20; - Võ Thành Nhã - 23709251

&#x20; - Trần Thị Kim Ngân - 23719511

\- \*\*Giảng viên hướng dẫn:\*\* ThS Trương Vĩnh Linh

\---



\# SLIDE 2 - GIỚI THIỆU BÀI TOÁN



Người học tiếng Anh thường gặp 3 vấn đề chính:

\- \*\*Mất động lực:\*\* Khó duy trì thói quen khi tự học một mình trong thời gian dài.

\- \*\*Thiếu phản hồi:\*\* Không có người sửa lỗi tức thì khi luyện viết hoặc nói.

\- \*\*Lộ trình rời rạc:\*\* Kiến thức chưa được cá nhân hóa theo điểm mạnh/yếu của từng người.



\*\*Dự án Pengwin\*\* giải quyết các vấn đề trên bằng sự kết hợp giữa:

\- \*\*Micro-learning:\*\* Chia nhỏ bài học, giúp tiếp thu nhanh mỗi ngày.

\- \*\*Interactive Quiz:\*\* Hệ thống câu hỏi đa dạng, chấm điểm tự động.

\- \*\*AI Chat Tutor:\*\* Hỗ trợ hội thoại, sửa lỗi ngữ pháp và lưu lịch sử luyện tập.

\- \*\*Cơ chế Streak \& Spaced Repetition (SM-2):\*\* Tối ưu hóa khả năng ghi nhớ dài hạn.



\---



\# SLIDE 3 - MỤC TIÊU HỆ THỐNG



\- Xây dựng nền tảng học trực tuyến đa người dùng (Multi-user).

\- Hệ thống quản lý tài khoản bảo mật, phân quyền chi tiết (Student, Creator, Admin).

\- Cung cấp kho bài tập kỹ năng đa dạng (Reading, Listening, Writing, Speaking).

\- Theo dõi tiến độ trực quan: Dashboard, thống kê kỹ năng, hệ thống Streak.

\- Áp dụng thuật toán \*\*SM-2 (Spaced Repetition)\*\* để tự động nhắc lịch ôn tập.

\- Tạo trải nghiệm học tập có tính tương tác cao và duy trì động lực mỗi ngày.



\---



\# SLIDE 4 - USE CASE / CHỨC NĂNG



\### 🐧 Người học (Student)

\- Đăng ký/Đăng nhập, quản lý hồ sơ cá nhân.

\- Luyện tập kỹ năng và nhận phản hồi điểm số tức thì.

\- Ôn tập từ vựng/ngữ pháp theo danh sách đến hạn (Due cards).

\- Chat với AI Tutor để luyện kỹ năng Writing/Speaking.



\### 🐧 Người sáng tạo (Creator)

\- Soạn thảo và quản lý bài học (Lessons).

\- Thiết kế bộ câu hỏi trắc nghiệm (Questions).

\- Theo dõi trạng thái phê duyệt nội dung từ Admin.



\### 🐧 Quản trị viên (Admin)

\- Quản lý người dùng (Phân quyền, khóa/mở tài khoản).

\- Kiểm duyệt nội dung bài học và câu hỏi từ Creator.

\- Theo dõi số liệu thống kê tổng thể của toàn bộ hệ thống.



\---



\# SLIDE 5 - KIẾN TRÚC HỆ THỐNG



\### Frontend (Giao diện người dùng)

\- Công nghệ: \*\*ReactJS\*\*

\- Chức năng: Dashboard tương tác, giao diện ôn tập thẻ, cửa sổ AI Chat.



\### Backend (Xử lý máy chủ)

\- Công nghệ: \*\*FastAPI (Python 3.12+)\*\*

\- Module: Xử lý xác thực (JWT), Logic Spaced Repetition, Quản lý Streak.



\### Database (Cơ sở dữ liệu)

\- \*\*SQLite + SQLAlchemy\*\*: Lưu trữ dữ liệu người dùng, nội dung bài học và lịch sử chat.



\### Bảo mật \& Auth

\- \*\*JWT (JSON Web Token)\*\* để duy trì phiên đăng nhập.

\- Mã hóa mật khẩu bằng \*\*Passlib/Bcrypt\*\* đảm bảo an toàn dữ liệu.



\---



\# SLIDE 6 - QUY TRÌNH DEMO



1\. \*\*Đăng nhập Student:\*\* Giới thiệu giao diện Dashboard và hệ thống Streak.

2\. \*\*Luyện tập (Practice):\*\* Làm bài tập thực tế, submit và xem điểm số cập nhật.

3\. \*\*Ôn tập (Review):\*\* Trải nghiệm thuật toán SM-2 (Thẻ hiện lên dựa trên độ khó đã chọn).

4\. \*\*AI Chat:\*\* Thực hiện hội thoại với AI, nhận diện khả năng sửa lỗi của chatbot.

5\. \*\*Quản trị (Admin):\*\* Đăng nhập quyền Admin để duyệt nội dung và xem thống kê User.



\---



\# SLIDE 7 - ỨNG DỤNG TRÍ TUỆ NHÂN TẠO (AI)



Hệ thống tích hợp AI vào hai khía cạnh chính:

\- \*\*AI Tutor:\*\* Tích hợp mô hình ngôn ngữ lớn để sửa lỗi ngữ pháp và hội thoại theo ngữ cảnh của người học.

\- \*\*Hỗ trợ phát triển (Vibe Coding):\*\* Nhóm sử dụng AI (Cursor, Copilot) để:

&#x20; - Tối ưu hóa cấu trúc mã nguồn (Boilerplate).

&#x20; - Tự động sinh dữ liệu mẫu (Dummy data) cho 500+ Flashcards và Quiz..

&#x20; - Hỗ trợ gỡ lỗi (Debugging) và viết Unit test.



\---



\# SLIDE 8 - KẾT QUẢ \& ĐÁNH GIÁ



\### Đã hoàn thành (MVP)

\- Hoàn thiện Backend với đầy đủ các Router nghiệp vụ.

\- Hệ thống Frontend đồng bộ thương hiệu \*\*Pengwin\*\*, hỗ trợ đa thiết bị.

\- Tích hợp thành công thuật toán SM-2 và hệ thống theo dõi Streak.



\### Hướng phát triển

\- Nâng cấp AI Tutor để hỗ trợ phát âm (Voice-to-Text).

\- Bổ sung hệ thống phân tích sâu (Data Analytics) về hành vi người dùng.

\- Mở rộng kho nội dung bài học theo các chứng chỉ quốc tế (IELTS/TOEIC).



\---

