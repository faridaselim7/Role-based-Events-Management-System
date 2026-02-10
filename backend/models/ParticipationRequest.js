import mongoose from 'mongoose';

const participationRequestSchema = new mongoose.Schema(
  {
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // optional note from vendor
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    // who responded (should be the professor)
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
    // optional admin/professor note
    responseMessage: { type: String }
  },
  { timestamps: true }
);

// prevent duplicate requests from same vendor to same workshop
participationRequestSchema.index({ workshop: 1, vendor: 1 }, { unique: true });

export const ParticipationRequest = mongoose.model('ParticipationRequest', participationRequestSchema);
