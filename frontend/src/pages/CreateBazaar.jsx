import React, { useState } from 'react';
import axios from 'axios';
import { SparklesIcon, CalendarIcon, MapPinIcon, CheckIcon } from '@heroicons/react/24/solid';
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOformStyles,
  EOcardStyles,
  EOalertStyles,
  EOradius,
  EOtransitions,
} from '../styles/EOdesignSystem';

const CreateBazaar = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    description: '',
    registrationDeadline: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const requiredFields = ['name', 'startDateTime', 'endDateTime', 'location', 'description', 'registrationDeadline'];
    const emptyFields = requiredFields.filter(field => !formData[field].trim());
    if (emptyFields.length > 0) {
      setError(`Please fill in all required fields: ${emptyFields.join(', ')}`);
      return;
    }
    const isoFormData = {
      ...formData,
      startDateTime: new Date(formData.startDateTime).toISOString(),
      endDateTime: new Date(formData.endDateTime).toISOString(),
      registrationDeadline: new Date(formData.registrationDeadline).toISOString()
    };
    setLoading(true);
    try {
      const response = await axios.post('/api/events/bazaars', isoFormData);
      console.log('Create bazaar response:', response.data);
      setSuccessMessage('Bazaar created successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error creating bazaar';
      setError(errorMessage);
      console.error('Error creating bazaar:', err);
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
        .bazaar-form-container { animation: slideInDown 0.4s ease-out; }
        .form-input { transition: ${EOtransitions.normal}; }
        .form-input:hover { border-color: ${EOcolors.pastel}; }
        .form-input:focus {
          border-color: ${EOcolors.primary};
          box-shadow: 0 0 0 4px ${EOcolors.primary}15;
          background-color: ${EOcolors.light};
        }
        .btn-submit {
          transition: ${EOtransitions.normal};
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px ${EOcolors.primary}30;
        }
      `}</style>

      <div className="bazaar-form-container" style={{
        maxWidth: "48rem",
        ...EOcardStyles.base,
        border: `2px solid ${EOcolors.lightSilver}`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: `2px solid ${EOcolors.light}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "3rem",
              height: "3rem",
              borderRadius: EOradius.xl,
              background: `linear-gradient(135deg, ${EOcolors.primary}20, ${EOcolors.tertiary}20)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <SparklesIcon style={{ width: "1.5rem", height: "1.5rem", color: EOcolors.primary }} />
            </div>
            <div>
              <h2 style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: EOcolors.secondary,
                margin: 0,
              }}>
                Create Bazaar
              </h2>
              <p style={{
                margin: "0.25rem 0 0 0",
                color: EOcolors.text.secondary,
                fontSize: "0.875rem",
              }}>
                Set up a new bazaar event for your campus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: EOcolors.text.secondary,
              transition: EOtransitions.normal,
              padding: "0.5rem",
              borderRadius: EOradius.md,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = EOcolors.light;
              e.currentTarget.style.color = EOcolors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = EOcolors.text.secondary;
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            ...EOalertStyles.error,
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}>
            <span>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Error</strong>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: EOcolors.error,
                fontSize: "1.25rem",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div style={{
            ...EOalertStyles.success,
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <CheckIcon style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={EOformStyles.label}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <SparklesIcon style={{ width: "1rem", height: "1rem" }} />
                Bazaar Name *
              </div>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="E.g., Spring Bazaar 2025"
              className="form-input"
              style={EOformStyles.base}
              required
            />
          </div>

          <div>
            <label style={EOformStyles.label}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPinIcon style={{ width: "1rem", height: "1rem" }} />
                Location *
              </div>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="E.g., Main Campus Courtyard"
              className="form-input"
              style={EOformStyles.base}
              required
            />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}>
            <div>
              <label style={EOformStyles.label}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
                  Start Date & Time *
                </div>
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                className="form-input"
                style={EOformStyles.base}
                required
              />
            </div>
            <div>
              <label style={EOformStyles.label}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
                  End Date & Time *
                </div>
              </label>
              <input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                className="form-input"
                style={EOformStyles.base}
                required
              />
            </div>
          </div>

          <div>
            <label style={EOformStyles.label}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
                Registration Deadline *
              </div>
            </label>
            <input
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
              className="form-input"
              style={EOformStyles.base}
              required
            />
          </div>

          <div>
            <label style={EOformStyles.label}>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the bazaar, vendors, activities, etc."
              rows="4"
              className="form-input"
              style={{
                ...EOformStyles.base,
                fontFamily: "inherit",
                resize: "vertical",
              }}
              required
            />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "2rem",
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...EObuttonStyles.outline,
                width: "100%",
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
                width: "100%",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <div style={{
                    animation: "spin 1s linear infinite",
                    width: "1rem",
                    height: "1rem",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                  }} />
                  Creating Bazaar...
                </span>
              ) : (
                "Create Bazaar"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateBazaar;