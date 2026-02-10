// SalesReport.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Download, 
  DollarSign, 
  Filter, 
  X, 
  Calendar, 
  ChevronDown,
  Users,
  Store,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { TableSkeleton, EmptyState } from "../LoadingEmptyStates";
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EOradius,
  EOtransitions,
} from "../../styles/EOdesignSystem";

function SalesReport() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sortedEvents, setSortedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [eventNameFilter, setEventNameFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const [sortOrder, setSortOrder] = useState("desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const eventTypes = ["Trips", "Bazaars", "Gym Sessions", "Workshops", "Conferences"];

  // Unique names for dropdown
  const eventNames = [...new Set(events.map((e) => e.name))].sort();

  useEffect(() => {
    let filtered = events;

    if (eventNameFilter) {
      filtered = filtered.filter((event) => event.name === eventNameFilter);
    }
    
    if (eventTypeFilter) {
      filtered = filtered.filter((event) => event.type === eventTypeFilter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date).toISOString().split("T")[0];
        return eventDate === dateFilter;
      });
    }
    
    setFilteredEvents(filtered);
  }, [events, eventNameFilter, eventTypeFilter, dateFilter]);

  useEffect(() => {
    const sorted = [...filteredEvents].sort((a, b) => {
      if (sortOrder === "desc") {
        return b.totalRevenue - a.totalRevenue;
      } else {
        return a.totalRevenue - b.totalRevenue;
      }
    });
    setSortedEvents(sorted);
  }, [filteredEvents, sortOrder]);

  const fetchAllEventsData = async () => {
    setLoading(true);
    try {
      const endpoints = [
        { url: "http://localhost:5001/api/events/bazaars", type: "Bazaars" },
        { url: "http://localhost:5001/api/eo/conferences", type: "Conferences" },
        { url: "http://localhost:5001/api/events/workshops", type: "Workshops" },
        { url: "http://localhost:5001/api/events/trips", type: "Trips" },
        { url: "http://localhost:5001/api/events/gym-sessions", type: "Gym Sessions" }
      ];

      const responses = await Promise.allSettled(
        endpoints.map((endpoint) => axios.get(endpoint.url))
      );

      let allEvents = [];
      
      responses.forEach((response, index) => {
        if (response.status === "fulfilled" && response.value.data) {
          const eventsData = Array.isArray(response.value.data)
            ? response.value.data
            : [];
          
          const typedEvents = eventsData.map((event) => {
            let totalRevenue = 0;
            const typeLabel = endpoints[index].type;
            
            if (typeLabel === "Bazaars") {
              if (event.vendorFees && event.vendorsCount) {
                totalRevenue = event.vendorFees * event.vendorsCount;
              } else {
                const vendors = event.vendorsCount || event.totalVendors || 1;
                const estimatedFee = 100;
                totalRevenue = vendors * estimatedFee;
              }
            } else if (typeLabel === "Conferences") {
              if (event.ticketPrice && event.registeredAttendees) {
                totalRevenue = event.ticketPrice * event.registeredAttendees;
              } else {
                const attendees =
                  event.registeredAttendees ||
                  event.totalAttendees ||
                  event.attendeesCount ||
                  0;
                const estimatedPrice = 80;
                totalRevenue = attendees * estimatedPrice;
              }
            } else if (typeLabel === "Workshops") {
              if (event.fee && event.participants) {
                totalRevenue = event.fee * event.participants;
              } else {
                const participants =
                  event.participants ||
                  event.totalAttendees ||
                  event.attendeesCount ||
                  0;
                const estimatedPrice = 40;
                totalRevenue = participants * estimatedPrice;
              }
            } else if (typeLabel === "Trips") {
              if (event.cost && event.attendeesCount) {
                totalRevenue = event.cost * event.attendeesCount;
              } else {
                const attendees =
                  event.attendeesCount ||
                  event.totalAttendees ||
                  event.participants ||
                  0;
                const estimatedPrice = 50;
                totalRevenue = attendees * estimatedPrice;
              }
            } else if (typeLabel === "Gym Sessions") {
              if (event.participationFee && event.participants) {
                totalRevenue = event.participationFee * event.participants;
              } else {
                const participants =
                  event.participants ||
                  event.totalAttendees ||
                  event.attendeesCount ||
                  0;
                const estimatedPrice = 20;
                totalRevenue = participants * estimatedPrice;
              }
            }
            
            return {
              _id: event._id || event.id,
              name: event.name || event.title || "Unnamed " + typeLabel,
              type: typeLabel,
              date:
                event.startDate ||
                event.startDateTime ||
                event.date ||
                new Date().toISOString(),
              totalRevenue: totalRevenue
            };
          });
          
          allEvents = allEvents.concat(typedEvents);
        }
      });

      setEvents(allEvents);
    } catch (err) {
      console.error("Error fetching events data for sales report:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5001/api/eo/reports/sales"
      );
      const data = response.data;
      
      if (data && data.length > 0) {
        const validatedEvents = data.map((event) => ({
          ...event,
          type: eventTypes.includes(event.type) ? event.type : "General"
        }));
        setEvents(validatedEvents);
      } else {
        await fetchAllEventsData();
      }
    } catch (err) {
      await fetchAllEventsData();
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  

 

  const clearFilters = () => {
    setEventNameFilter("");
    setEventTypeFilter("");
    setDateFilter("");
  };

  const handleSortSelect = (order) => {
    setSortOrder(order);
    setShowSortDropdown(false);
  };

  const hasActiveFilters = eventNameFilter || eventTypeFilter || dateFilter;
  const totalFilteredRevenue = sortedEvents.reduce(
    (sum, event) => sum + event.totalRevenue,
    0
  );
  const totalOverallRevenue = events.reduce(
    (sum, event) => sum + event.totalRevenue,
    0
  );

  const getEventTypeColor = (type) => {
    const colors = {
      Trips: "bg-[#D7DBF2] text-[#2D3748]",
      Bazaars: "bg-[#E5E9D5] text-[#2D3748]",
      "Gym Sessions": "bg-[#F0F4FF] text-[#2D3748]",
      Workshops: "bg-[#D7DBF2] text-[#2D3748]",
      Conferences: "bg-[#E5E9D5] text-[#2D3748]"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getRevenueBadgeColor = (revenue) => {
    if (revenue >= 5000) return "bg-green-100 text-green-700";
    if (revenue >= 2000) return "bg-blue-100 text-blue-700";
    if (revenue >= 1000) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
    return day + " " + month;
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const totalEventsCount = events.length;
  const avgRevenue = totalEventsCount
    ? totalOverallRevenue / totalEventsCount
    : 0;
  const topEvent =
    events.length > 0
      ? events.reduce(
          (max, e) => (e.totalRevenue > max.totalRevenue ? e : max),
          events[0]
        )
      : null;
  const topEventRevenue = topEvent ? topEvent.totalRevenue : 0;

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
              Revenue performance across all events
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {"$" + totalOverallRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totalEventsCount}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Events</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {"$" + Math.round(avgRevenue).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Avg Revenue per Event
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Store className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {"$" + topEventRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {topEvent ? topEvent.name : "Top Event Revenue"}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 mt-8">
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
                  Sales Report
                </CardTitle>
              <p className="text-[#475467] mt-1">
                Total revenue from events:{" "}
                <span className="font-semibold text-[#059669]">
                  {"$" + totalOverallRevenue.toLocaleString()}
                </span>
                {hasActiveFilters && events.length > 0 && (
                  <span className="ml-2">
                    (Filtered:{" "}
                    <span className="font-semibold text-[#059669]">
                      {"$" + totalFilteredRevenue.toLocaleString()}
                    </span>{" "}
                    from {sortedEvents.length} of {events.length} events)
                  </span>
                )}
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
              
              <div className="relative">
                <Button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  variant="outline"
                  className="border-[#D7DBF2] text-[#2D3748] hover:bg-[#D7DBF2] hover:border-[#D7DBF2]"
                  disabled={events.length === 0}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Sort by Revenue
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleSortSelect("desc")}
                        className={
                          "w-full text-left px-4 py-2 text-sm hover:bg-[#F0F4FF] transition-colors " +
                          (sortOrder === "desc"
                            ? "bg-[#D7DBF2] text-[#2D3748] font-medium"
                            : "text-[#475467]")
                        }
                      >
                        Highest to Lowest
                      </button>
                      <button
                        onClick={() => handleSortSelect("asc")}
                        className={
                          "w-full text-left px-4 py-2 text-sm hover:bg-[#F0F4FF] transition-colors " +
                          (sortOrder === "asc"
                            ? "bg-[#D7DBF2] text-[#2D3748] font-medium"
                            : "text-[#475467]")
                        }
                      >
                        Lowest to Highest
                      </button>
                    </div>
                  </div>
                )}
              </div>

             
              
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
                    className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm bg-white text-[#344054] focus:border-[#D7DBF2] focus:ring-2 focus:ring-[#D7DBF2]"
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
                    className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm bg-white text-[#344054] focus:border-[#D7DBF2] focus:ring-2 focus:ring-[#D7DBF2]"
                  >
                    <option value="">All Event Types</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Date input */}
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">
                    Event Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085] w-4 h-4" />
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="pl-10 border-[#D0D5DD] rounded-lg text-sm focus:border-[#D7DBF2] focus:ring-2 focus:ring-[#D7DBF2]"
                    />
                  </div>
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

          <div className="mt-8">
            {loading ? (
              <TableSkeleton rows={6} columns={4} />
            ) : sortedEvents.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No Sales Data"
                description={
                  hasActiveFilters && events.length > 0
                    ? "No events match your filters"
                    : "Revenue data will appear once events are created"
                }
              />
            ) : (
              <div className="space-y-4">
                {sortedEvents.map((event) => (
                  <div
                    key={event._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#E2E8F0]"
                  >
                    <div className="p-6 flex items-start gap-6">
                      <div className="flex-shrink-0 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] rounded-xl p-4 text-center min-w-[120px]">
                        <div className="text-sm font-medium text-[#6B7280] mb-1">
                          {formatEventDate(event.date)}
                        </div>
                        <div className="text-3xl font-bold text-[#1F2937]">
                          {formatEventTime(event.date)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-[#1F2937]">
                            {event.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <span
                              className={
                                "px-3 py-1 text-lg font-medium rounded-full " +
                                getRevenueBadgeColor(event.totalRevenue)
                              }
                            >
                              {"$" + event.totalRevenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-4">
                          <span
                            className={
                              "inline-flex items-center px-2 py-1 rounded-full text-sm font-medium " +
                              getEventTypeColor(event.type)
                            }
                          >
                            {event.type}
                          </span>
                          <span>
                            📅{" "}
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                        
                        <div className="bg-[#F3F4F6] rounded-lg p-4">

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-[#475467]">
                                Total Revenue
                              </p>
                              <p className="text-2xl font-bold text-[#059669]">
                                {"$" + event.totalRevenue.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-[#475467]">
                                Revenue Rank
                              </p>
                              <p className="text-lg font-semibold text-[#2D3748]">
                                {sortOrder === "desc"
                                  ? "#" +
                                    (sortedEvents.findIndex(
                                      (e) => e._id === event._id
                                    ) +
                                      1)
                                  : "#" +
                                    (sortedEvents.length -
                                      sortedEvents.findIndex(
                                        (e) => e._id === event._id
                                      ))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SalesReport;
