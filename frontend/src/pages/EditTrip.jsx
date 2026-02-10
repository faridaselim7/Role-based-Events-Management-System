import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const EditTrip = ({ trip, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    description: '',
    registrationDeadline: '',
    price: '',
    capacity: ''
  });
  const [isEditable, setIsEditable] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trip) {
      const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().slice(0, 16) : '';
      setFormData({
        name: trip.name || '',
        startDateTime: formatDate(trip.startDateTime),
        endDateTime: formatDate(trip.endDateTime),
        location: trip.location || '',
        description: trip.description || '',
        registrationDeadline: formatDate(trip.registrationDeadline),
        price: trip.price !== undefined ? trip.price : '',
        capacity: trip.capacity !== undefined ? trip.capacity : ''
      });
      const currentDate = new Date();
      const endDate = new Date(trip.endDateTime);
      if (currentDate > endDate) {
        setIsEditable(false);
        setError('Cannot edit a trip that has already passed.');
      }
    }
  }, [trip]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isEditable) return;
    const requiredFields = ['name', 'startDateTime', 'endDateTime', 'location', 'registrationDeadline', 'price', 'capacity'];
    const emptyFields = requiredFields.filter(field => {
      if (field === 'price' || field === 'capacity') return !formData[field].trim() || isNaN(formData[field]) || parseFloat(formData[field]) <= 0;
      return !formData[field].trim();
    });
    if (emptyFields.length > 0) {
      setError(`Please fill in all required fields: ${emptyFields.join(', ')}`);
      return;
    }
    const isoFormData = {
      ...formData,
      startDateTime: new Date(formData.startDateTime).toISOString(),
      endDateTime: new Date(formData.endDateTime).toISOString(),
      registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
      price: parseFloat(formData.price),
      capacity: parseInt(formData.capacity, 10)
    };
    try {
      const response = await axios.put(`http://localhost:5001/api/events/trips/${trip._id}`, isoFormData);
      console.log('Update trip response:', response.data);
      alert('Trip updated successfully!');
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error updating trip';
      setError(errorMessage);
      console.error('Error updating trip:', err);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-xl p-6 shadow-lg border border-[#E4E7EB]">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E4E7EB]">
        <h2 className="text-2xl font-bold text-[#2B4B3E]">Edit Trip</h2>
        <Button 
          variant="ghost" 
          onClick={onClose} 
          className="text-[#344054] hover:text-[#2B4B3E] hover:bg-[#F3F4F6] transition-all duration-200 rounded-lg"
        >
          ✕
        </Button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">Trip Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
              required
              disabled={!isEditable}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
              required
              disabled={!isEditable}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">Price</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
                required
                disabled={!isEditable}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">Capacity</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
                required
                disabled={!isEditable}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
                required
                disabled={!isEditable}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">End Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
                required
                disabled={!isEditable}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">Registration Deadline</Label>
            <Input
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
              className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
              required
              disabled={!isEditable}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-[#2B4B3E] mb-2 block">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-[#D0D5DD] rounded-lg focus:border-[#2B4B3E] focus:ring-2 focus:ring-[#2B4B3E]/20 transition-all duration-200 hover:border-[#2B4B3E]"
              rows={3}
              required
              disabled={!isEditable}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#E4E7EB]">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="px-6 py-2 border border-[#D0D5DD] text-[#2B4B3E] hover:bg-[#F3F4F6] transition-all duration-200 rounded-lg font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-6 py-2 bg-[#2B4B3E] hover:bg-[#1A2E26] text-white transition-all duration-200 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isEditable}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTrip;