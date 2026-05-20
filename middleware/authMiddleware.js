const db = require('../models/db');

module.exports = (req, res, next) => {
  // 1. Detect if the session expired
  // If the 'connect.sid' session cookie is present, but there is no active session data (userId),
  // it indicates the session has expired due to inactivity.
  if (req.cookies && req.cookies['connect.sid'] && (!req.session || !req.session.userId)) {
    res.clearCookie('connect.sid');
    return res.redirect('/login?error=Session+Expired:+Your+session+has+expired+due+to+inactivity.+Please+log+in+again.');
  }

  // 2. Verify active session exists
  if (!req.session || !req.session.userId) {
    return res.redirect('/login?error=Access+Denied:+Please+log+in+to+access+the+dashboard.');
  }

  // 3. Fetch user details from database using the session's userId
  db.get('SELECT id, fullname, email, account_type, balance FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err) {
      console.error('Database error in authMiddleware:', err.message);
      return res.redirect('/login?error=Database+error.+Please+try+again.');
    }

    if (!user) {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login?error=Access+Denied:+Session+invalid+or+user+not+found.');
      });
      return;
    }

    // Bind user and session statistics to res.locals for EJS view templates
    res.locals.user = user;
    res.locals.sessionInfo = {
      loginTime: req.session.loginTime,
      userId: req.session.userId,
      userEmail: req.session.userEmail
    };
    next();
  });
};
