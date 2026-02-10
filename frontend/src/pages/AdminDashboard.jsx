import React, { useState, useEffect } from "react";
import { 
  Trash2, Users, Shield, Calendar, BarChart3, Store, FileText, X, Star,
  Search, Filter, ChevronDown, ChevronUp, MapPin, Clock, Tag, SlidersHorizontal,
  Heart, Eye, RefreshCw, MessageCircle, ChevronRight, ChevronLeft
} from "lucide-react";

import { 
  NoUsersState, 
  NoAdminsState,
  EmptyState,
  NoEventsState,
  TableSkeleton,
} from '../components/LoadingEmptyStates';
import { createAdmin } from "../services/adminApi";
import DocumentManagement from "../components/events-office/DocumentManagement";
import UnifiedDashboardLayout from "../components/UnifiedDashboardLayout";
import VendorRequests from "../components/events-office/VendorRequests"; 
import VendorPartners from "../components/VendorPartners";

import EventAttendanceReport from "../components/events-office/EventAttendanceReport";
import SalesReport from "../components/events-office/SalesReport";
import EventFilterSort from "../components/EventFilterSort";
import LostAndFoundManagement from "./LostAndFoundManagement";

import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EOradius,
  EOtransitions,
} from "../styles/EOdesignSystem";
import {
  fetchAdmins,
  fetchAdminById,
  updateAdmin,
  deleteAdmin,
  fetchAllUsers,
  assignUserRole,
  fetchAllEvents,
  blockUser,
  unblockUser,
} from "../services/adminApi";
import { api } from "../lib/api";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "TBD" : date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "TBD" : date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};


