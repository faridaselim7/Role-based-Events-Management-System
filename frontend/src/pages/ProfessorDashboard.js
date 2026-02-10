import React, { useEffect, useState, useRef } from "react";
import UnifiedDashboardLayout from "../components/UnifiedDashboardLayout";
import GymSchedule from "./GymSchedule";
import axios from "axios";
import { XCircle, Calendar, Clock, User, Award, Store, Heart, Star, Eye, MapPin,Package } from "lucide-react";
import MyRegisteredEvents from "./MyRegisteredEvents";
import Register from "./EventRegistration";
import useNotifications from "../stores/notifications";
import VendorPartners from "../components/VendorPartners";
import LostAndFoundVisitor from "./LostAndFoundVisitor";
import { 
  FullPageLoader, 
  CardSkeleton, 
  TableSkeleton, 
  NoWorkshopsState,
  NoEventsState,
  NoRegistrationsState,
  NoSearchResultsState 
} from '../components/LoadingEmptyStates';
import { colors } from "../styles/colors";
import { Vote } from "lucide-react"; // Add this icon
import PollsView from "../components/PollsView";
import WorkshopParticipantsView from "../components/WorkshopParticipantsView";
import { Users } from "lucide-react";
import EventFilterSort from '../components/EventFilterSort'; 
import useAllEventNotifications from "../hooks/useAllEventNotifications";
import { Toaster, toast } from "sonner";
import EventsView from "./BrowseEvents";
import { 
  NoFavoritesState
  
} from '../components/LoadingEmptyStates';

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};


// Unified VendorsSection with Voting (used in events & workshops)
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
      alert("You have already voted for this vendor.");
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
        if (!res.ok) throw new Error("Failed to record vote");
        return res.json();
      })
      .then((data) => {
        if (data.vendors) {
          setVendors(data.vendors);
        } else {
          setVendors((prev) =>
            prev.map((v) =>
              v._id === vendorId ? { ...v, votes: (v.votes || 0) + 1 } : v
            )
          );
        }
        setVotedVendors((prev) => new Set([...prev, vendorId]));
        alert("Your vote has been recorded!");
      })
      .catch((err) => {
        alert("Error: " + err.message);
      });
  };
  // Add at the top of ProfessorDashboard.js
