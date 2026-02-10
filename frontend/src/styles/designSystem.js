/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    UNIFIED DESIGN SYSTEM                                   ║
 * ║           GUC Bazaar & Booth Management Platform                           ║
 * ║                                                                             ║
 * ║  This design system ensures consistent styling across all vendor features:  ║
 * ║  - Apply for Bazaar Form                                                   ║
 * ║  - Apply for Platform Booth Form                                           ║
 * ║  - Document Upload (Tax Card & Logo)                                       ║
 * ║  - Vendor Dashboard Components                                             ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// COLOR PALETTE - Modern Teal & Prussian Blue Theme
// ============================================================================
export const colors = {
  // Primary Colors
  primary: "#307B8E",        // Teal Blue - Main CTA, primary buttons
  secondary: "#A9D3C5",      // Light Teal - Hover states, secondary actions
  tertiary: "#CEE5D6",       // Soft Mint - Borders, light backgrounds, success states
  accent: "#103A57",         // Deep Prussian - Text, headings, emphasis

  // Status Colors
  success: "#10B981",        // Emerald - Success states, confirmations
  error: "#EF4444",          // Red - Errors, deletions
  warning: "#F59E0B",        // Amber - Warnings, pending states
  info: "#3B82F6",           // Blue - Informational messages

  // Neutral Colors
  light: "#F8FAFB",          // Nearly White - Light backgrounds
  border: "#E5E7EB",         // Light Gray - Border colors
  text: {
    primary: "#103A57",      // Main text
    secondary: "#6B7280",    // Secondary text
    muted: "#9CA3AF",        // Muted text
  },

  // Semantic Variants
  hover: "#A9D3C5",          // Hover state color
  focus: "#307B8E",          // Focus state color
  disabled: "#A0AEC0",       // Disabled state color
};

// ============================================================================
// SHADOWS - Elevation System
// ============================================================================
export const shadows = {
  sm: "0 2px 8px rgba(16, 58, 87, 0.08)",
  md: "0 4px 12px rgba(16, 58, 87, 0.12)",
  lg: "0 8px 24px rgba(16, 58, 87, 0.15)",
  xl: "0 10px 40px rgba(16, 58, 87, 0.1)",
  hover: "0 8px 16px rgba(169, 211, 197, 0.3)",
  focus: "0 0px 0px 4px rgba(48, 123, 142, 0.15)",
};

// ============================================================================
// TYPOGRAPHY - Font Sizes & Weights
// ============================================================================
export const typography = {
  // Headings
  h1: { fontSize: "2.5rem", fontWeight: "700", letterSpacing: "-0.02em" },
  h2: { fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.02em" },
  h3: { fontSize: "1.5rem", fontWeight: "700", letterSpacing: "-0.01em" },
  h4: { fontSize: "1.25rem", fontWeight: "700" },
  h5: { fontSize: "1.125rem", fontWeight: "700" },

  // Body Text
  body: { fontSize: "1rem", fontWeight: "400", lineHeight: "1.5" },
  bodySmall: { fontSize: "0.9375rem", fontWeight: "400" },
  bodyXSmall: { fontSize: "0.875rem", fontWeight: "400" },

  // Labels
  label: { fontSize: "0.9375rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" },
  labelSmall: { fontSize: "0.8125rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" },

  // Caption
  caption: { fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.02em" },
};

// ============================================================================
// SPACING - Consistent Spacing Scale
// ============================================================================
export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  xxl: "2.5rem",
  xxxl: "3rem",
};

// ============================================================================
// BORDER RADIUS - Rounded Corners Scale
// ============================================================================
export const borderRadius = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "0.875rem",
  xxl: "1.25rem",
  full: "9999px",
};

// ============================================================================
// TRANSITIONS - Animation Timing
// ============================================================================
export const transitions = {
  fast: "all 0.15s ease",
  normal: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "all 0.5s ease",
};

// ============================================================================
// Z-INDEX - Layering System
// ============================================================================
export const zIndex = {
  hide: "-1",
  auto: "auto",
  base: "0",
  dropdown: "1000",
  sticky: "1020",
  fixed: "1030",
  modalBackdrop: "1040",
  modal: "1050",
  tooltip: "1070",
};

// ============================================================================
// COMPONENT STYLES - Reusable Component Styles
// ============================================================================

/**
 * BUTTON STYLES
 * Usage: Apply these styles to button elements for consistent appearance
 */
