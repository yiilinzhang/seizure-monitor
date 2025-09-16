const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = (db) => {
  const router = express.Router();

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

  return router;
};