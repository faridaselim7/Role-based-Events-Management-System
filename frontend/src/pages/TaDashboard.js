import React, { useState, useRef, useEffect } from "react";
import { Calendar, Clock, User, Heart, Store, Vote, Package} from "lucide-react";
import GymSchedule from "./GymSchedule";
import UnifiedDashboardLayout from "../components/UnifiedDashboardLayout";
import MyRegisteredEvents from "./MyRegisteredEvents";
import Register from "./EventRegistration";
import VendorPartners from "../components/VendorPartners";
import PollsView from "../components/PollsView";
import useAllEventNotifications from "../hooks/useAllEventNotifications";
import LostAndFoundVisitor from "./LostAndFoundVisitor";
// Import the new BrowseEvents component
import EventsView from "./BrowseEvents";

import { 
  NoFavoritesState,
  CardSkeleton
} from '../components/LoadingEmptyStates';

// Safe date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

// Main TA Dashboard
export const TADashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState("events");
  const [favorites, setFavorites] = useState([]);
  const eventsRef = useRef(null);
  
  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  // Load favorites on mount
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);
  
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

  useAllEventNotifications("ta");

  return (
    <UnifiedDashboardLayout
      user={currentUser}
      onLogout={onLogout}
      navigation={navigation}
      currentView={currentView}
      onViewChange={setCurrentView}
      title="TA Dashboard"
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

      {/* My Registrations */}
      {currentView === "registrations" && (
        <MyRegisteredEvents 
          userId={currentUser?.id} 
          userType={currentUser?.role} 
          email={currentUser?.email}
        />
      )}

      {/* My Favorites */}
      {currentView === "favorites" && (
        <FavoritesView 
          userId={currentUser?.id}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewChange={setCurrentView}
        />
      )}

      {/* Gym Schedule */}
      {currentView === "gym" && <GymSchedule />}

      {/* Register */}
      {currentView === "register" && (
        <Register 
          userId={currentUser?.id}
          userType={currentUser?.role}
          name={`${currentUser?.firstName} ${currentUser?.lastName}`}
          email={currentUser?.email}
        />
      )}

      {/* Polls */}
      {currentView === "polls" && <PollsView />}

      {/* Vendor Partners */}
      {currentView === "vendorPartners" && (
        <div className="space-y-8">
          <VendorPartners layout="grid" />
        </div>
      )}
         {currentView === "lostAndFound" && <LostAndFoundVisitor />}
    </UnifiedDashboardLayout>
  );
};

// Favorites View Component
const FavoritesView = ({ userId, favorites = [], onToggleFavorite, onViewChange }) => {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const fetchFavoritesAndEvents = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const userType = user?.role || 'TA';
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

export default TADashboard;