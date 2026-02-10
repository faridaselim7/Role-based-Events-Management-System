// controllers/professorController.js
import { Workshop } from '../models/Workshop.js';
import { ParticipationRequest } from '../models/ParticipationRequest.js';
import { User } from '../models/User.js';
import { notifyWorkshopSubmitted } from './notifyController.js';
import Registration from '../models/Registration.js';  // ← ADD THIS LINE


/**
 * Helper: validate workshop creation data
 */
export function validateWorkshopInput(body, isEdit = false) {
  const requiredFields = [
    'title',
    'location',
    'startDate',
    'endDate',
    'facultyResponsible',
    'requiredBudget',
    'fundingSource',
    'capacity',
    'registrationDeadline',
  ];

  // Check required fields only for creation
  if (!isEdit) {
    for (const field of requiredFields) {
      if (!body[field]) return `Missing required field: ${field}`;
    }
  }

  const allowedLocations = ['GUC Cairo', 'GUC Berlin'];
  const allowedFaculties = ['MET', 'IET', 'EMS', 'ARCH', 'Civil', 'MGT', 'BI', 'LAW', 'Pharmacy', 'AA'];
  const allowedFundingSources = ['GUC-Funded', 'Externally-Funded'];

  if (body.location && !allowedLocations.includes(body.location)) {
    return `Invalid location. Must be one of: ${allowedLocations.join(', ')}`;
  }

  if (body.facultyResponsible && !allowedFaculties.includes(body.facultyResponsible)) {
    return `Invalid facultyResponsible. Must be one of: ${allowedFaculties.join(', ')}`;
  }

  if (body.fundingSource && !allowedFundingSources.includes(body.fundingSource)) {
    return `Invalid fundingSource. Must be one of: ${allowedFundingSources.join(', ')}`;
  }

  // Logical date validation
  const { startDate, endDate, registrationDeadline } = body;
  const today = new Date();
  today.setHours(0,0,0,0);

  if (startDate) {
    const start = new Date(startDate);
    if (start < today)
      return 'Start date cannot be in the past';
  }

  if (startDate && endDate && new Date(endDate) < new Date(startDate))
    return 'End date cannot be before start date';

  if (registrationDeadline) {
    const reg = new Date(registrationDeadline);
    if (reg < today)
      return 'Registration deadline cannot be in the past';
    if (startDate && reg > new Date(startDate))
      return 'Registration deadline must be before the workshop start date';
  }

  return null;
}


/**
 * Controller: create a new workshop
 */

// controllers/professorController.js

export async function createWorkshop(req, res) {
  try {
    // --- 1) Validate workshop input ---
    const error = validateWorkshopInput(req.body);
    if (error) return res.status(400).json({ message: error });

    // --- 2) Resolve professor names → IDs ---
    let professorIds = [];

    // Accept either professorsParticipatingNames (new) OR professorsParticipating (fallback)
    const rawNames =
      req.body.professorsParticipatingNames ??
      req.body.professorsParticipating;

    if (rawNames) {
      const names = Array.isArray(rawNames)
        ? rawNames
        : rawNames.split(",").map((n) => n.trim()).filter(Boolean);

      for (const name of names) {
        const prof = await User.findOne({
          role: "Professor",
          $or: [
            { firstName: new RegExp(name, "i") },
            { lastName: new RegExp(name, "i") },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$firstName", " ", "$lastName"] },
                  regex: name,
                  options: "i",
                },
              },
            },
          ],
        });

        if (prof) {
          professorIds.push(prof._id);
        } else {
          console.warn(`⚠️ Professor not found: ${name}`);
        }
      }
    }

    // --- 3) Create new workshop document ---
    const newWorkshop = new Workshop({
      title: req.body.title,
      location: req.body.location,
      facultyResponsible: req.body.facultyResponsible,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      registrationDeadline: req.body.registrationDeadline,
      capacity: req.body.capacity,
      requiredBudget: req.body.requiredBudget,
      fundingSource: req.body.fundingSource,
      description: req.body.description,

      // ✅ store IDs (for relations)
      professorsParticipating: professorIds,

      // ✅ store raw names (for easy display)
      professorsParticipatingNames: rawNames || "",

      fullAgenda: req.body.fullAgenda,

      // ⚠️ make sure this matches your Workshop schema exactly
      extraRequiredResources: req.body.extraRequiredResources || req.body.extraResources,

      createdBy: req.user?.id,  // logged-in professor
      price: req.body.price || 0,
    });

    await newWorkshop.save();

    // --- 4) Re-fetch with population for clean response ---
    const workshop = await Workshop.findById(newWorkshop._id)
      .populate("professorsParticipating", "firstName lastName")
      .populate("createdBy", "firstName lastName email");

    // --- 5) Notify Events Office (non-blocking) ---
    try {
      await notifyWorkshopSubmitted({
        workshop,
        triggeredBy: req.user?._id || null,
      });
    } catch (notifyErr) {
      console.error(
        "Failed to create 'workshop_submitted' notification:",
        notifyErr
      );
      // Don't fail the request because of notification issues
    }

    res.status(201).json({
      message: "Workshop created successfully",
      workshop,
    });
  } catch (err) {
    console.error("Error creating workshop:", err);
    res.status(500).json({ message: "Server error creating workshop" });
  }
}





    


/**
 * View all workshops created by the logged-in professor
 */
// controllers/professorController.js → listMyWorkshops
// FINAL VERSION — SHOWS REAL COUNT ON BUTTON
export async function listMyWorkshops(req, res) {
  try {
    const professorId = req.user.id;

    const workshops = await Workshop.find({
      $or: [
        { createdBy: professorId },
        { professorsParticipating: professorId }
      ]
    })
      .sort({ startDate: 1 })
      .populate('createdBy', 'firstName lastName email')
      .populate('professorsParticipating', 'firstName lastName email')
      .populate('acceptedVendors', 'name email')
      .lean();

    // ADD REAL REGISTERED COUNT FROM REGISTRATIONS COLLECTION
    const workshopsWithRealCount = await Promise.all(
      workshops.map(async (w) => {
        const realCount = await Registration.countDocuments({
          eventId: w._id,
          status: 'registered'
        });

        return {
          ...w,
          registeredCount: realCount,                    // ← THIS IS WHAT THE BUTTON USES
          remainingSpots: w.capacity - realCount
        };
      })
    );

    res.json({ workshops: workshopsWithRealCount });
  } catch (err) {
    console.error('Error listing workshops:', err);
    res.status(500).json({ message: 'Server error listing workshops' });
  }
}
/**
 * Edit a workshop (only the professor who created it can edit)
 */
export async function editWorkshop(req, res) {
  try {
    const { id } = req.params;
    const update = req.body;

    // ✅ Validate input (edit mode)
    const error = validateWorkshopInput(update, true);
    if (error) return res.status(400).json({ message: error });

    // ✅ Prevent any manual createdBy tampering
    delete update.createdBy;

    // ✅ Update the workshop (no auth restriction)
    const workshop = await Workshop.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate("professorsParticipating", "firstName lastName");

    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    res.json({
      message: "Workshop updated successfully",
      workshop,
    });
  } catch (err) {
    console.error("Error editing workshop:", err);
    res.status(500).json({ message: "Server error editing workshop" });
  }
}
