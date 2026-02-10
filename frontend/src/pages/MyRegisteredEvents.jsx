import React, { useEffect, useState } from "react";
import { Calendar, Loader2, XCircle, MapPin, Users, Clock, Star, MessageSquare, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Toaster, toast } from "sonner";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

export default function MyRegisteredEvents({ email, userId }) {
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal control
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Rating functionality
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  // Comments functionality
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState(null);

  const hasEventEnded = (eventDate) => {
    const now = new Date();
    return new Date(eventDate) < now;
  };

  // Helper: Get auth token (assume stored in localStorage after login)
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token"); // Adjust key if different
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  useEffect(() => {
    if (!email) {
      setLoading(false);
      toast.error("Email is required to fetch registered events.");
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch registered events (unchanged; assumes /api/registrations exists)
        const res = await fetch(`${API_BASE}/api/registrations/user/email/${email}`);
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        setMyEvents(data.data || []);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, userId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    const options = { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const canCancel = (eventDate) => {
    const now = new Date();
    return new Date(eventDate) > now;
  };

const handleCancel = async (registration) => {
  const event = registration.eventId;
  const eventDate = event.startDate || event.startDateTime || event.date;
  const eventTitle = event.title || event.name || "Event";
    
  if (!canCancel(eventDate)) {
    toast.error("Cannot cancel an event that has already started");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/registrations/${registration._id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to cancel registration");
    }

    // ✅ Update wallet in localStorage
    if (data.user && typeof data.user.wallet !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const updatedUser = { ...parsed, wallet: data.user.wallet };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          console.log("Wallet updated after refund:", data.user.wallet);
        }
      } catch (e) {
        console.error("Failed to update user wallet in localStorage after refund:", e);
      }
    }

    // ✅ Trigger a custom event to notify EventRegistration component
    const cancelEvent = new CustomEvent('registrationCancelled', {
      detail: { 
        eventId: event._id,
        newWallet: data.user?.wallet
      }
    });
    window.dispatchEvent(cancelEvent);

    // Update local state
    setMyEvents(prev => prev.filter(r => r._id !== registration._id));
    toast.success(`Registration for "${eventTitle}" cancelled. Refund issued.`);
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Failed to cancel registration");
  }
};

  const openCancelConfirm = (registration) => {
    setRegistrationToCancel(registration);
    setShowCancelConfirm(true);
  };

  const closeCancelConfirm = () => {
    setShowCancelConfirm(false);
    setRegistrationToCancel(null);
  };

  const handleConfirmCancel = async () => {
    if (!registrationToCancel) return;
    await handleCancel(registrationToCancel);
    closeCancelConfirm();
  };

  // Updated: Rating Functions (now matches backend /api/events/:type/:id/rate & /comment)
  const openRatingModal = (registration) => {
    const event = registration.eventId;
    setSelectedEvent({ registration, event });
    
    // Check if user already rated this event
    fetchUserRating(event._id, registration.eventType);
    setShowRatingModal(true);
  };

  const fetchUserRating = async (eventId, eventType) => {
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventType}/${eventId}/ratings`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch ratings");
      const data = await res.json();
      // Find user's own rating from feedback list
      const userFeedback = data.feedback?.find(fb => fb.userId?._id === userId || fb.userId === userId);
      if (userFeedback) {
        setRating(userFeedback.rating || 0);
        setRatingComment(userFeedback.comment || "");
      } else {
        setRating(0);
        setRatingComment("");
      }
    } catch (err) {
      console.error("Error fetching user rating:", err);
      toast.error("Failed to load your rating");
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
  
    try {
      const eventType = selectedEvent.registration.eventType;
      const eventId = selectedEvent.event._id;

      // Submit rating (separate endpoint)
      const rateRes = await fetch(`${API_BASE}/api/events/${eventType}/${eventId}/rate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating }),
      });
      if (!rateRes.ok) throw new Error("Failed to submit rating");

      // Submit comment if provided (separate endpoint; optional)
      if (ratingComment.trim()) {
        const commentRes = await fetch(`${API_BASE}/api/events/${eventType}/${eventId}/comment`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ comment: ratingComment }),
        });
        if (!commentRes.ok) throw new Error("Failed to submit comment");
      }
  
      toast.success("Rating and comment submitted successfully!");
      setShowRatingModal(false);
      resetRatingForm();
  
      // Fetch updated reviews and comments
      await fetchComments(eventId, eventType);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit rating");
    }
  };

  const resetRatingForm = () => {
    setRating(0);
    setHoverRating(0);
    setRatingComment("");
    setSelectedEvent(null);
  };

  // Updated: Comments Functions (now matches backend /api/events/:type/:id/ratings & /comment)
  const openCommentsModal = async (registration) => {
    const event = registration.eventId;
    setSelectedEvent({ registration, event });
    setShowCommentsModal(true);
    await fetchComments(event._id, registration.eventType);
  };

  const fetchComments = async (eventId, eventType) => {
    try {
      setLoadingComments(true);
      const res = await fetch(`${API_BASE}/api/events/${eventType}/${eventId}/ratings`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch reviews and comments");
      const data = await res.json();
      // Map feedback to component format (incl. average if needed)
      setComments(data.feedback || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reviews and comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      const eventType = selectedEvent.registration.eventType;
      const eventId = selectedEvent.event._id;
      const res = await fetch(`${API_BASE}/api/events/${eventType}/${eventId}/comment`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment: newComment }),
      });

      if (!res.ok) throw new Error("Failed to submit comment");
      
      toast.success("Comment posted successfully!");
      setNewComment("");
      await fetchComments(eventId, eventType);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit comment");
    }
  };

  const closeModals = () => {
    setShowRatingModal(false);
    setShowCommentsModal(false);
    setSelectedEvent(null);
    resetRatingForm();
    setNewComment("");
    setComments([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white rounded-2xl">
      <Toaster position="bottom-right" />

      <Card className="w-full max-w-8xl border-[#738A6E] bg-white shadow-md rounded-2xl min-h-screen">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FASEA] to-[#D7DBF2] rounded-full flex items-center justify-center shadow-lg">
              <Calendar className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl text-[#2D3748] font-bold">
            My Registered Events
          </CardTitle>
          <CardDescription className="text-[#4A5D49] text-lg">
            View all events you've registered for
          </CardDescription>
          {email && <p className="text-sm text-[#738A6E] mt-2">Showing events for: <span className="font-semibold">{email}</span></p>}
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 className="animate-spin text-[#FASEA] w-12 h-12 mb-4" />
              <p className="text-[#4A5568] text-lg">Loading your registered events...</p>
            </div>
          ) : myEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#344C3D]">
              <XCircle className="w-12 h-12 text-[#738A6E] mb-3" />
              <p className="text-xl font-semibold">No Registered Events Yet</p>
              <p className="text-sm text-[#4A5D49] mt-2">
                Register for a workshop, trip, or event to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-9">
              {myEvents.map((registration) => {
                const event = registration.eventId;
                if (!event) return null;

                // Handle different field names for Workshops vs Trips
                const eventTitle = event.title || event.name || "Unnamed Event";
                const eventDate = event.startDate || event.startDateTime || event.date;
                const location = event.location || "Location TBD";
                const description = event.description || "No description provided.";
                 const eventEnded = hasEventEnded(eventDate);
                console.log('Registration event:', { eventTitle, eventDate, registration });

                return (
                  <Card key={registration._id} className="border-2 border-[#8EA58C] bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {registration.eventType.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {registration.status}
                        </span>
                      </div>
                      <CardTitle className="text-[#344C3D] text-xl font-bold leading-tight">{eventTitle}</CardTitle>
                    </CardHeader>

                    <CardContent className="flex-grow flex flex-col justify-between">
                      <div className="space-y-3 mb-4">
                        <p className="text-sm text-[#4A5D49] line-clamp-3">{description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-[#344C3D]">
                            <Clock className="w-4 h-4 mr-2 text-[#738A6E]" />
                            <span className="font-medium">{eventDate ? formatDate(eventDate) : "Date TBD"}</span>
                          </div>
                          <div className="flex items-center text-sm text-[#344C3D]">
                            <MapPin className="w-4 h-4 mr-2 text-[#738A6E]" />
                            <span>{location}</span>
                          </div>
                          <div className="flex items-center text-sm text-[#344C3D]">
                            <Users className="w-4 h-4 mr-2 text-[#738A6E]" />
                            <span className="capitalize">{event.category || registration.eventType} Event</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {eventEnded ? (
                          <>
                           <Button
  className="w-full bg-[#366B2B] hover:bg-[#2a5621] text-white flex items-center justify-center gap-2"
  onClick={() => openRatingModal(registration)}
>
  <Star className="w-4 h-4" />
  Rate Event
</Button>
<Button
  className="w-full bg-[#307B8E] hover:bg-[#256472] text-white flex items-center justify-center gap-2"
  onClick={() => openCommentsModal(registration)}
>
  <MessageSquare className="w-4 h-4" />
  View Comments
</Button>
                          </>
                        ) : (
                          <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => openCancelConfirm(registration)}
                          >
                            Cancel & Refund
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel & Refund Confirmation Modal */}
{showCancelConfirm && registrationToCancel && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <Card className="w-full max-w-md bg-white rounded-xl shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-6 h-6 text-red-500" />
          <CardTitle className="text-[#103A57]">
            Cancel Registration?
          </CardTitle>
        </div>
        <CardDescription className="text-[#366B2B]">
          {registrationToCancel.eventId?.title ||
            registrationToCancel.eventId?.name ||
            "Event"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#103A57]">
          Are you sure you want to cancel your registration?
        </p>

        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={closeCancelConfirm}
          >
            Keep Registration
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirmCancel}
          >
            Yes, Cancel & Refund
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}

      {/* Rating Modal */}
      {showRatingModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-[#103A57]">Rate Event</CardTitle>
              <CardDescription className="text-[#366B2B]">
                {selectedEvent.event.title || selectedEvent.event.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Star Rating */}
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-[#103A57] font-medium">Your Rating</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-10 h-10 cursor-pointer transition-all ${
                        star <= (hoverRating || rating)
                          ? 'fill-[#366B2B] text-[#366B2B]'
                          : 'text-gray-300'
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#307B8E]">
                  {rating === 0 ? 'Click to rate' : `${rating} out of 5 stars`}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-[#103A57] mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full border-2 border-[#CEE5D6] rounded-lg p-3 text-[#103A57] focus:outline-none focus:border-[#307B8E] min-h-[100px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
                  onClick={closeModals}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#366B2B] hover:bg-[#2a5621] text-white"
                  onClick={submitRating}
                >
                  Submit Rating
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white max-h-[80vh] flex flex-col">
            <CardHeader>
              <CardTitle className="text-[#103A57]">Event Comments</CardTitle>
              <CardDescription className="text-[#366B2B]">
                {selectedEvent.event.title || selectedEvent.event.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto">
              {/* Add Comment Section */}
              <div className="sticky top-0 bg-white pb-4 border-b border-[#CEE5D6]">
                <label className="block text-sm font-medium text-[#103A57] mb-2">
                  Add Your Comment
                </label>
                <div className="flex space-x-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 border-2 border-[#CEE5D6] rounded-lg p-3 text-[#103A57] focus:outline-none focus:border-[#307B8E] min-h-[80px]"
                  />
                  <Button
                    className="bg-[#307B8E] hover:bg-[#256472] text-white self-end"
                    onClick={submitComment}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

             {/* Comments List */}
<div className="space-y-3">
  {loadingComments ? (
    <div className="flex justify-center py-8">
      <Loader2 className="animate-spin text-[#307B8E] w-8 h-8" />
    </div>
  ) : comments.length === 0 ? (
    <p className="text-center text-[#366B2B] py-8">
      No reviews or comments yet. Be the first to comment!
    </p>
  ) : (
    comments.map((comment) => (
      <div
        key={comment._id}
        className="bg-[#A9D3C5] border border-[#CEE5D6] rounded-lg p-4"
      >
        <div className="flex justify-between items-start mb-2">
          <p className="font-semibold text-[#103A57]">
            {comment.userId?.firstName && comment.userId?.lastName 
              ? `${comment.userId.firstName} ${comment.userId.lastName}` 
              : comment.userId?.email || "Anonymous"}
          </p>
          <p className="text-xs text-[#366B2B]">
            {new Date(comment.updatedAt || comment.createdAt).toLocaleDateString()}
          </p>
        </div>
        {comment.rating && (
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < comment.rating ? "fill-[#366B2B] text-[#366B2B]" : "text-gray-300"
                }`}
              />
            ))}
          </div>
        )}
        {comment.comment && (
          <p className="text-[#103A57]">{comment.comment}</p>
        )}
      </div>
    ))
  )}
</div>

              {/* Close Button */}
              <div className="sticky bottom-0 bg-white pt-4 border-t border-[#CEE5D6]">
                <Button
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700"
                  onClick={closeModals}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}