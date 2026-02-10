import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Archive, ArchiveRestore , ChevronLeft, ChevronRight} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { CardSkeleton, EmptyState } from "../LoadingEmptyStates";
import { Calendar } from "lucide-react";
import EventFilterSort from '../EventFilterSort';
import { exportRegistrationsToExcel } from "../../utils/exportToExcel";
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
} from "../../styles/EOdesignSystem";

const USER_TYPE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "ta", label: "TA" },
  { value: "professor", label: "Professor" },
];
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
        <span className="text-[#2D5F4F] text-md">
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
export default function ConferenceManagement() {
  const [conferences, setConferences] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filteredConferences, setFilteredConferences] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [ratingsDialogOpen, setRatingsDialogOpen] = useState(false);
  const [selectedConference, setSelectedConference] = useState(null);
  
    // FILTER STATES - SAME AS WORKSHOP MANAGEMENT
    const [showFilters, setShowFilters] = useState(false);
    const [filterProfessor, setFilterProfessor] = useState('all');
    const [filterFunding, setFilterFunding] = useState('all');
    const [startDateFilter, setStartDateFilter] = useState(null);
    const [endDateFilter, setEndDateFilter] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
  const roleHeader = { headers: { "x-role": "events_office" } };

  const [formData, setFormData] = useState({
    title: "",
    startDateTime: "",
    endDateTime: "",
    shortDescription: "",
    fullAgenda: "",
    website: "",
    requiredBudget: "",
    fundingSource: "guc",
    extraResources: "",
    allowedUserTypes: []
  });

  useEffect(() => { fetchConferences(); }, []);

  const fetchConferences = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5001/api/eo/conferences", roleHeader);
      setConferences(data || []);
    } catch (err) { 
      console.error("Error fetching conferences:", err); 
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      startDateTime: "",
      endDateTime: "",
      shortDescription: "",
      fullAgenda: "",
      website: "",
      requiredBudget: "",
      fundingSource: "guc",
      extraResources: "",
      allowedUserTypes: []
    });
  };

  const handleUserTypeToggle = (userType) => {
    setFormData(prev => {
      const current = prev.allowedUserTypes || [];
      if (current.includes(userType)) {
        return { ...prev, allowedUserTypes: current.filter(t => t !== userType) };
      } else {
        return { ...prev, allowedUserTypes: [...current, userType] };
      }
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // full ISO datetimes from the datetime-local inputs
    const startISO = formData.startDateTime
      ? new Date(formData.startDateTime).toISOString()
      : null;
    const endISO = formData.endDateTime
      ? new Date(formData.endDateTime).toISOString()
      : null;

    // dates (yyyy-mm-dd) if backend uses pure dates too
    const startDate = startISO ? startISO.slice(0, 10) : "";
    const endDate = endISO ? endISO.slice(0, 10) : "";
    // normalize fundingSource so it always matches the enum
    let fs = String(formData.fundingSource || "guc").toLowerCase();
    if (fs === "guc-funded") fs = "guc";
    if (fs === "externally-funded") fs = "external";

    const payload = {
      title: formData.title,
      startDate,
      endDate,
      startDateTime: startISO,
      endDateTime: endISO,
      shortDescription: formData.shortDescription,
      fullAgenda: formData.fullAgenda,
      website: formData.website,
      requiredBudget: Number(formData.requiredBudget) || 0,
      fundingSource: fs,              // ⬅ use normalized value
      extraResources: formData.extraResources,
      allowedUserTypes: formData.allowedUserTypes || [],
    };


    let res;
    if (editing?._id) {
      // EDIT EXISTING
      res = await axios.put(
        `http://localhost:5001/api/eo/conferences/${editing._id}`,
        payload,
        roleHeader
      );
    } else {
      // CREATE NEW
      res = await axios.post(
        "http://localhost:5001/api/eo/conferences",
        payload,
        roleHeader
      );
    }

    console.log("Conference saved:", res.data);
    setOpen(false);
    setEditing(null);
    resetForm();
    fetchConferences();
  } catch (err) {
    console.error("Error saving conference:", err?.response || err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err.message ||
      "Error saving conference";
    alert(msg); // so you SEE what went wrong instead of “nothing happens”
  }
};


  const handleEdit = (c) => {
    const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");
    setEditing(c);
    setFormData({
      title: c.title || c.name || "",
      startDateTime: fmt(c.startDate || c.startDateTime),
      endDateTime: fmt(c.endDate || c.endDateTime),
      shortDescription: c.shortDescription || "",
      fullAgenda: c.fullAgenda || "",
      website: c.website || "",
      requiredBudget: (c.requiredBudget ?? "").toString(),
        // normalize old values like "guc-funded" → "guc"
  fundingSource: (() => {
    let fs = (c.fundingSource || "guc").toLowerCase();
    if (fs === "guc-funded") fs = "guc";
    if (fs === "externally-funded") fs = "external";
    return fs;
  })(),

      extraResources: c.extraResources || "",
      // normalize to lowercase for backend roles
      allowedUserTypes: (c.allowedUserTypes || []).map(t => t.toLowerCase())
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this conference? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5001/api/eo/conferences/${id}`, roleHeader);
      fetchConferences();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Delete failed";
      alert(`Delete failed: ${msg}`);
      console.error("Error deleting conference:", err);
    }
  };

  const handleArchive = async (id, archive = true) => {
    try {
      if (archive) {
        await axios.patch(`http://localhost:5001/api/events/${id}/archive`, {}, roleHeader);
      } 
      await fetchConferences();
      if (archive) {
        setShowArchived(true);
      } else {
        setShowArchived(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Archive operation failed";
      alert(`Archive failed: ${msg}`);
      console.error("Error archiving conference:", err);
    }
  };

  //view ratings
  const handleViewRatings = async (conference) => {
    try {
      const { data } = await axios.get(
        `http://localhost:5001/api/events/${conference._id}/reviews`
      );
      
      setRatings(data.reviews || []);
      setSelectedConference(conference);
      setRatingsDialogOpen(true);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setRatings([]);
      alert("Failed to fetch feedback for this conference.");
    }
  };

  const currentDate = new Date();

  // Memoized lists
  const activeConferences = useMemo(
    () => conferences.filter(c => !c.archived || c.archived === false),
    [conferences]
  );

  const archivedConferences = useMemo(
    () => conferences.filter(c => c.archived === true),
    [conferences]
  );

  const displayedConferences = useMemo(
    () => (showArchived ? archivedConferences : activeConferences),
    [showArchived, activeConferences, archivedConferences]
  );
  const uniqueProfessors = useMemo(() => {
    return [...new Set(
      displayedConferences
        .map(c => c.professor || c.createdBy?.name || c.organizer || "Unknown Professor")
        .filter(Boolean)
    )].sort();
  }, [displayedConferences]);

  const uniqueLocations = useMemo(() => {
    return [...new Set(
      displayedConferences
        .map(c => c.location)
        .filter(Boolean)
    )].sort();
  }, [displayedConferences]);
  const conferencesToRender = filteredConferences.length > 0 ? filteredConferences : displayedConferences;
  const hasAnyConferences = conferences.length > 0;

  const isPastEvent = (conference) => {
    const endDate = new Date(conference.endDate || conference.endDateTime);
    return endDate < currentDate;
  };

  // Decide what to render: filtered list from EventFilterSort, or base list
  useEffect(() => {
    let filtered = [...displayedConferences];

    // Filter by Professor
    if (filterProfessor !== 'all') {
      filtered = filtered.filter(c =>
        (c.professor || c.createdBy?.name || c.organizer || "Unknown Professor") === filterProfessor
      );
    }
//filter by funding source
    if (filterFunding !== 'all') {
      filtered = filtered.filter(c => 
        (c.fundingSource || "").toLowerCase() === filterFunding
      );
    }

    // Filter by Date Range
    if (startDateFilter || endDateFilter) {
      filtered = filtered.filter(c => {
        const confDate = new Date(c.startDate || c.startDateTime);
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          if (confDate < start) return false;
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          if (confDate > end) return false;
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate || a.startDateTime);
      const dateB = new Date(b.startDate || b.startDateTime);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredConferences(filtered);
  }, [displayedConferences, filterProfessor, filterFunding, startDateFilter, endDateFilter, sortOrder]);

  // LOADING STATE
  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-[#1D3309]">
                Conference Management
              </CardTitle>
              <p className="text-[#1D3309] mt-1">Create and manage conferences</p>
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
        @keyframes conferenceSlideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes conferenceSlideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .conference-container { animation: conferenceSlideInDown 0.4s ease-out; }
        .conference-card {
          transition: ${EOtransitions.normal};
          animation: conferenceSlideInUp 0.3s ease-out;
        }
        .conference-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
          [data-radix-card-header] {
          padding-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="conference-container">
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
                  Conference Management
                </CardTitle>
                <p
                  style={{
                    color: EOcolors.text.secondary,
                    fontSize: "0.9375rem",
                  }}
                >
                  Create and manage conferences
                </p>
              </div>
              {hasAnyConferences && (
                <button
                  onClick={() => {
                    setEditing(null);
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
                  Create Conference
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-4">
            {/* EMPTY STATE - No conferences at all */}
            {!hasAnyConferences ? (
              <EmptyState
                icon={Calendar}
                title="No Conferences"
                description="Create your first conference to get started"
                action={{ label: "+ Create Conference", onClick: () => setOpen(true) }}
              />
            ) : (
              <>
                    {/* Tabs (Active / Archived) + Filters Button */}
             <div className="mb-4 mt-6 flex justify-between items-center gap-3 flex-wrap">
                <div className="flex gap-2">
    <button
      onClick={() => {
        setShowArchived(false);
        setFilteredConferences([]);
      }}
      style={{
        ...(!showArchived ? EObuttonStyles.primary : EObuttonStyles.outline),
        padding: "0.65rem 1.25rem",
        fontSize: "0.9375rem",
        fontWeight: 600,
        borderRadius: EOradius.lg,
      }}
    >
      Active ({activeConferences.length})
    </button>
    <button
      onClick={() => {
        setShowArchived(true);
        setFilteredConferences([]);
      }}
      style={{
        ...(showArchived ? EObuttonStyles.primary : EObuttonStyles.outline),
        padding: "0.65rem 1.25rem",
        fontSize: "0.9375rem",
        fontWeight: 600,
        borderRadius: EOradius.lg,
      }}
    >
      Archived ({archivedConferences.length})
    </button>
    </div>

    {/* Filters Button - Now inline with tabs, no badge */}
    {displayedConferences.length > 0 && (
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
{showFilters && displayedConferences.length > 0 && (
  <div className="mb-6 p-5 bg-white rounded-xl border-2" style={{ borderColor: EOcolors.lightSilver }}>
    <div className="flex flex-wrap items-center gap-4">
      

       {/* Filter by Professor */}
{uniqueProfessors.length > 0 && (
  <select
    value={filterProfessor}
    onChange={(e) => setFilterProfessor(e.target.value)}
    className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
  >
    <option value="all">All Professors</option>
    {uniqueProfessors.map(prof => (
      <option key={prof} value={prof}>{prof}</option>
    ))}
  </select>
)}

{/* Filter by Funding Source */}
<select
  value={filterFunding} // we're reusing the same state name for simplicity
  onChange={(e) => setFilterFunding(e.target.value)}
  className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
>
  <option value="all">All Funding Sources</option>
  <option value="guc">GUC Funded</option>
  <option value="external">Externally Funded</option>
</select>


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

      {(filterProfessor !== 'all' || filterFunding !== 'all' || startDateFilter || endDateFilter) && (
        <button
          onClick={() => {
            setFilterProfessor('all');
            setFilterFunding('all');
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
                {((showArchived && archivedConferences.length === 0) ||
                (!showArchived && activeConferences.length === 0)) ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#EAECF0]">
                    <EmptyState
                      icon={Calendar}
                      title={showArchived ? "No Archived Conferences" : "No Active Conferences"}
                      description={showArchived ? "No archived conferences found" : "Create your first conference to get started"}
                      action={!showArchived ? { label: "+ Create Conference", onClick: () => setOpen(true) } : null}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conferencesToRender.map(conference => {
                      const isPast = isPastEvent(conference);
                      const startDate = new Date(conference.startDate || conference.startDateTime);
                      const endDate = new Date(conference.endDate || conference.endDateTime);

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

                      const statusStyle = conference.archived
                        ? EObadgeStyles.error
                        : isPast
                        ? EObadgeStyles.pending
                        : EObadgeStyles.success;

                      const statusLabel = conference.archived
                        ? "Archived"
                        : isPast
                        ? "Past Event"
                        : "Upcoming";

                      return (
                        <div
                          key={conference._id}
                          className="conference-card"
                          style={{
                            background: "white",
                            borderRadius: EOradius.xl,
                            border: `2px solid ${EOcolors.lightSilver}`,
                            padding: "1.5rem",
                            display: "flex",
                            gap: "1.5rem",
                            alignItems: "flex-start",
                            opacity: conference.archived ? 0.7 : 1,
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
                                  {conference.title || conference.name}
                                  {conference.archived && (
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
                                  💰 EGP {conference.requiredBudget || 0} &nbsp;•&nbsp; 
                                  🏦 {(conference.fundingSource || "").toUpperCase()} &nbsp;•&nbsp;
                                  📅 {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
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
                              {conference.shortDescription || "No description available"}
                            </p>

                            {conference.allowedUserTypes &&
                              conference.allowedUserTypes.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.4rem",
                                    marginBottom: "0.75rem",
                                  }}
                                >
                                  {conference.allowedUserTypes.map((type) => {
                                    const opt = USER_TYPE_OPTIONS.find(o => o.value === type);
                                    return (
                                      <span
                                        key={type}
                                        style={{
                                          ...EObadgeStyles.info,
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        {opt ? opt.label : type}
                                      </span>
                                    );
                                  })}
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
                              {!conference.archived && new Date(conference.startDate || conference.startDateTime) > currentDate && (
                                <button
                                  onClick={() => handleEdit(conference)}
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
                              
                              {!conference.archived && isPast && (
                                <button
                                  onClick={() => handleArchive(conference._id, true)}
                                  style={{
                                    ...EObuttonStyles.outline,
                                    padding: "0.4rem 0.9rem",
                                    fontSize: "0.85rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                  }}
                                >
                                  <Archive style={{ width: "1rem", height: "1rem" }} />
                                  Archive
                                </button>
                              )}

                              <button
                                onClick={() => handleViewRatings(conference)}
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
                                ⭐ Feedback
                              </button>

                              <button
                                onClick={() => handleDelete(conference._id)}
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
                                <Trash2 style={{ width: "1rem", height: "1rem" }} />
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

        {/* CREATE / EDIT CONFERENCE DIALOG */}
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); resetForm(); } }}>
          <DialogContent className="max-w-[96vw] w-full max-h-[96vh] overflow-y-auto
             sm:max-w-4xl 
             md:max-w-5xl 
             lg:max-w-6xl 
             xl:max-w-4xl 
             p-4 sm:p-6 lg:p-8 bg-white
             rounded-2xl">
            <DialogHeader className="sticky top-0 bg-white pb-4 border-b border-[#EAECF0]">
              <DialogTitle className="text-xl font-semibold text-[#1D3309]">
                {editing ? "Edit Conference" : "Create Conference"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="bg-[#F9FAFB] p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-[#1D3309] mb-3">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-[#1D3309]">Conference Name *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-[#1D3309]">Start Date & Time *</Label>
                        <Input 
                          type="datetime-local" 
                          value={formData.startDateTime} 
                          onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })} 
                          className="border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                          required 
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-[#1D3309]">End Date & Time *</Label>
                        <Input 
                          type="datetime-local" 
                          value={formData.endDateTime} 
                          onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })} 
                          className="border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-[#1D3309]">Short Description *</Label>
                      <Textarea 
                        value={formData.shortDescription} 
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} 
                        rows={2} 
                        placeholder="Brief description of the conference..."
                        className="border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                        required 
                      />
                    </div>
                  </div>
                </div>

                {/* Conference Details */}
                <div className="bg-[#F9FAFB] p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-[#1D3309] mb-3">Conference Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-[#1D3309]">Full Agenda *</Label>
                      <Textarea 
                        value={formData.fullAgenda} 
                        onChange={(e) => setFormData({ ...formData, fullAgenda: e.target.value })} 
                        rows={3} 
                        placeholder="Detailed agenda, schedule, and program..."
                        className="border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-[#1D3309]">Website Link</Label>
                        <Input 
                          type="url" 
                          placeholder="https://example.com" 
                          value={formData.website} 
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
                          className="border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-[#1D3309]">Required Budget (EGP) *</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={formData.requiredBudget} 
                          onChange={(e) => setFormData({ ...formData, requiredBudget: e.target.value })} 
                          className="border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-[#1D3309]">Source of Funding *</Label>
                        <select
                          value={formData.fundingSource}
                          onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value })}
                          className="mt-1 w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm focus:border-[#1D3309] focus:ring-2 focus:ring-[#1D3309] bg-white"
                          required
                        >
                          <option value="guc">GUC</option>
                          <option value="external">External</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-[#1D3309]">Extra Required Resources</Label>
                        <Input 
                          placeholder="e.g., AV equipment, volunteers" 
                          value={formData.extraResources} 
                          onChange={(e) => setFormData({ ...formData, extraResources: e.target.value })} 
                          className="border-[#D0D5DD] rounded-lg focus:border-[#1D3309] focus:ring-[#1D3309]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Control */}
                <div className="bg-[#F9FAFB] p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-[#1D3309] mb-3">Access Control</h3>
                  <div>
                    <Label className="text-sm font-medium text-[#1D3309] mb-2 block">
                      Restrict to User Types (Leave empty for all users)
                    </Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {USER_TYPE_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(formData.allowedUserTypes || []).includes(opt.value)}
                            onChange={() => handleUserTypeToggle(opt.value)}
                            className="w-4 h-4 text-[#1D3309] border-[#D0D5DD] rounded focus:ring-[#1D3309]"
                          />
                          <span className="text-sm text-[#1D3309]">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-[#1D3309] mt-1">
                      {formData.allowedUserTypes.length === 0 
                        ? 'All user types can register' 
                        : `Only ${formData.allowedUserTypes
                            .map(v => USER_TYPE_OPTIONS.find(o => o.value === v)?.label || v)
                            .join(', ')} can register`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#EAECF0] sticky bottom-0 bg-white">
                <Button 
                  type="button" 
                  onClick={() => setOpen(false)} 
                  variant="outline" 
                  className="border-[#1D3309] text-[#1D3309] hover:bg-[#1D3309]/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#1D3309] hover:bg-[#2A4A12] text-[#C7DA91]"
                >
                  {editing ? "Save Changes" : "Create Conference"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* RATINGS DIALOG */}
        <Dialog open={ratingsDialogOpen} onOpenChange={(open) => { setRatingsDialogOpen(open); setRatings([]); }}>
          <DialogContent className="max-w-xl bg-white rounded-xl p-6 shadow-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-white pb-4 border-b border-[#EAECF0]">
              <DialogTitle className="text-xl font-semibold text-[#1D3309]">
                Ratings & Comments for {selectedConference?.title || selectedConference?.name}
              </DialogTitle>
            </DialogHeader>

            {ratings.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">No ratings or comments yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {ratings.map((r, i) => (
                  <div key={i} className="border p-3 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{r.userName || "Anonymous"}</span>
                      <span className="text-yellow-500 font-bold">{r.rating} ⭐</span>
                    </div>
                    <p className="text-gray-600 text-sm">{r.comment || "No comment"}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={() => setRatingsDialogOpen(false)} variant="outline" className="border-[#1D3309] text-[#1D3309] hover:bg-[#1D3309]/10">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}