const UserTabs = ({ active, onChange, pendingCount, allCount }) => (
  <div className="flex gap-2 mb-6">
    <button
      onClick={() => onChange("pending")}
      className={`px-4 py-2 rounded-lg ${
        active === "pending" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      Pending ({pendingCount})
    </button>
    <button
      onClick={() => onChange("all")}
      className={`px-4 py-2 rounded-lg ${
        active === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      All Users ({allCount})
    </button>
  </div>
);

const CreateAdminDialog = ({ open, onOpenChange, form, setForm, onCreated, submitting }) => {
  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreated(form); // ✅ Only call parent handler, no API call here
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create Admin / Event Office</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First name"
              className="flex-1 border rounded px-3 py-2 text-sm"
            />
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last name"
              className="flex-1 border rounded px-3 py-2 text-sm"
            />
          </div>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="Admin">Admin</option>
            <option value="Event Office">Event Office</option>
          </select>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminCard = ({ admin, onDelete, onEdit, deleting }) => {
  const id = admin._id || admin.id;
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div>
        <div className="font-semibold">{admin.name || `${admin.firstName} ${admin.lastName}`}</div>
        <div className="text-sm text-gray-600">{admin.email}</div>
        <div className="text-sm mt-1">Role: {admin.role} • Status: {admin.status}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(admin)}
          className="px-3 py-1 text-sm rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(admin)}
            disabled={!!deleting[id]}
          className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
};

const UserCard = ({
  user,
  userType,
  onAssign,
  onBlock,
  assigning,
  blocking,
  roleDraft,
  setRoleDraft,
}) => {
  const id = user.id; // ✅ Always use user.id for API calls
  const isPending = userType === "pending";

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div>
        <div className="font-semibold">
          {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
        </div>
        <div className="text-sm text-gray-600">{user.email}</div>
        <div className="text-sm mt-1">
          Role: {user.role || "—"} • Status: {user.status}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {isPending && (
          <>
            <select
              value={roleDraft[id] || ""}
              onChange={(e) =>
                setRoleDraft((m) => ({ ...m, [id]: e.target.value }))
              }
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Role…</option>
              <option value="Student">Student</option>
              <option value="TA">TA</option>
              <option value="Staff">Staff</option>
              <option value="Professor">Professor</option>
            </select>
            <button
              onClick={() => onAssign(user)}
              disabled={assigning[id]}
              className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {assigning[id] ? "Saving…" : "Assign"}
            </button>
          </>
        )}

        <button
          onClick={() => onBlock(user)}
          disabled={blocking[id]}
          className={`px-3 py-1 text-sm rounded text-white ${
            user.status === "Blocked"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:opacity-50`}
        >
          {blocking[id] ? "..." : user.status === "Blocked" ? "Unblock" : "Block"}
        </button>
      </div>
    </div>
  );
};

const EventCard = ({ event, onViewReviews, viewMode, ratings }) => {
  const start = event.startDateTime || event.startDate || event.date;
  const end = event.endDateTime || event.endDate;

  const professorsString = event.professorsString || '';

  return (
    <div className="border rounded-2xl p-6 flex flex-col gap-3 shadow-lg bg-white hover:shadow-xl transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-2xl font-bold text-[#103A57] mb-1">{event.title || event.name || "Untitled"}</div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded">
              {event.category || event.type || "General"}
            </span>
            <span className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-2 py-1 rounded">
              {event.location || "—"}
            </span>
          </div>
          {(start || end) && (
            <div className="mb-1 text-sm text-gray-700 flex flex-col gap-1">
              {start && (
                <span><span className="font-semibold">Start Date:</span> <span className="ml-1">{new Date(start).toLocaleString()}</span></span>
              )}
              {end && (
                <span><span className="font-semibold">End Date:</span> <span className="ml-1">{new Date(end).toLocaleString()}</span></span>
              )}
              {event.category === 'workshop' && professorsString ? (
                <span><span className="font-semibold">Participating Professors:</span> <span className="ml-1">{professorsString}</span></span>
              ) : null}
            </div>
          )}
          
          {/* Show ratings for past events */}
          {viewMode === 'past' && ratings && ratings.totalRatings > 0 && (
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">
                  {ratings.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({ratings.totalRatings})
                </span>
              </div>
              {ratings.totalComments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {ratings.totalComments}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {event.description ? (
            <div className="mt-2 text-gray-800 text-base leading-snug bg-gray-50 rounded p-2 border border-gray-100">
              {event.description}
            </div>
          ) : null}
        </div>
       
        {viewMode === 'past' && (
  <button
    onClick={() => onViewReviews(event)}
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
)}
      </div>
    </div>
  );
};

const ReviewsModal = ({ open, onClose, event, reviews, onDeleteReview, deletingReview, loadingReviews, deleteNotification }) => {
    if (!open || !event) return null;
  
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{event.title || event.name || "Event Reviews"}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
  
          {loadingReviews ? (
            <p className="text-gray-500">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id || review.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold">{review.userName || review.email || "Anonymous"}</div>
                    <div className="flex gap-1 my-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < (review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    {review.comment ? (
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No comment (rating only)</p>
                    )}
                  </div>
                  {review.comment && review.user?._id && (  // ✅ Only show if comment and user._id exist
                    <button
                      onClick={() => onDeleteReview(review)}
                      disabled={deletingReview[review._id || review.id]}
                      className="ml-4 px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete Comment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {deleteNotification && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {deleteNotification}
            </div>
          )}
        </div>
      </div>
    );
  };

  
  /* ---------------- CalendarRangePicker (same behavior as BrowseEvents) ---------------- */
  const CalendarRangePicker = ({ onDateRangeChange, startDate, endDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSelectingStart, setIsSelectingStart] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);
    const [tempStartDate, setTempStartDate] = useState(null);
    const [tempEndDate, setTempEndDate] = useState(null);
  
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
    useEffect(() => {
      setTempStartDate(startDate || null);
      setTempEndDate(endDate || null);
    }, [startDate, endDate]);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showCalendar && !event.target.closest('.calendar-container')) {
          setShowCalendar(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCalendar]);
  
    const handleDateClick = (day) => {
      const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
  
      if (isSelectingStart) {
        setTempStartDate(selectedDate);
        setTempEndDate(null);
        setIsSelectingStart(false);
      } else {
        if (tempStartDate && selectedDate < tempStartDate) {
          setTempEndDate(tempStartDate);
          setTempStartDate(selectedDate);
        } else {
          setTempEndDate(selectedDate);
        }
        setIsSelectingStart(true);
      }
    };
  
    const confirmDates = () => {
      onDateRangeChange(tempStartDate, tempEndDate);
      setShowCalendar(false);
    };
  
    const resetDates = () => {
      setTempStartDate(null);
      setTempEndDate(null);
      onDateRangeChange(null, null);
      setIsSelectingStart(true);
    };
  
    const isInRange = (day) => {
      if (!tempStartDate || !tempEndDate) return false;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return date >= tempStartDate && date <= tempEndDate;
    };
  
    const isStartDate = (day) =>
      tempStartDate &&
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString() ===
        tempStartDate.toDateString();
  
    const isEndDate = (day) =>
      tempEndDate &&
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString() ===
        tempEndDate.toDateString();
  
    const previousMonth = () =>
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    const nextMonth = () =>
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  
    const monthName = currentMonth.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i);
  
    return (
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setShowCalendar(true)}
          className="w-full px-3 py-2 border-2 border-gray-200 bg-white rounded-xl text-sm 
                     focus:outline-none 
                     focus:ring-2 focus:ring-[#307B8E]/20 focus:border-[#307B8E]
                     flex items-center justify-between 
                     hover:border-[#307B8E] transition-all"
        >
          <span className="text-gray-700">
            {startDate && endDate
              ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
              : startDate
              ? `${startDate.toLocaleDateString()} - ...`
              : 'Select date range'}
          </span>
          <Calendar className="w-4 h-4 text-gray-400" />
        </button>
  
        {/* Calendar Popup */}
        {showCalendar && (
          <div className="calendar-container absolute top-full left-0 mt-2 z-50 bg-white rounded-xl 
                          shadow-lg border-2 border-gray-200 p-4 min-w-[320px]">
  
            {/* Status Box */}
            <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs border border-blue-100">
              <p className="text-gray-700"><strong>Start:</strong> {tempStartDate ? tempStartDate.toLocaleDateString() : 'Not selected'}</p>
              <p className="text-gray-700"><strong>End:</strong> {tempEndDate ? tempEndDate.toLocaleDateString() : 'Not selected'}</p>
              <p className="font-semibold text-[#307B8E] mt-1">
                {isSelectingStart ? 'Click a date to select START' : 'Click a date to select END'}
              </p>
            </div>
  
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={previousMonth}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
  
              <h3 className="text-sm font-semibold text-gray-700">{monthName}</h3>
  
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
  
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500">{d}</div>
              ))}
            </div>
  
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={i} className="h-8" />
              ))}
  
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-8 w-8 flex items-center justify-center text-xs font-medium rounded-full transition
                    ${
                      isStartDate(day)
                        ? 'bg-[#307B8E] text-white'
                        : isEndDate(day)
                        ? 'bg-[#225B6A] text-white'
                        : isInRange(day)
                        ? 'bg-blue-100 text-[#307B8E]'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
  
            {/* Buttons */}
            <div className="flex gap-2 mt-3">
              {(tempStartDate || tempEndDate) && (
                <button
                  onClick={resetDates}
                  className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-xs"
                >
                  Reset
                </button>
              )}
  
              <button
                onClick={confirmDates}
                className="flex-1 py-1.5 bg-[#307B8E] text-white rounded-lg hover:bg-[#225B6A] font-medium text-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  
/* ---------------- EventSearchFilter (Styled to match BrowseEvents colors exactly) ---------------- */
const EventSearchFilter = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  filterName,
  setFilterName,
  filterProfessor,
  setFilterProfessor,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  sortOrder,
  setSortOrder,
  eventTypes = [],
  locations = [],
  uniqueNames = [],
  uniqueProfessors = [],
  onReset,
  totalCount = 0,
  filteredCount = 0
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const clearAll = () => {
    setSearchQuery("");
    setFilters({
      type: "",
      location: "",
      dateRange: "",
      sortBy: "date-desc"
    });
    setFilterName("all");
    setFilterProfessor("all");
    setStartDate(null);
    setEndDate(null);
    setSortOrder("newest");
    if (onReset) onReset();
  };

  const dateLabel = (() => {
    if (startDate && endDate) return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    if (startDate) return `${startDate.toLocaleDateString()} - ...`;
    return filters.dateRange || "";
  })();

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 space-y-4">
      
      {/* Search + Buttons */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events by name, professor, vendor, booth, location, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 
                       focus:border-[#307B8E] focus:ring-2 focus:ring-[#307B8E]/20 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            showFilters
              ? "bg-[#307B8E] text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Reset Button */}
        <button
          onClick={clearAll}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold 
                     bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
        >
          <RefreshCw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">

          {/* Event or Professor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {(filters.type?.toLowerCase() === "workshop" || filters.type?.toLowerCase() === "conference")
                ? "Professor"
                : "Event"}
            </label>

            {(filters.type?.toLowerCase() === "workshop" || filters.type?.toLowerCase() === "conference") ? (
              uniqueProfessors.length > 0 ? (
                <select
                  value={filterProfessor}
                  onChange={(e) => setFilterProfessor(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white 
                             focus:border-[#307B8E] focus:ring-2 focus:ring-[#307B8E]/20 transition-all"
                >
                  <option value="all">All Professors</option>
                  {uniqueProfessors.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-400 italic">No professors found</div>
              )
            ) : uniqueNames.length > 0 ? (
              <select
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white 
                           focus:border-[#307B8E] focus:ring-2 focus:ring-[#307B8E]/20 transition-all"
              >
                <option value="all">All Events</option>
                {uniqueNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-400 italic">No events found</div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Event Type
            </label>
            <select
              value={filters.type || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({ ...prev, type: val || "" }));
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white 
                         focus:border-[#307B8E] focus:ring-2 focus:ring-[#307B8E]/20 transition-all"
            >
              <option value="">All Types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <select
              value={filters.location || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  location: e.target.value || "",
                }))
              }
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white 
                         focus:border-[#307B8E] focus:ring-2 focus:ring-[#307B8E]/20 transition-all"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <CalendarRangePicker
              onDateRangeChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
                setFilters((prev) => ({ ...prev, dateRange: "" }));
              }}
              startDate={startDate}
              endDate={endDate}
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Sort By
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white 
                         focus:border-[#307B8E] focus:ring-2 focus:ring-[#307B8E]/20 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Count + Active Tags */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-bold text-[#307B8E]">{filteredCount}</span> of{" "}
          <span className="font-bold">{totalCount}</span> events
        </p>

        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-1">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.type && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full flex items-center gap-1">
              Type: {filters.type}
              <button onClick={() => setFilters((prev) => ({ ...prev, type: "" }))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.location && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
              Location: {filters.location}
              <button onClick={() => setFilters((prev) => ({ ...prev, location: "" }))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterName !== "all" && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full flex items-center gap-1">
              Event: {filterName}
              <button onClick={() => setFilterName("all")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterProfessor !== "all" && (
            <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full flex items-center gap-1">
              Professor: {filterProfessor}
              <button onClick={() => setFilterProfessor("all")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(startDate || endDate) && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full flex items-center gap-1">
              Date: {dateLabel}
              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

  
  

// ---------------- MAIN COMPONENT ----------------
export default function AdminDashboard({ user = { name: "Admin" }, onLogout = () => {} }) {
  const [currentView, setCurrentView] = useState("admins");
  const [userTab, setUserTab] = useState("Pending");
  

  // Search & Filter State for Events
  // Search & Filter State for Events
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    dateRange: "",
    sortBy: "date-desc"
  });
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' or 'past'

  // Additional filter pieces required by the BrowseEvents UI
  const [filterName, setFilterName] = useState('all');         // event name dropdown
  const [filterProfessor, setFilterProfessor] = useState('all'); // professor dropdown
  const [startDate, setStartDate] = useState(null);            // calendar start
  const [endDate, setEndDate] = useState(null);                // calendar end
  const [sortOrder, setSortOrder] = useState('newest');        // newest/oldest/name sort

  // lists for the smart dropdowns (derived from events below)
  const [uniqueNames, setUniqueNames] = useState([]);
  const [uniqueProfessors, setUniqueProfessors] = useState([]);

  const [eventRatings, setEventRatings] = useState({}); // Store ratings by event ID

  // Data state
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Derive event types and locations from events
  const eventTypes = [...new Set(events.map(event => event.category || event.type || "General").filter(Boolean))];
  const locations = [...new Set(events.map(event => event.location).filter(Boolean))];
  const [blocking, setBlocking] = useState({});
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [deletingReview, setDeletingReview] = useState({});
  const [deleteNotification, setDeleteNotification] = useState(null);
  const [reportView, setReportView] = useState("attendance"); // "attendance" or "sales"

  // UI/loading state
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [assigning, setAssigning] = useState({});
  const [roleDraft, setRoleDraft] = useState({});
  const [openCreate, setOpenCreate] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminEditForm, setAdminEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "Admin",
    status: "active"
  });

  // ADD THESE TWO LINES HERE
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Admin"
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Helper to normalize different event shapes
const normalizeEvent = (ev) => ({
  id: ev._id || ev.id,
  title: ev.title || ev.name || "Untitled Event",
  type: ev.category || ev.type || "General",
  location: ev.location || "Location TBD",
  start: ev.startDateTime || ev.date || ev.startDate || new Date(),
});

  // Fetch ratings for past events
// Add these two helper functions
const fetchEventRatings = async (eventId, eventType) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:5001/api/events/${eventType}/${eventId}/ratings`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        averageRating: data.averageRating || 0,
        totalRatings: data.totalRatings || 0,
        totalComments: data.totalComments || 0
      };
    }
  } catch (err) {
    console.error('Error fetching ratings:', err);
  }
  return { averageRating: 0, totalRatings: 0, totalComments: 0 };
};

const separateEventsByTime = (allEvents) => {
  const now = new Date();
  const upcoming = [];
  const past = [];

  console.log('🕐 Current time:', now);
  
  for (const event of allEvents) {
    const eventEndDate = new Date(event.endDate || event.endDateTime || event.date || event.startDate);
    
    // Debug: Log each event's dates
    console.log('Event:', event.title || event.name, {
      startDate: event.startDate,
      startDateTime: event.startDateTime,
      endDate: event.endDate,
      endDateTime: event.endDateTime,
      date: event.date,
      calculatedEndDate: eventEndDate,
      isPast: eventEndDate < now
    });
    
    if (eventEndDate < now) {
      past.push(event);
    } else {
      upcoming.push(event);
    }
  }
  
  console.log('✅ Final separation - Upcoming:', upcoming.length, 'Past:', past.length);
  return { upcoming, past };
};



  // Reviews state
  const [selectedEventForReviews, setSelectedEventForReviews] = useState(null);
  const [eventReviews, setEventReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);


  // Navigation
  const navigation = [
    { name: "Admin Management", icon: <Shield className="w-4 h-4" />, view: "admins" },
    { name: "User Management", icon: <Users className="w-4 h-4" />, view: "users" },
    { name: "All Events", icon: <Calendar className="w-4 h-4" />, view: "events" },
    { name: "Reports", icon: <BarChart3 className="w-4 h-4" />, view: "reports" },

    { name: "Documents", icon: <FileText className="w-4 h-4" />, view: "documents" },
    { name: "Vendor Requests", icon: <FileText className="w-4 h-4" />, view: "vendorRequests" },
    { name: "Vendor Partners", icon: <Store className="w-4 h-4" />, view: "vendorPartners" },
    { name: "Lost & Found", icon: <Search className="w-4 h-4" />, view: "lostAndFound" }
  ];
  useEffect(() => {
    if (!events) return;
    let result = [...events];
  
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => {
        const title = (event.title || event.name || "").toLowerCase();
        const description = (event.description || "").toLowerCase();
        const location = (event.location || "").toLowerCase();
        const organizer = typeof event.organizer === 'string'
          ? event.organizer.toLowerCase()
          : (event.organizer?.name || event.organizer?.email || "").toLowerCase();
  
        // vendor/booth support (if present)
        // SAFE vendor / vendors extraction
const vendors = Array.isArray(event.vendors)
? event.vendors
    .filter(v => v && v.companyName)  // remove null vendors
    .map(v => v.companyName.toLowerCase())
    .join(' ')
: '';

const vendor = event.vendor && event.vendor.companyName
? event.vendor.companyName.toLowerCase()
: '';

        const booths = (event.booths || []).map(b => (b.name || '').toLowerCase()).join(' ');
        const professorsString = (event.professorsString || '').toLowerCase();
  
        return title.includes(query) ||
               description.includes(query) ||
               location.includes(query) ||
               organizer.includes(query) ||
               vendors.includes(query) ||
               vendor.includes(query) ||
               booths.includes(query) ||
               professorsString.includes(query) ||
               ((event.type || event.category || '').toString().toLowerCase()).includes(query);
      });
    }
  
    // Name filter
    if (filterName && filterName !== 'all') {
      result = result.filter(e => (e.name || e.title || '') === filterName);
    }
  
    // Type filter
    if (filters.type) {
      const ft = filters.type.toLowerCase();
      result = result.filter(event => {
        const et = (event.category || event.type || '').toString().toLowerCase();
        return et === ft;
      });
    }
  
    // Location filter
    if (filters.location) {
      result = result.filter(event => (event.location || '').toLowerCase() === filters.location.toLowerCase());
    }
  
    // Professor filter
    if (filterProfessor && filterProfessor !== 'all') {
      result = result.filter(e => Array.isArray(e.professorNames) && e.professorNames.includes(filterProfessor));
    }
  
    // Date range filter (calendar)
    if (startDate || endDate) {
      result = result.filter(e => {
        const eventDate = new Date(e.startDateTime || e.startDate || e.date || e.createdAt || 0);
        if (startDate) {
          const s = new Date(startDate); s.setHours(0,0,0,0);
          if (eventDate < s) return false;
        }
        if (endDate) {
          const en = new Date(endDate); en.setHours(23,59,59,999);
          if (eventDate > en) return false;
        }
        return true;
      });
    } else if (filters.dateRange) {
      // fallback behavior for the older dateRange dropdown if used
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(event => {
        const eventDate = new Date(event.startDateTime || event.startDate || event.date || 0);
        const endDateLocal = event.endDateTime || event.endDate ? new Date(event.endDateTime || event.endDate) : eventDate;
        switch (filters.dateRange) {
          case 'today': return eventDate.toDateString() === today.toDateString();
          case 'week': {
            const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= today && eventDate <= weekEnd;
          }
          case 'month': {
            const monthEnd = new Date(today); monthEnd.setMonth(monthEnd.getMonth() + 1);
            return eventDate >= today && eventDate <= monthEnd;
          }
          case 'upcoming': return eventDate >= now || endDateLocal >= now;
          case 'past': return endDateLocal < now;
          default: return true;
        }
      });
    }
  
    // Sorting based on sortOrder (from the new filter control)
    result.sort((a, b) => {
      const dateA = new Date(a.startDateTime || a.startDate || a.date || 0);
      const dateB = new Date(b.startDateTime || b.startDate || b.date || 0);
      const nameA = (a.title || a.name || "").toLowerCase();
      const nameB = (b.title || b.name || "").toLowerCase();
  
      switch (sortOrder) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'name-asc': return nameA.localeCompare(nameB);
        case 'name-desc': return nameB.localeCompare(nameA);
        default: return dateB - dateA;
      }
    });
  
    setFilteredEvents(result);
  }, [events, searchQuery, filters, filterName, filterProfessor, startDate, endDate, sortOrder]);
  

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilters({
      type: "",
      location: "",
      dateRange: "",
      sortBy: "date-desc"
    });
  };
  // Fetch admins
  useEffect(() => {
    if (currentView !== "admins" || admins.length) return;
    setLoadingAdmins(true);
    fetchAdmins()
      .then(setAdmins)
      .catch(() => setAdmins([]))
      .finally(() => setLoadingAdmins(false));
  }, [currentView, admins.length]);

  // Fetch users (pending or all)
 
// Removed local fetchAllUsersSafe; using shared fetchAllUsers from adminApi.js

// ------------------- useEffect -------------------
useEffect(() => {
  if (currentView !== "users") return;
  setLoadingUsers(true);
  fetchAllUsers()
    .then((allUsers) => {
      // Separate pending users (role missing or unknown)
      const pending = allUsers.filter(
        (u) => !u.role || u.role.toLowerCase() === "unknown"
      );
      setPendingUsers(pending);
      setUsers(allUsers);
    })
    .catch((err) => {
      console.error("Error loading users:", err);
      setPendingUsers([]);
      setUsers([]);
    })
    .finally(() => setLoadingUsers(false));
}, [currentView]);

// Fetch events - MATCHING EVENTSVIEW LOGIC
useEffect(() => {
  if (currentView !== "events") return;
  
  const fetchData = async () => {
    try {
      setLoadingEvents(true);
      
      const user = JSON.parse(localStorage.getItem("user"));
      const userType = user?.role || 'Admin';
      const token = localStorage.getItem('token');
      
      let allEvents = [];
      
      // 1. Fetch from unified API endpoint
      try {
        const eventsRes = await fetch(
          `http://localhost:5001/api/events/upcoming?userType=${userType}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          console.log('Events data received:', eventsData);

          if (eventsData.events && eventsData.events.length > 0) {
            // Normalize type/category consistently
            const unifiedEvents = eventsData.events.map(event => {
              let defaultType = 'event';
              if (event.title) {
                const title = event.title.toLowerCase();
                if (title.includes('conference')) defaultType = 'conference';
                else if (title.includes('workshop')) defaultType = 'workshop';
                else if (title.includes('bazaar')) defaultType = 'bazaar';
                else if (title.includes('trip')) defaultType = 'trip';
              }
              const category = event.category || event.type || defaultType;
              return {
                ...event,
                type: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
                category: category.toLowerCase()
              };
            });
            allEvents = [...unifiedEvents];
          }
        }
      } catch (err) {
        console.error('Error fetching unified events:', err);
      }
      
     // 2. Fetch workshops
// 2. Fetch workshops
try {
  const workshopsRes = await fetch('http://localhost:5001/api/events/workshops', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (workshopsRes.ok) {
    const workshopsData = await workshopsRes.json();

    if (workshopsData && workshopsData.length > 0) {
      const workshopsWithProfessors = workshopsData.map((workshop) => {
        // Simply use the professorsParticipatingNames string as-is
        const professorsString = workshop.professorsParticipatingNames || 
                                 workshop.professorsParticipatingName || 
                                 'TBA';

        return {
          ...workshop,
          _id: workshop._id,
          name: workshop.title,
          type: 'Workshop',
          category: 'workshop',
          date: workshop.startDate,
          endDate: workshop.endDate,
          location: workshop.location,
          description: workshop.description,
          price: workshop.price,
          capacity: workshop.capacity,
          registrationDeadline: workshop.registrationDeadline,
          professorsString: professorsString,
          facultyResponsible: workshop.facultyResponsible
        };
      });

      const existingIds = new Set(allEvents.map(e => e._id?.toString()));
      const newWorkshops = workshopsWithProfessors.filter(
        w => !existingIds.has(w._id?.toString())
      );

      allEvents = [...allEvents, ...newWorkshops];
    }
  }
} catch (err) {
  console.error('Error fetching workshops:', err);
}
      // 3. Fetch bazaars
      try {
        const bazaarsRes = await fetch('http://localhost:5001/api/events/bazaars', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (bazaarsRes.ok) {
          const bazaarsData = await bazaarsRes.json();
          
          if (bazaarsData && bazaarsData.length > 0) {
            for (const bazaar of bazaarsData) {
              try {
                let vendors = [];
                try {
                  const vendorsRes = await fetch(
                    `http://localhost:5001/api/bazaar-applications/bazaar/${bazaar._id}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    }
                  );
                  
                  if (vendorsRes.ok) {
                    const vendorsData = await vendorsRes.json();
                    const applications = vendorsData.applications || vendorsData || [];
                    const acceptedApps = applications.filter(app => app.status === 'Accepted');
                    
                    vendors = await Promise.all(
                      acceptedApps.map(async (app) => {
                        try {
                          const vendorId = app.vendorId?._id || app.vendorId;
                          const vendorRes = await fetch(
                            `http://localhost:5001/api/users/${vendorId}`,
                            {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            }
                          );
                          
                          if (vendorRes.ok) {
                            const vendor = await vendorRes.json();
                            return {
                              _id: vendor._id,
                              companyName: vendor.companyName || 'Unknown Vendor',
                              email: vendor.email,
                              boothSize: app.boothSize,
                              attendees: app.attendees || []
                            };
                          }
                        } catch (err) {
                          console.error('Error fetching vendor:', err);
                        }
                        return null;
                      })
                    );
                    
                    vendors = vendors.filter(Boolean);
                  }
                } catch (err) {
                  console.error('Error fetching vendors:', err);
                }
                
                let booths = [];
                try {
                  const boothsRes = await fetch(
                    `http://localhost:5001/api/booth-applications/bazaar/${bazaar._id}/accepted`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    }
                  );
                  
                  if (boothsRes.ok) {
                    const boothsData = await boothsRes.json();
                    booths = boothsData.booths || [];
                  }
                } catch (err) {
                  console.error('Error fetching booths:', err);
                }
                
                bazaar.vendors = vendors;
                bazaar.booths = booths;
                bazaar.type = 'Bazaar';
                bazaar.category = 'bazaar';
                bazaar.name = bazaar.name || bazaar.title;
                
              } catch (err) {
                console.error('Error processing bazaar:', err);
                bazaar.vendors = [];
                bazaar.booths = [];
              }
            }
            
            const existingIds = new Set(allEvents.map(e => e._id?.toString()));
            const newBazaars = bazaarsData.filter(
              b => !existingIds.has(b._id?.toString())
            );
            
            allEvents = [...allEvents, ...newBazaars];
          }
        }
      } catch (err) {
        console.error('Error fetching bazaars:', err);
      }
      
      // 4. Fetch trips
      try {
        const tripsRes = await fetch('http://localhost:5001/api/events/trips', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (tripsRes.ok) {
          const tripsData = await tripsRes.json();
          
          if (tripsData && tripsData.length > 0) {
            const trips = tripsData.map(t => ({
              ...t,
              name: t.name || t.title,
              type: 'Trip',
              category: 'trip',
              date: t.startDateTime,
              endDate: t.endDateTime
            }));
            
            const existingIds = new Set(allEvents.map(e => e._id?.toString()));
            const newTrips = trips.filter(
              t => !existingIds.has(t._id?.toString())
            );
            
            allEvents = [...allEvents, ...newTrips];
          }
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
      }
      
      // 5. Separate into upcoming and past
      const { upcoming, past } = separateEventsByTime(allEvents);
      
      console.log('Total events:', allEvents.length);
      console.log('Upcoming events:', upcoming.length);
      console.log('Past events:', past.length);
      
      // 6. Fetch ratings for past events
      if (past.length > 0 && viewMode === 'past') {
        const ratingsMap = {};
        await Promise.all(
          past.map(async (event) => {
            const eventType = (event.category || 'event').toLowerCase();
            const ratings = await fetchEventRatings(event._id, eventType);
            ratingsMap[event._id] = ratings;
          })
        );
        setEventRatings(ratingsMap);
      }
      
      if (viewMode === 'past') {
        setEvents(past);
        setFilteredEvents(past);
      } else {
        setEvents(upcoming);
        setFilteredEvents(upcoming);
      }
      
      setLoadingEvents(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setLoadingEvents(false);
    }
  };

  fetchData();
}, [currentView, viewMode]);

// 🔥 Compute unique event names + unique professors when events change
useEffect(() => {
  if (!events || events.length === 0) {
    setUniqueNames([]);
    setUniqueProfessors([]);
    return;
  }

  // unique event names
  const names = [...new Set(
    events
      .map(e => (e.name || e.title || "").trim())
      .filter(Boolean)
  )].sort();
  setUniqueNames(names);

  // unique professors
  const profs = [...new Set(
    events
      .filter(e => Array.isArray(e.professorNames) && e.professorNames.length > 0)
      .flatMap(e => e.professorNames)
      .filter(Boolean)
  )].sort();
  setUniqueProfessors(profs);
}, [events]);

  // Handlers
  const handleDeleteAdmin = async (admin) => {
    const id = admin._id || admin.id;
    if (!window.confirm("Delete this admin?")) return;
    try {
      setDeleting((m) => ({ ...m, [id]: true }));
      await deleteAdmin(id);
      setAdmins((list) => list.filter((a) => (a._id || a.id) !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting((m) => ({ ...m, [id]: false }));
    }
  };

  const handleAssign = async (user) => {
    const id = user._id || user.id;
    const newRole = roleDraft[id];
    if (!newRole) { alert("Select role first"); return; }
    try {
      setAssigning((m) => ({ ...m, [id]: true }));
      const updated = await assignUserRole(id, newRole);
      setPendingUsers((list) => list.filter((u) => (u._id || u.id) !== id));
      setUsers((list) => {
        const idx = list.findIndex((u) => (u._id || u.id) === id);
        if (idx >= 0) {
          const copy = [...list];
          copy[idx] = { ...copy[idx], ...updated };
          return copy;
        }
        return [...list, updated];
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setAssigning((m) => ({ ...m, [id]: false }));
    }
  };
const handleBlockUser = async (user) => {
  const id = user.id; // ✅ Use user.id for API calls
  const isBlocked = String(user.status).toLowerCase() === "blocked";

  // Confirm action
  if (!window.confirm(isBlocked ? "Unblock this user?" : "Block this user?")) return;

  try {
    setBlocking((prev) => ({ ...prev, [id]: true }));

    // Call the correct API function
    const updatedUser = isBlocked
      ? await unblockUser(id)
      : await blockUser(id);

    // Update UI state
    setUsers((list) =>
      list.map((u) => (u.id === id ? { ...u, status: updatedUser.status } : u))
    );
    setPendingUsers((list) =>
      list.map((u) => (u.id === id ? { ...u, status: updatedUser.status } : u))
    );
  } catch (e) {
    console.error("Block/Unblock API error:", e.response || e);
    alert(e.response?.data?.message || e.message || "Failed to update status");
  } finally {
    setBlocking((prev) => ({ ...prev, [id]: false }));
  }
};



  const startEditAdmin = async (admin) => {
    try {
      const full = await fetchAdminById(admin._id || admin.id);
      const base = full.admin || full;
      setEditingAdmin(base._id || base.id);
      setAdminEditForm({
        firstName: base.firstName || "",
        lastName: base.lastName || "",
        email: base.email || "",
        role: base.role || "Admin",
        status: (base.status || "active").toLowerCase()
      });
      setOpenCreate(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const submitAdminEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateAdmin(editingAdmin, { ...adminEditForm });
      const updated = res.admin || res;
      setAdmins((list) =>
        list.map((a) =>
          (a._id || a.id) === editingAdmin
            ? { ...a, ...updated }
            : a
        )
      );
      setEditingAdmin(null);
    } catch (e2) {
      alert(e2.message);
    }
  };

  const handleViewReviews = async (event) => {
    const id = event._id || event.id; // Get the event ID
    setSelectedEventForReviews(event); // Set the selected event for the modal
    setLoadingReviews(true); // Show loading state
  
    try {
      // Fetch reviews from the backend
      const { data } = await api.get(`/events/${id}/reviews`);
      setEventReviews(data.reviews || []); // Store the reviews in state
      setShowReviewsModal(true); // Open the modal
    } catch (err) {
      console.warn("Failed to fetch reviews:", err.message);
      setEventReviews([]); // Clear reviews on error
      alert("Failed to load reviews. Please try again.");
    } finally {
      setLoadingReviews(false); // Hide loading state
    }
  };

    const handleDeleteReview = async (review) => {
      const feedbackId = review.id || review._id;
      const userId = review.user?._id;  // ✅ From populated user object
      if (!userId) {
        return alert("User ID not found for this review. Please refresh and try again.");
      }
      if (!window.confirm(`Delete comment from ${review.userName || 'this user'}? A warning email will be sent.`)) return;
      
      // Define eventId outside try so it's available in catch for logging
      const eventId = selectedEventForReviews._id || selectedEventForReviews.id;
      try {
        setDeletingReview(prev => ({ ...prev, [feedbackId]: true }));
        // ✅ Use review.eventType (from backend) or fallback to event's type
        const eventType = review.eventType || 
                          selectedEventForReviews.category?.toLowerCase() || 
                          selectedEventForReviews.type?.toLowerCase() || 
                          selectedEventForReviews.eventType?.toLowerCase() || 
                          'event';

        const { data: response } = await api.delete(
          `/events/${eventType}/${eventId}/ratings/${userId}/comment`,  // ✅ Use :userId param
          { 
            data: { 
              reason: 'Inappropriate content' // Default reason; you can prompt for custom if needed
            } 
          }
        );

        // Update state based on response
        if (response.ratingStillPresent) {
          // Keep the review but clear comment
          setEventReviews(prev => 
            prev.map(r => 
              (r.id || r._id) === feedbackId 
                ? { ...r, comment: null } 
                : r
            )
          );
          setDeleteNotification('Comment deleted successfully. Warning email sent to user.');
        } else {
          // Remove if no rating either
          setEventReviews(prev => prev.filter(r => (r.id || r._id) !== feedbackId));
          setDeleteNotification('Full review deleted. Warning email sent to user.');
        }

        // Clear notification after 3s
        setTimeout(() => setDeleteNotification(null), 3000);
      } catch (e) {
          console.error('Delete comment error:', e);
          const errorMsg = e.response?.data?.message || e.message || "Failed to delete comment";
          alert(`Error: ${errorMsg}. If "Event not found", check event type in console.`);
          console.log('Debug - EventType:', review.eventType, 'EventId:', eventId, 'UserId:', userId);  // ✅ Debug log
        } finally {
          setDeletingReview(prev => ({ ...prev, [feedbackId]: false }));
        }
      };



const handleCreateAdmin = async (formData) => {
  try {
    setCreateSubmitting(true);

    // ✅ Only here we call the API
    const res = await createAdmin(formData); 
    const newAdmin = res.admin || res;

    setAdmins((prev) => [...prev, newAdmin]);

    // Reset form & close dialog
    setCreateForm({ firstName: "", lastName: "", email: "", password: "", role: "Admin" });
    setOpenCreate(false);

  } catch (e) {
    console.error("CreateAdmin error:", e.response || e);
    alert(e.response?.data?.message || e.message || "Failed to create admin");
  } finally {
    setCreateSubmitting(false);
  }
};



  return (
    <UnifiedDashboardLayout
      user={user}
      onLogout={onLogout}
      navigation={navigation}
      currentView={currentView}
      onViewChange={setCurrentView}
      title="Admin Dashboard"
    >
      {/* All your current view content goes here — remove the old wrapper divs */}
      {currentView === "admins" && (
        <div className="space-y-6">
          <div>
            <h2 style={{
                          fontSize: "2rem",
                          fontWeight: "800",
                          color: EOcolors.secondary,
                          marginBottom: "0.5rem",
                        }}>
                        Admin Management
                        </h2>
                        <p style={{
                          fontSize: "1.125rem",
                          color: EOcolors.text.secondary,
                          fontWeight: "500",
                          margin: 0,
                          opacity: 0.9,
                          textAlign: "left",
                        }}>
                        Create and manage Admin accounts
                        </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {/* Blue Create Button above the list, aligned left */}
            <div className="flex justify-start mb-6">
              <button
                onClick={() => setOpenCreate(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              >
                + Create
              </button>
            </div>
            {/* ...rest of your admin list rendering... */}
           <CreateAdminDialog
  open={openCreate}
  onOpenChange={setOpenCreate}
  form={createForm}
  setForm={setCreateForm}
  onCreated={handleCreateAdmin}  // ✅ only triggers API call here
  submitting={createSubmitting}
/>

            <div className="mt-8">
              {loadingAdmins ? (
                <TableSkeleton count={3} />
              ) : admins.length === 0 ? (
                <NoAdminsState onCreateClick={() => setOpenCreate(true)} />
              ) : (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                  {admins.map((admin) => (
                    <AdminCard
                      key={admin._id ?? admin.id}
                      admin={admin}
                      onDelete={handleDeleteAdmin}
                      deleting={deleting}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
  
      {/* Repeat similar cleanup for other views */}
     {currentView === "users" && (
  <div className="space-y-6">
    <div>
      <div className="text-center pt-8 pb-6">
                        <h2 style={{
                                      fontSize: "2rem",
                                      fontWeight: "800",
                                      color: EOcolors.secondary,
                                      marginBottom: "0.5rem",
                                      textAlign: "left",
                                    }}>
                        User Management
                        </h2>
                        <p style={{
                          fontSize: "1.125rem",
                          color: EOcolors.text.secondary,
                          fontWeight: "500",
                          margin: 0,
                          opacity: 0.9,
                          textAlign: "left",
                        }}>
                        Review and manage all system users
                        </p>
                      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      {/* ====== Inline User Tabs ====== */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setUserTab("pending")}
          className={`px-4 py-2 rounded-lg ${
            userTab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          Pending ({pendingUsers.length})
        </button>
        <button
          onClick={() => setUserTab("all")}
          className={`px-4 py-2 rounded-lg ${
            userTab === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          All Users ({users.length})
        </button>
      </div>

      {/* ====== User Cards Grid ====== */}
      <div className="mt-8">
        {loadingUsers ? (
          <TableSkeleton count={5} />
        ) : (userTab === "pending" ? pendingUsers : users).length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Users Found"
            description="There are no users matching your criteria."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
            {(userTab === "pending" ? pendingUsers : users).map((user) => (
              <UserCard
                key={user._id ?? user.id}
                user={user}
                userType={userTab}
                onAssign={handleAssign}
                onBlock={handleBlockUser}
                assigning={assigning}
                blocking={blocking}
                roleDraft={roleDraft}
                setRoleDraft={setRoleDraft}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
      {/* Events, Reports, Documents, etc. — same pattern */}
      {currentView === "events" && (
  <div className="space-y-8">
    {/* Header with toggle buttons */}
    <div className="flex items-center justify-between">
      <div>
        <h2 style={{
          fontSize: "2rem",
          fontWeight: "800",
          color: EOcolors.secondary,
          marginBottom: "0.5rem",
        }}>All Events</h2>
        <p className="text-gray-600">View and manage all events across the platform</p>
      </div>
      
      {/* Toggle buttons for Upcoming/Past */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('upcoming')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
            viewMode === 'upcoming'
              ? 'bg-[#103A57] text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setViewMode('past')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
            viewMode === 'past'
              ? 'bg-[#103A57] text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Past Events
        </button>
      </div>
    </div>

  {/* Search & Filter Component */}
  <EventSearchFilter
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  filters={filters}
  setFilters={setFilters}
  filterName={filterName}
  setFilterName={setFilterName}
  filterProfessor={filterProfessor}
  setFilterProfessor={setFilterProfessor}
  startDate={startDate}
  endDate={endDate}
  setStartDate={setStartDate}
  setEndDate={setEndDate}
  sortOrder={sortOrder}
  setSortOrder={setSortOrder}
  eventTypes={eventTypes}
  locations={locations}
  uniqueNames={uniqueNames}
  uniqueProfessors={uniqueProfessors}
  onReset={handleResetFilters}
  totalCount={events.length}
  filteredCount={filteredEvents.length}
/>



    {/* Events Grid */}
    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
      {loadingEvents ? (
        // Loading Skeletons
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-start gap-6">
                <div className="w-28 h-24 bg-gray-200 rounded-xl"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </>
            ) : filteredEvents.length === 0 ? (
                <div className="col-span-full text-center py-16">
          <NoEventsState />
        </div>
      ) : (
        filteredEvents.map((event) => (

            <EventCard
  key={event._id ?? event.id}
  event={event}
  onViewReviews={handleViewReviews}
  normalizeEvent={normalizeEvent}
  viewMode={viewMode}  // Add this prop
  ratings={eventRatings[event._id ?? event.id]}  // Add this prop
/>
          ))
      )}
    </div>
  </div>
)}
  
      {currentView === "documents" && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-xl border-2 border-[#E8F0D7] p-10">
            <DocumentManagement />
          </div>
        </div>
      )}
      {/* ==================== VENDOR REQUESTS TAB ==================== */}
      {currentView === "vendorRequests" && (
  <div className="space-y-8">
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
      {/* 🔁 Reuse the Events Office vendor requests page here */}
      <VendorRequests />
    </div>
  </div>
)}
 

      {/* ==================== VENDOR PARTNERS TAB ==================== */}

{/* ==================== VENDOR PARTNERS TAB ==================== */}
{currentView === "vendorPartners" && (
  <div className="space-y-8">
    <VendorPartners layout="list" />   {/* Explicitly set layout="list" */}
  </div>
)}

{/* ==================== LOST & FOUND TAB ==================== */}
{currentView === "lostAndFound" && (
  <div className="space-y-8">
    <LostAndFoundManagement />
  </div>
)}

{/* ==================== REPORTS TAB ==================== */}

{currentView === "reports" && (
  <div className="space-y-6">
    {/* Header + small toggle */}
    <div className="flex items-center justify-between">
    

      {/* Toggle buttons */}
      <div className="inline-flex rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setReportView("attendance")}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            reportView === "attendance"
              ? "bg-white text-[#103A57] shadow"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Attendance
        </button>
        <button
          onClick={() => setReportView("sales")}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            reportView === "sales"
              ? "bg-white text-[#103A57] shadow"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Sales
        </button>
      </div>
    </div>

    {/* Actual report content */}
    <div>
      {reportView === "attendance" && <EventAttendanceReport />}
      {reportView === "sales" && <SalesReport />}
    </div>
  </div>
)}
<ReviewsModal
  open={showReviewsModal}
  onClose={() => setShowReviewsModal(false)}
  event={selectedEventForReviews}
  reviews={eventReviews}
  onDeleteReview={handleDeleteReview}
  deletingReview={deletingReview}
  loadingReviews={loadingReviews}
  deleteNotification={deleteNotification}
/>
    </UnifiedDashboardLayout>
  );
}
