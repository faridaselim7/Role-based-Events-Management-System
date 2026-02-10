// EventsView_Fixed.jsx - Fixed type display issues

import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, MapPin, XCircle, Star, Heart, Store, Users, MessageCircle,ChevronLeft, ChevronRight } from "lucide-react";
import { CardSkeleton, NoEventsState, NoSearchResultsState } from '../components/LoadingEmptyStates';

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};
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
const EventsView = ({ onSearchHandlerRef, userId, favorites = [], onToggleFavorite }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterProfessor, setFilterProfessor] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [viewMode, setViewMode] = useState('upcoming');
  const [eventRatings, setEventRatings] = useState({});
  const [filterName, setFilterName] = useState('all');


// Start with all events
let tempFiltered = [...events];

// Apply ALL active filters to get the base filtered set
if (filterType !== 'all') {
  tempFiltered = tempFiltered.filter((e) => {
    const eventType = (e.type || '').toLowerCase();
    const eventCategory = (e.category || '').toLowerCase();
    const filterTypeLower = filterType.toLowerCase();
    return eventType === filterTypeLower || eventCategory === filterTypeLower;
  });
}

if (filterName !== 'all') {
  tempFiltered = tempFiltered.filter((e) => {
    const eventName = e.name || e.title || '';
    return eventName === filterName;
  });
}

if (filterLocation !== 'all') {
  tempFiltered = tempFiltered.filter((e) => e.location === filterLocation);
}

if (filterProfessor !== 'all') {
  tempFiltered = tempFiltered.filter((e) => {
    return e.professorNames && e.professorNames.includes(filterProfessor);
  });
}

// Now calculate unique values for each dropdown by removing ONLY that specific filter
// For names: apply all filters EXCEPT name filter
let forNames = [...events];
if (filterType !== 'all') {
  forNames = forNames.filter((e) => {
    const eventType = (e.type || '').toLowerCase();
    const eventCategory = (e.category || '').toLowerCase();
    const filterTypeLower = filterType.toLowerCase();
    return eventType === filterTypeLower || eventCategory === filterTypeLower;
  });
}
if (filterLocation !== 'all') {
  forNames = forNames.filter((e) => e.location === filterLocation);
}
if (filterProfessor !== 'all') {
  forNames = forNames.filter((e) => e.professorNames && e.professorNames.includes(filterProfessor));
}
const uniqueNames = [...new Set(forNames.map(e => e.name || e.title).filter(Boolean))].sort();

// For locations: apply all filters EXCEPT location filter
let forLocations = [...events];
if (filterType !== 'all') {
  forLocations = forLocations.filter((e) => {
    const eventType = (e.type || '').toLowerCase();
    const eventCategory = (e.category || '').toLowerCase();
    const filterTypeLower = filterType.toLowerCase();
    return eventType === filterTypeLower || eventCategory === filterTypeLower;
  });
}
if (filterName !== 'all') {
  forLocations = forLocations.filter((e) => {
    const eventName = e.name || e.title || '';
    return eventName === filterName;
  });
}
if (filterProfessor !== 'all') {
  forLocations = forLocations.filter((e) => e.professorNames && e.professorNames.includes(filterProfessor));
}
const uniqueLocations = [...new Set(forLocations.map(e => e.location).filter(Boolean))].sort();

