import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  description: { type: String, required: true },
  capacity: { type: Number, required: true },
  registrationDeadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // who is allowed to register
  allowedUserTypes: {
    type: [String],
    enum: ['Student', 'Staff', 'TA', 'Professor'],
    default: ['Student', 'Staff', 'TA', 'Professor'],
  },

  // ✅ NEW: archiving
  archived: {
    type: Boolean,
    default: false,
  },
  archivedAt: {
    type: Date,
  },
});

export default mongoose.model('Trip', tripSchema);
