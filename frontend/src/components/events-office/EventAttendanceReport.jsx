import { useState, useEffect } from "react";
import axios from "axios";
import { Download, Calendar, Users, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CardSkeleton, NoEventsState } from "../LoadingEmptyStates";
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EOradius,
  EOtransitions,
} from "../../styles/EOdesignSystem";

export default function EventAttendanceReport() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [eventNameFilter, setEventNameFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Define the specific event types
  const eventTypes = ["Trips", "Bazaars", "Gym Sessions", "Workshops", "Conferences"];

  // Unique event names for dropdown
  const eventNames = [...new Set(events.map((e) => e.name))].filter(Boolean).sort();

  // Apply filters
  useEffect(() => {
    let filtered = events;
    
    if (eventNameFilter) {
      filtered = filtered.filter(event => event.name === eventNameFilter);
    }
    
    if (eventTypeFilter) {
      filtered = filtered.filter(event => 
        event.type === eventTypeFilter
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date).toISOString().split('T')[0];
        return eventDate === dateFilter;
      });
    }
    
    setFilteredEvents(filtered);
  }, [events, eventNameFilter, eventTypeFilter, dateFilter]);

  const fetchAllEventsData = async () => {
    setLoading(true);
    try {
      console.log("Fetching events from all endpoints...");
      
      const endpoints = [
        { url: 'http://localhost:5001/api/events/bazaars', type: 'Bazaars' },
        { url: 'http://localhost:5001/api/eo/conferences', type: 'Conferences' },
        { url: 'http://localhost:5001/api/events/workshops', type: 'Workshops' },
        { url: 'http://localhost:5001/api/events/trips', type: 'Trips' },
        { url: 'http://localhost:5001/api/events/gym-sessions', type: 'Gym Sessions' }
      ];

      const responses = await Promise.allSettled(
        endpoints.map(endpoint => axios.get(endpoint.url))
      );

      let allEvents = [];
      
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value.data) {
          const eventsData = Array.isArray(response.value.data) ? response.value.data : [];
          console.log(`Fetched ${eventsData.length} ${endpoints[index].type} from ${endpoints[index].url}`);
          
          const typedEvents = eventsData.map(event => ({
            _id: event._id || event.id,
            name: event.name || event.title || `Unnamed ${endpoints[index].type}`,
            type: endpoints[index].type,
            date: event.startDate || event.startDateTime || event.date || new Date().toISOString(),
            totalAttendees: event.totalAttendees || event.attendeesCount || event.registeredAttendees || event.participants || 0
          }));
          
          allEvents = [...allEvents, ...typedEvents];
        }
      });

      console.log(`Total events fetched: ${allEvents.length}`);
      
      setEvents(allEvents);
    } catch (err) {
      console.error("Error fetching events data:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAttendanceReport = async () => {
    setLoading(true);
    try {
      console.log("Trying direct report endpoint...");
      const { data } = await axios.get("http://localhost:5001/api/events/attendance-report");
      
      if (data && data.length > 0) {
        console.log("Direct report endpoint successful, found", data.length, "events");
        const validatedEvents = data.map(event => ({
          ...event,
          type: eventTypes.includes(event.type) ? event.type : "General"
        }));
        setEvents(validatedEvents);
      } else {
        console.log("Direct report endpoint returned no data, trying individual endpoints...");
        await fetchAllEventsData();
      }
    } catch (err) {
      console.log("Direct report endpoint failed, trying individual endpoints...");
      await fetchAllEventsData();
    }
  };

  useEffect(() => {
    fetchEventAttendanceReport();
  }, []);

  

  const clearFilters = () => {
    setEventNameFilter("");
    setEventTypeFilter("");
    setDateFilter("");
  };

  const hasActiveFilters = eventNameFilter || eventTypeFilter || dateFilter;

  const getEventTypeColor = (type) => {
    const colors = {
      'Trips': 'bg-[#D7DBF2] text-[#2D3748]',
      'Bazaars': 'bg-[#E5E9D5] text-[#2D3748]',
      'Gym Sessions': 'bg-[#F0F4FF] text-[#2D3748]',
      'Workshops': 'bg-[#D7DBF2] text-[#2D3748]',
      'Conferences': 'bg-[#E5E9D5] text-[#2D3748]'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // 📊 summary metrics for the top four cards
  const totalEventsCount = events.length;
  const totalAttendeesOverall = events.reduce(
    (sum, e) => sum + (e.totalAttendees || 0),
    0
  );
  const avgAttendees =
    totalEventsCount > 0 ? totalAttendeesOverall / totalEventsCount : 0;
  const maxAttendees =
    events.length > 0
      ? events.reduce(
          (max, e) => Math.max(max, e.totalAttendees || 0),
          0
        )
      : 0;

  // LOADING STATE – keep same data logic, just new layout
  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <div className="space-y-8">
            <div>
              <h2
                    style={{
                                  fontSize: "2rem",
                                  fontWeight: "800",
                                  color: EOcolors.secondary,
                                  marginBottom: "0.5rem",
                                }}>Reports & Analytics</h2>
              <p className="text-gray-600">
                Total number of attendees per event
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center" />
                <div className="h-6 w-16 bg-gray-200 mx-auto rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 mx-auto rounded animate-pulse" />
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center" />
                <div className="h-6 w-16 bg-gray-200 mx-auto rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 mx-auto rounded animate-pulse" />
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center" />
                <div className="h-6 w-16 bg-gray-200 mx-auto rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 mx-auto rounded animate-pulse" />
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center" />
                <div className="h-6 w-16 bg-gray-200 mx-auto rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 mx-auto rounded animate-pulse" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <CardTitle
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: EOcolors.secondary,
                    marginBottom: "0.5rem",
                  }}
                >
                  Events Attendance Report
                </CardTitle>
            
            <CardSkeleton count={3} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // MAIN LAYOUT (non-loading)
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0">
        <div className="space-y-8">
          {/* Top header + summary cards (admin layout style) */}
          <div>
          <h2
                    style={{
                                  fontSize: "2rem",
                                  fontWeight: "800",
                                  color: EOcolors.secondary,
                                  marginBottom: "0.5rem",
                                }}>Reports & Analytics</h2>
            <p className="text-gray-600">
              Total number of attendees per event
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
            {/* Total Events */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totalEventsCount}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Events</p>
            </div>

            {/* Total Attendees */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totalAttendeesOverall}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Attendees</p>
            </div>

            {/* Average Attendees */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {avgAttendees.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Avg Attendees per Event
              </p>
            </div>

            {/* Max per Event */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {maxAttendees}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Max Attendance on Single Event
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 mt-8">
        {/* Big white card with filters + event list */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: EOcolors.secondary,
                    marginBottom: "0.5rem",
                  }}
                >
                  Events Attendance Report
                </CardTitle>
              <p
                                style={{
                                  color: EOcolors.text.secondary,
                                  fontSize: "0.9375rem",
                                }}
                              >
                Total number of attendees per event
                {hasActiveFilters && events.length > 0 && ` (${filteredEvents.length} of ${events.length} events)`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-[#D7DBF2] text-[#2D3748] hover:bg-[#D7DBF2] hover:border-[#D7DBF2]"
                disabled={events.length === 0}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
            </div>
          </div>

          {showFilters && events.length > 0 && (
            <div className="mt-6 p-6 bg-[#F9FAFB] rounded-lg border border-[#EAECF0]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#2B4B3E]">
                  Filter Events
                </h3>
                <div className="flex gap-2">
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
                  <Button 
                    onClick={() => setShowFilters(false)}
                    variant="outline"
                    size="sm"
                    className="border-[#D7DBF2] text-[#2D3748] hover:bg-[#D7DBF2]"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Close
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Name dropdown */}
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">
                    Event Name
                  </label>
                  <select
                    value={eventNameFilter}
                    onChange={(e) => setEventNameFilter(e.target.value)}
                    className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm focus:border-[#D7DBF2] focus:ring-2 focus:ring-[#D7DBF2] bg-white text-[#344054]"
                  >
                    <option value="">All Event Names</option>
                    {eventNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Type dropdown */}
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">
                    Event Type
                  </label>
                  <select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm focus:border-[#D7DBF2] focus:ring-2 focus:ring-[#D7DBF2] bg-white text-[#344054]"
                  >
                    <option value="">All Event Types</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Event Date */}
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">
                    Event Date
                  </label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border-[#D0D5DD] focus:border-[#D7DBF2] focus:ring-2 focus:ring-[#D7DBF2]"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {eventNameFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#D7DBF2] text-[#2D3748] text-sm">
                      Name: {eventNameFilter}
                      <button 
                        onClick={() => setEventNameFilter("")}
                        className="ml-2 text-[#2D3748] hover:text-[#475467]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {eventTypeFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E5E9D5] text-[#2D3748] text-sm">
                      Type: {eventTypeFilter}
                      <button 
                        onClick={() => setEventTypeFilter("")}
                        className="ml-2 text-[#2D3748] hover:text-[#475467]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dateFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F0F4FF] text-[#2D3748] text-sm">
                      Date: {new Date(dateFilter).toLocaleDateString()}
                      <button 
                        onClick={() => setDateFilter("")}
                        className="ml-2 text-[#2D3748] hover:text-[#475467]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* List of events */}
          <div className="mt-8">
            {filteredEvents.length === 0 ? (
              <NoEventsState />
            ) : (
              <div className="space-y-4">
                {filteredEvents.map(event => {
                  const eventDate = new Date(event.date);
                  
                  // Format date range
                  const formatDateRange = () => {
                    const day = eventDate.getDate();
                    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                    const year = eventDate.getFullYear();
                    
                    return `${day} ${month} ${year}`;
                  };
                  
                  const timeString = eventDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });

                  return (
                    <div 
                      key={event._id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#EAECF0]"
                    >
                      <div className="p-6 flex items-start gap-6">
                        {/* Date & Time Box */}
                        <div className="flex-shrink-0 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] rounded-xl p-4 text-center min-w-[120px]">
                          <div className="text-sm font-medium text-[#6B7280] mb-1">
                            {formatDateRange()}
                          </div>
                          <div className="text-3xl font-bold text-[#1F2937]">
                            {timeString}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-[#1F2937]">
                              {event.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              {/* Event Type Badge */}
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEventTypeColor(event.type)}`}>
                                {event.type}
                              </span>
                              
                              {/* Attendance Badge */}
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                {event.totalAttendees} Attendees
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{eventDate.toLocaleDateString('en-US', { 
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span className="font-semibold text-[#1F2937]">
                                {event.totalAttendees} registered
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap">
                            
                            
                          
                            
                            
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
