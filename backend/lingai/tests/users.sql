-- Clear old data
DELETE FROM users;

-- Admin
INSERT INTO users (username, email, hashed_password, role, is_active)
VALUES ('admin', 'admin@test.com', 'temp', 'admin', 1);

-- Creators (5 người)
INSERT INTO users (username, email, hashed_password, role, is_active) VALUES
('creator1', 'creator1@test.com', 'temp', 'creator', 1),
('creator2', 'creator2@test.com', 'temp', 'creator', 1),
('creator3', 'creator3@test.com', 'temp', 'creator', 1),
('creator4', 'creator4@test.com', 'temp', 'creator', 1),
('creator5', 'creator5@test.com', 'temp', 'creator', 1);

-- Students (44 người)
-- user1 → user44
INSERT INTO users (username, email, hashed_password, role, is_active) VALUES
('user1', 'user1@test.com', 'temp', 'student', 1),
('user2', 'user2@test.com', 'temp', 'student', 1),
('user3', 'user3@test.com', 'temp', 'student', 1),
('user4', 'user4@test.com', 'temp', 'student', 1),
('user5', 'user5@test.com', 'temp', 'student', 1),
('user6', 'user6@test.com', 'temp', 'student', 1),
('user7', 'user7@test.com', 'temp', 'student', 1),
('user8', 'user8@test.com', 'temp', 'student', 1),
('user9', 'user9@test.com', 'temp', 'student', 1),
('user10', 'user10@test.com', 'temp', 'student', 1),
('user11', 'user11@test.com', 'temp', 'student', 1),
('user12', 'user12@test.com', 'temp', 'student', 1),
('user13', 'user13@test.com', 'temp', 'student', 1),
('user14', 'user14@test.com', 'temp', 'student', 1),
('user15', 'user15@test.com', 'temp', 'student', 1),
('user16', 'user16@test.com', 'temp', 'student', 1),
('user17', 'user17@test.com', 'temp', 'student', 1),
('user18', 'user18@test.com', 'temp', 'student', 1),
('user19', 'user19@test.com', 'temp', 'student', 1),
('user20', 'user20@test.com', 'temp', 'student', 1),
('user21', 'user21@test.com', 'temp', 'student', 1),
('user22', 'user22@test.com', 'temp', 'student', 1),
('user23', 'user23@test.com', 'temp', 'student', 1),
('user24', 'user24@test.com', 'temp', 'student', 1),
('user25', 'user25@test.com', 'temp', 'student', 1),
('user26', 'user26@test.com', 'temp', 'student', 1),
('user27', 'user27@test.com', 'temp', 'student', 1),
('user28', 'user28@test.com', 'temp', 'student', 1),
('user29', 'user29@test.com', 'temp', 'student', 1),
('user30', 'user30@test.com', 'temp', 'student', 1),
('user31', 'user31@test.com', 'temp', 'student', 1),
('user32', 'user32@test.com', 'temp', 'student', 1),
('user33', 'user33@test.com', 'temp', 'student', 1),
('user34', 'user34@test.com', 'temp', 'student', 1),
('user35', 'user35@test.com', 'temp', 'student', 1),
('user36', 'user36@test.com', 'temp', 'student', 1),
('user37', 'user37@test.com', 'temp', 'student', 1),
('user38', 'user38@test.com', 'temp', 'student', 1),
('user39', 'user39@test.com', 'temp', 'student', 1),
('user40', 'user40@test.com', 'temp', 'student', 1),
('user41', 'user41@test.com', 'temp', 'student', 1),
('user42', 'user42@test.com', 'temp', 'student', 1),
('user43', 'user43@test.com', 'temp', 'student', 1),
('user44', 'user44@test.com', 'temp', 'student', 1);