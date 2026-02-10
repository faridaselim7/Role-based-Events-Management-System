// Req #38 - Professor views workshop participants list and remaining spots
// controllers/WorkshopParticipantsController.js
import { Workshop } from '../models/Workshop.js';
import Registration from '../models/Registration.js';  // ← This one is default, so it's fine
import { User } from '../models/User.js';

export const getWorkshopParticipants = async (req, res) => {
  try {
    const { workshopId } = req.params;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) return res.status(404).json({ message: 'Workshop not found' });

    const isProfessor = 
      workshop.createdBy?.toString() === req.user.id ||
      workshop.professorsParticipating?.some(p => p.toString() === req.user.id);

    if (!isProfessor && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get registrations WITHOUT populate (because userId is string, not ObjectId)
    const registrations = await Registration.find({
      eventId: workshopId,
      status: 'registered'
    }).sort({ registrationDate: 1 }).lean();

    const registeredCount = registrations.length;
    const remainingSpots = workshop.capacity - registeredCount;

    // Manually resolve each user
    const participants = await Promise.all(
      registrations.map(async (reg) => {
        let user = null;
        let displayId = 'N/A';

        // The real student/staff ID is stored as string in reg.userId
        const rawId = reg.userId;

        if (rawId && typeof rawId === 'string') {
          // First: try to find user by studentOrStaffId
          user = await User.findOne({ studentOrStaffId: rawId }).select('firstName lastName email studentOrStaffId role');

          // If found → use real data
          if (user) {
            displayId = user.studentOrStaffId;
          } else {
            // Not found in DB → still show the ID from registration
            displayId = rawId;
          }
        }

        return {
          userId: user?._id || null,
          firstName: user?.firstName || (reg.name?.split(' ')[0]) || 'Unknown',
          lastName: user?.lastName || (reg.name?.split(' ')[1]) || 'User',
          email: user?.email || reg.email || 'no-email@guc.edu.eg',
          studentOrStaffId: displayId,
          role: user?.role || reg.userType || 'Student',
          registeredAt: reg.registrationDate || reg.createdAt,
          status: reg.status
        };
      })
    );

    res.json({
      workshopId: workshop._id,
      title: workshop.title,
      totalCapacity: workshop.capacity,
      registeredCount,
      remainingSpots,
      participants
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register user for workshop
// Register user for workshop
// Register user for workshop
export const registerForWorkshop = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;   // 🔐 we use this for restriction

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // 🔐 NEW: Restriction based on workshop.allowedUserTypes
    // If allowedUserTypes has values → ONLY those roles may register
    const allowed = Array.isArray(workshop.allowedUserTypes)
      ? workshop.allowedUserTypes
      : [];

    if (allowed.length > 0) {
      const normalizedAllowed = allowed.map((r) => String(r).toLowerCase());
      const userRoleNorm = String(userRole || '').toLowerCase();

      if (!normalizedAllowed.includes(userRoleNorm)) {
        return res.status(403).json({
          message: `This workshop is restricted. Allowed user types: ${allowed.join(
            ', '
          )}`,
        });
      }
    }

    // Check if workshop is published
    if (!workshop.published) {
      return res.status(400).json({ message: 'Workshop is not yet published' });
    }

    // Check registration deadline
    if (new Date() > workshop.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if already registered
    const alreadyRegistered = workshop.participants?.some(
      (p) => p.userId.toString() === userId
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'You are already registered for this workshop' });
    }

    // Check capacity
    if (workshop.participants && workshop.participants.length >= workshop.capacity) {
      return res.status(400).json({ message: 'Workshop is at full capacity' });
    }

    // Add participant
    if (!workshop.participants) {
      workshop.participants = [];
    }

    // ⚠️ kept exactly as you had it (pushed twice)
    workshop.participants.push({
      userId,
      registeredAt: new Date(),
      status: 'registered'
    });

    workshop.participants.push({
      userId,
      registeredAt: new Date(),
      status: 'registered'
    });

    // THIS IS THE ONLY LINE YOU CHANGE (you already had this)
    await workshop.save({ validateModifiedOnly: true });

    res.status(200).json({
      message: 'Successfully registered for workshop',
      remainingSpots: workshop.capacity - workshop.participants.length
    });
  } catch (error) {
    console.error('Error registering for workshop:', error);
    res.status(500).json({
      message: 'Failed to register for workshop',
      error: error.message
    });
  }
};


// Unregister user from workshop
export const unregisterFromWorkshop = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const userId = req.user.id;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Find and remove participant
    const participantIndex = workshop.participants?.findIndex(p => p.userId.toString() === userId);
    if (participantIndex === -1 || participantIndex === undefined) {
      return res.status(400).json({ message: 'You are not registered for this workshop' });
    }

    workshop.participants.splice(participantIndex, 1);
    await workshop.save();

    res.status(200).json({
      message: 'Successfully unregistered from workshop'
    });
  } catch (error) {
    console.error('Error unregistering from workshop:', error);
    res.status(500).json({ message: 'Failed to unregister from workshop', error: error.message });
  }
};

// Mark participant as attended
export const markParticipantAttended = async (req, res) => {
  try {
    const { workshopId, userId } = req.params;
    const professorId = req.user.id;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Verify requester is a professor involved in this workshop
    const isProfessor = workshop.createdBy?.toString() === professorId || 
                        workshop.professorsParticipating?.some(p => p.toString() === professorId);

    if (!isProfessor && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You do not have permission to mark attendance' });
    }

    // Find and update participant
    const participant = workshop.participants?.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    participant.status = 'attended';
    await workshop.save({ validateModifiedOnly: true });

    res.status(200).json({
      message: 'Participant marked as attended',
      participant
    });
  } catch (error) {
    console.error('Error marking participant attended:', error);
    res.status(500).json({ message: 'Failed to mark participant attended', error: error.message });
  }
};