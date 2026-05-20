const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const authMiddleware = require("./middleware/authMiddleware");

// Initialize database
require("./models/db");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Session Configuration
app.use(
  session({
    secret: "apextrust_secure_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 15 * 60 * 1000, // 15 minutes
      secure: false,          // Dev environment running HTTP
      httpOnly: true          // Protect against XSS
    }
  })
);

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes

// Home Route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Login Page
app.get("/login", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }
  res.render("login", {
    title: "Secure Login - ApexTrust Bank",
    activePage: "login",
    success: req.query.success || null,
    error: req.query.error || null,
    errors: null,
    values: {}
  });
});

// Register Page
app.get("/register", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }
  res.render("register", {
    title: "Register Account - ApexTrust Bank",
    activePage: "register",
    errors: null,
    values: {}
  });
});

// Dashboard Page
app.get("/dashboard", authMiddleware, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard - ApexTrust Bank",
    activePage: "dashboard"
  });
});

// Import Auth Routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});