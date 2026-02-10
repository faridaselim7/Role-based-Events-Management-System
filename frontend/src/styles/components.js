// styles/components.js
import { colors } from './colors';

export const sharedStyles = {
  // Page container
  pageContainer: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: colors.white,
  },

  // Card styles - PRIMARY CARD DESIGN
  card: {
    backgroundColor: colors.PastelBlue,
    border: `2px solid ${colors.silver}`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },

  cardHover: {
    backgroundColor: colors.PastelBlue,
    border: `2px solid ${colors.Teal}`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)',
    cursor: 'pointer',
  },

  // Text styles
  cardTitle: {
    color: colors.Prussian,
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '8px',
  },

  cardSubtext: {
    color: colors.Mughal,
    fontSize: '0.95rem',
    marginBottom: '4px',
  },

  cardDetail: {
    color: colors.Teal,
    fontSize: '0.9rem',
    marginBottom: '4px',
  },

  // Button styles
  button: {
    backgroundColor: colors.Mughal,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  buttonHover: {
    backgroundColor: colors.Prussian,
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },

  // Edit button
  editButton: {
    backgroundColor: colors.Teal,
    color: colors.white,
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  editButtonHover: {
    backgroundColor: colors.Prussian,
    transform: 'scale(1.1)',
  },

  // Add button (floating)
  addButton: {
    position: 'fixed',
    bottom: '40px',
    right: '40px',
    backgroundColor: colors.Mughal,
    color: colors.white,
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
    zIndex: 999,
  },

  addButtonHover: {
    backgroundColor: colors.Prussian,
    transform: 'scale(1.1)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
  },

  // Input styles
  input: {
    padding: '10px 16px',
    width: '100%',
    borderRadius: '8px',
    border: `2px solid ${colors.silver}`,
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    backgroundColor: colors.white,
  },

  inputFocus: {
    border: `2px solid ${colors.Teal}`,
    outline: 'none',
    boxShadow: `0 0 0 3px ${colors.PastelBlue}`,
  },

  // Modal styles
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 58, 87, 0.5)', // Prussian with opacity
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  modal: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    border: `2px solid ${colors.silver}`,
  },

  // Section headers
  sectionHeader: {
    color: colors.Mughal,
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '16px',
    marginTop: '24px',
  },

  pageHeader: {
    color: colors.Prussian,
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '24px',
  },

  // Menu (for add button dropdown)
  menu: {
    position: 'fixed',
    bottom: '120px',
    right: '40px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    padding: '12px',
    zIndex: 1000,
    border: `2px solid ${colors.silver}`,
  },

  menuButton: {
    backgroundColor: colors.PastelBlue,
    color: colors.Prussian,
    border: `1px solid ${colors.silver}`,
    borderRadius: '8px',
    padding: '12px 20px',
    width: '100%',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '8px',
  },

  menuButtonHover: {
    backgroundColor: colors.Teal,
    color: colors.white,
    transform: 'translateX(4px)',
  },
};

// Utility function to merge hover states
export const getHoverStyle = (baseStyle, hoverStyle, isHovered) => {
  return isHovered ? { ...baseStyle, ...hoverStyle } : baseStyle;
};