import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Upload, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const LostAndFoundVisitor = () => {
  const [events, setEvents] = useState([]);
  const [eventType, setEventType] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [formData, setFormData] = useState({
    eventId: '',
    itemName: '',
    description: '',
    location: '',
    contactInfo: '',
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const previousReportsRef = useRef([]); // Use ref instead of state

  useEffect(() => {
    fetchEvents();
    fetchMyReports();

    // Poll for updates every 10 seconds
    const pollInterval = setInterval(() => {
      fetchMyReports();
    }, 10000);

    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  }, []);

  // Filter events when type changes
  useEffect(() => {
    if (eventType) {
      const filtered = events.filter(event => {
        const type = (event.type || event.category || '').toLowerCase();
        return type === eventType;
      });
      setFilteredEvents(filtered);
      console.log(`🔍 Filtered ${filtered.length} events for type: ${eventType}`);
    } else {
      setFilteredEvents([]);
    }
    // Reset selected event when type changes
    setFormData(prev => ({ ...prev, eventId: '' }));
  }, [eventType, events]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');

      console.log('🔍 Fetching started events for Lost & Found...');

      try {
        const response = await fetch(
          'http://localhost:5001/api/lost-items/events',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Received started events:', data.count);
          
          if (data.events && data.events.length > 0) {
            setEvents(data.events);
            console.log(`📊 Total events available: ${data.events.length}`);
          } else {
            console.log('⚠️ No started events found');
            setEvents([]);
          }
        } else {
          console.error('❌ Failed to fetch events:', response.status);
          setEvents([]);
        }
      } catch (err) {
        console.error('❌ Error fetching started events:', err);
        setEvents([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchEvents:', error);
      setEvents([]);
    }
  };

  const fetchMyReports = async () => {
    console.log('=== FETCHING MY REPORTS ===');
    try {
      const token = localStorage.getItem('token');
      console.log('Token present:', !!token);
      
      const response = await fetch('http://localhost:5001/api/lost-items/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Fetch reports response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Reports data received:', data);
        console.log('Number of reports:', data.lostItems?.length || 0);
        
        // Debug: Log each report's photo path
        if (data.lostItems && data.lostItems.length > 0) {
          data.lostItems.forEach((item, idx) => {
            console.log(`Report ${idx + 1}:`, {
              title: item.title,
              photo: item.photo,
              eventModel: item.eventModel,
              event: item.event,
              status: item.status
            });
          });
        }

        // Check for status changes (unfound -> found)
        console.log('🔍 Checking for status changes...');
        console.log('Previous reports count:', previousReportsRef.current.length);
        console.log('New reports count:', data.lostItems?.length || 0);
        
        if (previousReportsRef.current.length > 0 && data.lostItems) {
          console.log('✅ Checking each report for status changes...');
          data.lostItems.forEach(newReport => {
            const oldReport = previousReportsRef.current.find(r => r._id === newReport._id);
            
            console.log(`📋 Checking report: ${newReport.title}`);
            console.log(`   Report ID: ${newReport._id}`);
            console.log(`   Old status: ${oldReport?.status || 'N/A'}`);
            console.log(`   New status: ${newReport.status}`);
            
            // If status changed from unfound to found
            if (oldReport && oldReport.status === 'unfound' && newReport.status === 'found') {
              console.log('🎉 STATUS CHANGE DETECTED! Showing toast...');
              toast.success(
                `🎉 Great news! Your item "${newReport.title}" has been found! Please visit the Events Office to collect it.`,
                {
                  duration: 8000,
                  position: 'top-center',
                  style: {
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px',
                    borderRadius: '12px'
                  }
                }
              );
            } else if (oldReport) {
              console.log('   ℹ️ No status change (both are same)');
            } else {
              console.log('   ℹ️ New report (not in previous list)');
            }
          });
        } else {
          console.log('⚠️ Skipping status check (first load - count is', previousReportsRef.current.length, ')');
        }

        // Update state
        setMyReports(data.lostItems || []);
        
        // IMPORTANT: Update ref AFTER checking for changes
        console.log('💾 Updating previousReportsRef to:', data.lostItems?.length || 0, 'reports');
        previousReportsRef.current = data.lostItems || [];
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch reports:', errorText);
      }
    } catch (error) {
      console.error('Error fetching my reports:', error);
    }
    console.log('=== FETCH MY REPORTS COMPLETE ===');
  };

  const handleEventTypeChange = (e) => {
    const value = e.target.value;
    console.log('Event type changed to:', value);
    setEventType(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        photo: file
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form data:', formData);
    console.log('Event ID:', formData.eventId);
    console.log('Event Type:', eventType);
    console.log('Token exists:', !!localStorage.getItem('token'));
    
    if (!eventType) {
      console.error('Missing event type');
      toast.error('Please select an event type');
      return;
    }

    if (!formData.eventId || !formData.itemName || !formData.description || !formData.location) {
      console.error('Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      // Find the selected event to determine its type/model
      const selectedEvent = events.find(e => e._id === formData.eventId);
      console.log('Selected event:', selectedEvent);
      
      if (!selectedEvent) {
        throw new Error('Selected event not found');
      }
      
      // Use the eventType from the dropdown (already lowercase: gym, court, etc.)
      const eventModel = eventType;
      console.log('Event type:', eventType, '-> Event model:', eventModel);
      
      const submitData = new FormData();
      submitData.append('title', formData.itemName);
      submitData.append('description', formData.description);
      submitData.append('location', formData.location);
      submitData.append('eventModel', eventModel);
      
      // Add dateLost (current date/time)
      submitData.append('dateLost', new Date().toISOString());
      
      if (formData.contactInfo) {
        submitData.append('contactInfo', formData.contactInfo);
      }
      
      if (formData.photo) {
        console.log('Photo attached:', formData.photo.name);
        submitData.append('photo', formData.photo);
      }

      // Log FormData contents
      console.log('FormData contents:');
      for (let pair of submitData.entries()) {
        console.log(pair[0], ':', pair[1]);
      }

      const url = `http://localhost:5001/api/lost-items/event/${formData.eventId}`;
      console.log('Submitting to URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.error('Error response:', responseText);
        
        let errorMessage = 'Failed to submit report';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.message || errorMessage;
          console.error('Parsed error:', error);
        } catch (e) {
          console.error('Could not parse error as JSON:', e);
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Success response parsed:', data);
      } catch (e) {
        console.error('Could not parse success response:', e);
        data = { message: 'Item reported successfully' };
      }
      
      console.log('=== SUBMISSION SUCCESSFUL ===');
      toast.success('Lost item reported successfully! Vendors and admins have been notified.');
      
      // Reset form
      setEventType('');
      setFormData({
        eventId: '',
        itemName: '',
        description: '',
        location: '',
        contactInfo: '',
        photo: null
      });
      setPhotoPreview(null);
      
      // Refresh reports
      console.log('Refreshing reports...');
      await fetchMyReports();
      console.log('Reports refreshed');
      
    } catch (error) {
      console.error('=== SUBMISSION FAILED ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast.error(error.message || 'Failed to submit report. Please check console for details.');
    } finally {
      setLoading(false);
      console.log('=== FORM SUBMISSION ENDED ===');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'found':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'unfound':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'found':
        return '#10b981';
      case 'unfound':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'found':
        return '#d1fae5';
      case 'unfound':
        return '#fee2e2';
      default:
        return '#fef3c7';
    }
  };


  return (
    <>
      <Toaster />
      <div className="min-h-screen p-6" style={{ backgroundColor: '#F8FAF9' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#2D5F4F' }}>
              Digital Lost & Found Board
            </h1>
            <p className="text-gray-600">
              Report your lost item and it will instantly appear on all vendor tablets and admin screens
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Lost Item Form */}
            <div className="border-2 rounded-2xl shadow-lg" style={{ borderColor: '#D7E5E0' }}>
              <div className="p-4 rounded-t-2xl" style={{ backgroundColor: '#2D5F4F' }}>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Report Lost Item
                </h2>
              </div>
              <div className="p-6 bg-white rounded-b-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Step 1: Event Type Dropdown */}
                  <div>
                    <label htmlFor="eventType" className="block text-sm font-semibold mb-2" style={{ color: '#2D5F4F' }}>
                      Event Type *
                    </label>
                    <select
                      id="eventType"
                      value={eventType}
                      onChange={handleEventTypeChange}
                      className="w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        borderColor: '#D7E5E0',
                        backgroundColor: '#F8FAF9',
                        color: '#2D5F4F'
                      }}
                      required
                    >
                      <option value="">-- Select Event Type --</option>
                      <option value="bazaar">🛍️ Bazaar</option>
                      <option value="workshop">🎓 Workshop</option>
                      <option value="trip">🚌 Trip</option>
                      <option value="conference">🎤 Conference</option>
                      <option value="gym">🏋️ Gym Session</option>
                      <option value="court">🎾 Court Reservation</option>
                    </select>
                  </div>

                  {/* Step 2: Specific Event Dropdown (only shows when type is selected) */}
                  {eventType && (
                    <div>
                      <label htmlFor="eventId" className="block text-sm font-semibold mb-2" style={{ color: '#2D5F4F' }}>
                        Select Specific Event *
                      </label>
                      <select
                        id="eventId"
                        name="eventId"
                        value={formData.eventId}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          borderColor: '#D7E5E0',
                          backgroundColor: '#F8FAF9',
                          color: '#2D5F4F'
                        }}
                        required
                      >
                        <option value="">
                          {filteredEvents.length === 0 ? 'No events available for this type' : 'Select an event'}
                        </option>
                        {filteredEvents.map(event => (
                          <option key={event._id} value={event._id}>
                            {event.name || event.title}
                          </option>
                        ))}
                      </select>
                      {filteredEvents.length === 0 && (
                        <p className="text-xs mt-2 text-gray-500">
                          💡 No {eventType} events found that you registered for
                        </p>
                      )}
                    </div>
                  )}

                  {!eventType && (
                    <div className="text-center py-6 px-4 rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                      <p className="text-sm text-gray-500">
                        👆 Please select an event type first
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="itemName" className="block text-sm font-semibold mb-2" style={{ color: '#2D5F4F' }}>
                      Item Name *
                    </label>
                    <input
                      type="text"
                      id="itemName"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      placeholder="e.g., Blue Water Bottle"
                      className="w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        borderColor: '#D7E5E0',
                        backgroundColor: '#F8FAF9'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold mb-2" style={{ color: '#2D5F4F' }}>
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Detailed description of the item..."
                      rows={3}
                      className="w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all resize-none"
                      style={{ 
                        borderColor: '#D7E5E0',
                        backgroundColor: '#F8FAF9'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold mb-2" style={{ color: '#2D5F4F' }}>
                      Last Seen Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Cafeteria, Building C3"
                      className="w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        borderColor: '#D7E5E0',
                        backgroundColor: '#F8FAF9'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contactInfo" className="block text-sm font-semibold mb-2" style={{ color: '#2D5F4F' }}>
                      Contact Information
                    </label>
                    <input
                      type="text"
                      id="contactInfo"
                      name="contactInfo"
                      value={formData.contactInfo}
                      onChange={handleInputChange}
                      placeholder="Phone number or email"
                      className="w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        borderColor: '#D7E5E0',
                        backgroundColor: '#F8FAF9'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2D5F4F' }}>
                      Upload Photo (Optional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="file"
                        id="photo"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="photo"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[#3A6F5F] hover:bg-[#F8FAF9]"
                        style={{ borderColor: '#D7E5E0', backgroundColor: 'white' }}
                      >
                        <Upload className="w-5 h-5" style={{ color: '#2D5F4F' }} />
                        <span style={{ color: '#2D5F4F' }} className="font-medium">
                          {formData.photo ? formData.photo.name : 'Click to upload photo'}
                        </span>
                      </label>
                    </div>
                    {photoPreview && (
                      <div className="mt-3">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-xl border-2"
                          style={{ borderColor: '#D7E5E0' }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
                    style={{ 
                      backgroundColor: loading ? '#6B8E7F' : '#2D5F4F',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Report Lost Item'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* My Reports */}
            <div className="space-y-4">
              <div className="border-2 rounded-2xl shadow-lg" style={{ borderColor: '#D7E5E0' }}>
                <div className="p-4 rounded-t-2xl flex items-center justify-between" style={{ backgroundColor: '#2D5F4F' }}>
                  <h2 className="text-xl font-bold text-white">My Reports</h2>
                  <div className="px-3 py-1 bg-white rounded-full">
                    <span className="text-sm font-bold" style={{ color: '#2D5F4F' }}>
                      {myReports.length}
                    </span>
                  </div>
                </div>
                <div className="p-6 max-h-[600px] overflow-y-auto bg-white rounded-b-2xl">
                  {myReports.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F8FAF9' }}>
                        <AlertCircle className="w-10 h-10" style={{ color: '#D7E5E0' }} />
                      </div>
                      <p className="text-gray-500 font-medium">No reports yet</p>
                      <p className="text-sm text-gray-400 mt-1">Your reported items will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myReports.map((report) => (
                        <div 
                          key={report._id} 
                          className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all" 
                          style={{ borderColor: '#D7E5E0', backgroundColor: '#F8FAF9' }}
                        >
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              {report.photo && (
                                <img
                                  src={report.photo.startsWith('http') ? report.photo : `http://localhost:5001${report.photo}`}
                                  alt={report.title || report.itemName}
                                  className="w-24 h-24 object-cover rounded-xl border-2"
                                  style={{ borderColor: '#D7E5E0' }}
                                  onError={(e) => {
                                    console.log('Image failed to load:', report.photo);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-bold text-lg" style={{ color: '#2D5F4F' }}>
                                      {report.title || report.itemName}
                                    </h3>
                                    {report.eventModel && (
                                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-1"
                                        style={{ backgroundColor: '#D7E5E0', color: '#2D5F4F' }}>
                                        {report.eventModel === 'GymSession' ? '🏋️ Gym Session' : 
                                         report.eventModel === 'Court' ? '🎾 Court' :
                                         report.eventModel === 'Bazaar' ? '🛍️ Bazaar' :
                                         report.eventModel === 'Workshop' ? '🎓 Workshop' :
                                         report.eventModel === 'Trip' ? '🚌 Trip' :
                                         report.eventModel === 'EO_Conference' ? '🎤 Conference' :
                                         report.eventModel}
                                      </span>
                                    )}
                                  </div>
                                  <div className="relative group">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer" 
                                      style={{ backgroundColor: getStatusBgColor(report.status) }}>
                                      {getStatusIcon(report.status)}
                                      <span
                                        className="text-xs font-bold capitalize"
                                        style={{ color: getStatusColor(report.status) }}
                                      >
                                        {report.status}
                                      </span>
                                    </div>
                                    
                                    {/* Hover Tooltip for Found Items */}
                                    {report.status === 'found' && (
                                      <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl shadow-lg border-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10"
                                        style={{ 
                                          backgroundColor: '#d1fae5',
                                          borderColor: '#10b981'
                                        }}>
                                        <div className="flex items-start gap-2">
                                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-bold text-green-800 mb-1">
                                              Item Found! 🎉
                                            </p>
                                            <p className="text-xs text-green-700">
                                              Please pass by the Events Office or contact the administrator to collect your item.
                                            </p>
                                          </div>
                                        </div>
                                        {/* Arrow pointer */}
                                        <div className="absolute -top-2 right-4 w-4 h-4 rotate-45" 
                                          style={{ backgroundColor: '#d1fae5', borderLeft: '2px solid #10b981', borderTop: '2px solid #10b981' }}>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                                <div className="space-y-1 text-xs" style={{ color: '#6B8E7F' }}>
                                  <p><strong>Location:</strong> {report.location}</p>
                                  {report.contactInfo && (
                                    <p><strong>Contact:</strong> {report.contactInfo}</p>
                                  )}
                                  {report.event && (
                                    <p><strong>Event:</strong> {report.event.name || report.event.title}</p>
                                  )}
                                  <p><strong>Reported:</strong> {new Date(report.createdAt).toLocaleString()}</p>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LostAndFoundVisitor;