const fetchProfessorNames = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const responses = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`http://localhost:5001/api/users/${id}`);
        if (!res.ok) return null;
        const prof = await res.json();
        return `${prof.firstName} ${prof.lastName}`.trim();
      } catch {
        return null;
      }
    })
  );
  return responses.filter(Boolean);
};
  if (loading) return <p className="text-gray-500 mt-3">Loading vendors...</p>;
  if (vendors.length === 0) return <p className="text-gray-500 mt-3">No vendors available for voting.</p>;

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-800 mb-2">Vendor Poll:</h4>
      <ul className="space-y-2">
        {vendors.map((vendor) => (
          <li
            key={vendor._id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
          >
            <span className="font-medium text-gray-800">
              {vendor.name}{" "}
              {vendor.votes !== undefined && (
                <span className="text-sm text-gray-600">({vendor.votes} votes)</span>
              )}
            </span>
            <button
              onClick={() => handleVote(vendor._id)}
              disabled={votedVendors.has(vendor._id)}
              className={`px-4 py-1.5 text-sm font-medium rounded transition ${
                votedVendors.has(vendor._id)
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
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

export default function ProfessorDashboard({ user, onLogout }) {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("workshops");
  const [events, setEvents] = useState({ bazaars: [], trips: [] });
  const [filteredEvents, setFilteredEvents] = useState({ bazaars: [], trips: [] });
  const eventsRef = useRef(null);
  const currentUser = user || JSON.parse(localStorage.getItem("user"));
  const { addNotification } = useNotifications();
  useAllEventNotifications("professor");

  const [filteredWorkshops, setFilteredWorkshops] = useState([]);
  const [filteredBrowseEvents, setFilteredBrowseEvents] = useState([]);
  
  // Favorites state
  const [favorites, setFavorites] = useState([]);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [activeWorkshop, setActiveWorkshop] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const [createPayload, setCreatePayload] = useState({
    title: "",
    location: "GUC Cairo",
    facultyResponsible: "MET",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    capacity: "",
    requiredBudget: "",
    fundingSource: "GUC-Funded",
    description: "",
    professorsParticipatingNames: "",   // 👈 NEW
    fullAgenda: "",
    extraResources: "",
    price: "",   // ← ADD THIS LINE
  });

  const token = localStorage.getItem("token");

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem(`favorites_${currentUser?.id}`);
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error("Error parsing favorites:", e);
        setFavorites([]);
      }
    }
  }, [currentUser?.id]);

  // Toggle favorite function
  const handleToggleFavorite = async (eventId) => {
    const isFavorite = favorites.includes(eventId);
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== eventId);
    } else {
      newFavorites = [...favorites, eventId];
    }
    
    setFavorites(newFavorites);
    
    // Persist to localStorage
    localStorage.setItem(`favorites_${currentUser?.id}`, JSON.stringify(newFavorites));
    
    // Optionally sync with backend
    try {
      await fetch(`http://localhost:5001/api/users/${currentUser?.id}/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ favorites: newFavorites }),
      });
    } catch (err) {
      console.error("Error syncing favorites with server:", err);
      // Favorites are still saved locally, so no need to revert
    }

    // Show toast notification
    if (isFavorite) {
      toast.info("Removed from favorites");
    } else {
      toast.success("Added to favorites");
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchWorkshopStatusUpdates = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/notifications/workshop-status");
        const updates = await res.json();

        updates.forEach((update) => {
          addNotification({
            id: update.id,
            type: "workshop-status",
            message:
              update.status === "accepted"
                ? `✅ Your workshop "${update.title}" has been accepted.`
                : `❌ Your workshop "${update.title}" has been rejected.`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        });
      } catch (err) {
        console.error("Error fetching workshop status notifications", err);
      }
    };

    fetchWorkshopStatusUpdates();

    // Optional: recheck every minute for updates
    const interval = setInterval(fetchWorkshopStatusUpdates, 60 * 1000);
    return () => clearInterval(interval);
  }, [addNotification]);

 // useEffect(() => {
   // const fetchNewEvents = async () => {
     // try {
       // const res = await fetch("http://localhost:5001/api/notifications/new-events");
        //const newEvents = await res.json();

        //newEvents.forEach((event) => {
          //addNotification({
            //id: event.id,
            //type: "new-event",
            //message: `📢 New event added: "${event.title}" on ${event.date}`,
            //read: false,
            //createdAt: new Date().toISOString(),
          //});
        //});
      //} catch (err) {
        //console.error("Error fetching new event notifications", err);
      //}
    //};

    //fetchNewEvents();
    //const interval = setInterval(fetchNewEvents, 60 * 1000);
    //return () => clearInterval(interval);
  //}, [addNotification]);

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;

        const res = await fetch(`http://localhost:5001/api/registrations/user/${user.id}`);
        const data = await res.json();
        const registeredEvents = data.events || [];

        const now = Date.now();

        registeredEvents.forEach((event) => {
          const eventTime = new Date(event.date).getTime();
          const oneDayBefore = eventTime - 24 * 60 * 60 * 1000;
          const oneHourBefore = eventTime - 60 * 60 * 1000;

          if (oneDayBefore > now) {
            setTimeout(() => {
              addNotification({
                id: `${event._id}-reminder-1d`,
                type: "event-reminder",
                message: `⏰ Reminder: "${event.title}" starts in 1 day.`,
                read: false,
                createdAt: new Date().toISOString(),
              });
            }, oneDayBefore - now);
          }

          if (oneHourBefore > now) {
            setTimeout(() => {
              addNotification({
                id: `${event._id}-reminder-1h`,
                type: "event-reminder",
                message: `⏰ Reminder: "${event.title}" starts in 1 hour.`,
                read: false,
                createdAt: new Date().toISOString(),
              });
            }, oneHourBefore - now);
          }
        });
      } catch (err) {
        console.error("Failed to fetch registered events:", err);
      }
    };

    fetchRegisteredEvents();
  }, [addNotification]);

