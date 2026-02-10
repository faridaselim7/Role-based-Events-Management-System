// backend/models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },

  // ✅ enum now explicitly allows 'gym'
  category: {
    type: String,
    enum: ['conference', 'bazaar', 'booth', 'Workshop', 'Trip', 'gym'],
    required: true
  },

  date: { type: Date, required: true },          // includes time
  durationMins: { type: Number, min: 15, max: 600 },
  description: String,

  // editable conference-only details
  conference: {
    location: String,
    speakers: [String],
    agendaUrl: String,
    description: String
  },

  // 🔐 NEW: who is allowed to register for this event
  // empty array = unrestricted → everyone in USER_TYPES can register
  allowedUserTypes: {
    type: [String],
    enum: ['Student', 'Staff', 'TA', 'Professor'],
    default: []
  },

  status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },

  // ✅ archive flag
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
