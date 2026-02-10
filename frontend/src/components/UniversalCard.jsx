import React, { useState } from 'react';
import { sharedStyles } from '../styles/components';
import { colors } from '../styles/colors';

/**
 * Reusable Card Component
 * Use this as a template for all cards: Workshop, Bazaar, Gym, Poll, Vendor, Event, Trip
 * 
 * Props:
 * - title: Main heading
 * - subtitle: Secondary text (location, professor, etc)
 * - details: Array of detail items [{icon, text}]
 * - onEdit: Optional edit handler
 * - onClick: Optional click handler
 * - children: Additional content
 * - editable: Boolean for edit button visibility
 */
export const UniversalCard = ({ 
  title, 
  subtitle, 
  details = [], 
  onEdit, 
  onClick,
  children,
  editable = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditHovered, setIsEditHovered] = useState(false);

  const cardStyle = isHovered ? sharedStyles.cardHover : sharedStyles.card;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Title */}
          <h4 style={sharedStyles.cardTitle}>{title}</h4>
          
          {/* Subtitle */}
          {subtitle && <p style={sharedStyles.cardSubtext}>{subtitle}</p>}
          
          {/* Details */}
          {details.map((detail, index) => (
            <p key={index} style={sharedStyles.cardDetail}>
              {detail.icon && <span>{detail.icon} </span>}
              {detail.text}
            </p>
          ))}
          
          {/* Additional children content */}
          {children}
        </div>

        {/* Edit Button */}
        {editable && onEdit && (
          <button
            style={
              isEditHovered
                ? { ...sharedStyles.editButton, ...sharedStyles.editButtonHover }
                : sharedStyles.editButton
            }
            onMouseEnter={() => setIsEditHovered(true)}
            onMouseLeave={() => setIsEditHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            ✏️
          </button>
        )}
      </div>
    </div>
  );
};

// ===== SPECIFIC CARD EXAMPLES =====

// Workshop Card Example
export const WorkshopCard = ({ workshop, onEdit }) => {
  return (
    <UniversalCard
      title={workshop.title}
      subtitle={`👨‍🏫 ${workshop.professor}`}
      details={[
        { icon: '🗓️', text: new Date(workshop.date).toLocaleDateString() },
        { icon: '📍', text: workshop.location },
        { icon: '👥', text: `${workshop.attendees}/${workshop.capacity} attendees` }
      ]}
      onEdit={onEdit}
      editable={true}
    />
  );
};

// Bazaar Card Example
export const BazaarCard = ({ bazaar, onEdit, isEditable }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <UniversalCard
      title={bazaar.name}
      subtitle={`📍 ${bazaar.location}`}
      details={[
        { 
          icon: '🗓️', 
          text: `${formatDate(bazaar.startDateTime)} - ${formatDate(bazaar.endDateTime)}` 
        }
      ]}
      onEdit={onEdit}
      editable={isEditable}
    />
  );
};

// Trip Card Example
export const TripCard = ({ trip, onEdit, isEditable }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <UniversalCard
      title={trip.name}
      subtitle={`📍 ${trip.location}`}
      details={[
        { 
          icon: '🗓️', 
          text: `${formatDate(trip.startDateTime)} - ${formatDate(trip.endDateTime)}` 
        },
        { icon: '💰', text: `Price: $${trip.price}` }
      ]}
      onEdit={onEdit}
      editable={isEditable}
    />
  );
};

// Gym Session Card Example
export const GymSessionCard = ({ session, onEdit }) => {
  return (
    <UniversalCard
      title={session.name}
      subtitle={`🏋️ ${session.trainer}`}
      details={[
        { icon: '🗓️', text: new Date(session.date).toLocaleDateString() },
        { icon: '⏰', text: `${session.startTime} - ${session.endTime}` },
        { icon: '📍', text: session.location }
      ]}
      onEdit={onEdit}
      editable={session.isEditable}
    />
  );
};

// Poll Card Example
export const PollCard = ({ poll, onVote }) => {
  return (
    <UniversalCard
      title={poll.question}
      subtitle={`By ${poll.createdBy}`}
      details={[
        { icon: '🗳️', text: `${poll.totalVotes} votes` },
        { icon: '📅', text: `Ends ${new Date(poll.endDate).toLocaleDateString()}` }
      ]}
      onClick={onVote}
    >
      <div style={{ marginTop: '12px' }}>
        {poll.options.map((option, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <div style={{
              backgroundColor: colors.silver,
              borderRadius: '4px',
              padding: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${option.percentage}%`,
                backgroundColor: colors.Teal,
                opacity: 0.3,
                transition: 'width 0.3s ease'
              }} />
              <span style={{ 
                position: 'relative', 
                color: colors.Prussian,
                fontWeight: '500'
              }}>
                {option.text} - {option.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </UniversalCard>
  );
};

// Vendor Card Example
export const VendorCard = ({ vendor, onContact }) => {
  return (
    <UniversalCard
      title={vendor.name}
      subtitle={vendor.category}
      details={[
        { icon: '📞', text: vendor.phone },
        { icon: '📧', text: vendor.email },
        { icon: '⭐', text: `Rating: ${vendor.rating}/5` }
      ]}
      onClick={onContact}
    />
  );
};

export default UniversalCard;