// backend/routes/registrationRoutes.js
import express from 'express';
import sgMail from '@sendgrid/mail';
import Registration from '../models/Registration.js';
import { Workshop } from '../models/Workshop.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Stripe from 'stripe';
import { getOAuthClient, addEventsToGoogleCalendar } from '../services/googleCalendarService.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is missing in .env');
}


// ──────────────────────────────────────────────────────────────
// GOOGLE CALENDAR OAUTH FLOW
// ──────────────────────────────────────────────────────────────

// 1. User clicks "Connect Google Calendar" → redirect to Google
router.get('/calendar/connect', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send('Missing userId');

  const oAuth2Client = getOAuthClient();

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: userId, // So we know which user is connecting
  });

  res.redirect(authUrl);
});

// 2. Google redirects back here after user approves
router.get('/calendar/oauth2callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send('Missing code or userId');
  }

  try {
    const oAuth2Client = getOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    user.googleCalendar = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || user.googleCalendar?.refreshToken,
      scope: tokens.scope ? tokens.scope.split(' ') : [],
      tokenType: tokens.token_type || 'Bearer',
      expiryDate: tokens.expiry_date || null,
      connected: true,
    };

    await user.save();

    res.send(`
      <script>
        alert("Google Calendar connected successfully!");
        window.close();
      </script>
    `);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(500).send(`Connection failed: ${err.message}`);
  }
});

// Optional: manual add endpoint (not used anymore)
router.post('/google-calendar/add-events', async (req, res) => {
  res.status(410).json({ message: 'This endpoint is no longer used' });
});

