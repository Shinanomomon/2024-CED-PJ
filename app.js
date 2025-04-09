// app.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2/promise'); // ใช้แบบ promise

const app = express();

// เซ็ต view engine เป็น ejs
app.set('view engine', 'ejs');
// ระบุโฟลเดอร์ public สำหรับไฟล์ static (css, js, รูป ฯลฯ)
app.use(express.static('public'));

// สำหรับ parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// กำหนด session
app.use(session({
  secret: 'yoursecretkey', // แก้เป็นอะไรก็ได้
  resave: false,
  saveUninitialized: false
}));

// สร้าง Connection Pool สำหรับเชื่อม MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',       // ใส่พาสเวิร์ด DB ของเราตามจริง
  database: 'complaint_system'
});

// Middleware ตรวจสอบว่า user ล็อกอินหรือยัง
function ensureUserLoggedIn(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    // ถ้ายังไม่ได้ล็อกอิน user
    res.redirect('/login');
  }
}

// Middleware ตรวจสอบว่า admin ล็อกอินหรือยัง
function ensureAdminLoggedIn(req, res, next) {
  if (req.session.adminId) {
    next();
  } else {
    // ถ้ายังไม่ได้ล็อกอิน admin
    res.redirect('/admin/login');
  }
}

// -------------------- Routes ฝั่ง User -------------------- //

// หน้า Login User
app.get('/login', (req, res) => {
  res.render('login_user');  // แสดงไฟล์ views/login_user.ejs
});

// รับ POST จากฟอร์ม login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username=? AND password=?",
      [username, password]
    );
    if (rows.length > 0) {
      // login สำเร็จ
      req.session.userId = rows[0].id;
      res.redirect('/home');
    } else {
      // login ไม่สำเร็จ
      res.send('Username หรือ Password ผิด หรือไม่มีอยู่ในระบบ');
    }
  } catch (err) {
    console.error(err);
    res.send('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
  }
});

// หน้า Home สำหรับ User
app.get('/home', ensureUserLoggedIn, (req, res) => {
  res.render('home_user');
});

// หน้า Create Complaint
app.get('/complaint/create', ensureUserLoggedIn, (req, res) => {
  res.render('create_complaint');
});

// รับ POST จากฟอร์ม create complaint
app.post('/complaint/create', ensureUserLoggedIn, async (req, res) => {
  const { subject, detail } = req.body;
  const userId = req.session.userId;
  try {
    await db.query(
      "INSERT INTO complaints (user_id, subject, detail, status) VALUES (?,?,?,?)",
      [userId, subject, detail, 'pending']
    );
    res.redirect('/complaint/history');
  } catch (err) {
    console.error(err);
    res.send('เกิดข้อผิดพลาดในการบันทึกคำร้อง');
  }
});

// หน้า History Complaint
app.get('/complaint/history', ensureUserLoggedIn, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [complaints] = await db.query(
      "SELECT * FROM complaints WHERE user_id=? ORDER BY id DESC",
      [userId]
    );
    res.render('history_complaint', { complaints });
  } catch (err) {
    console.error(err);
    res.send('เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง');
  }
});

// -------------------- Routes ฝั่ง Admin -------------------- //

// หน้า Login Admin
app.get('/admin/login', (req, res) => {
  res.render('login_admin');
});

// รับ POST จากฟอร์ม login admin
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE username=? AND password=?",
      [username, password]
    );
    if (rows.length > 0) {
      req.session.adminId = rows[0].id;
      res.redirect('/admin/complaints');
    } else {
      res.send('Login Admin ไม่ถูกต้อง');
    }
  } catch (err) {
    console.error(err);
    res.send('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล (admin)');
  }
});

// หน้า Complaints List สำหรับ Admin
app.get('/admin/complaints', ensureAdminLoggedIn, async (req, res) => {
  try {
    // JOIN user เพื่อดึง username ของคนแจ้ง
    const [complaints] = await db.query(`
      SELECT c.*, u.username 
      FROM complaints c
      INNER JOIN users u ON c.user_id = u.id
      ORDER BY c.id DESC
    `);
    res.render('complaint_list_admin', { complaints });
  } catch (err) {
    console.error(err);
    res.send('เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง (admin)');
  }
});

// ตัวอย่าง route เปลี่ยนสถานะคำร้อง (admin)
app.post('/admin/complaints/update-status', ensureAdminLoggedIn, async (req, res) => {
  const { complaintId, status } = req.body;
  try {
    await db.query("UPDATE complaints SET status=? WHERE id=?", [status, complaintId]);
    res.redirect('/admin/complaints');
  } catch (err) {
    console.error(err);
    res.send('เกิดข้อผิดพลาดในการอัปเดตสถานะคำร้อง');
  }
});

// สตาร์ทเซิร์ฟเวอร์
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
