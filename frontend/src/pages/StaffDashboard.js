import React, { useState, useRef, useEffect } from "react";
import { Calendar, Clock, User, XCircle, Star, Heart, Store,Package } from "lucide-react";
import GymSchedule from "./GymSchedule";
import UnifiedDashboardLayout from "../components/UnifiedDashboardLayout";
import MyRegisteredEvents from "./MyRegisteredEvents";
import Register from "./EventRegistration";
import VendorPartners from "../components/VendorPartners";
import useNotifications from "../stores/notifications";
import { CardSkeleton, ListItemSkeleton, NoEventsState, NoFavoritesState,NoSearchResultsState,EmptyState} from '../components/LoadingEmptyStates';
import { Vote } from "lucide-react";
import PollsView from "../components/PollsView";
import EventFilterSort from "../components/EventFilterSort";
import useAllEventNotifications from "../hooks/useAllEventNotifications";
import EventsView from "./BrowseEvents";
import LostAndFoundVisitor from "./LostAndFoundVisitor";
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EOradius,
  EOtransitions,
} from "../styles/EOdesignSystem";

// Helper to fetch professor names
const fetchProfessorNames = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const responses = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`http://localhost:5001/api/users/${id}`);
      if (!res.ok) {
        console.error(`Failed to fetch professor with id ${id}`);
        return null;
      }
      const prof = await res.json();
      return `${prof.firstName} ${prof.lastName}`.trim();
    })
  );

  return responses.filter(Boolean);
};

// Safe date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};


