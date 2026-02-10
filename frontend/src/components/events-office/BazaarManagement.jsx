import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Edit, Trash2, Archive, Download, ChevronLeft, ChevronRight, Calendar} from 'lucide-react';
import axios from 'axios';
import { exportRegistrationsToExcel } from '../../utils/exportToExcel';
import EOfiltersort from '../EOfiltersort';
import {
  CardSkeleton,
  NoBazaarsState
} from '../LoadingEmptyStates';

// EO design system imports for outer layer + cards
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
} from '../../styles/EOdesignSystem';

// 🔹 Only change: values capitalized to match backend
const USER_TYPE_OPTIONS = [
  { value: "Student",   label: "Student" },
  { value: "Staff",     label: "Staff" },
  { value: "TA",        label: "TA" },
  { value: "Professor", label: "Professor" },
];

const roleHeader = { headers: { 'x-role': 'events_office' } };
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

function BazaarManagement() {
  const [bazaars, setBazaars] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingBazaar, setEditingBazaar] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    description: '',
    registrationDeadline: '',
    allowedUserTypes: []
  });

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [selectedBazaarForFeedback, setSelectedBazaarForFeedback] = useState(null);
  const [filteredBazaars, setFilteredBazaars] = useState([]);
const [sortOrder, setSortOrder] = useState('newest');
const [filterLocation, setFilterLocation] = useState('all');
const [filterName, setFilterName] = useState('all');
const [startDateFilter, setStartDateFilter] = useState(null);
const [endDateFilter, setEndDateFilter] = useState(null);
const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    fetchBazaars();
  }, []);

  const fetchBazaars = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/events/bazaars');
      setBazaars(response.data);
    } catch (error) {
      console.error('Error fetching bazaars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        allowedUserTypes: formData.allowedUserTypes || []
      };
      if (editingBazaar) {
        await axios.put(`http://localhost:5001/api/events/bazaars/${editingBazaar._id}`, payload);
      } else {
        await axios.post('http://localhost:5001/api/events/bazaars', payload);
      }
      setOpen(false);
      setEditingBazaar(null);
      fetchBazaars();
      resetForm();
    } catch (error) {
      console.error('Error saving bazaar:', error);
    }
  };

  const handleEdit = (bazaar) => {
    const formatDate = (dateString) => new Date(dateString).toISOString().slice(0, 16);
    setEditingBazaar(bazaar);
    setFormData({
      name: bazaar.name,
      location: bazaar.location,
      startDateTime: formatDate(bazaar.startDateTime),
      endDateTime: formatDate(bazaar.endDateTime),
      description: bazaar.description,
      registrationDeadline: bazaar.registrationDeadline ? formatDate(bazaar.registrationDeadline) : '',
      allowedUserTypes: bazaar.allowedUserTypes || []
    });
    setOpen(true);
  };

  const handleDeleteBazaar = async (id) => {
    if (!window.confirm('Delete this bazaar? This cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:5001/api/events/bazaars/${id}`, roleHeader);
      fetchBazaars();
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Delete failed';
      alert(`Delete failed: ${msg}`);
      console.error('Error deleting bazaar:', error);
    }
  };

  const handleArchiveBazaar = async (id, archive = true) => {
    try {
      if (archive) {
        await axios.patch(`http://localhost:5001/api/events/${id}/archive`, {}, roleHeader);
      } else {
        await axios.patch(`http://localhost:5001/api/events/${id}/unarchive`, {}, roleHeader);
      }
      await fetchBazaars();
      if (archive) {
        setShowArchived(true);
      } else {
        setShowArchived(false);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Archive operation failed';
      alert(`Archive failed: ${msg}`);
    }
  };

  const handleExportRegistrations = async (bazaarId, bazaarName) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/registrations/event/${bazaarId}`, roleHeader);
      const registrations = response.data.data || response.data || [];

      if (registrations.length === 0) {
        alert('No registrations found for this bazaar');
        return;
      }

      exportRegistrationsToExcel(registrations, bazaarName, 'bazaar');
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Failed to export registrations. Please try again.');
    }
  };

  const handleViewFeedback = async (bazaar) => {
    setSelectedBazaarForFeedback(bazaar);
    setFeedbackOpen(true);
    setFeedbackLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:5001/api/events/${bazaar._id}/reviews`
      );

      setFeedbackData(response.data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setFeedbackData([]);
      alert("Failed to load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      startDateTime: '',
      endDateTime: '',
      description: '',
      registrationDeadline: '',
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

  const currentDate = new Date();

  // Memoized lists
  const activeBazaars = useMemo(
    () => bazaars.filter(b => !b.archived || b.archived === false),
    [bazaars]
  );

  const archivedBazaars = useMemo(
    () => bazaars.filter(b => b.archived === true),
    [bazaars]
  );

  const displayedBazaars = useMemo(
    () => (showArchived ? archivedBazaars : activeBazaars),
    [showArchived, activeBazaars, archivedBazaars]
  );

  const hasAnyBazaars = bazaars.length > 0;

  const isPastEvent = (bazaar) => {
    const endDate = new Date(bazaar.endDateTime);
    return endDate < currentDate;
  };

  const bazaarsToRender = filteredBazaars;
    // Calculate unique values for filters
const uniqueNames = [...new Set(displayedBazaars.map(b => b.name).filter(Boolean))].sort();
const uniqueLocations = [...new Set(displayedBazaars.map(b => b.location).filter(Boolean))].sort();

// Apply filters
useEffect(() => {
  let filtered = [...displayedBazaars];



  // Name filter
  if (filterName !== 'all') {
    filtered = filtered.filter((b) => b.name === filterName);
  }

  // Location filter
  if (filterLocation !== 'all') {
    filtered = filtered.filter((b) => b.location === filterLocation);
  }

  // Date range filter
  if (startDateFilter || endDateFilter) {
    filtered = filtered.filter((b) => {
      const bazaarDate = new Date(b.startDateTime);
      
      if (startDateFilter) {
        const start = new Date(startDateFilter);
        start.setHours(0, 0, 0, 0);
        if (bazaarDate < start) return false;
      }
      
      if (endDateFilter) {
        const end = new Date(endDateFilter);
        end.setHours(23, 59, 59, 999);
        if (bazaarDate > end) return false;
      }
      
      return true;
    });
  }

  // Sort by date
  filtered.sort((a, b) => {
    const dateA = new Date(a.startDateTime);
    const dateB = new Date(b.startDateTime);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  setFilteredBazaars(filtered);
}, [displayedBazaars, sortOrder, filterLocation, filterName, startDateFilter, endDateFilter]);

  // LOADING STATE
  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-[#1D3309]">
                Bazaar Management
              </CardTitle>
              <p className="text-[#1D3309] mt-1">Create and manage campus bazaars</p>
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
        @keyframes bazaarSlideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bazaarSlideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bazaar-container { animation: bazaarSlideInDown 0.4s ease-out; }
        .bazaar-card {
          transition: ${EOtransitions.normal};
          animation: bazaarSlideInUp 0.3s ease-out;
        }
        .bazaar-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
          [data-radix-card-header] {
          padding-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="bazaar-container">
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
                                Bazaar Management
                              </CardTitle>
                              <p
                                style={{
                                  color: EOcolors.text.secondary,
                                  fontSize: "0.9375rem",
                                }}
                              >
                                Create and manage campus bazaars
                              </p>
                            </div>
              {hasAnyBazaars && (
                <button
                  onClick={() => {
                    setEditingBazaar(null);
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
                  Create Bazaar
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-4">
            {/* EMPTY STATE - No bazaars at all */}
            {!hasAnyBazaars ? (
              <NoBazaarsState onCreateClick={() => setOpen(true)} />
            ) : (
              <>
                {/* Tabs (Active / Archived) */}
               <div className="mb-4 mt-6 flex justify-between items-center gap-3 flex-wrap">
                       <div className="flex gap-2">
    <button
      onClick={() => {
        setShowArchived(false);
        setFilteredBazaars([]);
      }}
      style={{
        ...(!showArchived
          ? EObuttonStyles.primary
          : EObuttonStyles.outline),
        padding: "0.65rem 1.25rem",
        fontSize: "0.9375rem",
        fontWeight: 600,
        borderRadius: EOradius.lg,
      }}
    >
      Active ({activeBazaars.length})
    </button>
    <button
      onClick={() => {
        setShowArchived(true);
        setFilteredBazaars([]);
      }}
      style={{
        ...(showArchived
          ? EObuttonStyles.primary
          : EObuttonStyles.outline),
        padding: "0.65rem 1.25rem",
        fontSize: "0.9375rem",
        fontWeight: 600,
        borderRadius: EOradius.lg,
      }}
    >
      Archived ({archivedBazaars.length})
    </button>
  </div>
  
  {/* Filters Toggle Button */}
  {displayedBazaars.length > 0 && (
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

                {/* FILTER BLOCK */}
               {/* SEARCH AND FILTERS */}
{/* FILTERS SECTION - Collapsible */}
{showFilters && displayedBazaars.length > 0 && (
  <div 
    className="mb-4 p-4 bg-white rounded-xl border-2"
    style={{ 
      borderColor: EOcolors.lightSilver,
      animation: "bazaarSlideInUp 0.3s ease-out"
    }}
  >
    <div className="flex flex-wrap gap-4">
      {/* Name Filter */}
      {uniqueNames.length > 0 && (
        <select
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="all">All Bazaars</option>
          {uniqueNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      )}

      {/* Location Filter */}
      {uniqueLocations.length > 0 && (
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="all">All Locations</option>
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      )}

      {/* Date Range Picker */}
      <div className="w-64">
        <CalendarRangePicker
          onDateRangeChange={(start, end) => {
            setStartDateFilter(start);
            setEndDateFilter(end);
          }}
          startDate={startDateFilter}
          endDate={endDateFilter}
        />
      </div>

      {/* Sort Order */}
      <select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      {/* Clear Filters Button */}
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
                {((showArchived && archivedBazaars.length === 0) ||
                  (!showArchived && activeBazaars.length === 0)) ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#EAECF0]">
                    <NoBazaarsState
                      onCreateClick={() => setOpen(true)}
                      title={showArchived ? "No Archived Bazaars" : "No Active Bazaars"}
                      description={
                        showArchived
                          ? "There are no archived bazaars in the system."
                          : "Get started by creating your first bazaar"
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bazaarsToRender.map((bazaar) => {
                      const isPast = isPastEvent(bazaar);
                      const startDate = new Date(bazaar.startDateTime);
                      const endDate = new Date(bazaar.endDateTime);

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

                      const statusStyle = bazaar.archived
                        ? EObadgeStyles.error
                        : isPast
                          ? EObadgeStyles.pending
                          : EObadgeStyles.success;

                      const statusLabel = bazaar.archived
                        ? "Archived"
                        : isPast
                          ? "Past Event"
                          : "Upcoming";

                      return (
                        <div
                          key={bazaar._id}
                          className="bazaar-card"
                          style={{
                            background: "white",
                            borderRadius: EOradius.xl,
                            border: `2px solid ${EOcolors.lightSilver}`,
                            padding: "1.5rem",
                            display: "flex",
                            gap: "1.5rem",
                            alignItems: "flex-start",
                            opacity: bazaar.archived ? 0.7 : 1,
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
                                  {bazaar.name}
                                  {bazaar.archived && (
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
                                  📍 {bazaar.location}
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
                              {bazaar.description}
                            </p>

                            {bazaar.allowedUserTypes &&
                              bazaar.allowedUserTypes.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.4rem",
                                    marginBottom: "0.75rem",
                                  }}
                                >
                                  {bazaar.allowedUserTypes.map((type) => (
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
                              {!bazaar.archived &&
                                new Date(bazaar.startDateTime) > currentDate && (
                                  <button
                                    onClick={() => handleEdit(bazaar)}
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

                              {!bazaar.archived && isPast && (
                                <button
                                  onClick={() =>
                                    handleArchiveBazaar(bazaar._id, true)
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
                                  handleExportRegistrations(bazaar._id, bazaar.name)
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
                                onClick={() => handleViewFeedback(bazaar)}
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
                                onClick={() => handleDeleteBazaar(bazaar._id)}
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

        {/* CREATE / EDIT BAZAAR DIALOG */}
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditingBazaar(null);
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
                {editingBazaar ? "Edit" : "Create"} Bazaar
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-[#1D3309]">
                    Bazaar Name
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
                <div>
                  <Label className="text-sm font-medium text-[#1D3309] mb-2 block">
                    Restrict to User Types (Leave empty for all users)
                  </Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {USER_TYPE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(formData.allowedUserTypes || []).includes(opt.value)}
                          onChange={() => handleUserTypeToggle(opt.value)}
                          className="w-4 h-4 text-[#1D3309] border-[#D0D5DD] rounded focus:ring-[#1D3309]"
                        />
                        <span className="text-sm text-[#1D3309]">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-[#1D3309] mt-1">
                    {formData.allowedUserTypes.length === 0
                      ? "All user types can register"
                      : `Only ${formData.allowedUserTypes
                        .map(v => USER_TYPE_OPTIONS.find(o => o.value === v)?.label || v)
                        .join(", ")
                      } can register`}
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
                  {editingBazaar ? "Save Changes" : "Create Bazaar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* FEEDBACK DIALOG */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent className="max-w-xl bg-white rounded-xl p-6 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#3B5C90]">
                Feedback — {selectedBazaarForFeedback?.name}
              </DialogTitle>
            </DialogHeader>

            {feedbackLoading ? (
              <p className="text-center py-6 text-gray-500">Loading feedback...</p>
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

export default BazaarManagement;