const db = require('./db');

/**
 * Inserts a single transaction record.
 */
function createTransaction(userId, type, amount, description, callback) {
  db.run(
    'INSERT INTO transactions (user_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
    [userId, type, amount, description],
    function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, this.lastID);
    }
  );
}

/**
 * Retrieves the last 10 transactions for a user, ordered latest first.
 */
function getTransactionsByUserId(userId, callback) {
  db.all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC, id DESC LIMIT 10',
    [userId],
    (err, rows) => {
      if (err) {
        return callback(err);
      }
      callback(null, rows);
    }
  );
}

/**
 * Executes a double-entry funds transfer within an SQLite transaction context.
 */
function executeTransfer(senderId, senderEmail, recipientEmail, amount, callback) {
  db.serialize(() => {
    // 1. Verify recipient email address exists
    db.get('SELECT id, balance FROM users WHERE email = ?', [recipientEmail], (err, recipient) => {
      if (err) {
        return callback(err);
      }
      if (!recipient) {
        return callback(new Error('Recipient account not found.'));
      }

      // 2. Start database transaction
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          return callback(beginErr);
        }

        // 3. Deduct amount from sender
        db.run(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [amount, senderId],
          function (deductErr) {
            if (deductErr) {
              db.run('ROLLBACK');
              return callback(deductErr);
            }

            // 4. Add amount to recipient
            db.run(
              'UPDATE users SET balance = balance + ? WHERE id = ?',
              [amount, recipient.id],
              function (creditErr) {
                if (creditErr) {
                  db.run('ROLLBACK');
                  return callback(creditErr);
                }

                // 5. Log transfer_out for sender
                db.run(
                  'INSERT INTO transactions (user_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
                  [senderId, 'transfer_out', amount, `Transfer to ${recipientEmail}`],
                  function (txSenderErr) {
                    if (txSenderErr) {
                      db.run('ROLLBACK');
                      return callback(txSenderErr);
                    }

                    // 6. Log transfer_in for recipient
                    db.run(
                      'INSERT INTO transactions (user_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
                      [recipient.id, 'transfer_in', amount, `Transfer from ${senderEmail}`],
                      function (txRecipientErr) {
                        if (txRecipientErr) {
                          db.run('ROLLBACK');
                          return callback(txRecipientErr);
                        }

                        // 7. Commit changes
                        db.run('COMMIT', (commitErr) => {
                          if (commitErr) {
                            db.run('ROLLBACK');
                            return callback(commitErr);
                          }
                          callback(null);
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}

module.exports = {
  createTransaction,
  getTransactionsByUserId,
  executeTransfer
};
