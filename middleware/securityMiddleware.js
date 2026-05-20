const securityLogs = require('../models/securityLogs');

// In-memory failed login attempts tracker by IP
const failedLoginAttempts = {};
const LOCKOUT_THRESHOLD = 3;

/**
 * Middleware to check user inactivity.
 * Destroys the session and logs the expiration if the user has been inactive for >= 2 minutes.
 */
function checkInactivity(req, res, next) {
  if (req.session && req.session.userId) {
    const now = Date.now();
    const lastActive = req.session.lastActive || now;
    const inactivityTimeout = 2 * 60 * 1000; // 2 minutes inactivity timeout

    if (now - lastActive > inactivityTimeout) {
      console.log(`Session inactivity timeout triggered for user ${req.session.userEmail}`);
      
      const logId = req.session.securityLogId;
      const loginTime = req.session.loginTime || now;
      const duration = Math.floor((now - loginTime) / 1000); // duration in seconds
      const ip = req.ip;

      // Log the expiration in database
      if (logId) {
        securityLogs.logInactivityExpiration(logId, duration, (err) => {
          if (err) console.error('Error logging inactivity expiration:', err.message);
        });
      }

      // Track expired session access attempts in security logs
      securityLogs.logSuspiciousActivity(
        req.session.userId,
        'suspicious_expired_access',
        ip,
        `Attempted access with expired session. Inactive for ${Math.floor((now - lastActive) / 1000)} seconds.`,
        (err) => {
          if (err) console.error('Error logging expired session access:', err.message);
        }
      );

      // Destroy session and clear client-side cookies
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session on timeout:', err);
        res.clearCookie('connect.sid');
        return res.redirect('/login?error=Session+expired+due+to+inactivity.');
      });
    } else {
      // Update last active timestamp
      req.session.lastActive = now;
      next();
    }
  } else {
    next();
  }
}

/**
 * Middleware to check if an IP is locked out due to multiple failed login attempts.
 */
function checkFailedLoginLimit(req, res, next) {
  const ip = req.ip;
  const attempts = failedLoginAttempts[ip] || 0;

  if (attempts >= LOCKOUT_THRESHOLD) {
    // Log suspicious activity if not already logged for this block
    if (attempts === LOCKOUT_THRESHOLD) {
      securityLogs.logSuspiciousActivity(
        null,
        'suspicious_failed_logins',
        ip,
        `Lockout threshold reached. IP address failed login 3 consecutive times.`,
        (err) => {
          if (err) console.error('Error logging suspicious failed logins:', err.message);
        }
      );
      // Increment so we don't spam duplicate logs on every subsequent locked request
      failedLoginAttempts[ip] = LOCKOUT_THRESHOLD + 1;
    }

    return res.redirect(
      '/login?error=Multiple+failed+login+attempts.+Account+temporarily+restricted+for+security.'
    );
  }
  next();
}

/**
 * Register a failed login attempt for an IP.
 */
function registerFailedLogin(ip, userId = null) {
  const attempts = failedLoginAttempts[ip] || 0;
  failedLoginAttempts[ip] = attempts + 1;

  if (failedLoginAttempts[ip] >= LOCKOUT_THRESHOLD) {
    securityLogs.logSuspiciousActivity(
      userId,
      'suspicious_failed_logins',
      ip,
      `Suspicious login block: IP failed authentication multiple times.`,
      (err) => {
        if (err) console.error('Error logging suspicious failed logins:', err.message);
      }
    );
  }
}

/**
 * Reset failed login attempts for an IP on successful authentication.
 */
function resetFailedLogin(ip) {
  delete failedLoginAttempts[ip];
}

/**
 * Middleware to check for rapid transaction attempts (rate limit to 3 seconds).
 */
function checkRapidTransactions(req, res, next) {
  if (req.session && req.session.userId) {
    const now = Date.now();
    const lastTx = req.session.lastTransactionTime || 0;
    const limitMs = 3000; // 3 seconds rate limit

    if (now - lastTx < limitMs) {
      console.log(`Rapid transaction block triggered for user ${req.session.userEmail}`);
      
      // Log suspicious activity
      securityLogs.logSuspiciousActivity(
        req.session.userId,
        'suspicious_rapid_transactions',
        req.ip,
        `Blocked transaction: submitted another request after only ${((now - lastTx) / 1000).toFixed(2)} seconds.`,
        (err) => {
          if (err) console.error('Error logging suspicious rapid transaction:', err.message);
        }
      );

      return res.redirect(
        '/dashboard?error=Suspiciously+rapid+transaction+attempts+detected.+Transaction+blocked+for+security.'
      );
    } else {
      req.session.lastTransactionTime = now;
      next();
    }
  } else {
    next();
  }
}

module.exports = {
  checkInactivity,
  checkFailedLoginLimit,
  registerFailedLogin,
  resetFailedLogin,
  checkRapidTransactions
};
