const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Redirect root to login
router.get('/', (req, res) => {
  res.redirect('/login');
});

// Login Page Route
router.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Secure Login - ApexTrust Bank', 
    activePage: 'login',
    success: req.query.success || null,
    error: req.query.error || null,
    errors: null,
    values: {}
  });
});

// Register Page Route
router.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Register Account - ApexTrust Bank', 
    activePage: 'register',
    errors: null,
    values: {}
  });
});

// Dashboard Page Route
router.get('/dashboard', authMiddleware, (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard - ApexTrust Bank', 
    activePage: 'dashboard' 
  });
});

module.exports = router;