// Vendors Section with Voting
const VendorsSection = ({ eventId, category }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedVendors, setVotedVendors] = useState(new Set());

  useEffect(() => {
    fetch(`http://localhost:5001/api/vendors/${category}/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setVendors(data.vendors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId, category]);

  const handleVote = (vendorId) => {
    if (votedVendors.has(vendorId)) {
      alert("You have already voted.");
      return;
    }

    fetch(`http://localhost:5001/api/vendors/vote/${category}/${eventId}/${vendorId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Vote failed");
        return res.json();
      })
      .then((data) => {
        if (data.vendors) setVendors(data.vendors);
        else {
          setVendors((prev) =>
            prev.map((v) => (v._id === vendorId ? { ...v, votes: (v.votes || 0) + 1 } : v))
          );
        }
        setVotedVendors((prev) => new Set([...prev, vendorId]));
        alert("Vote recorded!");
      })
      .catch((err) => alert("Error: " + err.message));
  };

  if (loading) return <p className="text-gray-500 mt-3 animate-pulse">Loading vendors...</p>;
  if (vendors.length === 0) return (
    <div className="mt-4">
      <EmptyState
        icon={Store}
        title="No Vendors"
        description="No vendors available for voting yet"
      />
    </div>
  );

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-800 mb-2">Vote for Vendor:</h4>
      <ul className="space-y-2">
        {vendors.map((vendor) => (
          <li key={vendor._id} className="flex items-center justify-between p-2 border rounded">
            <span className="font-medium">
              {vendor.name} {vendor.votes !== undefined && `(${vendor.votes} votes)`}
            </span>
            <button
              onClick={() => handleVote(vendor._id)}
              disabled={votedVendors.has(vendor._id)}
              className={`px-3 py-1 text-sm rounded text-white transition ${
                votedVendors.has(vendor._id)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {votedVendors.has(vendor._id) ? "Voted" : "Vote"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Ratings and Comments section
const RatingsSection = ({ eventId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:5001/api/events/${eventId}/reviews`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json();
      })
      .then((data) => {
        const reviewsData = data.reviews || [];
        setReviews(reviewsData);
        
        // Calculate average rating
        if (reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length;
          setAverageRating(avg.toFixed(1));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching reviews:', err);
        setReviews([]);
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <p className="text-gray-500 mt-4 animate-pulse">Loading ratings...</p>;

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">Ratings & Comments</h4>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 font-semibold text-lg">{averageRating} ★</span>
            <span className="text-sm text-gray-600">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">No ratings yet.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {reviews.map((review) => (
            <div key={review._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">
                    {review.userName || review.userId?.firstName || review.userId?.email || "Anonymous"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < (review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                </div>
                {review.createdAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// Favorites View
const FavoritesView = ({ userId, favorites = [], onToggleFavorite, onViewChange }) => {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const fetchFavoritesAndEvents = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const userType = user?.role || 'Staff';
        const token = localStorage.getItem('token');

        // Fetch from unified events API
        const response = await fetch(
          `http://localhost:5001/api/events/upcoming?userType=${userType}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (data.events && data.events.length > 0) {
          setAllEvents(data.events);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading favorites:", error);
        setLoading(false);
      }
    };

    fetchFavoritesAndEvents();
  }, [userId]);

  const toggleFavoriteLocal = (eventId) => {
    setRemoving(eventId);
    if (typeof onToggleFavorite === 'function') {
      onToggleFavorite(eventId);
    }
    setTimeout(() => setRemoving(null), 300);
  };

  const favoriteEvents = allEvents.filter(e => favorites.includes(e._id));

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D7E5E0] p-8">
        <h2 className="text-3xl font-bold text-[#2D5F4F] mb-6">My Favorites</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (favoriteEvents.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D7E5E0] p-8 text-center">
        <NoFavoritesState />
        <button
          onClick={() => onViewChange("events")}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-[#2D5F4F] to-[#3A6F5F] text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300"
        >
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#2D5F4F]">My Favorite Events</h2>
        <div className="px-4 py-2 bg-gradient-to-r from-[#F5C4CA] to-[#FFD4DA] text-[#2D5F4F] font-bold rounded-full shadow-sm">
          {favoriteEvents.length} {favoriteEvents.length === 1 ? 'favorite' : 'favorites'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteEvents.map((item) => (
          <div
            key={item._id}
            className="group relative bg-white border-2 border-[#D7E5E0] rounded-2xl p-6 hover:shadow-xl hover:border-[#F5C4CA] transition-all duration-300"
          >
            {/* Type Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-[#F5C4CA] to-[#FFD4DA] text-[#2D5F4F] text-xs font-bold rounded-full shadow-sm">
              {item.type || 'Event'}
            </div>

            {/* Unfavorite Button */}
            <button
              onClick={() => toggleFavoriteLocal(item._id)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-[#FFF5F7] transition-all duration-300 shadow-md"
            >
              <Heart
                className={`w-5 h-5 ${
                  removing === item._id
                    ? "animate-pulse text-red-400"
                    : "fill-red-500 text-red-500"
                }`}
              />
            </button>

            {/* Content */}
            <div className="mt-10 space-y-3">
              <h3 className="text-xl font-bold text-[#2D5F4F] line-clamp-2">
                {item.name || item.title}
              </h3>

              <div className="flex items-center gap-2 text-[#6B8E7F]">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {formatDate(item.date || item.startDate || item.startDateTime)}
                </span>
              </div>

              {item.location && (
                <div className="flex items-center gap-2 text-[#6B8E7F]">
                  <span className="w-4 h-4 flex-shrink-0">📍</span>
                  <span className="text-sm font-medium line-clamp-1">{item.location}</span>
                </div>
              )}

              {item.description && (
                <p className="text-sm text-[#4A7B6B] line-clamp-2 mt-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Staff Dashboard
// Main Staff Dashboard
export const StaffDashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState("events");
  const eventsRef = useRef(null);
  const currentUser = user || JSON.parse(localStorage.getItem("user"));
  
  // Initialize favorites from localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);
  
  // Toggle favorite function
  const toggleFavorite = (eventId) => {
    setFavorites(prev => {
      const updated = prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId];
      return updated;
    });
  };

  const navigation = [
    { name: "Browse Events", icon: <Calendar className="w-4 h-4" />, view: "events" },
    { name: "My Registrations", icon: <User className="w-4 h-4" />, view: "registrations" },
    { name: "My Favorites", icon: <Heart className="w-4 h-4" />, view: "favorites" },
    { name: "Register", icon: <User className="w-4 h-4" />, view: "register" },
    { name: "Gym Schedule", icon: <Clock className="w-4 h-4" />, view: "gym" },
    { 
      name: "Polls", 
      view: "polls",
      icon: <Vote className="w-4 h-4" />
    },
    { 
      name: 'Vendor Partners', 
      view: 'vendorPartners',
      icon: <Store className="w-4 h-4" />
    },
   
    { 
          name: 'Lost & Found', 
          view: 'lostAndFound',
          icon: <Package className="w-4 h-4" />
        }
      
    
  ];

  return (
    <UnifiedDashboardLayout
      user={currentUser}
      onLogout={onLogout}
      navigation={navigation}
      currentView={currentView}
      onViewChange={setCurrentView}
      title="Staff Dashboard"
      onSearchResults={(results) => {
        if (eventsRef.current) eventsRef.current(results);
      }}
    >
{/* Browse Events View - Using new component */}
      {currentView === "events" && (
        <EventsView 
          onSearchHandlerRef={eventsRef}
          userId={currentUser?.id}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}
      {currentView === "favorites" && (
        <FavoritesView 
          userId={currentUser?.id}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewChange={setCurrentView}
        />
      )}
      {currentView === "registrations" && (
        <MyRegisteredEvents 
          email={currentUser?.email}
          userId={currentUser?.id} 
          userType={currentUser?.role} 
        />
      )}
      {currentView === "register" && (
        <Register 
          userId={currentUser?.id}
          userType={currentUser?.role}
          name={`${currentUser?.firstName} ${currentUser?.lastName}`}
          email={currentUser?.email}
        />
      )}
      {currentView === "gym" && <GymSchedule />}
      {currentView === "polls" && <PollsView />}
      {currentView === "vendorPartners" && (
  <div className="space-y-8">
    <VendorPartners layout="grid" />   {/* Add layout="grid" prop */}
  </div>
)}
 {currentView === "lostAndFound" && <LostAndFoundVisitor />}
    </UnifiedDashboardLayout>
  );
};

export default StaffDashboard;