import React, { useState } from 'react';
import axios from 'axios';
import { TruckIcon, CalendarIcon, MapPinIcon, CheckIcon } from '@heroicons/react/24/solid';
import {
  EOcolors,
  EObuttonStyles,
  EOformStyles,
  EOcardStyles,
  EOalertStyles,
  EOradius,
  EOtransitions,
} from '../styles/EOdesignSystem';

const USER_TYPES = ["Student", "Staff", "TA", "Professor"];

const CreateTrip = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    description: '',
    registrationDeadline: '',
    price: '',
    capacity: '',
    // ⭐ who is allowed to register (optional)
    allowedUserTypes: [],
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // ⭐ toggle user type in the array
  const handleUserTypeToggle = (userType) => {
    setFormData((prev) => {
      const current = prev.allowedUserTypes || [];
      if (current.includes(userType)) {
        return {
          ...prev,
          allowedUserTypes: current.filter((t) => t !== userType),
        };
      }
      return {
        ...prev,
        allowedUserTypes: [...current, userType],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const requiredFields = [
      'name',
      'startDateTime',
      'endDateTime',
      'location',
      'registrationDeadline',
      'price',
      'capacity',
    ];
    const emptyFields = requiredFields.filter((field) => {
      if (field === 'price' || field === 'capacity') {
        return (
          !formData[field].trim() ||
          isNaN(formData[field]) ||
          parseFloat(formData[field]) <= 0
        );
      }
      return !formData[field].trim();
    });

    if (emptyFields.length > 0) {
      setError(
        `Please fill in all required fields with valid values: ${emptyFields.join(
          ', '
        )}`
      );
      return;
    }

    const isoFormData = {
      ...formData,
      startDateTime: new Date(formData.startDateTime).toISOString(),
      endDateTime: new Date(formData.endDateTime).toISOString(),
      registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
      price: parseFloat(formData.price),
      capacity: parseInt(formData.capacity, 10),
      // ⭐ make sure backend receives the array (optional)
      allowedUserTypes: formData.allowedUserTypes || [],
    };

    setLoading(true);
    try {
      await axios.post('/api/events/trips', isoFormData);
      setSuccessMessage('Trip created successfully! 🚌');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error creating trip';
      setError(errorMessage);
      console.error('Error creating trip:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .create-trip-container { animation: slideInDown 0.4s ease-out; }
        .form-input { transition: ${EOtransitions.normal}; }
        .form-input:hover:not(:disabled) { border-color: ${EOcolors.pastel}; }
        .form-input:focus:not(:disabled) {
          border-color: ${EOcolors.primary};
          box-shadow: 0 0 0 4px ${EOcolors.primary}15;
          background-color: ${EOcolors.light};
        }
        .form-input:disabled {
          background-color: ${EOcolors.light};
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px ${EOcolors.primary}30;
        }
      `}</style>

      <div
        className="create-trip-container"
        style={{
          maxWidth: '48rem',
          ...EOcardStyles.base,
          border: `2px solid ${EOcolors.lightSilver}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: `2px solid ${EOcolors.light}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: EOradius.xl,
                background: `linear-gradient(135deg, ${EOcolors.primary}20, ${EOcolors.secondary}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TruckIcon
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  color: EOcolors.primary,
                }}
              />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: EOcolors.secondary,
                  margin: 0,
                }}
              >
                Create New Trip
              </h2>
              <p
                style={{
                  margin: '0.25rem 0 0 0',
                  color: EOcolors.text.secondary,
                  fontSize: '0.875rem',
                }}
              >
                Plan an exciting adventure for students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: EOcolors.text.secondary,
              transition: EOtransitions.normal,
              padding: '0.5rem',
              borderRadius: EOradius.md,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = EOcolors.light;
              e.currentTarget.style.color = EOcolors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = EOcolors.text.secondary;
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              ...EOalertStyles.error,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <span>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong
                style={{ display: 'block', marginBottom: '0.25rem' }}
              >
                Error
              </strong>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: EOcolors.error,
                fontSize: '1.25rem',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              ...EOalertStyles.success,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <CheckIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>{successMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div>
            <label style={EOformStyles.label}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>✨</span>
                Trip Name *
              </div>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={loading}
              className="form-input"
              style={EOformStyles.base}
              required
            />
          </div>

          <div>
            <label style={EOformStyles.label}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <MapPinIcon style={{ width: '1rem', height: '1rem' }} />
                Location *
              </div>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              disabled={loading}
              className="form-input"
              style={EOformStyles.base}
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <label style={EOformStyles.label}>Price (EGP) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                disabled={loading}
                className="form-input"
                style={EOformStyles.base}
                required
              />
            </div>
            <div>
              <label style={EOformStyles.label}>Capacity (Seats) *</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                disabled={loading}
                className="form-input"
                style={EOformStyles.base}
                required
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <label style={EOformStyles.label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                  Start Date & Time *
                </div>
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDateTime: e.target.value,
                  })
                }
                disabled={loading}
                className="form-input"
                style={EOformStyles.base}
                required
              />
            </div>
            <div>
              <label style={EOformStyles.label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                  End Date & Time *
                </div>
              </label>
              <input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endDateTime: e.target.value,
                  })
                }
                disabled={loading}
                className="form-input"
                style={EOformStyles.base}
                required
              />
            </div>
          </div>

          <div>
            <label style={EOformStyles.label}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                Registration Deadline *
              </div>
            </label>
            <input
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  registrationDeadline: e.target.value,
                })
              }
              disabled={loading}
              className="form-input"
              style={EOformStyles.base}
              required
            />
          </div>

          <div>
            <label style={EOformStyles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={loading}
              rows="4"
              className="form-input"
              style={{
                ...EOformStyles.base,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* ⭐ Restrict to user types */}
          <div>
            <label
              style={{
                ...EOformStyles.label,
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Restrict to User Types (optional)
            </label>
            <p
              style={{
                margin: 0,
                marginBottom: '0.5rem',
                fontSize: '0.8rem',
                color: EOcolors.text.secondary,
              }}
            >
              Leave empty to allow all users. If you select any, only those
              user types will be able to see/register.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginTop: '0.25rem',
              }}
            >
              {USER_TYPES.map((type) => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.875rem',
                    color: EOcolors.text.primary,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(formData.allowedUserTypes || []).includes(type)}
                    onChange={() => handleUserTypeToggle(type)}
                    disabled={loading}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
            <p
              style={{
                marginTop: '0.3rem',
                fontSize: '0.75rem',
                color: EOcolors.text.secondary,
              }}
            >
              {formData.allowedUserTypes.length === 0
                ? 'Currently: all user types can register.'
                : `Currently restricted to: ${formData.allowedUserTypes.join(
                    ', '
                  )}`}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '2rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                ...EObuttonStyles.outline,
                width: '100%',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
              style={{
                ...EObuttonStyles.primary,
                width: '100%',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: EOtransitions.normal,
              }}
            >
              {loading ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      animation: 'spin 1s linear infinite',
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                  Creating Trip...
                </span>
              ) : (
                'Create Trip'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateTrip;
