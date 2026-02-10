import mongoose from 'mongoose';



const WorkshopSchema = new mongoose.Schema(
  {
    // Core (Professor side)
    title: { type: String, required: true },
    description: { type: String, default: '' },               // from EO_Workshop
    shortDescription: { type: String },                       // from old Workshop
    fullAgenda: { type: String },                             // from old Workshop
    location: { type: String, enum: ['GUC Cairo', 'GUC Berlin'], required: true },
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },

    facultyResponsible: {
      type: String,
      enum: ['MET','IET','EMS','ARCH','Civil','MGT','BI','LAW','Pharmacy','AA'],
      required: true
    },
    requiredBudget: { type: Number, required: true },
    
     price: { type: Number, required: false, default: 0 },
    
    fundingSource: {
      type: String,
      enum: ["guc", "GUC", "GUC-Funded", "Externally-Funded"],    // canonical lowercase
      required: true,
    },
    
    extraRequiredResources: { type: String },
    capacity: { type: Number, required: true },
    registrationDeadline: { type: Date, required: true },

    // Ownership
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },

    professorsParticipating: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    professorsParticipatingNames: {
      type: String,  
      default: "",
    },

    // EO workflow (unified)
    status: {
      type: String,
      enum: ['pending','approved','rejected','needs_edit','published'],
      default: 'pending'
    },
    eoNotes: { type: String, default: '' },

    // Approvals
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },

    // Publish
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },

    // Rejection / edit requests
    rejectionReason: { type: String, default: '' },
    editRequest: {
      message: { type: String, default: '' },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      requestedAt: { type: Date }
    },

    // Vendors
    acceptedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Req #38 - Professor views workshop participants list and remaining spots
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        registeredAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['registered', 'attended', 'cancelled'], default: 'registered' },
      }
    ],
    // ✅ who is allowed to register
    allowedUserTypes: {
      type: [String],
      enum: ['student', 'staff', 'ta', 'professor'],
      default: ['student', 'staff', 'ta', 'professor'],
    },

    // ✅ NEW: archiving
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);



// Date validations
WorkshopSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    return next(new Error('End date cannot be before start date'));
  }
  if (this.registrationDeadline > this.startDate) {
    return next(new Error('Registration deadline must be before the workshop start date'));
  }
  next();
});


// Virtual for remaining spots
WorkshopSchema.virtual('remainingSpots').get(function() {
  return this.capacity - (this.participants ? this.participants.length : 0);
});



export const Workshop = mongoose.model('Workshop', WorkshopSchema);
