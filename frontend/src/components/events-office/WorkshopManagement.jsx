// WorkshopManagement.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/simple-dialog";
import { exportRegistrationsToExcel } from "../../utils/exportToExcel";
import { Trash2, Archive, ArchiveRestore, Download, Edit, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { CardSkeleton, NoWorkshopsManagementState } from "../LoadingEmptyStates";
import EOfiltersort from "../EOfiltersort";

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

const api = axios.create({
  baseURL: "http://localhost:5001/api/eo",
  headers: { "x-role": "events_office" },
});

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
// === Restriction helpers (SAME idea as trips) ===
const ROLE_OPTIONS = [
  { value: "student", label: "Students" },
  { value: "ta", label: "Teaching Assistants (TAs)" },
  { value: "staff", label: "Staff" },
  { value: "professor", label: "Professors" },
];

const roleLabelMap = {
  student: "Students",
  ta: "TAs",
  staff: "Staff",
  professor: "Professors",
};

function describeAudience(allowedUserTypes) {
  if (!Array.isArray(allowedUserTypes) || allowedUserTypes.length === 0) {
    return "Visible to all roles (students, TAs, staff, professors).";
  }
  const labels = allowedUserTypes
    .map((r) => roleLabelMap[r] || r)
    .filter(Boolean);

  if (labels.length === 1) return `Restricted to ${labels[0]}.`;
  if (labels.length === 2) return `Restricted to ${labels.join(" and ")}.`;
  return `Restricted to ${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}.`;
}

export default function WorkshopManagement() {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [ratingsDialogOpen, setRatingsDialogOpen] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  // Filter states
  const [filteredWorkshops, setFilteredWorkshops] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [filterProfessor, setFilterProfessor] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState('all');

  // Request-Edit modal
  const [editForId, setEditForId] = useState(null);
  const [editMsg, setEditMsg] = useState("");

  // NEW: restriction modal state
  const [restrictionWorkshop, setRestrictionWorkshop] = useState(null);
  const [restrictionTemp, setRestrictionTemp] = useState([]);

  const handleViewRatings = async (workshop) => {
    try {
      const { data } = await axios.get(
        `http://localhost:5001/api/events/${workshop._id}/reviews`
      );

      setRatings(data.reviews || []);
      setSelectedWorkshop(workshop);
      setRatingsDialogOpen(true);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setRatings([]);
      alert("Failed to fetch feedback for this workshop.");
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/workshops");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const s = e?.response?.status;
      const u = e?.config?.baseURL + e?.config?.url;
      console.error(`[${s}] GET ${u}`, e?.response?.data || e?.message || e);
      alert(
        `[${s || "ERR"}] ${u}\n` +
          (e?.response?.data?.message || e.message || "Request failed")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const acceptAndPublish = async (id) => {
    try {
      setBusyId(id);
      await api.patch(`/workshops/${id}/accept`);
      await load();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to accept & publish";
      alert(msg);
    } finally {
      setBusyId(null);
    }
  };

  const patch = async (id, path, body = {}) => {
    try {
      setBusyId(id);
      await api.patch(`/workshops/${id}/${path}`, body);
      await load();
    } catch (e) {
      console.error(`${path} failed:`, e?.response?.data || e);
      alert(
        e?.response?.data?.message ||
          `Failed to ${path.replace("-", " ")}`
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this workshop? This cannot be undone.")) return;
    try {
      setBusyId(id);
      await api.delete(`/workshops/${id}`);
      await load();
    } catch (e) {
      console.error("delete failed:", e?.response?.data || e);
      alert(e?.response?.data?.message || "Failed to delete workshop");
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (id, archive = true) => {
    try {
      setBusyId(id);
      if (archive) {
        await api.patch(`http://localhost:5001/api/events/${id}/archive`);
      }
      await load();
    } catch (e) {
      console.error("archive failed:", e?.response?.data || e);
      alert(e?.response?.data?.message || "Failed to archive workshop");
    } finally {
      setBusyId(null);
    }
  };

  const handleExportRegistrations = async (workshopId, workshopTitle) => {
    try {
      setBusyId(workshopId);
      const response = await axios.get(
        `http://localhost:5001/api/registrations/event/${workshopId}`,
        {
          headers: { "x-role": "events_office" },
        }
      );
      const registrations = response.data.data || response.data || [];

      if (registrations.length === 0) {
        alert("No registrations found for this workshop");
        return;
      }

      exportRegistrationsToExcel(registrations, workshopTitle, "workshop");
    } catch (error) {
      console.error("Error fetching registrations:", error);
      alert("Failed to export registrations. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openEditModal = (id) => {
    setEditForId(id);
    setEditMsg("");
  };
  const closeEditModal = () => {
    setEditForId(null);
    setEditMsg("");
  };
  const submitEditRequest = async () => {
    if (!editMsg.trim() || !editForId) return;
    await patch(editForId, "request-edits", { message: editMsg.trim() });
    closeEditModal();
  };

 const openRestrictionModal = (workshop) => {
  const current =
    Array.isArray(workshop.allowedUserTypes) &&
    workshop.allowedUserTypes.length > 0
      ? workshop.allowedUserTypes.map((r) => r.toLowerCase())
      : [];

  setRestrictionWorkshop(workshop);
  setRestrictionTemp(current);
};


  const closeRestrictionModal = () => {
    setRestrictionWorkshop(null);
    setRestrictionTemp([]);
  };

  const toggleRestrictionRole = (role) => {
    setRestrictionTemp((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const saveRestrictions = async () => {
    if (!restrictionWorkshop) return;
    try {
      setBusyId(restrictionWorkshop._id);
      await api.patch(
        `/workshops/${restrictionWorkshop._id}/restrictions`,
        {
          allowedUserTypes: restrictionTemp,
        }
      );
      await load();
      closeRestrictionModal();
    } catch (e) {
      console.error("restrictions failed:", e?.response?.data || e);
      alert(
        e?.response?.data?.message ||
          "Failed to save restrictions"
      );
    } finally {
      setBusyId(null);
    }
  };

  const currentDate = new Date();

  const isPastEvent = (workshop) => {
    const endDate = new Date(workshop.endDate || workshop.startDate);
    return endDate < currentDate;
  };

  // Memoized lists
  const activeWorkshops = useMemo(
    () => rows.filter((w) => !w.archived || w.archived === false),
    [rows]
  );

  const archivedWorkshops = useMemo(
    () => rows.filter((w) => w.archived === true),
    [rows]
  );

  const displayedWorkshops = useMemo(
    () => (showArchived ? archivedWorkshops : activeWorkshops),
    [showArchived, activeWorkshops, archivedWorkshops]
  );

  const hasAnyWorkshops = rows.length > 0;

  const uniqueProfessors = [...new Set(
    displayedWorkshops
      .map(w => w.professor || w.createdBy?.name || "Unknown Professor")
      .filter(Boolean)
  )].sort();
    const uniqueLocations = [...new Set(displayedWorkshops.map(w => w.location).filter(Boolean))].sort();

  useEffect(() => {
    let filtered = [...displayedWorkshops];

  if (filterProfessor !== 'all') {
    filtered = filtered.filter(w =>
      (w.professor || w.createdBy?.name || "Unknown Professor") === filterProfessor
    );
  }
        if (filterLocation !== 'all') filtered = filtered.filter(w => w.location === filterLocation);
  
    if (startDateFilter || endDateFilter) {
      filtered = filtered.filter(w => {
        const workshopDate = new Date(w.startDate);
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          if (workshopDate < start) return false;
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          if (workshopDate > end) return false;
        }
        return true;
      });
    }
  
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  
    setFilteredWorkshops(filtered);
  }, [filterProfessor, displayedWorkshops, filterLocation, startDateFilter, endDateFilter, sortOrder]);

  const workshopsToRender = filteredWorkshops;


  // LOADING STATE
  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-[#1D3309]">
                Workshop Management
              </CardTitle>
              <p className="text-[#1D3309] mt-1">
                Approve, reject, or request edits for workshops
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
        @keyframes workshopSlideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes workshopSlideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .workshop-container { animation: workshopSlideInDown 0.4s ease-out; }
        .workshop-card {
          transition: ${EOtransitions.normal};
          animation: workshopSlideInUp 0.3s ease-out;
        }
        .workshop-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
          [data-radix-card-header] {
          padding-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="workshop-container">
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
                                Workshop Management
                              </CardTitle>
                              <p
                                style={{
                                  color: EOcolors.text.secondary,
                                  fontSize: "0.9375rem",
                                }}
                              >
                                Approve, reject, or request edits for workshops
                              </p>
                            </div>
            </div>
          </CardHeader>

         <CardContent className="px-0" style={{ paddingTop: 0 }}>
      {!rows.length ? (
        <NoWorkshopsManagementState title="No Workshops Available" description="There are no workshops submitted for review at this time." />
      ) : (
        <>
          {/* Tabs + Filters Button — Filters on the right */}
          <div className="mb-4 mt-6 flex justify-between items-center gap-3 flex-wrap">
               <div className="flex gap-2">
              <button
                onClick={() => setShowArchived(false)}
                style={{
                  ...(!showArchived ? EObuttonStyles.primary : EObuttonStyles.outline),
                  padding: "0.65rem 1.25rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  borderRadius: EOradius.lg,
                }}
              >
                Active ({activeWorkshops.length})
              </button>
              <button
                onClick={() => setShowArchived(true)}
                style={{
                  ...(showArchived ? EObuttonStyles.primary : EObuttonStyles.outline),
                  padding: "0.65rem 1.25rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  borderRadius: EOradius.lg,
                }}
              >
                Archived ({archivedWorkshops.length})
              </button>
            </div>

            {displayedWorkshops.length > 0 && (
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

          {/* Custom Filter Panel */}
          {/* Custom Filter Panel — EXACT SAME AS TRIPMANAGEMENT (with Location!) */}
{showFilters && displayedWorkshops.length > 0 && (
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

      {/* Filter by Location — NOW INCLUDED! */}
      {uniqueLocations.length > 0 && (
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="all">All Locations</option>
          {uniqueLocations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      )}

      {/* Date Range */}
      <div className="w-64">
        <CalendarRangePicker
          onDateRangeChange={(s, e) => {
            setStartDateFilter(s);
            setEndDateFilter(e);
          }}
          startDate={startDateFilter}
          endDate={endDateFilter}
        />
      </div>

      {/* Sort */}
      <select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      {/* Clear Filters */}
      {(filterProfessor !== 'all' || filterLocation !== 'all' || startDateFilter || endDateFilter) && (
        <button
          onClick={() => {
            setFilterProfessor('all');       
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

                {/* EMPTY STATE FOR CURRENT VIEW */}
                {((showArchived && archivedWorkshops.length === 0) ||
                  (!showArchived && activeWorkshops.length === 0)) ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#EAECF0]">
                    <NoWorkshopsManagementState
                      title={
                        showArchived
                          ? "No Archived Workshops"
                          : "No Active Workshops"
                      }
                      description={
                        showArchived
                          ? "There are no archived workshops in the system."
                          : "There are no active workshops awaiting approval."
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workshopsToRender.map((workshop) => {
                      const isPast = isPastEvent(workshop);
                      const startDate = new Date(workshop.startDate);
                      const endDate = new Date(
                        workshop.endDate || workshop.startDate
                      );

                      const formatDateRange = () => {
                        const startDay = startDate.getDate();
                        const endDay = endDate.getDate();
                        const startMonth = startDate
                          .toLocaleDateString("en-US", {
                            month: "short",
                          })
                          .toUpperCase();
                        const endMonth = endDate
                          .toLocaleDateString("en-US", {
                            month: "short",
                          })
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

                      const statusStyle = workshop.archived
                        ? EObadgeStyles.error
                        : workshop.published
                        ? EObadgeStyles.success
                        : EObadgeStyles.pending;

                      const statusLabel = workshop.archived
                        ? "Archived"
                        : workshop.published
                        ? "Published"
                        : "Pending";

                      const eventStatusStyle = isPast
                        ? EObadgeStyles.pending
                        : EObadgeStyles.success;

                      const eventStatusLabel = isPast
                        ? "Past Event"
                        : "Upcoming";

                      const audienceText = describeAudience(
                        workshop.allowedUserTypes
                      );

                      return (
                        <div
                          key={workshop._id}
                          className="workshop-card"
                          style={{
                            background: "white",
                            borderRadius: EOradius.xl,
                            border: `2px solid ${EOcolors.lightSilver}`,
                            padding: "1.5rem",
                            display: "flex",
                            gap: "1.5rem",
                            alignItems: "flex-start",
                            opacity: workshop.archived ? 0.7 : 1,
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
                                  {workshop.title ||
                                    workshop.shortDescription ||
                                    "(no title)"}
                                  {workshop.archived && (
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
                                  🕒 {startDate.toLocaleDateString()} -{" "}
                                  {endDate.toLocaleDateString()}
                                  {workshop.published && (
                                    <span
                                      style={{
                                        marginLeft: "1rem",
                                        color: EOcolors.success,
                                      }}
                                    >
                                      ✅ Published
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  flexShrink: 0,
                                }}
                              >
                                <span style={statusStyle}>{statusLabel}</span>
                                {!workshop.archived && (
                                  <span style={eventStatusStyle}>
                                    {eventStatusLabel}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p
                              style={{
                                color: EOcolors.text.secondary,
                                fontSize: "0.9rem",
                                marginBottom: "0.5rem",
                              }}
                              className="line-clamp-2"
                            >
                              {workshop.description ||
                                workshop.shortDescription ||
                                "No description available"}
                            </p>

                            {/* NEW: audience description */}
                            <p
                              style={{
                                color: EOcolors.text.muted,
                                fontSize: "0.8rem",
                                marginBottom: "0.75rem",
                              }}
                            >
                              {audienceText}
                            </p>

                            {/* Action Buttons */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                                marginTop: "0.5rem",
                              }}
                            >
                              {!workshop.archived && (
                                <>
                                  {/* Accept & Publish */}
                                  {!workshop.published && (
                                    <button
                                      onClick={() =>
                                        acceptAndPublish(workshop._id)
                                      }
                                      disabled={busyId === workshop._id}
                                      style={{
                                        ...EObuttonStyles.outline,
                                        padding: "0.4rem 0.9rem",
                                        fontSize: "0.85rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        borderColor: "#10B981",
                                        color: "#10B981",
                                      }}
                                    >
                                      {busyId === workshop._id
                                        ? "Publishing…"
                                        : "Accept & Publish"}
                                    </button>
                                  )}

                                  {/* Reject */}
                                  {!workshop.published && (
                                    <button
                                      onClick={() =>
                                        patch(workshop._id, "reject", {
                                          reason:
                                            "Doesn't meet criteria",
                                        })
                                      }
                                      disabled={busyId === workshop._id}
                                      style={{
                                        ...EObuttonStyles.outline,
                                        padding: "0.4rem 0.9rem",
                                        fontSize: "0.85rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        borderColor: EOcolors.error,
                                        color: EOcolors.error,
                                      }}
                                    >
                                      {busyId === workshop._id
                                        ? "Rejecting…"
                                        : "Reject"}
                                    </button>
                                  )}

                                  {/* Request Edit */}
                                  {!workshop.published && (
                                    <button
                                      onClick={() =>
                                        openEditModal(workshop._id)
                                      }
                                      disabled={busyId === workshop._id}
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
                                      {busyId === workshop._id
                                        ? "Requesting…"
                                        : "Request Edit"}
                                    </button>
                                  )}

                                  {/* NEW: Restrictions button */}
                                  <button
                                    onClick={() =>
                                      openRestrictionModal(workshop)
                                    }
                                    disabled={busyId === workshop._id}
                                    style={{
                                      ...EObuttonStyles.outline,
                                      padding: "0.4rem 0.9rem",
                                      fontSize: "0.85rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.4rem",
                                      borderColor: "#7C3AED",
                                      color: "#7C3AED",
                                    }}
                                  >
                                    <Edit
                                      style={{
                                        width: "1rem",
                                        height: "1rem",
                                      }}
                                    />
                                    Restrictions
                                  </button>
                                </>
                              )}

                              {/* Archive */}
                              {!workshop.archived && isPast && (
                                <button
                                  onClick={() =>
                                    handleArchive(workshop._id, true)
                                  }
                                  disabled={busyId === workshop._id}
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
                                    style={{
                                      width: "1rem",
                                      height: "1rem",
                                    }}
                                  />
                                  {busyId === workshop._id
                                    ? "Archiving…"
                                    : "Archive"}
                                </button>
                              )}

                              {/* Unarchive */}
                              {workshop.archived && (
                                <button
                                  onClick={() =>
                                    handleArchive(workshop._id, false)
                                  }
                                  disabled={busyId === workshop._id}
                                  style={{
                                    ...EObuttonStyles.outline,
                                    padding: "0.4rem 0.9rem",
                                    fontSize: "0.85rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    borderColor: EOcolors.secondary,
                                    color: EOcolors.secondary,
                                  }}
                                >
                                  <ArchiveRestore
                                    style={{
                                      width: "1rem",
                                      height: "1rem",
                                    }}
                                  />
                                  {busyId === workshop._id
                                    ? "Unarchiving…"
                                    : "Unarchive"}
                                </button>
                              )}

                              {/* Export */}
                              <button
                                onClick={() =>
                                  handleExportRegistrations(
                                    workshop._id,
                                    workshop.title ||
                                      workshop.shortDescription ||
                                      "Workshop"
                                  )
                                }
                                disabled={busyId === workshop._id}
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
                                  style={{
                                    width: "1rem",
                                    height: "1rem",
                                  }}
                                />
                                {busyId === workshop._id
                                  ? "Exporting…"
                                  : "Export"}
                              </button>

                              {/* View Feedback */}
                              <button
                                onClick={() => handleViewRatings(workshop)}
                                disabled={busyId === workshop._id}
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

                              {/* Delete */}
                              <button
                                onClick={() => remove(workshop._id)}
                                disabled={busyId === workshop._id}
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
                                  style={{
                                    width: "1rem",
                                    height: "1rem",
                                  }}
                                />
                                {busyId === workshop._id
                                  ? "Deleting…"
                                  : "Delete"}
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

        {/* Edit Modal */}
        <Dialog
          open={Boolean(editForId)}
          onOpenChange={(open) => {
            if (!open) closeEditModal();
          }}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle style={{ color: EOcolors.secondary }}>
                Request Edits
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <p
                className="text-sm"
                style={{ color: EOcolors.primary }}
              >
                Describe what needs to be changed or clarified for this
                workshop.
              </p>

              <Textarea
                autoFocus
                placeholder="Write your request…"
                value={editMsg}
                onChange={(e) => setEditMsg(e.target.value)}
                className="min-h-[100px]"
                style={{
                  borderColor: EOcolors.primary,
                  backgroundColor: EOcolors.light,
                  color: EOcolors.secondary,
                }}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeEditModal}
                  style={{
                    ...EObuttonStyles.outline,
                    padding: "0.5rem 1rem",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={submitEditRequest}
                  disabled={!editMsg.trim() || busyId === editForId}
                  style={{
                    ...EObuttonStyles.primary,
                    padding: "0.5rem 1rem",
                    opacity:
                      !editMsg.trim() || busyId === editForId
                        ? 0.6
                        : 1,
                  }}
                >
                  {busyId === editForId ? "Sending…" : "Send Request"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* RATINGS DIALOG */}
        <Dialog
          open={ratingsDialogOpen}
          onOpenChange={(open) => {
            setRatingsDialogOpen(open);
            if (!open) setRatings([]);
          }}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ color: EOcolors.secondary }}>
                Ratings & Comments for{" "}
                {selectedWorkshop?.title || "Workshop"}
              </DialogTitle>
            </DialogHeader>

            {ratings.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">
                No ratings or comments yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {ratings.map((r, i) => (
                  <div
                    key={i}
                    className="border p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">
                        {r.userName ||
                          r.userId?.firstName ||
                          r.userId?.email ||
                          "Anonymous"}
                      </span>
                      <span className="text-yellow-500 font-bold">
                        {r.rating} ⭐
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-gray-600 text-sm">
                        {r.comment}
                      </p>
                    )}
                    {r.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(
                          r.createdAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setRatingsDialogOpen(false)}
                style={{
                  ...EObuttonStyles.outline,
                  padding: "0.5rem 1rem",
                }}
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* RESTRICTIONS DIALOG (no line under checkboxes) */}
        <Dialog
          open={Boolean(restrictionWorkshop)}
          onOpenChange={(open) => {
            if (!open) closeRestrictionModal();
          }}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle style={{ color: EOcolors.secondary }}>
                Restrict Registration
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p
                  className="text-sm"
                  style={{ color: EOcolors.primary }}
                >
                  Select which roles are allowed to register for this
                  workshop.
                </p>
                <div className="mt-3 space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: EOcolors.secondary }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={restrictionTemp.includes(opt.value)}
                        onChange={() =>
                          toggleRestrictionRole(opt.value)
                        }
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ❌ No extra line / helper text under the checkboxes */}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeRestrictionModal}
                  style={{
                    ...EObuttonStyles.outline,
                    padding: "0.5rem 1rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveRestrictions}
                  disabled={
                    busyId === restrictionWorkshop?._id
                  }
                  style={{
                    ...EObuttonStyles.primary,
                    padding: "0.5rem 1rem",
                    opacity:
                      busyId === restrictionWorkshop?._id
                        ? 0.6
                        : 1,
                  }}
                >
                  {busyId === restrictionWorkshop?._id
                    ? "Saving…"
                    : "Save"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