export const buttonStyles = {
  // Primary Button - Main Call-to-Action
  primary: {
    backgroundColor: colors.primary,
    color: "white",
    border: "none",
    borderRadius: borderRadius.xl,
    padding: "1.125rem 2rem",
    fontWeight: "700",
    fontSize: "1.0625rem",
    cursor: "pointer",
    transition: transitions.normal,
    boxShadow: `0 4px 12px ${colors.primary}30`,
    letterSpacing: "0.02em",
    "&:hover": {
      backgroundColor: colors.primary,
      transform: "translateY(-2px)",
      boxShadow: `0 12px 24px ${colors.primary}35`,
    },
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },

  // Secondary Button - Alternative Action
  secondary: {
    backgroundColor: colors.tertiary,
    color: colors.accent,
    border: `2px solid ${colors.secondary}`,
    borderRadius: borderRadius.xl,
    padding: "0.875rem 1.25rem",
    fontWeight: "700",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: transitions.normal,
    "&:hover": {
      backgroundColor: colors.secondary,
      borderColor: colors.primary,
      transform: "translateY(-2px)",
      boxShadow: `0 8px 16px ${colors.secondary}40`,
    },
  },

  // Ghost Button - Minimal Style
  ghost: {
    backgroundColor: "transparent",
    color: colors.primary,
    border: `2px solid ${colors.tertiary}`,
    borderRadius: borderRadius.xl,
    padding: "0.875rem 1rem",
    fontWeight: "600",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: transitions.normal,
    "&:hover": {
      borderColor: colors.secondary,
      backgroundColor: "#F3F9F7",
    },
  },
};

/**
 * FORM INPUT STYLES
 * Usage: Apply these styles to input, textarea, and select elements
 */
export const formInputStyles = {
  base: {
    width: "100%",
    padding: "0.875rem 1rem",
    border: `2px solid ${colors.tertiary}`,
    borderRadius: borderRadius.lg,
    fontSize: "0.9375rem",
    color: colors.accent,
    backgroundColor: "white",
    transition: transitions.normal,
    outline: "none",
    fontFamily: "inherit",
    "&:hover": {
      borderColor: colors.secondary,
    },
    "&:focus": {
      borderColor: colors.primary,
      boxShadow: `0 0 0 4px ${colors.primary}15`,
      backgroundColor: colors.light,
    },
  },

  label: {
    display: "block",
    fontSize: "0.9375rem",
    fontWeight: "700",
    color: colors.accent,
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  error: {
    borderColor: colors.error,
    boxShadow: `0 0 0 4px ${colors.error}15`,
  },

  success: {
    borderColor: colors.success,
    boxShadow: `0 0 0 4px ${colors.success}15`,
  },
};

/**
 * CARD STYLES
 * Usage: Apply these styles to container divs for consistent card appearance
 */
export const cardStyles = {
  base: {
    backgroundColor: "white",
    borderRadius: borderRadius.xxl,
    border: `2px solid ${colors.tertiary}`,
    padding: "2rem",
    boxShadow: shadows.md,
    transition: transitions.normal,
  },

  hover: {
    borderColor: colors.secondary,
    boxShadow: shadows.lg,
  },

  elevated: {
    boxShadow: shadows.xl,
  },
};

/**
 * ALERT/BANNER STYLES
 * Usage: Apply these styles to notification/alert containers
 */
export const alertStyles = {
  success: {
    backgroundColor: `${colors.success}15`,
    borderColor: colors.success,
    color: "#065F46",
    padding: "1rem 1.25rem",
  },

  error: {
    backgroundColor: "#FEE2E2",
    borderColor: colors.error,
    color: "#7F1D1D",
    padding: "1rem 1.25rem",
  },

  warning: {
    backgroundColor: `${colors.warning}15`,
    borderColor: colors.warning,
    color: "#92400E",
    padding: "1rem 1.25rem",
  },

  info: {
    backgroundColor: `${colors.info}15`,
    borderColor: colors.info,
    color: "#1E3A8A",
    padding: "1rem 1.25rem",
  },
};

// ============================================================================
// ANIMATION KEYFRAMES - CSS Animations
// ============================================================================
export const keyframes = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Get box shadow with proper color opacity
 * @param {string} color - Color hex code
 * @param {number} opacity - Opacity percentage (0-100)
 * @returns {string} Box shadow CSS value
 */
export const getBoxShadow = (color, opacity = 20) => {
  return `0 4px 12px ${color}${Math.round(opacity * 2.55).toString(16).padStart(2, '0')}`;
};

/**
 * Merge style objects safely
 * @param {...object} styles - Style objects to merge
 * @returns {object} Merged style object
 */
export const mergeStyles = (...styles) => {
  return Object.assign({}, ...styles);
};

/**
 * Create a hover effect style object
 * @param {string} baseColor - Base color
 * @returns {object} Style object with hover effects
 */
export const createHoverEffect = (baseColor) => ({
  transition: transitions.normal,
  "&:hover": {
    backgroundColor: baseColor,
    transform: "translateY(-2px)",
    boxShadow: getBoxShadow(baseColor, 30),
  },
});

// ============================================================================
// EXPORT DEFAULT DESIGN SYSTEM
// ============================================================================
export default {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
  transitions,
  zIndex,
  buttonStyles,
  formInputStyles,
  cardStyles,
  alertStyles,
  keyframes,
  getBoxShadow,
  mergeStyles,
  createHoverEffect,
};