useEffect(() => {
  async function loadProfessorNotifications() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5001/api/professor/notifications",
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        console.error(
          "Failed to load professor notifications",
          await res.text()
        );
        return;
      }

      const json = await res.json();

      // support both: [ ... ]  OR  { notifications: [ ... ] }
      const notificationsArray = json.notifications || json;

      if (!Array.isArray(notificationsArray)) {
        console.error(
          "Professor notifications: expected array, got",
          notificationsArray
        );
        return;
      }

      notificationsArray.forEach((n) => {
        // let backend decide the type, just forward it
        addNotification({
          id: n._id || n.id,
          type: n.type || "info",         // 'success', 'warning', etc. if backend sets it
          message: n.message || "",
          read: n.read ?? false,
          createdAt: n.createdAt || new Date().toISOString(),
        });
      });
    } catch (err) {
      console.error("Professor notifications error", err);
    }
  }

  loadProfessorNotifications();
}, [addNotification]);




  useEffect(() => {
    const fetchNewPartners = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/loyalty/new-partners");
        const data = await res.json();
        data.forEach(partner => {
          addNotification({
            id: partner.id,
            type: "new-loyalty-partner",
            message: `🎉 New GUC Loyalty Partner added: ${partner.name}`,
            read: false,
            createdAt: new Date(partner.addedAt).toISOString()
          });
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchNewPartners();
    const interval = setInterval(fetchNewPartners, 60 * 1000);
    return () => clearInterval(interval);
  }, [addNotification]);

  async function fetchEvents() {
    setEventsLoading(true);
    try {
      const bazaarsRes = await axios.get("http://localhost:5001/api/events/upcoming");
      const tripsRes = await axios.get("http://localhost:5001/api/events/upcoming");

      // Adjust according to your API response structure
      const allEvents = {
        bazaars: bazaarsRes.data.events || bazaarsRes.data || [],
        trips: tripsRes.data.events || tripsRes.data || [],
      };

      setEvents(allEvents);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setEventsLoading(false);
    }
  }

  async function fetchWorkshops() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5001/api/professor/workshops", {
        headers: token
          ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
          : { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load workshops");
      const data = await res.json();
      setWorkshops(data.workshops || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const openViewModal = (workshop) => {
  const formatted = {
    ...workshop,
    startDate: workshop.startDate ? new Date(workshop.startDate).toISOString().slice(0, 16) : "",
    endDate: workshop.endDate ? new Date(workshop.endDate).toISOString().slice(0, 16) : "",
    registrationDeadline: workshop.registrationDeadline
      ? new Date(workshop.registrationDeadline).toISOString().slice(0, 16)
      : "",
    price: workshop.price || 0,
    extraResources: workshop.extraResources || workshop.extraRequiredResources || "",
  };
  setActiveWorkshop(formatted);
  setIsEditing(false);
  setOpenModal(true);
};

  const closeModal = () => {
    setOpenModal(false);
    setActiveWorkshop(null);
    setIsEditing(false);
  };

  const handleEditToggle = () => setIsEditing((v) => !v);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setActiveWorkshop((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdits = async () => {
    if (!activeWorkshop?._id) return;

    const payload = {
      title: activeWorkshop.title,
      description: activeWorkshop.description,
      location: activeWorkshop.location,
      startDate: activeWorkshop.startDate,
      endDate: activeWorkshop.endDate,
      registrationDeadline: activeWorkshop.registrationDeadline,
      capacity: activeWorkshop.capacity,
      requiredBudget: activeWorkshop.requiredBudget,
      fundingSource: activeWorkshop.fundingSource,
      facultyResponsible: activeWorkshop.facultyResponsible,
      fullAgenda: activeWorkshop.fullAgenda,
      extraRequiredResources: activeWorkshop.extraResources,
      professorsParticipatingNames : activeWorkshop.professorsParticipatingNames || "",   // 👈 NEW,
      price: Number(activeWorkshop.price) || 0,
    };

    try {
  const res = await fetch(`http://localhost:5001/api/professor/workshops/${activeWorkshop._id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to save");
  }

  const json = await res.json();
  setWorkshops((prev) =>
    prev.map((w) => (w._id === activeWorkshop._id ? (json.workshop || json) : w))
  );
  toast.success("Workshop updated successfully!");
  closeModal();
} catch (err) {
  toast.error(err.message || "Error updating workshop.");
}

  };

const handleCreateSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(
      "http://localhost:5001/api/professor/workshops",
      createPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const createdWorkshop = response.data.workshop || response.data;

    setWorkshops((prev) => [...prev, createdWorkshop]);
    setOpenCreate(false);

    setCreatePayload({
      title: "",
      location: "GUC Cairo",
      facultyResponsible: "MET",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      capacity: "",
      requiredBudget: 0,
      fundingSource: "GUC-Funded",
      description: "",
      professorsParticipatingNames: "",   // 👈 NEW
      fullAgenda: "",
      extraResources: "",
      price: "",
    });

    toast.success("Workshop created successfully!");
  } catch (err) {
    toast.error(
      err.response?.data?.message || err.message || "Failed to create workshop."
    );
  }
};

// Ratings and Comments section for Events
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
 
// FavoritesView component


// Favorites View
const FavoritesView = ({ userId, favorites = [], onToggleFavorite, onViewChange }) => {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const fetchFavoritesAndEvents = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const userType = user?.role || 'Professor';
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

  // Loading state for entire dashboard
  if (loading && currentView === "workshops" && workshops.length === 0) {
    return <FullPageLoader message="Loading your workshops..." />;
  }

  return (
    <UnifiedDashboardLayout
      user={currentUser}
      onLogout={onLogout}
        navigation={[
    { 
      name: "My Workshops", 
      view: "workshops",
      icon: <Award className="w-4 h-4" />
    },
    { 
      name: "Gym Schedule", 
      view: "gym",
      icon: <Clock className="w-4 h-4" />
    },
    { 
      name: "Browse Events", 
      view: "events",
      icon: <Calendar className="w-4 h-4" />
    },
    { 
      name: "My Registrations", 
      view: "registrations",
      icon: <User className="w-4 h-4" />
    },
    { 
      name: "Register", 
      view: "register",
      icon: <User className="w-4 h-4" />   // or another icon you like
    },
    { 
      name: "Favorites", 
      view: "favorites",
      icon: <Heart className="w-4 h-4" />

    },
    { 
      name: "Polls", 
      view: "polls",
      icon: <Vote className="w-4 h-4" />
    },
    { 
      name: "Vendor Partners", 
      view: "vendorPartners",
      icon: <Store className="w-4 h-4" />
    },
    { 
              name: 'Lost & Found', 
              view: 'lostAndFound',
              icon: <Package className="w-4 h-4" />
            }
          
  ]}

      currentView={currentView}
      onViewChange={setCurrentView}
      title="Professor Dashboard"
      onSearchResults={(results) => {
        // Optional: handle global search
      }}
    >
      {/* ⬇️ Add toaster once here */}
      <Toaster position="bottom-right" richColors />
      
      {/* === Workshops View === */}
{currentView === "workshops" && (
  <div className="min-h-screen flex bg-white">

    {/* Main content */}
    <main className="flex-1 p-8">
        {/* ADD FILTER COMPONENT HERE */}
        {!loading && workshops.length > 0 && (
        <EventFilterSort
          events={workshops}
          onFilteredEventsChange={setFilteredWorkshops}
          eventType="workshop"
        />
      )}
      {/* Workshop list / empty state */}
      <section>
        {/* LOADING STATE */}
        {loading && (
          <div className="space-y-6">
            <CardSkeleton count={3} />
          </div>
        )}
        
        {/* ERROR STATE */}
        {error && (
          <div
            className="p-4 rounded-lg mb-6"
            style={{
              backgroundColor: '#ffe5e5',
              border: '1px solid #ffb3b3',
              color: '#b30000',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {/* EMPTY STATE */}
        {!loading && workshops.length === 0 && (
          <NoWorkshopsState onCreateClick={() => setOpenCreate(true)} />
        )}

        {/* WORKSHOPS LIST */}
        {/* WORKSHOPS LIST — WITH PARTICIPANTS BUTTON */}
{!loading && workshops.length > 0 && (
  <>
    {/* Create Workshop Button */}
    <div className="flex justify-center mb-8">
      <button
        onClick={() => setOpenCreate(true)}
        className="px-16 py-4 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
        style={{
          background: "#307B8E",
          color: "white",
        }}
      >
        + Create Workshop
      </button>
    </div>

    <div className="mt-6 space-y-8">
      {workshops.map((w) => (
        <div
          key={w._id}
          className="bg-white rounded-2xl shadow-xl border-2 border-[#307B8E]/20 p-8 hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              {/* Title + Status */}
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-2xl font-bold text-[#103A57]">
                  {w.title}
                </h3>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold ${
                    w.status === "approved"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : w.status === "published"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : w.status === "rejected"
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  }`}
                >
                  {w.status?.toUpperCase() || "PENDING"}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-gray-700">
                <div>
                  <strong className="text-[#307B8E]">Location</strong>
                  <p className="font-medium">{w.location}</p>
                </div>
                <div>
                  <strong className="text-[#307B8E]">Faculty</strong>
                  <p className="font-medium">{w.facultyResponsible}</p>
                </div>
                <div>
                  <strong className="text-[#307B8E]">Date</strong>
                  <p className="font-medium">{formatDateTime(w.startDate)}</p>
                </div>
                <div>
                  <strong className="text-[#307B8E]">Capacity</strong>
                  <p className="font-medium">
  {w.registeredCount || 0} / {w.capacity}
  <span className="block text-sm text-gray-500">
    {w.capacity - (w.registeredCount || 0)} spots left
  </span>
</p>
                </div>
              </div>

              {/* Rejection / Edit Request */}
              {w.status === "rejected" && w.rejectionReason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                  <p className="font-semibold text-red-800">Rejected</p>
                  <p className="text-red-700">{w.rejectionReason}</p>
                </div>
              )}
              {w.status === "needs_edit" && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="font-semibold text-yellow-800">Edits Requested</p>
                  <p className="text-yellow-700">{w.editRequest?.message || "Please update your workshop details"}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 lg:items-end">
              <button
                onClick={() => openViewModal(w)}
                className="w-60 px-6 py-3 bg-[#307B8E] text-white font-bold rounded-lg 
                          hover:bg-[#103A57] transition shadow-md flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                View Details
              </button>


              {/* NEW: View Participants Button */}
              <button
  onClick={() => {
    setActiveWorkshop(w);
    setCurrentView("participants");
  }}
  className="w-60 px-6 py-3 bg-green-600 text-white font-bold rounded-lg 
               hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2"
>
  <Users className="w-5 h-5" />
  View Participants ({w.registeredCount || w.participants?.length || 0})
</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)}
      </section>
    </main>
  </div>
)}

      {/* === Events View === */}
      {currentView === "events" && (
        <EventsView 
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
      
      {/* === Favorites View === */}
      {currentView === "favorites" && (
        <FavoritesView 
          userId={currentUser?.id}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onViewChange={setCurrentView}
        />
      )}

      {/* === Registrations === */}
      {currentView === "registrations" && (
        <MyRegisteredEvents 
          userId={currentUser?.id} 
          userType={currentUser?.role} 
          email={currentUser?.email}
        />
      )}

      {/* === Register === */}
      {currentView === "register" && (
        <Register
          userId={currentUser?.id}
          userType={currentUser?.role}
          name={`${currentUser?.firstName} ${currentUser?.lastName}`}
          email={currentUser?.email}
        />
      )}
      {currentView === "vendorPartners" && (
  <div className="space-y-8">
    <VendorPartners layout="grid" />   {/* Add layout="grid" prop */}
  </div>
)}

      {/* === Gym === */}
      {currentView === "gym" && <GymSchedule />}
      {currentView === "polls" && <PollsView />}  {/* ← NEW TAB */}
      {currentView === "participants" && activeWorkshop && (
  <WorkshopParticipantsView workshopId={activeWorkshop._id} />
)}

{openModal && activeWorkshop && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

      {/* Close button (icon in the corner) */}
      <button
        onClick={closeModal}
        className="absolute right-4 top-4 text-gray-300 hover:text-white z-10"
      >
        <XCircle className="w-7 h-7 drop-shadow" />
      </button>

      {/* Header */}
      <div className="rounded-t-2xl bg-[#307B8E] px-6 py-5 text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] opacity-80">
              Workshop Overview
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {activeWorkshop.title}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2 text-xs md:text-sm text-white/90">
              {activeWorkshop.facultyResponsible && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">
                  Faculty: {activeWorkshop.facultyResponsible}
                </span>
              )}
              {activeWorkshop.location && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">
                  Location: {activeWorkshop.location}
                </span>
              )}
              {activeWorkshop.startDate && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">
                  Starts: {formatDateTime(activeWorkshop.startDate)}
                </span>
              )}
            </div>
          </div>

          {/* Status pill */}
          <div className="mt-2 md:mt-0">
            <span
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm
                ${
                  activeWorkshop.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : activeWorkshop.status === "published"
                    ? "bg-blue-100 text-blue-800"
                    : activeWorkshop.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
            >
              {activeWorkshop.status
                ? activeWorkshop.status.toUpperCase()
                : "PENDING"}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-6">

        {/* Top grid: main info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {/* Location */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Location
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {activeWorkshop.location}
              </p>
            ) : (
              <select
                name="location"
                value={activeWorkshop.location}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              >
                <option>GUC Cairo</option>
                <option>GUC Berlin</option>
              </select>
            )}
          </div>

          {/* Faculty */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Faculty responsible
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {activeWorkshop.facultyResponsible}
              </p>
            ) : (
              <select
                name="facultyResponsible"
                value={activeWorkshop.facultyResponsible}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              >
                <option>MET</option>
                <option>IET</option>
                <option>EMS</option>
                <option>ARCH</option>
                <option>Civil</option>
                <option>MGT</option>
                <option>BI</option>
                <option>LAW</option>
                <option>Pharmacy</option>
                <option>AA</option>
              </select>
            )}
          </div>

          {/* Capacity */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Capacity
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {activeWorkshop.capacity}
              </p>
            ) : (
              <input
                type="number"
                name="capacity"
                value={activeWorkshop.capacity}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </div>

          {/* Start date */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Start date
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatDateTime(activeWorkshop.startDate)}
              </p>
            ) : (
              <input
                type="datetime-local"
                name="startDate"
                value={activeWorkshop.startDate}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </div>

          {/* End date */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              End date
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatDateTime(activeWorkshop.endDate)}
              </p>
            ) : (
              <input
                type="datetime-local"
                name="endDate"
                value={activeWorkshop.endDate}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </div>

          {/* Registration deadline */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Registration deadline
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatDateTime(activeWorkshop.registrationDeadline)}
              </p>
            ) : (
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={activeWorkshop.registrationDeadline}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </div>

          {/* Required budget */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Required budget
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {activeWorkshop.requiredBudget}
              </p>
            ) : (
              <input
                type="number"
                name="requiredBudget"
                min={0}
                value={activeWorkshop.requiredBudget}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </div>

          {/* Workshop fees */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Workshop fees
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {activeWorkshop.price ?? "—"}
              </p>
            ) : (
              <input
                type="number"
                name="price"
                min={0}
                value={activeWorkshop.price}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setActiveWorkshop((prev) => ({ ...prev, price: "" }));
                    return;
                  }
                  const numeric = Number(value);
                  if (!isNaN(numeric)) {
                    setActiveWorkshop((prev) => ({
                      ...prev,
                      price: Math.max(0, numeric),
                    }));
                  }
                }}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </div>

          {/* Funding source */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Funding source
            </p>
            {!isEditing ? (
              <p className="mt-1 text-sm font-medium text-gray-900">
                {activeWorkshop.fundingSource}
              </p>
            ) : (
              <select
                name="fundingSource"
                value={activeWorkshop.fundingSource}
                onChange={handleFieldChange}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              >
                <option>GUC-Funded</option>
                <option>Externally-Funded</option>
              </select>
            )}
          </div>
        </div>

        {/* Long text sections */}
        <div className="space-y-5 text-sm">
          {/* Description */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Description
            </h4>
            {!isEditing ? (
              <p className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 whitespace-pre-line text-gray-800">
                {activeWorkshop.description || "—"}
              </p>
            ) : (
              <textarea
                name="description"
                value={activeWorkshop.description || ""}
                onChange={handleFieldChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </section>

          {/* Professors */}
          <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Participating professors
          </h4>
          {!isEditing ? (
            <p className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-gray-800">
              {activeWorkshop.professorsParticipatingNames || "—"}
            </p>
          ) : (
            <input
              name="professorsParticipatingNames"   // 👈 use the correct key
              value={activeWorkshop.professorsParticipatingNames || ""}
              onChange={handleFieldChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              placeholder="Comma-separated list"
            />
          )}
        </section>

          {/* Full agenda */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Full agenda
            </h4>
            {!isEditing ? (
              <p className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 whitespace-pre-line text-gray-800">
                {activeWorkshop.fullAgenda || "—"}
              </p>
            ) : (
              <textarea
                name="fullAgenda"
                value={activeWorkshop.fullAgenda || ""}
                onChange={handleFieldChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </section>

          {/* Extra resources */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Extra resources
            </h4>
            {!isEditing ? (
              <p className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 whitespace-pre-line text-gray-800">
                {activeWorkshop.extraResources || "—"}
              </p>
            ) : (
              <textarea
                name="extraResources"
                value={activeWorkshop.extraResources || ""}
                onChange={handleFieldChange}
                rows={2}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#307B8E]"
              />
            )}
          </section>
        </div>

        {/* Footer buttons */}
        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {!isEditing ? (
            <>
              <button
                onClick={closeModal}
                className="order-2 sm:order-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleEditToggle}
                className="order-1 sm:order-2 rounded-lg bg-[#307B8E] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#103A57] transition"
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={saveEdits}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 transition"
              >
                Save changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  closeModal();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
)}

      {/* === Create Workshop Modal === */}
      {openCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Workshop</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
  {/* Workshop Title */}
  <input
    required
    name="title"
    placeholder="Workshop Title"
    value={createPayload.title}
    onChange={(e) =>
      setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
    }
    className="w-full border rounded p-2"
  />

  {/* Workshop Fees – directly under title */}
  <input
    type="number"
    name="price"
    placeholder="Workshop Fees"
    value={createPayload.price}
    min={0}
    onKeyDown={(e) => {
      if (e.key === "-" || e.key === "e" || e.key === "E") {
        e.preventDefault(); // block negative & scientific notation
      }
    }}
    onChange={(e) => {
      const value = e.target.value;

      if (value === "") {
        setCreatePayload({ ...createPayload, price: "" });
        return;
      }

      const numeric = Number(value);
      if (!isNaN(numeric)) {
        setCreatePayload({
          ...createPayload,
          price: Math.max(0, numeric),
        });
      }
    }}
    className="w-full border rounded p-2"
    required
  />
              <div className="grid grid-cols-2 gap-3">
                <select
                  name="location"
                  value={createPayload.location}
                  onChange={(e) =>
                    setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
                  }
                  className="border rounded p-2"
                >
                  <option>GUC Cairo</option>
                  <option>GUC Berlin</option>
                </select>
                <select
                  name="facultyResponsible"
                  value={createPayload.facultyResponsible}
                  onChange={(e) =>
                    setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
                  }
                  className="border rounded p-2"
                >
                  <option>MET</option>
                  <option>IET</option>
                  <option>EMS</option>
                  <option>ARCH</option>
                  <option>Civil</option>
                  <option>MGT</option>
                  <option>BI</option>
                  <option>LAW</option>
                  <option>Pharmacy</option>
                  <option>AA</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
  {/* Start Date */}
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      Start Date
    </label>
    <input
      type="datetime-local"
      name="startDate"
      value={createPayload.startDate}
      onChange={(e) =>
        setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
      }
      className="border rounded p-2 w-full"
      required
    />
  </div>

  {/* End Date */}
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      End Date
    </label>
    <input
      type="datetime-local"
      name="endDate"
      value={createPayload.endDate}
      onChange={(e) =>
        setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
      }
      className="border rounded p-2 w-full"
      required
    />
  </div>

  {/* Registration Deadline */}
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      Registration Deadline
    </label>
    <input
      type="datetime-local"
      name="registrationDeadline"
      value={createPayload.registrationDeadline}
      onChange={(e) =>
        setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
      }
      className="border rounded p-2 w-full"
      required
    />
  </div>
</div>

            
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  name="capacity"
                  placeholder="Capacity"
                  value={createPayload.capacity}
                  min={10} 
                  onChange={(e) =>
                    setCreatePayload({ ...createPayload, [e.target.name]: Number(e.target.value) })
                  }
                  className="border rounded p-2"
                  required
                />
                <input
                  type="number"
                  name="requiredBudget"
                  placeholder="Budget"
                  value={createPayload.requiredBudget}
                  min={0} 
                  onChange={(e) =>
                    setCreatePayload({ ...createPayload, [e.target.name]: Number(e.target.value) })
                  }
                  className="border rounded p-2"
                  required
                />
              </div>
              <select
                name="fundingSource"
                value={createPayload.fundingSource}
                onChange={(e) =>
                  setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
                }
                className="w-full border rounded p-2"
              >
                <option>GUC-Funded</option>
                <option>Externally-Funded</option>
              </select>
              <textarea
                name="description"
                placeholder="Description"
                value={createPayload.description}
                onChange={(e) =>
                  setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
                }
                rows={3}
                className="w-full border rounded p-2"
              />
              <input
                name="professorsParticipatingNames"
                placeholder="Professors (comma-separated)"
                value={createPayload.professorsParticipatingNames}
                onChange={(e) =>
                  setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
                }
                className="w-full border rounded p-2"
              />
              <textarea
                name="fullAgenda"
                placeholder="Full Agenda"
                value={createPayload.fullAgenda}
                onChange={(e) =>
                  setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
                }
                rows={4}
                className="w-full border rounded p-2"
              />
              <textarea
                name="extraResources"
                placeholder="Extra Resources"
                value={createPayload.extraResources}
                onChange={(e) =>
                  setCreatePayload({ ...createPayload, [e.target.name]: e.target.value })
                }
                rows={2}
                className="w-full border rounded p-2"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {currentView === "lostAndFound" && <LostAndFoundVisitor />}
    </UnifiedDashboardLayout>
  );
}