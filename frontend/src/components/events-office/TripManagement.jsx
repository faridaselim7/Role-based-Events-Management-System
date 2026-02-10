// frontend/src/components/events-office/TripManagement.jsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Plus, Edit, Trash2, Archive, Download , Calendar, ChevronLeft, ChevronRight} from "lucide-react";
import axios from "axios";
import { exportRegistrationsToExcel } from "../../utils/exportToExcel";
import { CardSkeleton, NoTripsState } from "../LoadingEmptyStates";
import EOfiltersort from "../EOfiltersort"; // ✅ we use it again

// EO design system imports for outer layer + cards
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
    EOformStyles, 
} from "../../styles/EOdesignSystem";

const USER_TYPE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "ta", label: "TA" },
  { value: "professor", label: "Professor" },
];

const roleHeader = { headers: { "x-role": "events_office" } };
const CalendarRangePicker = ({ onDateRangeChange, startDate, endDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const handleDateClick = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
  
    if (isSelectingStart) {
      setTempStartDate(selectedDate);
      setTempEndDate(null);
      setIsSelectingStart(false);
    } else {
      if (selectedDate < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(selectedDate);
      } else {
        setTempEndDate(selectedDate);
      }
      setIsSelectingStart(true);
    }
  };
  
  const confirmDates = () => {
    if (tempStartDate) {
      onDateRangeChange(tempStartDate, tempEndDate);
    }
    setShowCalendar(false);
  };
  
  const handleOpenCalendar = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsSelectingStart(!startDate);
    setShowCalendar(true);
  };
  
  const isInRange = (day) => {
    const displayStart = tempStartDate || startDate;
    const displayEnd = tempEndDate || endDate;
    if (!displayStart || !displayEnd) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= displayStart && date <= displayEnd;
  };
  
  const isStartDate = (day) => {
    const displayStart = tempStartDate || startDate;
    if (!displayStart) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === displayStart.toDateString();
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.calendar-container')) {
        setShowCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const isEndDate = (day) => {
    const displayEnd = tempEndDate || endDate;
    if (!displayEnd) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === displayEnd.toDateString();
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const resetDates = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    onDateRangeChange(null, null);
    setIsSelectingStart(true);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpenCalendar}
        className="w-full px-3 py-2 border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B4D4C8]/30 focus:border-[#3A6F5F] flex items-center justify-between hover:border-[#3A6F5F] transition-all"
      >
        <span className="text-[#2D5F4F]">
          {startDate && endDate 
            ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
            : startDate
            ? `${startDate.toLocaleDateString()} - ...`
            : 'Select date range'}
        </span>
        <Calendar className="w-4 h-4 text-[#6B8E7F]" />
      </button>

      {showCalendar && (
        <div className="calendar-container absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-xl border-2 border-[#D7E5E0] p-4 min-w-[320px]">
          <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs">
            <p className="text-gray-600">
              <strong>Start:</strong> {tempStartDate ? tempStartDate.toLocaleDateString() : 'Not selected'}
            </p>
            <p className="text-gray-600">
              <strong>End:</strong> {tempEndDate ? tempEndDate.toLocaleDateString() : 'Not selected'}
            </p>
            <p className="font-semibold text-blue-600 mt-1">
              {isSelectingStart ? 'Click to select START date' : 'Click to select END date'}
            </p>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-3">
              <button onClick={previousMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold">{monthName}</h3>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="h-8"></div>
              ))}

              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-8 w-8 flex items-center justify-center text-xs font-medium rounded-full transition ${
                    isStartDate(day)
                      ? 'bg-blue-500 text-white'
                      : isEndDate(day)
                      ? 'bg-blue-800 text-white'
                      : isInRange(day)
                      ? 'bg-blue-100 text-blue-800'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            {(tempStartDate || tempEndDate) && (
              <button
                onClick={resetDates}
                className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium text-xs"
              >
                Reset
              </button>
            )}
            <button
              onClick={confirmDates}
              className="flex-1 py-1.5 bg-[#2D5F4F] text-white rounded hover:bg-[#3A6F5F] font-medium text-xs"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function TripManagement() {
  const [trips, setTrips] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter states - exactly like Bazaar
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterName, setFilterName] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    startDateTime: "",
    endDateTime: "",
    description: "",
    capacity: "",
    registrationDeadline: "",
    allowedUserTypes: [],
  });


  // ⭐ FEEDBACK MODAL STATE
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [selectedTripForFeedback, setSelectedTripForFeedback] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5001/api/events/trips");
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tripData = {
        ...formData,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        allowedUserTypes: formData.allowedUserTypes || [],
      };
      if (editingTrip) {
        await axios.put(
          `http://localhost:5001/api/events/trips/${editingTrip._id}`,
          tripData
        );
      } else {
        await axios.post("http://localhost:5001/api/events/trips", tripData);
      }
      setOpen(false);
      setEditingTrip(null);
      fetchTrips();
      resetForm();
    } catch (error) {
      console.error("Error saving trip:", error);
    }
  };

  const handleEdit = (trip) => {
    const formatDate = (dateString) =>
      new Date(dateString).toISOString().slice(0, 16);
    setEditingTrip(trip);
    setFormData({
      name: trip.name,
      location: trip.location,
      price: trip.price.toString(),
      startDateTime: formatDate(trip.startDateTime),
      endDateTime: formatDate(trip.endDateTime),
      description: trip.description,
      capacity: trip.capacity.toString(),
      registrationDeadline: trip.registrationDeadline
        ? formatDate(trip.registrationDeadline)
        : "",
      allowedUserTypes: trip.allowedUserTypes || [],
    });
    setOpen(true);
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    try {
      await axios.delete(
        `http://localhost:5001/api/events/trips/${id}`,
        roleHeader
      );
      fetchTrips();
    } catch (error) {
      const msg =
        error?.response?.data?.message || error.message || "Delete failed";
      alert(`Delete failed: ${msg}`);
      console.error("Error deleting trip:", error);
    }
  };

  const handleArchiveTrip = async (id, archive = true) => {
    try {
      if (archive) {
        await axios.patch(
          `http://localhost:5001/api/events/${id}/archive`,
          {},
          roleHeader
        );
      }
      await fetchTrips();
      if (archive) {
        setShowArchived(true);
      } else {
        setShowArchived(false);
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message || error.message || "Archive failed";
      alert(`Archive failed: ${msg}`);
      console.error("Error archiving trip:", error);
    }
  };

  // FETCH FEEDBACK FOR SELECTED TRIP
  const handleViewFeedback = async (trip) => {
    setSelectedTripForFeedback(trip);
    setFeedbackOpen(true);
    setFeedbackLoading(true);

    try {
      // ✅ Uses /reviews endpoint
      const response = await axios.get(
        `http://localhost:5001/api/events/${trip._id}/reviews`
      );

      // ✅ Access data.reviews
      setFeedbackData(response.data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setFeedbackData([]);
      alert("Failed to load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleExportRegistrations = async (tripId, tripName) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/registrations/event/${tripId}`,
        roleHeader
      );
      const registrations = response.data.data || response.data || [];

      if (registrations.length === 0) {
        alert("No registrations found for this trip");
        return;
      }

      exportRegistrationsToExcel(registrations, tripName, "trip");
    } catch (error) {
      console.error("Error fetching registrations:", error);
      alert("Failed to export registrations. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      price: "",
      startDateTime: "",
      endDateTime: "",
      description: "",
      capacity: "",
      registrationDeadline: "",
      allowedUserTypes: [],
    });
  };

  const handleUserTypeToggle = (userType) => {
    setFormData((prev) => {
      const current = prev.allowedUserTypes || [];
      if (current.includes(userType)) {
        return { ...prev, allowedUserTypes: current.filter((t) => t !== userType) };
      } else {
        return { ...prev, allowedUserTypes: [...current, userType] };
      }
    });
  };

  const currentDate = new Date();

  // ✅ Memoized lists so EOfiltersort doesn't cause infinite loops
  const activeTrips = useMemo(
    () => trips.filter((t) => !t.archived || t.archived === false),
    [trips]
  );

  const archivedTrips = useMemo(
    () => trips.filter((t) => t.archived === true),
    [trips]
  );

  const displayedTrips = useMemo(
    () => (showArchived ? archivedTrips : activeTrips),
    [showArchived, activeTrips, archivedTrips]
  );
  const uniqueNames = [...new Set(displayedTrips.map(t => t.name).filter(Boolean))].sort();
  const uniqueLocations = [...new Set(displayedTrips.map(t => t.location).filter(Boolean))].sort();

  // Filtering logic - identical to Bazaar
  useEffect(() => {
    let filtered = [...displayedTrips];

    if (filterName !== 'all') filtered = filtered.filter(t => t.name === filterName);
    if (filterLocation !== 'all') filtered = filtered.filter(t => t.location === filterLocation);

    if (startDateFilter || endDateFilter) {
      filtered = filtered.filter(t => {
        const tripDate = new Date(t.startDateTime);
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          if (tripDate < start) return false;
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          if (tripDate > end) return false;
        }
        return true;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.startDateTime);
      const dateB = new Date(b.startDateTime);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredTrips(filtered);
  }, [displayedTrips, filterName, filterLocation, startDateFilter, endDateFilter, sortOrder]);

  const tripsToRender = filteredTrips;

  const hasAnyTrips = trips.length > 0;

  const isPastEvent = (trip) => {
    const endDate = new Date(trip.endDateTime);
    return endDate < currentDate;
  };
  



  // LOADING STATE
  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-[#1D3309]">
                Trip Management
              </CardTitle>
              <p className="text-[#1D3309] mt-1">
                Create and manage student trips
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            <CardSkeleton count={3} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{`
        @keyframes tripSlideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tripSlideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .trip-container { animation: tripSlideInDown 0.4s ease-out; }
        .trip-card {
          transition: ${EOtransitions.normal};
          animation: tripSlideInUp 0.3s ease-out;
        }
        .trip-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
          [data-radix-card-header] {
          padding-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="trip-container">
        <Card
          style={{
            ...EOcardStyles.base,
            border: `2px solid ${EOcolors.lightSilver}`,
          }}
          className="border-0 shadow-none bg-transparent"
        >
          <CardHeader className="px-0 pb-2 border-b border-border/40">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                              <CardTitle
                                style={{
                                  fontSize: "1.75rem",
                                  fontWeight: "800",
                                  color: EOcolors.secondary,
                                  marginBottom: "0.5rem",
                                }}
                              >
                                Trip Management
                              </CardTitle>
                              <p
                                style={{
                                  color: EOcolors.text.secondary,
                                  fontSize: "0.9375rem",
                                }}
                              >
                                Create and manage student trips
                              </p>
                            </div>
              {hasAnyTrips && (
                <button
                  onClick={() => {
                    setEditingTrip(null);
                    resetForm();
                    setOpen(true);
                  }}
                  style={{
                    ...EObuttonStyles.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Plus style={{ width: "1.125rem", height: "1.125rem" }} />
                  Create Trip
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-4">
            {/* EMPTY STATE - No trips at all */}
            {!hasAnyTrips ? (
              <NoTripsState onCreateClick={() => setOpen(true)} />
            ) : (
              <>
                {/* Tabs (Active / Archived) */}
             {/* Tabs (Active / Archived) + Filters Button */}
             <div className="mb-4 mt-6 flex justify-between items-center gap-3 flex-wrap">
                <div className="flex gap-2">
    <button
      onClick={() => {
        setShowArchived(false);
        setFilteredTrips([]);
      }}
      style={{
        ...(!showArchived ? EObuttonStyles.primary : EObuttonStyles.outline),
        padding: "0.65rem 1.25rem",
        fontSize: "0.9375rem",
        fontWeight: 600,
        borderRadius: EOradius.lg,
      }}
    >
      Active ({activeTrips.length})
    </button>
    <button
      onClick={() => {
        setShowArchived(true);
        setFilteredTrips([]);
      }}
      style={{
        ...(showArchived ? EObuttonStyles.primary : EObuttonStyles.outline),
        padding: "0.65rem 1.25rem",
        fontSize: "0.9375rem",
        fontWeight: 600,
        borderRadius: EOradius.lg,
      }}
    >
      Archived ({archivedTrips.length})
    </button>
    </div>

    {/* Filters Button - Now inline with tabs, no badge */}
    {displayedTrips.length > 0 && (
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          ...(showFilters ? EObuttonStyles.primary : EObuttonStyles.outline),
          padding: "0.65rem 1.25rem",
          fontSize: "0.9375rem",
          fontWeight: 600,
          borderRadius: EOradius.lg,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
      </button>
    )}
  </div>

{/* Filter Panel - Still shows active count visually */}
{showFilters && displayedTrips.length > 0 && (
  <div className="mb-6 p-5 bg-white rounded-xl border-2" style={{ borderColor: EOcolors.lightSilver }}>
    <div className="flex flex-wrap items-center gap-4">
      

      {uniqueNames.length > 0 && (
        <select
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="all">All Trips</option>
          {uniqueNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      )}

      {uniqueLocations.length > 0 && (
        <select
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="all">All Locations</option>
          {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      )}

      <div className="w-64">
        <CalendarRangePicker
          onDateRangeChange={(s, e) => { setStartDateFilter(s); setEndDateFilter(e); }}
          startDate={startDateFilter}
          endDate={endDateFilter}
        />
      </div>

      <select
        value={sortOrder}
        onChange={e => setSortOrder(e.target.value)}
        className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      {(filterName !== 'all' || filterLocation !== 'all' || startDateFilter || endDateFilter) && (
        <button
          onClick={() => {
            setFilterName('all');
            setFilterLocation('all');
            setStartDateFilter(null);
            setEndDateFilter(null);
          }}
          className="px-4 py-2 text-[#3A6F5F] hover:text-[#2D5F4F] font-semibold transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  </div>
)}

                {/* EMPTY STATE FOR CURRENT VIEW (Active/Archived) */}
                {((showArchived && archivedTrips.length === 0) ||
                (!showArchived && activeTrips.length === 0)) ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#EAECF0]">
                    <NoTripsState
                      onCreateClick={() => setOpen(true)}
                      title={showArchived ? "No Archived Trips" : "No Active Trips"}
                      description={
                        showArchived
                          ? "There are no archived trips in the system."
                          : "Get started by creating your first trip"
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tripsToRender.map((trip) => {
                      const isPast = isPastEvent(trip);
                      const startDate = new Date(trip.startDateTime);
                      const endDate = new Date(trip.endDateTime);

                      const formatDateRange = () => {
                        const startDay = startDate.getDate();
                        const endDay = endDate.getDate();
                        const startMonth = startDate
                          .toLocaleDateString("en-US", { month: "short" })
                          .toUpperCase();
                        const endMonth = endDate
                          .toLocaleDateString("en-US", { month: "short" })
                          .toUpperCase();

                        if (startMonth === endMonth && startDay === endDay) {
                          return `${startDay} ${startMonth}`;
                        } else if (startMonth === endMonth) {
                          return `${startDay} - ${endDay} ${startMonth}`;
                        } else {
                          return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
                        }
                      };

                      const timeString = startDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });

                      const statusStyle = trip.archived
                        ? EObadgeStyles.error
                        : isPast
                        ? EObadgeStyles.pending
                        : EObadgeStyles.success;

                      const statusLabel = trip.archived
                        ? "Archived"
                        : isPast
                        ? "Past Event"
                        : "Upcoming";

                      return (
                        <div
                          key={trip._id}
                          className="trip-card"
                          style={{
                            background: "white",
                            borderRadius: EOradius.xl,
                            border: `2px solid ${EOcolors.lightSilver}`,
                            padding: "1.5rem",
                            display: "flex",
                            gap: "1.5rem",
                            alignItems: "flex-start",
                            opacity: trip.archived ? 0.7 : 1,
                            boxShadow: EOshadows.sm,
                          }}
                        >
                          {/* Date & Time Box */}
                          <div
                            style={{
                              flexShrink: 0,
                              background: `linear-gradient(135deg, ${EOcolors.light}, ${EOcolors.pastel}20)`,
                              borderRadius: EOradius.lg,
                              padding: "1.1rem",
                              textAlign: "center",
                              minWidth: "110px",
                              border: `2px solid ${EOcolors.lightSilver}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: EOcolors.text.muted,
                                marginBottom: "0.4rem",
                              }}
                            >
                              {formatDateRange()}
                            </div>
                            <div
                              style={{
                                fontSize: "2rem",
                                fontWeight: 800,
                                color: EOcolors.secondary,
                                lineHeight: 1,
                              }}
                            >
                              {timeString}
                            </div>
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                marginBottom: "0.75rem",
                              }}
                            >
                              <div>
                                <h3
                                  style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 800,
                                    color: EOcolors.secondary,
                                    margin: 0,
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  {trip.name}
                                  {trip.archived && (
                                    <span
                                      style={{
                                        marginLeft: "0.5rem",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        color: EOcolors.text.muted,
                                      }}
                                    >
                                      (Archived)
                                    </span>
                                  )}
                                </h3>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "0.9375rem",
                                    color: EOcolors.text.secondary,
                                  }}
                                >
                                  📍 {trip.location} &nbsp;•&nbsp; 💰 EGP{" "}
                                  {trip.price} &nbsp;•&nbsp; 👥 Capacity:{" "}
                                  {trip.capacity}
                                </p>
                              </div>

                              <span
                                style={{
                                  ...statusStyle,
                                  display: "inline-block",
                                }}
                              >
                                {statusLabel}
                              </span>
                            </div>

                            <p
                              style={{
                                color: EOcolors.text.secondary,
                                fontSize: "0.9rem",
                                marginBottom: "0.75rem",
                              }}
                              className="line-clamp-2"
                            >
                              {trip.description}
                            </p>

                            {trip.allowedUserTypes &&
                              trip.allowedUserTypes.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.4rem",
                                    marginBottom: "0.75rem",
                                  }}
                                >
                                  {trip.allowedUserTypes.map((type) => (
                                    <span
                                      key={type}
                                      style={{
                                        ...EObadgeStyles.info,
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              )}

                            {/* Action Buttons */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                                marginTop: "0.5rem",
                              }}
                            >
                              {!trip.archived &&
                                new Date(trip.startDateTime) > currentDate && (
                                  <button
                                    onClick={() => handleEdit(trip)}
                                    style={{
                                      ...EObuttonStyles.outline,
                                      padding: "0.4rem 0.9rem",
                                      fontSize: "0.85rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.4rem",
                                    }}
                                  >
                                    <Edit style={{ width: "1rem", height: "1rem" }} />
                                    Edit
                                  </button>
                                )}

                              {!trip.archived && isPast && (
                                <button
                                  onClick={() =>
                                    handleArchiveTrip(trip._id, true)
                                  }
                                  style={{
                                    ...EObuttonStyles.outline,
                                    padding: "0.4rem 0.9rem",
                                    fontSize: "0.85rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                  }}
                                >
                                  <Archive
                                    style={{ width: "1rem", height: "1rem" }}
                                  />
                                  Archive
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleExportRegistrations(trip._id, trip.name)
                                }
                                style={{
                                  ...EObuttonStyles.outline,
                                  padding: "0.4rem 0.9rem",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  borderColor: "#3B82F6",
                                  color: "#3B82F6",
                                }}
                              >
                                <Download
                                  style={{ width: "1rem", height: "1rem" }}
                                />
                                Export
                              </button>

                              <button
                                onClick={() => handleViewFeedback(trip)}
                                style={{
                                  ...EObuttonStyles.outline,
                                  padding: "0.4rem 0.9rem",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  borderColor: "#FACC15",
                                  color: "#B45309",
                                }}
                              >
                                ⭐ View Feedback
                              </button>

                              <button
                                onClick={() => handleDeleteTrip(trip._id)}
                                style={{
                                  ...EObuttonStyles.outline,
                                  padding: "0.4rem 0.9rem",
                                  fontSize: "0.85rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  borderColor: EOcolors.error,
                                  color: EOcolors.error,
                                  marginLeft: "auto",
                                }}
                              >
                                <Trash2
                                  style={{ width: "1rem", height: "1rem" }}
                                />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* CREATE / EDIT TRIP DIALOG — ORIGINAL VERSION RESTORED */}
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditingTrip(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-[96vw] w-full max-h-[96vh] overflow-y-auto
             sm:max-w-4xl 
             md:max-w-5xl 
             lg:max-w-6xl 
             xl:max-w-4xl 
             p-4 sm:p-6 lg:p-8 bg-white
             rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#1D3309]">
                {editingTrip ? "Edit" : "Create"} Trip
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-[#1D3309]">
                    Trip Name
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#1D3309]">
                    Location
                  </Label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-[#1D3309]">
                      Price (EGP)
                    </Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-[#1D3309]">
                      Capacity
                    </Label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-[#1D3309]">
                      Start Date &amp; Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.startDateTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDateTime: e.target.value,
                        })
                      }
                      className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-[#1D3309]">
                      End Date &amp; Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.endDateTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endDateTime: e.target.value,
                        })
                      }
                      className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#1D3309]">
                    Registration Deadline
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationDeadline: e.target.value,
                      })
                    }
                    className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#1D3309]">
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 w-full border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309] transition-all duration-200 hover:border-[#2A4A12]"
                    rows={3}
                    required
                  />
                </div>
                <div style={{ marginTop: "1rem" }}>
  <label style={EOformStyles.label}>
    Restrict to User Types (leave empty for all users)
  </label>
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "0.75rem",
      marginTop: "0.5rem",
    }}
  >
    {["Student", "Staff", "TA", "Professor"].map((userType) => (
      <label
        key={userType}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
      >
        <input
          type="checkbox"
          checked={(formData.allowedUserTypes || []).includes(userType)}
          onChange={() => handleUserTypeToggle(userType)}
        />
        <span>{userType}</span>
      </label>
    ))}
  </div>
  <p
    style={{
      fontSize: "0.75rem",
      color: EOcolors.text.secondary,
      marginTop: "0.25rem",
    }}
  >
    {formData.allowedUserTypes.length === 0
      ? "All user types can register"
      : `Only ${formData.allowedUserTypes.join(", ")} can register`}
  </p>
