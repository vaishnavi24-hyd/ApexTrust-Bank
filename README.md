# 🏦 ApexTrust Bank

ApexTrust Bank is a secure Banking Transaction System built using Node.js and Express.js that demonstrates HTTP Session Tracking and Cookie-based Authentication in a modern banking environment.

The project allows users to securely register, log in, perform banking transactions, and maintain transaction history using sessions and cookies.

---

# 🚀 Features

## 🔐 Authentication System
- User Registration
- Secure Login
- Password Hashing using bcrypt
- Logout Functionality

---

## 🍪 Session & Cookie Tracking
- HTTP Session Management
- Cookie-based User Tracking
- Persistent Login Sessions
- Session Expiration Handling
- Protected Routes

---

## 💳 Banking Transaction System
- Deposit Money
- Withdraw Money
- Transfer Funds
- Real-time Balance Updates

---

## 📜 Transaction History
- View Recent Transactions
- Timestamp-based Transaction Logs
- Session-linked Transaction Tracking

---

## 🛡️ Banking Security Features
- Session Monitoring
- Auto Logout
- IP Address Tracking
- Login Activity Tracking
- Security Alerts

---

# 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend Runtime |
| Express.js | Web Framework |
| SQLite | Database |
| EJS | Templating Engine |
| Bootstrap 5 | Frontend UI |
| bcrypt | Password Hashing |
| express-session | HTTP Session Management |
| cookie-parser | Cookie Handling |

---

# 📂 Project Structure

```bash
apextrust-bank/
│
├── middleware/
│   ├── authMiddleware.js
│   └── securityMiddleware.js
│
├── models/
│   ├── db.js
│   ├── transactionModel.js
│   └── securityLogs.js
│
├── public/
│   └── style.css
│
├── routes/
│   ├── auth.js
│   └── transactions.js
│
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   └── partials/
│
├── server.js
├── package.json
└── README.md

⚙️ Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/YOUR_USERNAME/apextrust-bank.git
2️⃣ Navigate to Project
cd apextrust-bank
3️⃣ Install Dependencies
npm install
4️⃣ Start Server
node server.js
🌐 Run Application

Open browser:

http://localhost:3000
🔑 Core Functionalities
Register User
Login User
Maintain HTTP Sessions
Store Cookies
Deposit Funds
Withdraw Funds
Transfer Funds
View Transaction History
Monitor Active Sessions
🍪 Session Tracking Workflow
User Login
     ↓
Session Created
     ↓
Cookie Stored in Browser
     ↓
Authenticated Requests
     ↓
Transaction Tracking
     ↓
Session Expiration / Logout
🛡️ Security Implementations
Password Hashing using bcrypt
Protected Routes
Session Validation
Cookie-based Authentication
Secure Logout Handling
Inactivity Session Timeout
📸 UI Highlights
Professional Banking Dashboard
Dark Fintech Theme
Responsive Layout
Transaction Monitoring
Security Tracking Console
🎯 Learning Outcomes

This project demonstrates:

HTTP Session Management
Cookie Handling
Authentication Systems
Banking Transaction Processing
Secure Backend Development
Express.js Middleware Architecture
Full Stack Web Development

Author

Developed by Vaishnavi Guttapally