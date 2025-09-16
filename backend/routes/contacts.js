const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Get all emergency contacts for the authenticated user
  router.get('/', (req, res) => {
    const userId = req.user.userId;

    db.all(
      'SELECT id, name, phone_number, created_at FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, contacts) => {
        if (err) {
          console.error('Error fetching contacts:', err);
          return res.status(500).json({ error: 'Failed to fetch contacts' });
        }

        res.json({
          contacts: contacts || [],
          count: contacts ? contacts.length : 0
        });
      }
    );
  });

  // Add a new emergency contact
  router.post('/', (req, res) => {
    const userId = req.user.userId;
    const { name, phone_number } = req.body;

    // Validation
    if (!name || !phone_number) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    // Basic phone number validation (you can make this more robust)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,12}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Check if contact already exists
    db.get(
      'SELECT id FROM emergency_contacts WHERE user_id = ? AND phone_number = ?',
      [userId, phone_number],
      (err, existing) => {
        if (err) {
          console.error('Error checking existing contact:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (existing) {
          return res.status(409).json({ error: 'Contact with this phone number already exists' });
        }

        // Insert new contact
        db.run(
          'INSERT INTO emergency_contacts (user_id, name, phone_number) VALUES (?, ?, ?)',
          [userId, name, phone_number],
          function(err) {
            if (err) {
              console.error('Error adding contact:', err);
              return res.status(500).json({ error: 'Failed to add contact' });
            }

            // Return the newly created contact
            db.get(
              'SELECT id, name, phone_number, created_at FROM emergency_contacts WHERE id = ?',
              [this.lastID],
              (err, contact) => {
                if (err) {
                  console.error('Error fetching new contact:', err);
                  return res.status(500).json({ error: 'Contact created but failed to fetch details' });
                }

                res.status(201).json({
                  message: 'Contact added successfully',
                  contact
                });
              }
            );
          }
        );
      }
    );
  });

  // Update an emergency contact
  router.put('/:id', (req, res) => {
    const userId = req.user.userId;
    const contactId = req.params.id;
    const { name, phone_number } = req.body;

    // Validation
    if (!name && !phone_number) {
      return res.status(400).json({ error: 'At least one field (name or phone_number) is required' });
    }

    // Check if contact exists and belongs to user
    db.get(
      'SELECT id FROM emergency_contacts WHERE id = ? AND user_id = ?',
      [contactId, userId],
      (err, contact) => {
        if (err) {
          console.error('Error checking contact:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!contact) {
          return res.status(404).json({ error: 'Contact not found' });
        }

        // Build update query
        const updates = [];
        const params = [];

        if (name) {
          updates.push('name = ?');
          params.push(name);
        }

        if (phone_number) {
          const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,12}$/;
          if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
          }
          updates.push('phone_number = ?');
          params.push(phone_number);
        }

        params.push(contactId);
        params.push(userId);

        // Update contact
        db.run(
          `UPDATE emergency_contacts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          params,
          function(err) {
            if (err) {
              console.error('Error updating contact:', err);
              return res.status(500).json({ error: 'Failed to update contact' });
            }

            // Return updated contact
            db.get(
              'SELECT id, name, phone_number, created_at FROM emergency_contacts WHERE id = ?',
              [contactId],
              (err, contact) => {
                if (err) {
                  console.error('Error fetching updated contact:', err);
                  return res.status(500).json({ error: 'Contact updated but failed to fetch details' });
                }

                res.json({
                  message: 'Contact updated successfully',
                  contact
                });
              }
            );
          }
        );
      }
    );
  });

  // Delete an emergency contact
  router.delete('/:id', (req, res) => {
    const userId = req.user.userId;
    const contactId = req.params.id;

    // Check if contact exists and belongs to user
    db.get(
      'SELECT id FROM emergency_contacts WHERE id = ? AND user_id = ?',
      [contactId, userId],
      (err, contact) => {
        if (err) {
          console.error('Error checking contact:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!contact) {
          return res.status(404).json({ error: 'Contact not found' });
        }

        // Delete contact
        db.run(
          'DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?',
          [contactId, userId],
          function(err) {
            if (err) {
              console.error('Error deleting contact:', err);
              return res.status(500).json({ error: 'Failed to delete contact' });
            }

            res.json({
              message: 'Contact deleted successfully',
              id: contactId
            });
          }
        );
      }
    );
  });

  return router;
};