</div>

              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setOpen(false)}
                  variant="outline"
                  className="border-[#1D3309] text-[#1D3309] hover:bg-[#1D3309]/10 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1D3309] hover:bg-[#2A4A12] text-[#C7DA91] transition-all duration-200"
                >
                  {editingTrip ? "Save Changes" : "Create Trip"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* FEEDBACK DIALOG (unchanged logic / layout) */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent className="max-w-xl bg-white rounded-xl p-6 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#3B5C90]">
                Feedback — {selectedTripForFeedback?.name}
              </DialogTitle>
            </DialogHeader>

            {feedbackLoading ? (
              <p className="text-center py-6 text-gray-500">
                Loading feedback...
              </p>
            ) : feedbackData.length === 0 ? (
              <p className="text-center py-6 text-gray-500">
                No ratings or comments yet.
              </p>
            ) : (
              <div className="max-h-[350px] overflow-y-auto space-y-4 mt-4">
                {feedbackData.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <h4 className="font-semibold text-[#1F2937]">
                        {item.userName || "Anonymous"}
                      </h4>
                      <div className="text-yellow-500 font-bold">
                        {"⭐".repeat(item.rating)}
                      </div>
                    </div>

                    {item.comment && (
                      <p className="text-gray-700 mt-2">{item.comment}</p>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default TripManagement;
