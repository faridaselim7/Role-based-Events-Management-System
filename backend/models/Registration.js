import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userType: {
    type: String,
    required: true,
    enum: ['Student', 'TA', 'Staff', 'Professor'],
    index: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Event', 'Workshop', 'Trip'],
    default: 'Event'
  },
  eventType: {
    type: String,
    required: true,
    enum: ['workshop', 'trip', 'conference', 'bazaar', 'gym', 'booth'],
  },
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'attended'],
    default: 'registered',
  },
  registrationDate: { type: Date, default: Date.now },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending',
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'wallet', 'none'],
    default: 'none',
  },
  stripePaymentIntentId: String,
  refundedToWallet: {
    type: Boolean,
    default: false,
  },
  notes: String,
  certificateSent: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

registrationSchema.index({ userId: 1, userType: 1 });
registrationSchema.index({ eventId: 1, status: 1 });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;