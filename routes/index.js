const express = require('express');
const router = express.Router();

// Redirect root to login
router.get('/', (req, res) => {
  res.redirect('/login');
});

// Login Page Route
router.get('/login', (req, res) => {
  res.render('login', { title: 'Secure Login - ApexTrust Bank', activePage: 'login' });
});

// Register Page Route
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register Account - ApexTrust Bank', activePage: 'register' });
});

// Dashboard Page Route
router.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Dashboard - ApexTrust Bank', activePage: 'dashboard' });
});

module.exports = router;
