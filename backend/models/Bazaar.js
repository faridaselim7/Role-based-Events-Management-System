import mongoose from 'mongoose';

const bazaarSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  registrationDeadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to Events Office user

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

export default mongoose.model('Bazaar', bazaarSchema);
