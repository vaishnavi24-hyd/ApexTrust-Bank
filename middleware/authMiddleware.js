const db = require('../models/db');

module.exports = (req, res, next) => {
  const email = req.query.email;

  if (!email) {
    return res.redirect('/login?error=Access+Denied:+Please+log+in+to+access+the+dashboard.');
  }

  db.get('SELECT id, fullname, email, account_type, balance FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Database error in authMiddleware:', err.message);
      return res.redirect('/login?error=Database+error.+Please+try+again.');
    }

    if (!user) {
      return res.redirect('/login?error=Access+Denied:+Session+invalid+or+user+not+found.');
    }

    // Attach user information to response locals for EJS accessibility
    res.locals.user = user;
    next();
  });
};
