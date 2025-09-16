const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = (db) => {
  const router = express.Router();

  // Authentication middleware
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  };

  // Register new user
  router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      // Check if user already exists
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
          return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomBytes(16).toString('hex');

        // Create user
        db.run(
          'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
          [userId, email, hashedPassword, name],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Generate JWT token
            const token = jwt.sign(
              { userId, email, name },
              process.env.JWT_SECRET,
              { expiresIn: '7d' }
            );

            res.status(201).json({
              message: 'User created successfully',
              token,
              user: { id: userId, email, name }
            });
          }
        );
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login
  router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
          const passwordValid = await bcrypt.compare(password, user.password);

          if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Generate JWT token
          const token = jwt.sign(
            { userId: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.json({
            message: 'Login successful',
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            }
          });
        } catch (error) {
          console.error('Login error:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
  });

  // Update user name
  router.put('/update-name', authenticateToken, (req, res) => {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    db.run(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, userId],
      function(err) {
        if (err) {
          console.error('Error updating name:', err);
          return res.status(500).json({ error: 'Failed to update name' });
        }

        res.json({
          message: 'Name updated successfully',
          name: name
        });
      }
    );
  });

  // Update user password
  router.put('/update-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // First verify the current password
    db.get(
      'SELECT password FROM users WHERE id = ?',
      [userId],
      async (err, user) => {
        if (err || !user) {
          return res.status(500).json({ error: 'Database error' });
        }

        try {
          const isValidPassword = await bcrypt.compare(currentPassword, user.password);
          if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
          }

          // Hash the new password
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          // Update the password
          db.run(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId],
            function(err) {
              if (err) {
                console.error('Error updating password:', err);
                return res.status(500).json({ error: 'Failed to update password' });
              }

              res.json({ message: 'Password updated successfully' });
            }
          );
        } catch (error) {
          console.error('Password update error:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
  });

  return router;
};