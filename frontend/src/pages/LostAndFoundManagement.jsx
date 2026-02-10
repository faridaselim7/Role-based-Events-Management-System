import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCcw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User
} from 'lucide-react';

const LostAndFoundManagement = () => {
  const [allReports, setAllReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchAllReports();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchAllReports(true); // Silent refresh
    }, 10000);
    
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    filterReports();
  }, [allReports, statusFilter]);

  const fetchAllReports = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5001/api/lost-items/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllReports(data.lostItems || []);
        if (!silent) {
          toast.success('Reports loaded successfully');
        }
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (!silent) {
        toast.error('Failed to load reports');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...allReports];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredReports(filtered);
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5001/api/lost-items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      const data = await response.json();
      toast.success(`Item marked as ${newStatus}`);
      
      // Update local state
      setAllReports(prev =>
        prev.map(report =>
          report._id === itemId ? { ...report, status: newStatus } : report
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
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

  const stats = {
    total: allReports.length,
    unfound: allReports.filter(r => r.status === 'unfound').length,
    found: allReports.filter(r => r.status === 'found').length
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#103A57' }}>
                Lost & Found Management
              </h1>
              <p className="text-gray-600">
                Real-time updates from all reported lost items across campus
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <div className="border-2 rounded-lg shadow-lg p-6 bg-white" style={{ borderColor: '#307B8E' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                <p className="text-3xl font-bold" style={{ color: '#103A57' }}>
                  {stats.total}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#A9D3C5' }}
              >
                <Search className="w-6 h-6" style={{ color: '#307B8E' }} />
              </div>
            </div>
          </div>


          <div className="border-2 rounded-lg shadow-lg p-6 bg-white" style={{ borderColor: '#ef4444' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Still Missing</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.unfound}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>



          <div className="border-2 rounded-lg shadow-lg p-6 bg-white" style={{ borderColor: '#10b981' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Found Items</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.found}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters - NO BORDER BOX */}
        <div className="mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" style={{ color: '#307B8E' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-md focus:outline-none focus:ring-2"
                style={{ borderColor: '#A9D3C5', '--tw-ring-color': '#307B8E' }}
              >
                <option value="all">All Status</option>
                <option value="unfound">Unfound</option>
                <option value="found">Found</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
              style={{ borderColor: '#307B8E', borderTopColor: 'transparent' }}
            />
            <p className="text-gray-600">Loading reports...</p>
          </div>

        ) : filteredReports.length === 0 ? (
          <div className="border-2 rounded-lg shadow-lg p-12 bg-white" style={{ borderColor: '#307B8E' }}>
            <div className="text-center text-gray-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No reports found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report._id}
                className="border-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow bg-white"
                style={{ borderColor: '#A9D3C5' }}
              >

                <div
                  className="pb-3 p-4 rounded-t-lg"
                  style={{
                    backgroundColor: getStatusBgColor(report.status),
                    borderBottom: `2px solid ${getStatusColor(report.status)}`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.status)}
                      <span
                        className="font-semibold capitalize"
                        style={{ color: getStatusColor(report.status) }}
                      >
                        {report.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex gap-4">
                    {report.photo && (
                      <div className="flex-shrink-0">
                        <img
                          src={report.photo}
                          alt={report.itemName}
                          className="w-32 h-32 object-cover rounded-lg border-2"
                          style={{ borderColor: '#A9D3C5' }}
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <div>

                        <h3 className="text-xl font-bold mb-1" style={{ color: '#103A57' }}>
                          {report.title}
                        </h3>
                        <p className="text-gray-700">{report.description}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#307B8E' }} />
                          <span className="text-gray-600">
                            <strong>Location:</strong> {report.location}
                          </span>
                        </div>

                        {report.event && (
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#307B8E' }} />
                            <span className="text-gray-600">
                              <strong>Event:</strong> {report.event.name}
                            </span>
                          </div>
                        )}


                        {report.createdBy && (
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#307B8E' }} />
                            <span className="text-gray-600">
                              <strong>Reported By:</strong> {report.createdBy.firstName} {report.createdBy.lastName}
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {report.createdByRole}
                              </span>
                            </span>
                          </div>
                        )}

                        {report.contactInfo && (
                          <div className="flex items-start gap-2">
                            {report.contactInfo.includes('@') ? (
                              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#307B8E' }} />
                            ) : (
                              <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#307B8E' }} />
                            )}
                            <span className="text-gray-600">
                              <strong>Contact:</strong> {report.contactInfo}
                            </span>
                          </div>

                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        {report.status !== 'found' && (
                          <button
                            onClick={() => updateItemStatus(report._id, 'found')}
                            className="flex-1 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#10b981' }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark as Found
                          </button>
                        )}
                        {report.status !== 'unfound' && (
                          <button
                            onClick={() => updateItemStatus(report._id, 'unfound')}
                            className="flex-1 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <AlertCircle className="w-4 h-4" />
                            Mark as Unfound
                          </button>
                        )}
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
  );
};

export default LostAndFoundManagement;