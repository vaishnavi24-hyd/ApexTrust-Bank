const db = require('./db');

/**
 * Logs a new user login session.
 */
function logLogin(userId, ip, callback) {
  db.run(
    "INSERT INTO security_logs (user_id, login_time, ip_address, session_status, description) VALUES (?, datetime('now', 'localtime'), ?, 'active', 'User successfully logged in')",
    [userId, ip],
    function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, this.lastID);
    }
  );
}

/**
 * Logs a user logout session.
 */
function logLogout(logId, duration, callback) {
  db.run(
    "UPDATE security_logs SET logout_time = datetime('now', 'localtime'), session_status = 'logged_out', session_duration = ? WHERE id = ?",
    [duration, logId],
    function (err) {
      if (err) {
        if (callback) return callback(err);
        return;
      }
      if (callback) callback(null);
    }
  );
}

/**
 * Logs a session expiration due to inactivity.
 */
function logInactivityExpiration(logId, duration, callback) {
  db.run(
    "UPDATE security_logs SET logout_time = datetime('now', 'localtime'), session_status = 'expired', session_duration = ? WHERE id = ?",
    [duration, logId],
    function (err) {
      if (err) {
        if (callback) return callback(err);
        return;
      }
      if (callback) callback(null);
    }
  );
}

/**
 * Logs a suspicious security event.
 */
function logSuspiciousActivity(userId, type, ip, description, callback) {
  db.run(
    "INSERT INTO security_logs (user_id, login_time, ip_address, session_status, description) VALUES (?, datetime('now', 'localtime'), ?, ?, ?)",
    [userId, ip, type, description],
    function (err) {
      if (err) {
        if (callback) return callback(err);
        return;
      }
      if (callback) callback(null, this.lastID);
    }
  );
}

/**
 * Retrieves the last 5 security log events for a specific user.
 */
function getLogsByUserId(userId, callback) {
  db.all(
    'SELECT * FROM security_logs WHERE user_id = ? ORDER BY id DESC LIMIT 5',
    [userId],
    (err, rows) => {
      if (err) {
        return callback(err);
      }
      callback(null, rows);
    }
  );
}

module.exports = {
  logLogin,
  logLogout,
  logInactivityExpiration,
  logSuspiciousActivity,
  getLogsByUserId
};
