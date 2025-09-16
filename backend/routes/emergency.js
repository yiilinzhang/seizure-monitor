const express = require('express');
const twilio = require('twilio');

module.exports = (db) => {
  const router = express.Router();

  // Initialize Twilio client (optional - works without it)
  let twilioClient = null;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Helper function to send SMS
  const sendSMS = async (phoneNumber, userName, eventData) => {
    if (!twilioClient) {
      console.log('Twilio not configured - SMS simulated');
      return { success: false, error: 'Twilio not configured' };
    }

    const { location, delta_pct, timestamp } = eventData;
    const eventTime = new Date(timestamp * 1000).toLocaleString();
    const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

    const message = `EMERGENCY ALERT: ${userName} is experiencing a seizure.
Time: ${eventTime}
Location: ${mapsUrl}
Sensor spike: ${delta_pct}% above threshold
Emergency services have been notified.`;

    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      console.log(`SMS sent successfully to ${phoneNumber}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Helper function to make voice call
  const makeVoiceCall = async (phoneNumber, userName) => {
    if (!twilioClient) {
      console.log('Twilio not configured - Call simulated');
      return { success: false, error: 'Twilio not configured' };
    }

    // For trial accounts, we'll use TwiML directly instead of URL callback
    try {
      const call = await twilioClient.calls.create({
        twiml: `<Response><Say voice="alice" loop="2">${userName} is experiencing a seizure now. You have been designated an emergency contact. Please check your SMS for their exact location. Emergency services have been called.</Say><Pause length="2"/><Say voice="alice">Thank you.</Say></Response>`,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      console.log(`Voice call initiated to ${phoneNumber}: ${call.sid}`);
      return { success: true, sid: call.sid };
    } catch (error) {
      console.error(`Failed to call ${phoneNumber}:`, error);
      return { success: false, error: error.message };
    }
  };

  // TwiML endpoint for voice calls
  router.get('/twiml/:userName', (req, res) => {
    const userName = decodeURIComponent(req.params.userName);
    const message = `${userName} is experiencing a seizure now. You have been designated an emergency contact. Please check the location on the phone. Emergency services have been called.`;

    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" loop="2">${message}</Say>
    <Pause length="2"/>
    <Say voice="alice">Thank you.</Say>
</Response>`);
  });

  // Main emergency trigger endpoint
  router.post('/trigger', async (req, res) => {
    const { userId, eventId, location, delta_pct, timestamp, sendSMS: enableSMS = true, sendCall: enableCall = true } = req.body;

    // Validation
    if (!userId || !eventId || !location || !delta_pct || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'eventId', 'location', 'delta_pct', 'timestamp']
      });
    }

    if (!location.lat || !location.lng) {
      return res.status(400).json({
        error: 'Invalid location format',
        expected: { lat: 'number', lng: 'number' }
      });
    }

    try {
      // Get user information
      db.get(
        'SELECT name, email FROM users WHERE id = ?',
        [userId],
        async (err, user) => {
          if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          // Log the emergency event
          db.run(
            'INSERT INTO emergency_events (id, user_id, location_lat, location_lng, delta_pct, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [eventId, userId, location.lat, location.lng, delta_pct, timestamp],
            (err) => {
              if (err) {
                console.error('Error logging emergency event:', err);
                // Continue even if logging fails
              }
            }
          );

          // Get all emergency contacts for this user
          db.all(
            'SELECT name, phone_number FROM emergency_contacts WHERE user_id = ?',
            [userId],
            async (err, contacts) => {
              if (err) {
                console.error('Error fetching contacts:', err);
                return res.status(500).json({ error: 'Failed to fetch emergency contacts' });
              }

              if (!contacts || contacts.length === 0) {
                return res.status(404).json({
                  error: 'No emergency contacts found for this user',
                  suggestion: 'Please add emergency contacts first'
                });
              }

              // Process notifications for all contacts
              const notificationResults = [];
              const eventData = { location, delta_pct, timestamp };

              for (const contact of contacts) {
                console.log(`Processing emergency notifications for ${contact.name} (${contact.phone_number})`);

                // Send SMS if enabled
                let smsResult;
                if (enableSMS) {
                  smsResult = await sendSMS(contact.phone_number, user.name, eventData);
                } else {
                  smsResult = { success: false, error: 'SMS disabled by user settings' };
                }

                // Make voice call if enabled
                let callResult;
                if (enableCall) {
                  callResult = await makeVoiceCall(contact.phone_number, user.name);
                } else {
                  callResult = { success: false, error: 'Voice call disabled by user settings' };
                }

                notificationResults.push({
                  contact: contact.name,
                  phone: contact.phone_number,
                  sms: smsResult,
                  call: callResult,
                  settings: { smsEnabled: enableSMS, callEnabled: enableCall }
                });
              }

              // Check if any notifications were successful
              const anySuccess = notificationResults.some(
                result => result.sms.success || result.call.success
              );

              if (!anySuccess) {
                return res.status(500).json({
                  error: 'Failed to send any emergency notifications',
                  details: notificationResults
                });
              }

              // Return success response
              res.json({
                message: 'Emergency notifications triggered successfully',
                user: user.name,
                eventId,
                timestamp: new Date(timestamp * 1000).toISOString(),
                location,
                delta_pct,
                contactsNotified: contacts.length,
                notifications: notificationResults
              });
            }
          );
        }
      );
    } catch (error) {
      console.error('Emergency trigger error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get emergency event history for a user (requires authentication)
  router.get('/events/:userId', (req, res) => {
    const userId = req.params.userId;

    db.all(
      'SELECT * FROM emergency_events WHERE user_id = ? ORDER BY triggered_at DESC LIMIT 50',
      [userId],
      (err, events) => {
        if (err) {
          console.error('Error fetching events:', err);
          return res.status(500).json({ error: 'Failed to fetch emergency events' });
        }

        res.json({
          events: events || [],
          count: events ? events.length : 0
        });
      }
    );
  });

  return router;
};