// ──────────────────────────────────────────────────────────────
// HELPER: Generate fallback .ics link
// ──────────────────────────────────────────────────────────────
function generateGoogleCalendarUrl(event) {
  if (!event) return null;

  const title = encodeURIComponent(event.title || event.name || 'GUC Event');
  const location = encodeURIComponent(event.location || '');
  const description = encodeURIComponent(event.description || '');

  const startDate = event.startDate || event.startDateTime || event.date;
  const endDate = event.endDate || event.endDateTime || new Date(new Date(startDate).getTime() + 60*60*1000);

  if (!startDate) return null;

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}&sf=true&output=xml`;
}

// ──────────────────────────────────────────────────────────────
// BATCH REGISTRATION — FIXED: Deduct wallet AFTER success
// ──────────────────────────────────────────────────────────────
router.post('/batch', async (req, res) => {
  try {
    console.log('📥 Batch registration request received');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const { registrations, currentUser: userId } = req.body;

    if (!registrations?.length || !userId) {
      console.log('Missing registrations or userId');
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const paymentMethod = registrations[0]?.paymentMethod || 'none';

    const results = [];
    const errors = [];
    const eventsForCalendar = [];
    let successfulAmount = 0;

    const now = new Date();

    for (const reg of registrations) {
      try {
        console.log(`Processing event ${reg.eventId} (${reg.eventType})`);

        const { eventId, eventType, name, email, userId: regUserId, userType, amountPaid } = reg;

        let event = null;
        let modelName = 'Event';

        if (eventType === 'workshop') {
          event = await Workshop.findById(eventId);
          if (event) modelName = 'Workshop';
          else event = await Event.findById(eventId);
        } else if (eventType === 'trip') {
          event = await Trip.findById(eventId);
          if (event) modelName = 'Trip';
          else event = await Event.findById(eventId);
        } else {
          event = await Event.findById(eventId);
        }

        if (!event) {
          throw new Error('Event not found');
        }

        console.log(`Event found: ${event.title || event.name}`);

        // Validation checks
        if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
          throw new Error('Registration deadline has passed');
        }

        const eventStart = new Date(event.startDate || event.startDateTime || event.date);
        if (eventStart < now) {
          throw new Error('Event has already started');
        }

        // const existing = await Registration.findOne({ eventId, userId: regUserId, status: 'registered' });
        // if (existing) {
        //   throw new Error('Already registered');
        // }
                // === PREVENT DUPLICATES AND CLEAN CANCELLED ===
        const existingAnyStatus = await Registration.findOne({
          eventId,
          userId: regUserId,
          userType
        });

        if (existingAnyStatus) {
          if (existingAnyStatus.status === 'registered') {
            throw new Error('Already registered');
          } else if (existingAnyStatus.status === 'cancelled') {
            await Registration.deleteOne({ _id: existingAnyStatus._id });
            console.log('Cleaned up old cancelled registration');
          }
        }

        if (event.allowedUserTypes && event.allowedUserTypes.length > 0) {
          const allowed = event.allowedUserTypes.map(t => String(t).toLowerCase().trim());
          const role = String(userType).toLowerCase().trim();
          if (!allowed.includes(role)) {
            throw new Error(`Restricted to: ${event.allowedUserTypes.join(', ')}`);
          }
        }

        // Create registration
        const registration = new Registration({
          eventId,
          eventType,
          onModel: modelName,
          name,
          email,
          userId: regUserId,
          userType,
          amountPaid: amountPaid || 0,
          paymentMethod,
          status: 'registered',
          paymentStatus: 'completed'
        });

        await registration.save();
        console.log(`Registration successful for event ${eventId}`);

        results.push({
          eventId,
          status: 'success',
          registrationId: registration._id,
          googleCalendarUrl: generateGoogleCalendarUrl(event)
        });

        successfulAmount += (amountPaid || 0);

        eventsForCalendar.push({
          title: event.title || event.name || 'GUC Event',
          description: event.description || 'Registered via GUC Events System',
          location: event.location || 'German University in Cairo',
          startDate: event.startDate || event.startDateTime || event.date,
          endDate: event.endDate || event.endDateTime || new Date(eventStart.getTime() + 3600000)
        });

      } catch (err) {
        const msg = err.message || 'Unknown error';
        console.log(`FAILED for event ${reg.eventId}: ${msg}`);
        errors.push({ eventId: reg.eventId, error: msg });
      }
    }

    // Deduct wallet ONLY for successful amount
    let updatedWalletBalance = null;
    if (paymentMethod === 'wallet' && successfulAmount > 0) {
      const balance = Number(user.wallet || 0);
      if (balance < successfulAmount) {
        console.log('INSUFFICIENT BALANCE FOR SUCCESSFUL EVENTS - REJECTING');
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient wallet balance for successful registrations',
          available: balance,
          required: successfulAmount
        });
      }
      user.wallet = Number((balance - successfulAmount).toFixed(2));
      await user.save();
      updatedWalletBalance = user.wallet;
      console.log(`Wallet deducted for successful amount. New balance: ${updatedWalletBalance}`);
    }

    // Google Calendar addition
    let calendarResults = null;
    let calendarError = null;
    if (eventsForCalendar.length > 0 && user.googleCalendar?.connected) {
      try {
        calendarResults = await addEventsToGoogleCalendar(user.googleCalendar, eventsForCalendar);
        console.log('Google Calendar addition successful');
      } catch (err) {
        calendarError = err.message;
        console.log('Google Calendar failed:', calendarError);
      }
    }

    const responseData = {
      success: results.length > 0,
      message: `Successfully registered for ${results.length} event(s)`,
      registrations: results,
      totalAmount: successfulAmount,
      paymentMethod
    };

    if (updatedWalletBalance !== null) {
      responseData.user = {
        _id: user._id,
        wallet: updatedWalletBalance,
        googleCalendar: { connected: user.googleCalendar?.connected || false }
      };
    }

    if (errors.length > 0) responseData.errors = errors;
    if (calendarResults) responseData.calendarResults = calendarResults;
    if (calendarError) responseData.calendarError = calendarError;

    res.status(results.length > 0 ? 201 : 400).json(responseData);

  } catch (error) {
    console.error('Batch registration error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Register for an event
router.post('/', async (req, res) => {
  try {
    const { eventId, eventType, name, email, userId, userType, paymentMethod, stripePaymentIntentId } = req.body;

    // Validate required fields
    if (!eventId || !eventType || !name || !email || !userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: eventId, eventType, name, email, userId, userType'
      });
    }

    // Fetch event to get the price and determine model name
    let event = null;
    let eventPrice = 0;
    let modelName = 'Event'; // Default to Event
    
    if (eventType === 'workshop') {
      event = await Workshop.findById(eventId);
      if (event) {
        modelName = 'Workshop'; // Set to Workshop if found
      } else {
        event = await Event.findById(eventId);
      }
      if (!event) {
        return res.status(404).json({ success: false, message: 'Workshop not found' });
      }
      eventPrice = event.price || event.fee || 0;
      
    } else if (eventType === 'trip') {
      event = await Trip.findById(eventId);
      if (event) {
        modelName = 'Trip'; // Set to Trip if found
      } else {
        event = await Event.findById(eventId);
      }
      if (!event) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }
      eventPrice = event.price || event.fee || 0;
      
    } else if (eventType === 'conference') {
      event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Conference not found' });
      }
      eventPrice = event.price || event.fee || 0;
      
    } else if (eventType === 'bazaar') {
      event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Bazaar not found' });
      }
      eventPrice = event.price || event.fee || 0;
      
    } else if (eventType === 'gym') {
      event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Gym session not found' });
      }
      eventPrice = event.price || event.fee || 0;
      
    } else if (eventType === 'booth') {
      event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Booth not found' });
      }
      eventPrice = event.price || event.fee || 0;
      
    } else {
      return res.status(400).json({ success: false, message: 'Invalid eventType. Must be one of: workshop, trip, conference, bazaar, gym, booth' });
    }

    // Check registration deadline
    const now = new Date();
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (now > deadline) {
        return res.status(400).json({
          success: false,
          message: `Registration deadline has passed. Deadline was ${deadline.toLocaleDateString()}`
        });
      }
    }

    // Check if event has already started
    const eventStartDate = new Date(event.startDate || event.date);
    if (now > eventStartDate) {
      return res.status(400).json({
        success: false,
        message: 'This event has already started. Registration is closed.'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      userId,
      userType,
      status: { $in: ['registered'] }  // Only block if actively registered, not if cancelled
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // If there's a cancelled registration, delete it to avoid conflicts
    await Registration.deleteOne({
      eventId,
      userId,
      userType,
      status: 'cancelled'
    });

    // Create new registration WITH onModel field
    const registration = new Registration({
      eventId,
      eventType,
      onModel: modelName, // ← ADD THIS LINE - Critical for populate to work!
      name,
      email,
      userId,
      userType,
      amountPaid: eventPrice,
      paymentMethod: paymentMethod || 'none',
      stripePaymentIntentId: stripePaymentIntentId || undefined
    });

    // Fetch user for wallet operations and response
    let user = null;

    // If paying with wallet, ensure user has funds and deduct immediately
    if ((paymentMethod || '').toLowerCase() === 'wallet') {
      user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Normalize values to numbers and round to 2 decimals to avoid type/precision issues
      const walletBalance = Number(user.wallet || 0);
      const price = Number(eventPrice || 0);

      // Helpful debug log when balance insufficient
      if (walletBalance < price) {
        console.error('Insufficient wallet balance: ', {
          userId: trimmedId,
          walletStored: user.wallet,
          walletBalance,
          eventId,
          eventPrice: eventPrice,
          price
        });
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance', walletBalance, price });
      }

      // Deduct and store rounded to 2 decimals
      user.wallet = Number((walletBalance - price).toFixed(2));
      await user.save();
    }

    // If paying with Stripe, verify the PaymentIntent succeeded server-side
    if (paymentMethod === 'stripe') {
      if (!stripePaymentIntentId) {
        return res.status(400).json({ success: false, message: 'stripePaymentIntentId is required for stripe payments' });
      }

      try {
        const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        if (!pi || pi.status !== 'succeeded') {
          return res.status(400).json({ success: false, message: 'Payment not completed. PaymentIntent status: ' + (pi?.status || 'unknown') });
        }

        if (pi.amount) {
          registration.amountPaid = (pi.amount || 0) / 100;
        } else {
          registration.amountPaid = eventPrice;
        }
        registration.paymentMethod = 'stripe';
      } catch (err) {
        console.error('Error verifying payment intent:', err);
        return res.status(500).json({ success: false, message: 'Error verifying payment intent', error: err.message });
      }
    }

    await registration.save();

    // Send payment receipt if any amount was paid
    let emailed = false;
    try {
      if ((registration.amountPaid || 0) > 0) {
        emailed = await sendPaymentReceipt(registration);
      }
    } catch (e) {
      console.error('Failed to send payment receipt:', e);
    }

    let userPayload = null;

    if (user) {
      userPayload = {
        id: user._id,
        wallet: user.wallet,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };
    }

    // Generate Google Calendar URL for the event
    const googleCalendarUrl = generateGoogleCalendarUrl(event);

    res.status(201).json({
    success: true,
    message: 'Successfully registered for the event',
    emailed,
    data: registration,
    user: userPayload,
    googleCalendarUrl // Include Google Calendar URL in response
  });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error registering for event',
      error: error.message
    });
  }
});

// **NEW ENDPOINT**: Get registrations by user email
// AUTO-SEND CERTIFICATES when workshop has ended and user has paid
router.get('/user/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    let registrations = await Registration.find({
      email: email.toLowerCase(),
      status: { $ne: 'cancelled' }
    })
      .populate('eventId')
      .sort({ registrationDate: -1 });

    const now = new Date();

    for (const reg of registrations) {
      try {
        const event = reg.eventId;
        if (!event) continue;

        // Must be workshop
        if (reg.eventType !== 'workshop') continue;

        // Must be paid
        if (Number(reg.amountPaid || 0) <= 0) continue;

        // Already sent? skip
        if (reg.certificateSent) continue;

        // Determine event end date
        const endDate = new Date(
          event.endDate ||
          event.endDateTime ||
          event.startDate ||
          event.startDateTime ||
          event.date
        );

        // Must be in the past
        if (isNaN(endDate.getTime())) continue;
        if (endDate > now) continue;

        // 🔥 Send the certificate email ONCE
        const emailed = await sendCertificateEmail(reg);

        if (emailed) {
          reg.certificateSent = true;
          await reg.save();
        }

      } catch (innerErr) {
        console.error("Error auto-sending certificate:", innerErr);
      }
    }

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });

  } catch (error) {
    console.error('Error fetching registrations by email:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

// Get all registrations for a specific event
router.get('/event/:eventId', async (req, res) => {
  try {
    const registrations = await Registration.find({
      eventId: req.params.eventId,
      status: 'registered'
    }).sort({ registrationDate: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

// Get all registrations
router.get('/', async (req, res) => {
  try {
    const registrations = await Registration.find()
      .sort({ registrationDate: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching all registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

// **NEW ENDPOINT**: Cancel registration with POST method
router.post('/:id/cancel', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('eventId');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const event = registration.eventId;
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const now = new Date();
    const eventDate = new Date(event.date || event.startDate);
    const msInDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.ceil((eventDate - now) / msInDay);

    // Only accept cancellation if there are at least 14 days left
    if (daysDiff < 14) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only cancel your registration at least 14 days before the event.'
      });
    }

    let updatedUser = null;

    // Process refund into wallet
    if ((registration.amountPaid || 0) > 0 && !registration.refundedToWallet) {
      const user = await User.findById(registration.userId);

      if (user) {
        user.wallet = (user.wallet || 0) + (registration.amountPaid || 0);
        await user.save();

        updatedUser = {
          _id: user._id,
          wallet: user.wallet,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        };

        registration.refundedToWallet = true;
      }
    }

    registration.status = 'cancelled';
    await registration.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Registration cancelled successfully', 
      data: registration,
      user: updatedUser    // <-- This is the line your frontend NEEDS
    });

  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling registration',
      error: error.message
    });
  }
});

// Cancel a registration (DELETE method - keeping for backwards compatibility)
router.delete('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    let event = null;
if (registration.eventType === 'workshop') {
  event = await Workshop.findById(registration.eventId) || await Event.findById(registration.eventId);
} else if (registration.eventType === 'trip') {
  event = await Trip.findById(registration.eventId) || await Event.findById(registration.eventId);
} else {
  event = await Event.findById(registration.eventId);
}

    const now = new Date();
    const eventDate = new Date(event.date);
    const msInDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.ceil((eventDate - now) / msInDay);

    if (daysDiff < 14) {
      return res.status(400).json({ success: false, message: 'Cancellation can only be accepted if there are at least 2 weeks (14 days) before the event' });
    }

    if ((registration.amountPaid || 0) > 0 && !registration.refundedToWallet) {
      const user = await User.findById(registration.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + (registration.amountPaid || 0);
        await user.save();
        registration.refundedToWallet = true;
      }
    }

    registration.status = 'cancelled';
    await registration.save();

    res.status(200).json({ success: true, message: 'Registration cancelled successfully', data: registration });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling registration',
      error: error.message
    });
  }
});

// Update registration status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['registered', 'cancelled', 'attended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: registered, cancelled, or attended'
      });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (status === 'attended' && registration.eventType === 'workshop') {
      try {
        const emailed = await sendCertificateEmail(registration);
        return res.status(200).json({
          success: true,
          message: 'Registration status updated successfully',
          emailed,
          data: registration
        });
      } catch (emailErr) {
        console.error('Certificate email error:', emailErr);
        return res.status(200).json({
          success: true,
          message: 'Registration status updated successfully (email failed)',
          emailed: false,
          data: registration
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration status updated successfully',
      data: registration
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating registration status',
      error: error.message
    });
  }
});

export default router;