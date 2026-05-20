const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const transactionModel = require('../models/transactionModel');
const authMiddleware = require('../middleware/authMiddleware');

// Secure all transaction routes with the authMiddleware
router.use(authMiddleware);

// POST /deposit
router.post(
  '/deposit',
  [
    body('amount')
      .trim()
      .notEmpty()
      .withMessage('Amount is required.')
      .isFloat({ gt: 0 })
      .withMessage('Deposit amount must be a positive number.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = encodeURIComponent(errors.array()[0].msg);
      return res.redirect(`/dashboard?error=${errorMsg}`);
    }

    const amount = parseFloat(req.body.amount);
    const userId = req.session.userId;

    // Update user balance in database
    db.run(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, userId],
      function (err) {
        if (err) {
          console.error('Error updating balance on deposit:', err.message);
          return res.redirect('/dashboard?error=Internal+server+error.+Please+try+again.');
        }

        // Write transaction history log
        transactionModel.createTransaction(
          userId,
          'deposit',
          amount,
          'Cash deposit',
          (txErr) => {
            if (txErr) {
              console.error('Error creating transaction record for deposit:', txErr.message);
            }
            res.redirect(
              `/dashboard?success=Successfully+deposited+$${amount.toFixed(2)}`
            );
          }
        );
      }
    );
  }
);

// POST /withdraw
router.post(
  '/withdraw',
  [
    body('amount')
      .trim()
      .notEmpty()
      .withMessage('Amount is required.')
      .isFloat({ gt: 0 })
      .withMessage('Withdrawal amount must be a positive number.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = encodeURIComponent(errors.array()[0].msg);
      return res.redirect(`/dashboard?error=${errorMsg}`);
    }

    const amount = parseFloat(req.body.amount);
    const userId = req.session.userId;

    // Fetch user details to verify funds
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        console.error('Error querying user balance on withdrawal:', err ? err.message : 'User not found');
        return res.redirect('/dashboard?error=Internal+server+error.+Please+try+again.');
      }

      if (user.balance < amount) {
        return res.redirect('/dashboard?error=Insufficient+funds+for+this+withdrawal.');
      }

      // Update user balance in database
      db.run(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [amount, userId],
        function (updateErr) {
          if (updateErr) {
            console.error('Error updating balance on withdrawal:', updateErr.message);
            return res.redirect('/dashboard?error=Internal+server+error.+Please+try+again.');
          }

          // Write transaction history log
          transactionModel.createTransaction(
            userId,
            'withdraw',
            amount,
            'Cash withdrawal',
            (txErr) => {
              if (txErr) {
                console.error('Error creating transaction record for withdrawal:', txErr.message);
              }
              res.redirect(
                `/dashboard?success=Successfully+withdrew+$${amount.toFixed(2)}`
              );
            }
          );
        }
      );
    });
  }
);

// POST /transfer
router.post(
  '/transfer',
  [
    body('recipientEmail')
      .trim()
      .notEmpty()
      .withMessage('Recipient email is required.')
      .isEmail()
      .withMessage('Please enter a valid recipient email address.')
      .normalizeEmail(),
    body('amount')
      .trim()
      .notEmpty()
      .withMessage('Amount is required.')
      .isFloat({ gt: 0 })
      .withMessage('Transfer amount must be a positive number.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = encodeURIComponent(errors.array()[0].msg);
      return res.redirect(`/dashboard?error=${errorMsg}`);
    }

    const recipientEmail = req.body.recipientEmail;
    const amount = parseFloat(req.body.amount);
    const senderId = req.session.userId;
    const senderEmail = req.session.userEmail;

    // Prevent transferring money to self
    if (recipientEmail === senderEmail) {
      return res.redirect('/dashboard?error=Cannot+transfer+funds+to+your+own+email+address.');
    }

    // Verify sender has sufficient funds
    db.get('SELECT balance FROM users WHERE id = ?', [senderId], (err, sender) => {
      if (err || !sender) {
        console.error('Error querying sender balance on transfer:', err ? err.message : 'Sender not found');
        return res.redirect('/dashboard?error=Internal+server+error.+Please+try+again.');
      }

      if (sender.balance < amount) {
        return res.redirect('/dashboard?error=Insufficient+funds+for+this+transfer.');
      }

      // Execute double-entry transfer transaction
      transactionModel.executeTransfer(
        senderId,
        senderEmail,
        recipientEmail,
        amount,
        (transferErr) => {
          if (transferErr) {
            console.error('Error executing transfer:', transferErr.message);
            const errorMsg = encodeURIComponent(transferErr.message);
            return res.redirect(`/dashboard?error=${errorMsg}`);
          }

          res.redirect(
            `/dashboard?success=Successfully+transferred+$${amount.toFixed(2)}+to+${recipientEmail}.`
          );
        }
      );
    });
  }
);

module.exports = router;