// For professors: apply all filters EXCEPT professor filter
let forProfessors = [...events];
if (filterType !== 'all') {
  forProfessors = forProfessors.filter((e) => {
    const eventType = (e.type || '').toLowerCase();
    const eventCategory = (e.category || '').toLowerCase();
    const filterTypeLower = filterType.toLowerCase();
    return eventType === filterTypeLower || eventCategory === filterTypeLower;
  });
}
if (filterName !== 'all') {
  forProfessors = forProfessors.filter((e) => {
    const eventName = e.name || e.title || '';
    return eventName === filterName;
  });
}
if (filterLocation !== 'all') {
  forProfessors = forProfessors.filter((e) => e.location === filterLocation);
}
const uniqueProfessors = [...new Set(
  forProfessors
    .filter(e => e.professorNames && e.professorNames.length > 0)
    .flatMap(e => e.professorNames)
    .filter(Boolean)
)].sort();
  
  const toggleFavorite = (eventId, e) => {
    if (e) e.stopPropagation();
    if (typeof onToggleFavorite === 'function') {
      onToggleFavorite(eventId);
    }
  };
  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };
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
    
    for (const event of allEvents) {
      const eventEndDate = new Date(event.endDate || event.endDateTime || event.date || event.startDate);
      
      if (eventEndDate < now) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    }
    
    return { upcoming, past };
  };

  // Helper function to normalize event type/category
  const normalizeEventType = (event) => {
    let eventType = event.type || event.category || 'event';
    let eventCategory = event.category || event.type || 'event';
    
    // Convert to string if needed
    eventType = String(eventType);
    eventCategory = String(eventCategory);
    
    // Normalize type to Title Case
    eventType = eventType.charAt(0).toUpperCase() + eventType.slice(1).toLowerCase();
    // Normalize category to lowercase
    eventCategory = eventCategory.toLowerCase();
    
    return {
      ...event,
      type: eventType,
      category: eventCategory
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const user = JSON.parse(localStorage.getItem("user"));
        const userType = user?.role || 'Student';
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
              // FIXED: Normalize type/category consistently
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
try {
  const workshopsRes = await fetch('http://localhost:5001/api/events/workshops', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (workshopsRes.ok) {
    const workshopsData = await workshopsRes.json();

    if (workshopsData && workshopsData.length > 0) {
      const workshopsWithProfessors = await Promise.all(
        workshopsData.map(async (workshop) => {

          const professorNames = [];

          // Use professorsParticipatingNames as is (string) or construct from populated array
          const rawNames =
            workshop.professorsParticipatingNames ||
            workshop.professorsParticipatingName ||
            workshop.professorNames ||
            workshop.professorsNames ||
            "";

          if (rawNames && typeof rawNames === "string") {
            const names = rawNames
              .split(',')
              .map(n => n.trim())
              .filter(n => n.length > 0);

            professorNames.push(...names);
          }

          // If no string names, construct from populated professorsParticipating array
          if (professorNames.length === 0 && workshop.professorsParticipating && workshop.professorsParticipating.length > 0) {
            const names = workshop.professorsParticipating
              .map(p => {
                if (p.firstName && p.lastName) {
                  return `${p.firstName} ${p.lastName}`.trim();
                }
                return null;
              })
              .filter(n => n !== null);

            professorNames.push(...names);
          }

          // ------------------------------------------
          // 3. Build final workshop object
          // ------------------------------------------
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

            professorNames: professorNames,

            professorsString:
              professorNames.length > 0
                ? professorNames.join(', ')
                : 'TBA', // no longer uses facultyResponsible

            facultyResponsible: workshop.facultyResponsible
          };
        })
      );

      // Prevent duplicates
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
        
        // 5. FIXED: Normalize ALL events to ensure type/category are always set
        const normalizedEvents = allEvents.map(normalizeEventType);
        
        // 6. Separate into upcoming and past
        const { upcoming, past } = separateEventsByTime(normalizedEvents);
        
        console.log('Total events:', normalizedEvents.length);
        console.log('Upcoming events:', upcoming.length);
        console.log('Past events:', past.length);
        
        // Log types for debugging
        console.log('Upcoming event types:', upcoming.map(e => ({ name: e.name, type: e.type, category: e.category })));
        
        // 7. Fetch ratings for past events
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
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [viewMode]);

  // Filter and sort events
  useEffect(() => {
    let filtered = [...events];

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((e) => {
        const name = (e.name || "").toLowerCase();
        const description = (e.description || "").toLowerCase();
        const type = (e.type || "").toLowerCase();
        const category = (e.category || "").toLowerCase();
        const location = (e.location || "").toLowerCase();
        const professorsString = (e.professorsString || "").toLowerCase();
        
        const vendorNames = e.vendors 
  ? e.vendors.filter(v => v).map(v => (v.companyName || '').toLowerCase()).join(' ')
  : '';
const vendorName = e.vendor 
  ? (e.vendor.companyName || '').toLowerCase()
  : '';
const boothNames = e.booths
  ? e.booths.filter(b => b).map(b => (b.name || '').toLowerCase()).join(' ')
  : '';

        return (
          name.includes(term) ||
          description.includes(term) ||
          type.includes(term) ||
          category.includes(term) ||
          location.includes(term) ||
          professorsString.includes(term) ||
          vendorNames.includes(term) ||
          vendorName.includes(term) ||
          boothNames.includes(term)
        );
      });
    }

    // Apply name filter
    if (filterName !== 'all') {
      filtered = filtered.filter((e) => {
        const eventName = e.name || e.title || '';
        return eventName === filterName;
      });
    }
    // Apply type filter - FIXED: More robust type matching
    if (filterType !== 'all') {
      filtered = filtered.filter((e) => {
        const eventType = (e.type || '').toLowerCase();
        const eventCategory = (e.category || '').toLowerCase();
        const filterTypeLower = filterType.toLowerCase();
        
        return eventType === filterTypeLower || eventCategory === filterTypeLower;
      });
    }
    // Apply location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter((e) => e.location === filterLocation);
    }

    // Apply professor filter
    if (filterProfessor !== 'all') {
      filtered = filtered.filter((e) => {
        return e.professorNames && e.professorNames.includes(filterProfessor);
      });
    }
// Apply date range filter
if (startDate || endDate) {
  filtered = filtered.filter((e) => {
    const eventDate = new Date(e.date || e.startDate || e.startDateTime);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (eventDate < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (eventDate > end) return false;
    }
    
    return true;
  });
}
    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.startDate || a.startDateTime);
      const dateB = new Date(b.date || b.startDate || b.startDateTime);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredEvents(filtered);
  }, [searchTerm, events, sortOrder, filterType, filterLocation, filterProfessor, startDate, endDate, filterName]);

  // Helper function to get display type - ensures consistent display
  const getDisplayType = (item) => {
    const type = item.type || item.category || 'Event';
    return String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-[#2D5F4F]">Browse Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-[#2D5F4F]">Browse Events</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                viewMode === 'upcoming'
                  ? 'bg-[#2D5F4F] text-white shadow-md'
                  : 'bg-[#F8FAF9] text-[#6B8E7F] hover:bg-[#D7E5E0]'
              }`}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setViewMode('past')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                viewMode === 'past'
                  ? 'bg-[#2D5F4F] text-white shadow-md'
                  : 'bg-[#F8FAF9] text-[#6B8E7F] hover:bg-[#D7E5E0]'
              }`}
            >
              Past Events
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D7E5E0] p-8">
          <NoEventsState />
        </div>
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-[#2D5F4F]">Browse Events</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                viewMode === 'upcoming'
                  ? 'bg-[#2D5F4F] text-white shadow-md'
                  : 'bg-[#F8FAF9] text-[#6B8E7F] hover:bg-[#D7E5E0]'
              }`}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setViewMode('past')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                viewMode === 'past'
                  ? 'bg-[#2D5F4F] text-white shadow-md'
                  : 'bg-[#F8FAF9] text-[#6B8E7F] hover:bg-[#D7E5E0]'
              }`}
            >
              Past Events
            </button>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, professor, vendor, booth, location, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-5 py-4 pl-12 text-[#2D5F4F] placeholder:text-[#8FB4A3] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all duration-300"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8FB4A3]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D7E5E0] p-8">
          <NoSearchResultsState searchTerm={searchTerm} />
          <button
           onClick={() => {
            setFilterType('all');
            setFilterLocation('all');
            setFilterProfessor('all');
            setFilterName('all');
            setSearchTerm('');
            setStartDate(null);
            setEndDate(null);
          }}
            className="mt-6 px-6 py-3 bg-[#2D5F4F] text-white font-semibold rounded-xl hover:bg-[#3A6F5F] transition-all duration-300"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-[#2D5F4F]">Browse Events</h2>
          <div className="px-4 py-2 bg-gradient-to-r from-[#F5C4CA] to-[#FFD4DA] text-[#2D5F4F] font-bold rounded-full shadow-sm">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('upcoming')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
              viewMode === 'upcoming'
                ? 'bg-[#2D5F4F] text-white shadow-md'
                : 'bg-[#F8FAF9] text-[#6B8E7F] hover:bg-[#D7E5E0]'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setViewMode('past')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
              viewMode === 'past'
                ? 'bg-[#2D5F4F] text-white shadow-md'
                : 'bg-[#F8FAF9] text-[#6B8E7F] hover:bg-[#D7E5E0]'
            }`}
          >
            Past Events
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, professor, vendor, booth, location, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-5 py-4 pl-12 text-[#2D5F4F] placeholder:text-[#8FB4A3] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all duration-300"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8FB4A3]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="flex flex-wrap gap-4">
      {/* Dynamic Filter: Event Name OR Professor Name with smart label */}
<div className="flex items-center gap-3">


  {(() => {
    const isWorkshopOrConference = 
      filterType.toLowerCase() === 'workshop' || 
      filterType.toLowerCase() === 'conference';

    if (isWorkshopOrConference) {
      // Show Professor filter when Workshop or Conference is selected
      return uniqueProfessors.length > 0 ? (
        <select
          value={filterProfessor}
          onChange={(e) => {
            setFilterProfessor(e.target.value);
            // Optional: auto-clear name filter to avoid confusion
            if (filterName !== 'all') setFilterName('all');
          }}
          className="flex-1 min-w-[200px] border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="all">All Professors</option>
          {uniqueProfessors.map((prof) => (
            <option key={prof} value={prof}>{prof}</option>
          ))}
        </select>
      ) : (
        <div className="text-sm text-[#8FB4A3] italic">No professors found</div>
      );
    }

    // Default: Show Event Name filter
    return uniqueNames.length > 0 ? (
      <select
        value={filterName}
        onChange={(e) => {
          setFilterName(e.target.value);
          // Optional: auto-clear professor filter
          if (filterProfessor !== 'all') setFilterProfessor('all');
        }}
        className="flex-1 min-w-[200px] border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
      >
        <option value="all">All Events</option>
        {uniqueNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    ) : (
      <div className="text-sm text-[#8FB4A3] italic">No events found</div>
    );
  })()}
</div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="all">All Types</option>
          <option value="workshop">Workshop</option>
          <option value="trip">Trip</option>
          <option value="bazaar">Bazaar</option>
          <option value="booth">Booth</option>
          <option value="conference">Conference</option>
        </select>

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

        {uniqueProfessors.length > 0 && (
          <select
            value={filterProfessor}
            onChange={(e) => setFilterProfessor(e.target.value)}
            className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
          >
            <option value="all">All Professors</option>
            {uniqueProfessors.map((prof) => (
              <option key={prof} value={prof}>{prof}</option>
            ))}
          </select>
        )}

<div className="w-64">
          <CalendarRangePicker
            onDateRangeChange={handleDateRangeChange}
            startDate={startDate}
            endDate={endDate}
          />
        </div>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border-2 border-[#D7E5E0] bg-[#F8FAF9] rounded-xl px-4 py-2 text-[#2D5F4F] focus:border-[#3A6F5F] focus:ring-2 focus:ring-[#B4D4C8]/30 transition-all"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        {(filterType !== 'all' || filterLocation !== 'all' || filterProfessor !== 'all' || filterName !== 'all' || searchTerm || startDate || endDate) && (          <button
           onClick={() => {
            setSearchTerm('');
            setFilterType('all');
            setFilterLocation('all');
            setFilterProfessor('all');
            setFilterName('all');
            setStartDate(null);
            setEndDate(null);
          }}
            className="px-4 py-2 text-[#3A6F5F] hover:text-[#2D5F4F] font-semibold transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((item) => {
  // Add this debug log
  console.log('Event data:', {
    name: item.name,
    type: item.type,
    professorsString: item.professorsString,
    professorNames: item.professorNames,
    facultyResponsible: item.facultyResponsible
  });
          const isFavorite = favorites.includes(item._id);
          const professorInfo = item.professorsString || '';
          const hasVendors = (item.vendors && item.vendors.length > 0) || item.vendor;
          const vendorCount = item.vendors?.length || (item.vendor ? 1 : 0);
          const hasBooths = item.booths && item.booths.length > 0;
          const boothCount = item.booths?.length || 0;
          const ratings = eventRatings[item._id];
          
          return (
            <div
              key={item._id}
              className="group relative bg-white border-2 border-[#D7E5E0] rounded-2xl p-6 hover:shadow-xl hover:border-[#3A6F5F] transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Type Badge - FIXED: Using helper function */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-[#D7E5E0] to-[#B4D4C8] text-[#2D5F4F] text-xs font-bold rounded-full shadow-sm">
                {getDisplayType(item)}
              </div>

              {viewMode === 'upcoming' && (
                <button
                  onClick={(e) => toggleFavorite(item._id, e)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-[#F8FAF9] transition-all duration-300 shadow-md z-10"
                >
                  <Heart
                    className={`w-5 h-5 transition-all ${
                      isFavorite
                        ? "fill-red-500 text-red-500 scale-110"
                        : "text-gray-400 group-hover:text-red-300"
                    }`}
                  />
                </button>
              )}

              <div 
                className="mt-10 space-y-3 cursor-pointer"
                onClick={() => setSelectedEvent(item)}
              >
                <h3 className="text-xl font-bold text-[#2D5F4F] line-clamp-2 group-hover:text-[#3A6F5F] transition-colors">
                  {item.name || item.title || "Untitled"}
                </h3>

                <div className="flex items-center gap-2 text-[#6B8E7F]">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {formatDate(item.date || item.startDate || item.startDateTime)}
                  </span>
                </div>

                {item.location && (
                  <div className="flex items-center gap-2 text-[#6B8E7F]">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium line-clamp-1">{item.location}</span>
                  </div>
                )}

                {professorInfo && (
                  <div className="flex items-start gap-2 text-[#6B8E7F]">
                    <User className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-medium line-clamp-2">{professorInfo}</span>
                    </div>
                  </div>
                )}

                {hasVendors && (
                  <div className="flex items-center gap-2 text-[#6B8E7F]">
                    <Store className="w-4 h-4 flex-shrink-0 text-[#F5C4CA]" />
                    <span className="text-sm font-medium">
                      {vendorCount} {vendorCount === 1 ? 'Vendor' : 'Vendors'}
                    </span>
                  </div>
                )}

                {hasBooths && (
                  <div className="flex items-center gap-2 text-[#6B8E7F]">
                    <Store className="w-4 h-4 flex-shrink-0 text-[#F5C4CA]" />
                    <span className="text-sm font-medium">
                      {boothCount} {boothCount === 1 ? 'Booth' : 'Booths'}
                    </span>
                  </div>
                )}

                {viewMode === 'past' && ratings && ratings.totalRatings > 0 && (
                  <div className="flex items-center gap-4 pt-2 border-t border-[#D7E5E0]">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-[#2D5F4F]">
                        {ratings.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-[#6B8E7F]">
                        ({ratings.totalRatings})
                      </span>
                    </div>
                    {ratings.totalComments > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-[#6B8E7F]" />
                        <span className="text-sm text-[#6B8E7F]">
                          {ratings.totalComments}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {item.description && (
                  <p className="text-sm text-[#4A7B6B] line-clamp-2 mt-2">
                    {item.description}
                  </p>
                )}

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(item);
                  }}
                  className="mt-4 w-full py-2 bg-[#2D5F4F] text-white font-semibold rounded-xl hover:bg-[#3A6F5F] transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isFavorite={favorites.includes(selectedEvent._id)}
          onToggleFavorite={toggleFavorite}
          viewMode={viewMode}
          ratings={eventRatings[selectedEvent._id]}
        />
      )}
    </div>
  );
};

// Event Details Modal Component
const EventDetailsModal = ({ event, onClose, isFavorite, onToggleFavorite, viewMode, ratings }) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Helper function to get display type
  const getDisplayType = (item) => {
    const type = item.type || item.category || 'Event';
    return String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase();
  };

  useEffect(() => {
    if (viewMode === 'past') {
      fetchReviews();
    }
  }, [event._id, viewMode]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const token = localStorage.getItem('token');
      
      // Use the same endpoint format as BazaarManagement
      const response = await fetch(
        `http://localhost:5001/api/events/${event._id}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Reviews response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Reviews data:', data);
        
        // Extract reviews array (matches BazaarManagement structure)
        const reviewsList = data.reviews || [];
        
        // Sort by date (newest first)
        reviewsList.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        setReviews(reviewsList);
      } else {
        console.error('Failed to fetch reviews:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-3xl w-full relative overflow-y-auto max-h-[90vh] border-2 border-[#D7E5E0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F8FAF9] transition-all"
        >
          <XCircle className="w-6 h-6 text-[#6B8E7F]" />
        </button>

        {viewMode === 'upcoming' && (
          <button
            onClick={(e) => onToggleFavorite(event._id, e)}
            className="absolute top-4 right-16 p-2 rounded-full hover:bg-[#F8FAF9] transition-all"
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400"
              }`}
            />
          </button>
        )}

        {/* Type Badge - FIXED: Using helper function */}
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#F5C4CA] to-[#FFD4DA] text-[#2D5F4F] text-sm font-bold rounded-full mb-4 shadow-sm">
          {getDisplayType(event)}
        </div>

        <h3 className="text-3xl font-bold text-[#2D5F4F] mb-6 pr-20">
          {event.name || event.title}
        </h3>

        {viewMode === 'past' && ratings && ratings.totalRatings > 0 && (
          <div className="flex items-center gap-6 mb-6 p-4 bg-[#F8FAF9] rounded-xl border border-[#D7E5E0]">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-[#2D5F4F]">
                  {ratings.averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-[#6B8E7F]">
                  {ratings.totalRatings} {ratings.totalRatings === 1 ? 'rating' : 'ratings'}
                </div>
              </div>
            </div>
            {ratings.totalComments > 0 && (
              <div className="flex items-center gap-2 border-l-2 border-[#D7E5E0] pl-6">
                <MessageCircle className="w-5 h-5 text-[#6B8E7F]" />
                <div>
                  <div className="text-lg font-bold text-[#2D5F4F]">
                    {ratings.totalComments}
                  </div>
                  <div className="text-xs text-[#6B8E7F]">
                    {ratings.totalComments === 1 ? 'comment' : 'comments'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#3A6F5F] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#2D5F4F]">Location</p>
                <p className="text-[#4A7B6B]">{event.location}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#3A6F5F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#2D5F4F]">Date & Time</p>
              <p className="text-[#4A7B6B]">
                {formatDate(event.date || event.startDate || event.startDateTime)}
              </p>
              {(event.endDate || event.endDateTime) && (
                <p className="text-[#4A7B6B] text-sm">
                  End: {formatDate(event.endDate || event.endDateTime)}
                </p>
              )}
            </div>
          </div>

         

          {event.professorNames && event.professorNames.length > 1 && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#3A6F5F] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#2D5F4F]">Participating Professors</p>
                <ul className="list-disc list-inside text-[#4A7B6B] space-y-1">
                  {event.professorNames.map((prof, index) => (
                    <li key={index}>{prof}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {event.description && (
            <div className="pt-4 border-t border-[#D7E5E0]">
              <p className="text-sm font-semibold text-[#2D5F4F] mb-2">Description</p>
              <p className="text-[#4A7B6B] leading-relaxed">{event.description}</p>
            </div>
          )}

          {viewMode === 'past' && (
            <div className="pt-6 border-t-2 border-[#D7E5E0] mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-[#2D5F4F]">Ratings & Comments</h4>
                {ratings && ratings.totalRatings > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 font-bold text-2xl">{ratings.averageRating.toFixed(1)} ★</span>
                    <span className="text-sm text-[#6B8E7F]">
                      ({ratings.totalRatings} {ratings.totalRatings === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>

              {loadingReviews ? (
                <p className="text-[#6B8E7F] animate-pulse">Loading ratings...</p>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 bg-[#F8FAF9] rounded-xl border border-[#D7E5E0]">
                  <MessageCircle className="w-12 h-12 text-[#D7E5E0] mx-auto mb-2" />
                  <p className="text-[#6B8E7F]">No ratings yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {reviews.map((review, index) => (
                    <div
                      key={review._id || index}
                      className="bg-[#F8FAF9] rounded-xl p-4 border-2 border-[#D7E5E0] hover:border-[#B4D4C8] transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2D5F4F] to-[#3A6F5F] rounded-full flex items-center justify-center text-white font-bold">
                            {(review.userName || review.userId?.firstName || review.userId?.email || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2D5F4F]">
                              {review.userName || review.userId?.firstName || review.userId?.email || 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (review.rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.createdAt && (
                          <span className="text-xs text-[#8FB4A3]">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-[#4A7B6B] mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsView;