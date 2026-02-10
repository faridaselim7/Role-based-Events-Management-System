// backend/services/googleCalendarService.js
import { google } from 'googleapis';

// OAuth2 client factory
export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/registrations/calendar/oauth2callback'
  );
}

// Add multiple events to user's Google Calendar
export async function addEventsToGoogleCalendar(googleCalendar, events = []) {
  // ==================== TEST MODE BYPASS (SAFE VERSION) ====================
// if (process.env.NODE_ENV !== 'production' && googleCalendar?.connected) {
//   console.log("TEST MODE: Skipping real Google Calendar API call (using safe fake success)");

//   return events.map(event => {
//     const startDate = new Date(event.startDate);
//     const endDate = new Date(event.endDate || startDate);

//     // Convert to YYYYMMDDTHHMMSSZ format required by Google links
//     const startISO = startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
//     const endISO = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

//     return {
//       success: true,
//       link:
//         `https://calendar.google.com/calendar/u/0/r/eventedit` +
//         `?text=${encodeURIComponent(event.title || 'GUC Event')}` +
//         `&dates=${startISO}/${endISO}` +
//         `&details=${encodeURIComponent(event.description || '')}` +
//         `&location=${encodeURIComponent(event.location || '')}`,
//     };
//   });
// }

  if (!googleCalendar || !googleCalendar.connected) {
    console.warn('Google Calendar not connected for user');
    return events.map(() => ({ success: false, error: 'Google Calendar not connected' }));
  }

  const oAuth2Client = getOAuthClient();

  // CRITICAL: Properly set credentials including refresh_token
  oAuth2Client.setCredentials({
    access_token: googleCalendar.accessToken,
    refresh_token: googleCalendar.refreshToken,  // This is required for auto-refresh
    expiry_date: googleCalendar.expiryDate || undefined,
    token_type: googleCalendar.tokenType || 'Bearer',
  });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const results = [];

  for (const event of events) {
    try {
      const startDateTime = new Date(event.startDate);
      const endDateTime = new Date(event.endDate || new Date(startDateTime.getTime() + 60 * 60 * 1000)); // default 1 hour

      const calendarEvent = {
        summary: event.title || 'GUC Event',
        description: event.description || 'Registered via GUC Events System',
        location: event.location || 'German University in Cairo',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Africa/Cairo', // Recommended: use local timezone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Africa/Cairo',
        },
        reminders: {
          useDefault: true,
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
      });

      console.log('Event added to Google Calendar:', response.data.htmlLink);
      results.push({ success: true, eventId: response.data.id, link: response.data.htmlLink });

    } catch (err) {
      console.error('Failed to add event to Google Calendar:', err.message || err);

      let errorMessage = 'Unknown error';
      if (err.message.includes('invalid_grant')) {
        errorMessage = 'Invalid or expired refresh token';
      } else if (err.message.includes('insufficient')) {
        errorMessage = 'Insufficient permissions';
      } else {
        errorMessage = err.message || 'Failed to insert event';
      }

      results.push({ success: false, error: errorMessage });
    }
  }

  return results;
}