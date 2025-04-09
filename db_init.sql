-- สร้างฐานข้อมูล (ถ้าไม่มี)
CREATE DATABASE IF NOT EXISTS complaint_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE complaint_system;

-- ตารางผู้ใช้ (User)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  fullname VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตารางผู้ดูแล (Admin)
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  fullname VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตารางคำร้อง (Complaints)
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  detail TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaints_users FOREIGN KEY (user_id) REFERENCES users(id)
);

-- เพิ่ม user และ admin ตัวอย่าง
INSERT INTO users (username, password, fullname)
VALUES ('testuser', '1234', 'User For Test');

INSERT INTO admins (username, password, fullname)
VALUES ('admin', 'admin', 'Administrator');
