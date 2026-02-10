import Poll from '../models/Poll.js';
import { User } from '../models/User.js';

// Req #82 - Events Office creates poll for vendor booth setup
export const createPoll = async (req, res) => {
  try {
    const { title, description, pollType, eventName, eventId, vendorId, bazaarId, options, vendors, startDate, endDate, allowMultipleVotes } = req.body;
    const userId = req.user.id || req.user._id;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // For vendor voting polls
    if (pollType === 'vendor_voting') {
      if (!vendors || vendors.length < 2) {
        return res.status(400).json({ message: 'At least 2 vendors are required' });
      }

      const poll = new Poll({
        title,
        description,
        pollType: 'vendor_voting',
        eventName,
        eventId,
        bazaarId,
        vendors: vendors.map(v => ({
          vendorId: v.vendorId,
          name: v.name,
          category: v.category,
          votes: 0,
          votedBy: []
        })),
        createdBy: userId,
        startDate: startDate || new Date(),
        endDate,
        status: 'active'
      });

      await poll.save();
      return res.status(201).json({
        message: 'Vendor voting poll created successfully',
        poll
      });
    }

    // For general polls with options
    if (!options || options.length < 2) {
      return res.status(400).json({ message: 'Title and at least 2 options are required' });
    }

    const poll = new Poll({
      title,
      description,
      pollType,
      vendorId,
      bazaarId,
      options: options.map((optionText, index) => ({
        optionId: `option_${index}`,
        optionText,
        votes: 0
      })),
      createdBy: userId,
      startDate: startDate || new Date(),
      endDate,
      allowMultipleVotes,
      status: 'active'
    });

    await poll.save();

    res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ message: 'Failed to create poll', error: error.message });
  }
};

// Req #83 - Student/Staff/TA/Professor votes for vendor in poll
export const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { selectedOption, vendorId } = req.body;
    const userId = req.user.id || req.user._id;

    console.log("=== VOTE REQUEST ===");
    console.log("Poll ID:", pollId);
    console.log("User ID from token:", userId);
    console.log("User object:", req.user);
    console.log("Selected option:", selectedOption);
    console.log("Vendor ID:", vendorId);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'active') {
      return res.status(400).json({ message: 'This poll is no longer active' });
    }

    // Check if poll has expired
    if (new Date() > new Date(poll.endDate)) {
      return res.status(400).json({ message: 'This poll has ended' });
    }

    // Handle vendor voting polls
    if (poll.pollType === 'vendor_voting' && vendorId) {
      // Check if user has already voted for ANY vendor in this poll
      const hasVotedInPoll = poll.vendors.some(v => 
        v.votedBy && v.votedBy.some(id => id.toString() === userId.toString())
      );

      if (hasVotedInPoll) {
        return res.status(400).json({ message: 'You have already voted in this poll' });
      }

      // Find the vendor to vote for
      const vendorIndex = poll.vendors.findIndex(v => v._id.toString() === vendorId.toString());
      
      if (vendorIndex === -1) {
        return res.status(400).json({ message: 'Vendor not found in poll' });
      }

      // Add vote to the vendor
      poll.vendors[vendorIndex].votes = (poll.vendors[vendorIndex].votes || 0) + 1;
      poll.vendors[vendorIndex].votedBy.push(userId);

      // Track in votes array for history
      poll.votes.push({
        userId,
        vendorId,
        votedAt: new Date()
      });

      await poll.save();

      return res.status(200).json({
        message: 'Vote recorded successfully',
        poll
      });
    }

    // Handle general option-based polls
    const existingVote = poll.votes.find(v => v.userId && v.userId.toString() === userId.toString());
    
    if (existingVote && !poll.allowMultipleVotes) {
      // User has already voted - don't allow changing vote for option-based polls
      return res.status(400).json({ message: 'You have already voted in this poll' });
    }

    const option = poll.options.find(o => o.optionId === selectedOption);
    if (!option) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    // Only add new vote if user hasn't voted before
    if (!existingVote) {
      poll.votes.push({
        userId,
        selectedOption,
        votedAt: new Date()
      });
      
      option.votes = (option.votes || 0) + 1;
    }
    
    await poll.save();

    res.status(200).json({
      message: 'Vote recorded successfully',
      poll
    });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ message: 'Failed to vote on poll', error: error.message });
  }
};

// Get poll details
export const getPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId).populate('createdBy', 'firstName lastName email');

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    res.status(200).json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ message: 'Failed to fetch poll', error: error.message });
  }
};

// Get all polls (with optional filters)
export const getAllPolls = async (req, res) => {
  try {
    const { pollType, bazaarId, vendorId, status } = req.query;
    const filters = {};

    if (pollType) filters.pollType = pollType;
    if (bazaarId) filters.bazaarId = bazaarId;
    if (vendorId) filters.vendorId = vendorId;
    if (status) filters.status = status;

    const polls = await Poll.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: 'Failed to fetch polls', error: error.message });
  }
};

// Close poll
export const closePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    poll.status = 'closed';
    await poll.save();

    res.status(200).json({
      message: 'Poll closed successfully',
      poll
    });
  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(500).json({ message: 'Failed to close poll', error: error.message });
  }
};