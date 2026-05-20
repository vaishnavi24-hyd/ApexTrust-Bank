const express = require("express");
const path = require("path");

// Initialize database
require("./models/db");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
  res.render("login", {
    title: "Login"
  });
});

// Register Page
app.get("/register", (req, res) => {
  res.render("register", {
    title: "Register"
  });
});

// Dashboard Page
app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Dashboard"
  });
});

// Import Auth Routes
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});