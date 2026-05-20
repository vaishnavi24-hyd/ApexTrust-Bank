const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');

// Validation rules for registration
const registerValidation = [
  body('fullname')
    .trim()
    .notEmpty()
    .withMessage('Full Name is required.'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('accountType')
    .notEmpty()
    .withMessage('Please select an account type.')
    .isIn(['checking', 'savings', 'business'])
    .withMessage('Invalid account type selection.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  })
];

// POST /register
router.post('/register', registerValidation, (req, res) => {
  const errors = validationResult(req);
  const values = req.body;

  if (!errors.isEmpty()) {
    return res.render('register', {
      title: 'Register Account - ApexTrust Bank',
      activePage: 'register',
      errors: errors.array(),
      values
    });
  }

  const { fullname, email, accountType, password } = req.body;

  // Check if email already exists
  db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Database query error on registration check:', err.message);
      return res.render('register', {
        title: 'Register Account - ApexTrust Bank',
        activePage: 'register',
        errors: [{ msg: 'Database connection issue. Please try again.' }],
        values
      });
    }

    if (row) {
      return res.render('register', {
        title: 'Register Account - ApexTrust Bank',
        activePage: 'register',
        errors: [{ msg: 'An account with this email address already exists.' }],
        values
      });
    }

    // Hash password and store user
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Bcrypt error:', hashErr);
        return res.render('register', {
          title: 'Register Account - ApexTrust Bank',
          activePage: 'register',
          errors: [{ msg: 'Error securing credentials. Please try again.' }],
          values
        });
      }

      // Generate a random initial balance for demonstration ($1,000 to $5,000)
      const initialBalance = (Math.random() * 4000 + 1000).toFixed(2);

      db.run(
        'INSERT INTO users (fullname, email, password, account_type, balance) VALUES (?, ?, ?, ?, ?)',
        [fullname, email, hashedPassword, accountType, initialBalance],
        function (insertErr) {
          if (insertErr) {
            console.error('Database insertion error:', insertErr.message);
            return res.render('register', {
              title: 'Register Account - ApexTrust Bank',
              activePage: 'register',
              errors: [{ msg: 'Error creating account. Please try again.' }],
              values
            });
          }

          console.log(`User registered successfully with ID: ${this.lastID}`);
          res.redirect('/login?success=Account+registered+successfully.+Please+log+in.');
        }
      );
    });
  });
});

// Validation rules for login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
];

const securityLogs = require('../models/securityLogs');
const securityMiddleware = require('../middleware/securityMiddleware');

// POST /login
router.post('/login', securityMiddleware.checkFailedLoginLimit, loginValidation, (req, res) => {
  const errors = validationResult(req);
  const values = req.body;

  if (!errors.isEmpty()) {
    return res.render('login', {
      title: 'Secure Login - ApexTrust Bank',
      activePage: 'login',
      errors: errors.array(),
      success: null,
      error: null,
      values
    });
  }

  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Database query error on login:', err.message);
      return res.render('login', {
        title: 'Secure Login - ApexTrust Bank',
        activePage: 'login',
        errors: [{ msg: 'Database connection issue. Please try again.' }],
        success: null,
        error: null,
        values
      });
    }

    if (!user) {
      securityMiddleware.registerFailedLogin(req.ip, null);
      return res.render('login', {
        title: 'Secure Login - ApexTrust Bank',
        activePage: 'login',
        errors: [{ msg: 'Invalid email or password.' }],
        success: null,
        error: null,
        values
      });
    }

    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr) {
        console.error('Bcrypt comparison error:', bcryptErr);
        return res.render('login', {
          title: 'Secure Login - ApexTrust Bank',
          activePage: 'login',
          errors: [{ msg: 'Error checking password. Please try again.' }],
          success: null,
          error: null,
          values
        });
      }

      if (!isMatch) {
        securityMiddleware.registerFailedLogin(req.ip, user.id);
        return res.render('login', {
          title: 'Secure Login - ApexTrust Bank',
          activePage: 'login',
          errors: [{ msg: 'Invalid email or password.' }],
          success: null,
          error: null,
          values
        });
      }

      // Successful login - Reset failed login attempts
      securityMiddleware.resetFailedLogin(req.ip);

      // Create Session variables
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.loginTime = new Date().toISOString();
      req.session.loginTimeMs = Date.now();
      req.session.lastActive = Date.now();

      // Log successful login session in database
      securityLogs.logLogin(user.id, req.ip, (logErr, logId) => {
        if (logErr) {
          console.error('Error creating security log on login:', logErr.message);
        } else {
          req.session.securityLogId = logId;
        }

        console.log(`User logged in successfully: ${user.email}`);
        res.redirect('/dashboard');
      });
    });
  });
});

// GET /logout
router.get('/logout', (req, res) => {
  const isTimeout = req.query.reason === 'timeout';

  if (req.session && req.session.userId) {
    const logId = req.session.securityLogId;
    const loginTime = req.session.loginTimeMs || Date.now();
    const duration = Math.floor((Date.now() - loginTime) / 1000); // duration in seconds

    // Log logout/expiration event in database
    if (logId) {
      if (isTimeout) {
        securityLogs.logInactivityExpiration(logId, duration, (err) => {
          if (err) console.error('Error logging inactivity expiration:', err.message);
        });
      } else {
        securityLogs.logLogout(logId, duration, (err) => {
          if (err) console.error('Error logging logout session:', err.message);
        });
      }
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session during logout:', err);
      }
      res.clearCookie('connect.sid');
      if (isTimeout) {
        res.redirect('/login?error=Session+expired+due+to+inactivity.+For+your+security,+please+log+in+again.');
      } else {
        res.redirect('/login?success=You+have+been+logged+out+successfully.');
      }
    });
  } else {
    if (isTimeout) {
      res.redirect('/login?error=Session+expired+due+to+inactivity.+For+your+security,+please+log+in+again.');
    } else {
      res.redirect('/login');
    }
  }
});

module.exports = router;
