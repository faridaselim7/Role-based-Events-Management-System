import { Search, ChevronDown, X, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from "../components/ui/button";


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
        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7DBF2] bg-white flex items-center justify-between hover:border-[#D7DBF2] transition-colors"
      >
        <span className="text-gray-700">
          {startDate && endDate 
            ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
            : startDate
            ? `${startDate.toLocaleDateString()} - ...`
            : 'Select date range'}
        </span>
        <Calendar className="w-4 h-4 text-gray-500" />
      </button>

      {showCalendar && (
        <div className="calendar-container absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-4 min-w-[320px]">
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
    className="flex-1 py-1.5 bg-[#366B2B] text-white rounded hover:bg-[#2d5623] font-medium text-xs"    >
    Confirm
  </button>
</div>
        </div>
      )}
    </div>
  );
};

const EventFilterSort = ({ 
  events, 
  onFilteredEventsChange, 
  eventType = 'event'
}) => {
  const [filters, setFilters] = useState({
    name: '',
    location: '',
    type: '',
    dateRange: { start: null, end: null }
  });
  const [sortBy, setSortBy] = useState('date-asc');
  const [showFilters, setShowFilters] = useState(false);

  const uniqueLocations = useMemo(() => {
    return [...new Set(events.map(e => e.location).filter(Boolean))].sort();
  }, [events]);

  const uniqueTypes = useMemo(() => {
    if (eventType === 'gym' || eventType === 'gym session') {
      return ['yoga', 'pilates', 'aerobics', 'zumba', 'cross_circuit', 'kick_boxing'];
    }
    return [...new Set(events.map(e => e.type || e.eventType || e.category).filter(Boolean))].sort();
  }, [events, eventType]);

  const getTypeLabel = (type) => {
    if (!type) return type;
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  const getName = (e) => {
    return e.name || e.title || '';
  };

  const getDate = (e) => {
    return e.date || e.startDate || e.startDateTime || '';
  };

  const getProfessor = (e) => {
    return e.professorName || e.professor || e.facultyResponsible || '';
  };

  const uniqueEventNames = useMemo(() => {
    if (eventType === 'workshop' || eventType === 'conference') {
      return [...new Set(events.map(e => getProfessor(e)).filter(Boolean))].sort();
    }
    return [...new Set(events.map(e => getName(e)).filter(Boolean))].sort();
  }, [events, eventType]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (filters.name) {
      if (eventType === 'workshop' || eventType === 'conference') {
        result = result.filter(e => getProfessor(e) === filters.name);
      } else {
        result = result.filter(e => getName(e) === filters.name);
      }
    }

    if (filters.location) {
      result = result.filter(e => e.location === filters.location);
    }

    if (filters.type) {
      result = result.filter(e => 
        (e.type === filters.type) || 
        (e.eventType === filters.type) || 
        (e.category === filters.type)
      );
    }

    if (filters.dateRange.start) {
      result = result.filter(e => {
        const eDate = new Date(getDate(e));
        return eDate >= filters.dateRange.start;
      });
    }

    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(e => {
        const eDate = new Date(getDate(e));
        return eDate <= endDate;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'date-asc' || sortBy === 'date-desc') {
        const dateA = new Date(getDate(a) || 0);
        const dateB = new Date(getDate(b) || 0);
        return sortBy === 'date-asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'name-asc' || sortBy === 'name-desc') {
        const nameA = getName(a).toLowerCase();
        const nameB = getName(b).toLowerCase();
        return sortBy === 'name-asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      }
      return 0;
    });

    return result;
  }, [events, filters, sortBy, eventType]);

  useEffect(() => {
    onFilteredEventsChange(filteredEvents);
  }, [filteredEvents, onFilteredEventsChange]);

  const handleDateRangeChange = (start, end) => {
    setFilters({
      ...filters,
      dateRange: { start, end }
    });
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      location: '',
      type: '',
      dateRange: { start: null, end: null }
    });
    setSortBy('date-asc');
  };

  const hasActiveFilters = filters.name || filters.location || filters.type || 
                          filters.dateRange.start || filters.dateRange.end ||
                          sortBy !== 'date-asc';

  const getNameLabel = () => {
    switch(eventType) {
      case 'workshop':
      case 'conference':
        return 'Professor Name';
      case 'trip':
        return 'Trip Name';
      case 'bazaar':
        return 'Bazaar Name';
      case 'gym':
      case 'gym session':
        return 'Session Name';
      default:
        return 'Event Name';
    }
  };

  const nameLabel = getNameLabel();

  return (
    <div className="mb-6 bg-white rounded-lg border border-[#E2E8F0] p-4">
       <div className="flex items-center justify-end mb-4">
      <Button 
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
                className="border-[#D7DBF2] text-[#2D3748] hover:bg-[#D7DBF2] hover:border-[#D7DBF2]"
                disabled={events.length === 0}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
        <div className="flex items-center gap-4">

          {hasActiveFilters && (
                    <Button 
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-[#F8FAFC] rounded-lg">
          <div>
            <label className="block text-xs font-medium text-[#2B4B3E] mb-2">{nameLabel}</label>
            <select
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7DBF2]"
            >
              <option value="">All Events</option>
              {uniqueEventNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B4B3E] mb-2">Location</label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7DBF2]"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>



          <div>
            <label className="block text-xs font-medium text-[#2B4B3E] mb-2">Date Range</label>
            <CalendarRangePicker 
              onDateRangeChange={handleDateRangeChange}
              startDate={filters.dateRange.start}
              endDate={filters.dateRange.end}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2B4B3E] mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7DBF2]"
            >
              <option value="date-asc">Date (Earliest)</option>
              <option value="date-desc">Date (Latest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventFilterSort;