import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Package, Search, CheckCircle2, XCircle, AlertCircle, MapPin, Calendar, User } from 'lucide-react';

const VendorLostAndFound = () => {
  console.log('🎯 VendorLostAndFound component MOUNTED!');
  
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchLostItems = useCallback(async () => {
    console.log('🚀 fetchLostItems called!');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log('👤 Token:', token ? 'exists' : 'MISSING');
      console.log('👤 User:', user);
      console.log('👤 User.id:', user?.id);
      
      if (!user?.id) {
        console.error('❌ No user.id found!');
        toast.error('Vendor ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching lost items for vendor:', user.id);

      const url = `http://localhost:5001/api/vendors/lost-items/${user.id}`;
      console.log('📡 Calling URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Lost items received:', data);
        setLostItems(data.lostItems || []);
      } else {
        const error = await response.json();
        console.error('❌ Error response:', error);
        toast.error(error.message || 'Failed to fetch lost items');
      }
    } catch (error) {
      console.error('❌ Error fetching lost items:', error);
      toast.error('Failed to fetch lost items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🎯 useEffect triggered!');
    fetchLostItems();
  }, [fetchLostItems]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `http://localhost:5001/api/lost-items/${selectedItem._id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Item marked as ${status}!`);
        
        setLostItems(prev => 
          prev.map(item => 
            item._id === selectedItem._id 
              ? { ...item, status } 
              : item
          )
        );
        
        setShowModal(false);
        setSelectedItem(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'found':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'unfound':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const filteredItems = lostItems.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F8FAF9' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#307B8E' }}>
            Lost & Found Items
          </h1>
          <p className="text-gray-600">
            Items reported at bazaars where you have a paid booth that has started
          </p>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filterStatus === 'all'
                ? 'text-white shadow-md'
                : 'bg-white text-gray-600 border-2'
            }`}
            style={{
              backgroundColor: filterStatus === 'all' ? '#307B8E' : 'white',
              borderColor: '#D7E5E0'
            }}
          >
            All ({lostItems.length})
          </button>
          <button
            onClick={() => setFilterStatus('unfound')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filterStatus === 'unfound'
                ? 'text-white shadow-md'
                : 'bg-white text-gray-600 border-2'
            }`}
            style={{
              backgroundColor: filterStatus === 'unfound' ? '#ef4444' : 'white',
              borderColor: '#D7E5E0'
            }}
          >
            Unfound ({lostItems.filter(i => i.status === 'unfound').length})
          </button>
          <button
            onClick={() => setFilterStatus('found')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              filterStatus === 'found'
                ? 'text-white shadow-md'
                : 'bg-white text-gray-600 border-2'
            }`}
            style={{
              backgroundColor: filterStatus === 'found' ? '#10b981' : 'white',
              borderColor: '#D7E5E0'
            }}
          >
            Found ({lostItems.filter(i => i.status === 'found').length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4" 
                style={{ borderColor: '#D7E5E0', borderTopColor: '#307B8E' }}>
              </div>
              <p className="text-gray-600">Loading lost items...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" 
              style={{ backgroundColor: '#E8F4F8' }}>
              <Package className="w-12 h-12" style={{ color: '#307B8E' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#307B8E' }}>
              No {filterStatus !== 'all' ? filterStatus : ''} items
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? 'No lost items have been reported at your paid and started bazaars yet.'
                : `No ${filterStatus} items found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                onClick={() => handleItemClick(item)}
                className="border-2 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ 
                  borderColor: '#D7E5E0',
                  backgroundColor: 'white'
                }}
              >
                {item.photo && (
                  <img
                    src={item.photo}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-xl mb-4 border-2"
                    style={{ borderColor: '#D7E5E0' }}
                  />
                )}

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg" style={{ color: '#307B8E' }}>
                    {item.title}
                  </h3>
                  <div 
                    className="flex items-center gap-1 px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: getStatusBgColor(item.status),
                      color: getStatusColor(item.status)
                    }}
                  >
                    {getStatusIcon(item.status)}
                    <span className="text-xs font-bold capitalize">
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {item.description}
                </p>

                <div className="space-y-2 text-sm" style={{ color: '#6B8E7F' }}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                  
                  {item.event && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{item.event.name || item.event.title}</span>
                    </div>
                  )}
                  
                  {item.createdBy && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>
                        {item.createdBy.firstName} {item.createdBy.lastName}
                      </span>
                    </div>
                  )}
                </div>

                {item.contactInfo && (
                  <div className="mt-3 pt-3 border-t-2" style={{ borderColor: '#D7E5E0' }}>
                    <p className="text-xs font-semibold" style={{ color: '#307B8E' }}>
                      Contact: {item.contactInfo}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b-2" style={{ borderColor: '#D7E5E0' }}>
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold" style={{ color: '#307B8E' }}>
                  {selectedItem.title}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ 
                  backgroundColor: getStatusBgColor(selectedItem.status),
                  color: getStatusColor(selectedItem.status)
                }}
              >
                {getStatusIcon(selectedItem.status)}
                <span className="font-bold capitalize">{selectedItem.status}</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedItem.photo && (
                <img
                  src={selectedItem.photo}
                  alt={selectedItem.title}
                  className="w-full max-h-96 object-cover rounded-xl border-2"
                  style={{ borderColor: '#D7E5E0' }}
                />
              )}

              <div>
                <h3 className="font-bold mb-2" style={{ color: '#307B8E' }}>
                  Description
                </h3>
                <p className="text-gray-700">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-2" style={{ color: '#307B8E' }}>
                    Location
                  </h3>
                  <p className="text-gray-700">{selectedItem.location}</p>
                </div>

                {selectedItem.event && (
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#307B8E' }}>
                      Event
                    </h3>
                    <p className="text-gray-700">
                      {selectedItem.event.name || selectedItem.event.title}
                    </p>
                  </div>
                )}

                {selectedItem.dateLost && (
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#307B8E' }}>
                      Date Lost
                    </h3>
                    <p className="text-gray-700">
                      {new Date(selectedItem.dateLost).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {selectedItem.createdBy && (
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#307B8E' }}>
                      Reported By
                    </h3>
                    <p className="text-gray-700">
                      {selectedItem.createdBy.firstName} {selectedItem.createdBy.lastName}
                    </p>
                  </div>
                )}

                {selectedItem.contactInfo && (
                  <div className="md:col-span-2">
                    <h3 className="font-bold mb-2" style={{ color: '#307B8E' }}>
                      Contact Information
                    </h3>
                    <p className="text-gray-700">{selectedItem.contactInfo}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t-2" style={{ borderColor: '#D7E5E0' }}>
                <h3 className="font-bold mb-4" style={{ color: '#307B8E' }}>
                  Update Status
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleStatusUpdate('found')}
                    disabled={selectedItem.status === 'found'}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as Found
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('unfound')}
                    disabled={selectedItem.status === 'unfound'}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    <XCircle className="w-5 h-5" />
                    Mark as Unfound
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLostAndFound;