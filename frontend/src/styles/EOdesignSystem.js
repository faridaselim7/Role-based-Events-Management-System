/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    EVENTS OFFICE DESIGN SYSTEM                               ║
 * ║           Modern Color Palette with Citron & Tyrian Purple Accents           ║
 * ║                                                                              ║
 * ║  Color Scheme:                                                               ║
 * ║  - Mughal Green (#366B2B) - Primary, trust, nature                          ║
 * ║  - Prussian Blue (#103A57) - Secondary, authority, stability                ║
 * ║  - Teal Blue (#307B8E) - Tertiary, modern, approachable                     ║
 * ║  - Pastel Blue (#A9D3C5) - Hover, accents, light backgrounds               ║
 * ║  - Light Silver (#CEE5D6) - Borders, subtle backgrounds                     ║
 * ║  - Citron (#E8F442) - Pop of color for alerts & CTAs                       ║
 * ║  - Tyrian Purple (#6F2DA8) - Pop of color for highlights & accents          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// COLOR PALETTE - Events Office Theme
// ============================================================================
export const EOcolors = {
  // Primary Colors - Nature-inspired, professional
  primary: "#366B2B",         // Mughal Green - Main actions, trust
  secondary: "#103A57",       // Prussian Blue - Authority, headings
  tertiary: "#307B8E",        // Teal Blue - Modern, approachable
  
  // Supporting Colors
  pastel: "#A9D3C5",          // Pastel Blue - Hover states
  lightSilver: "#CEE5D6",     // Light Silver - Borders, subtle BG
  
  // Pop of Color - Use sparingly for emphasis
  citron: "#E8F442",          // Bright yellow-green - Alerts, urgent CTAs
  tyrian: "#6F2DA8",          // Deep purple - Premium, highlights
  
  // Utility Colors
  success: "#10B981",         // Emerald - Success states
  error: "#EF4444",           // Red - Errors, cancellations
  warning: "#F59E0B",         // Amber - Warnings
  info: "#3B82F6",            // Blue - Info messages
  
  // Neutrals
  light: "#F8FAFB",           // Nearly white
  dark: "#1F2937",            // Dark gray
  text: {
    primary: "#103A57",       // Prussian - Main text
    secondary: "#6B7280",     // Gray - Secondary text
    muted: "#9CA3AF",         // Light gray - Muted text
  },
};

// ============================================================================
// SHADOWS - Professional Elevation
// ============================================================================
export const EOshadows = {
  xs: "0 1px 2px rgba(16, 58, 87, 0.05)",
  sm: "0 2px 8px rgba(16, 58, 87, 0.08)",
  md: "0 4px 16px rgba(16, 58, 87, 0.12)",
  lg: "0 8px 24px rgba(16, 58, 87, 0.15)",
  xl: "0 12px 32px rgba(16, 58, 87, 0.18)",
  citron: "0 4px 16px rgba(232, 244, 66, 0.3)",
  tyrian: "0 4px 16px rgba(111, 45, 168, 0.25)",
};

// ============================================================================
// TYPOGRAPHY - Professional Hierarchy
// ============================================================================
export const EOtypography = {
  h1: { fontSize: "2.5rem", fontWeight: "800", letterSpacing: "-0.02em" },
  h2: { fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.01em" },
  h3: { fontSize: "1.5rem", fontWeight: "700" },
  h4: { fontSize: "1.25rem", fontWeight: "600" },
  h5: { fontSize: "1.125rem", fontWeight: "600" },
  
  body: { fontSize: "1rem", fontWeight: "400", lineHeight: "1.6" },
  bodySmall: { fontSize: "0.9375rem", fontWeight: "400" },
  bodyXSmall: { fontSize: "0.875rem", fontWeight: "400" },
  
  label: { fontSize: "0.9375rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" },
  labelSmall: { fontSize: "0.8125rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" },
};

// ============================================================================
// SPACING & RADIUS
// ============================================================================
export const EOspacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  xxl: "2.5rem",
  xxxl: "3rem",
};

export const EOradius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.875rem",
  xl: "1rem",
  xxl: "1.5rem",
  full: "9999px",
};

// ============================================================================
// TRANSITIONS - Smooth, Professional
// ============================================================================
export const EOtransitions = {
  fast: "all 0.15s ease",
  normal: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "all 0.5s ease",
};

// ============================================================================
// BUTTON STYLES - Multiple Variants
// ============================================================================
export const EObuttonStyles = {
  // Primary - Green CTA
  primary: {
    backgroundColor: EOcolors.primary,
    color: "white",
    border: "none",
    borderRadius: EOradius.lg,
    padding: "0.875rem 1.5rem",
    fontWeight: "700",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: EOtransitions.normal,
    boxShadow: EOshadows.md,
    letterSpacing: "0.02em",
  },

  // Secondary - Blue CTA
  secondary: {
    backgroundColor: EOcolors.secondary,
    color: "white",
    border: "none",
    borderRadius: EOradius.lg,
    padding: "0.875rem 1.5rem",
    fontWeight: "700",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: EOtransitions.normal,
    boxShadow: EOshadows.md,
  },

  // Citron - Pop of Color CTA
  citron: {
    backgroundColor: EOcolors.citron,
    color: EOcolors.secondary,
    border: "none",
    borderRadius: EOradius.lg,
    padding: "0.875rem 1.5rem",
    fontWeight: "700",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: EOtransitions.normal,
    boxShadow: EOshadows.citron,
    letterSpacing: "0.02em",
  },

  // Tyrian - Premium Highlight CTA
  tyrian: {
    backgroundColor: EOcolors.tyrian,
    color: "white",
    border: "none",
    borderRadius: EOradius.lg,
    padding: "0.875rem 1.5rem",
    fontWeight: "700",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: EOtransitions.normal,
    boxShadow: EOshadows.tyrian,
    letterSpacing: "0.02em",
  },

  // Outline - Subtle action
  outline: {
    backgroundColor: "transparent",
    color: EOcolors.primary,
    border: `2px solid ${EOcolors.primary}`,
    borderRadius: EOradius.lg,
    padding: "0.75rem 1.25rem",
    fontWeight: "600",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: EOtransitions.normal,
  },

  // Ghost - Minimal style
  ghost: {
    backgroundColor: "transparent",
    color: EOcolors.secondary,
    border: "none",
    borderRadius: EOradius.lg,
    padding: "0.75rem 1rem",
    fontWeight: "600",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: EOtransitions.normal,
  },

  // Danger - Destructive action
  danger: {
    backgroundColor: EOcolors.error,
    color: "white",
    border: "none",
    borderRadius: EOradius.lg,
    padding: "0.875rem 1.5rem",
    fontWeight: "700",
    fontSize: "0.9375rem",
    cursor: "pointer",
    transition: EOtransitions.normal,
    boxShadow: `0 4px 12px ${EOcolors.error}30`,
  },
};

// ============================================================================
// FORM INPUT STYLES
// ============================================================================
export const EOformStyles = {
  base: {
    width: "100%",
    padding: "0.875rem 1rem",
    border: `2px solid ${EOcolors.lightSilver}`,
    borderRadius: EOradius.lg,
    fontSize: "0.9375rem",
    color: EOcolors.text.primary,
    backgroundColor: "white",
    transition: EOtransitions.normal,
    outline: "none",
    fontFamily: "inherit",
  },

  label: {
    display: "block",
    fontSize: "0.9375rem",
    fontWeight: "700",
    color: EOcolors.secondary,
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  focused: {
    borderColor: EOcolors.primary,
    boxShadow: `0 0 0 4px ${EOcolors.primary}15`,
    backgroundColor: `${EOcolors.light}`,
  },

  error: {
    borderColor: EOcolors.error,
    boxShadow: `0 0 0 4px ${EOcolors.error}15`,
  },

  success: {
    borderColor: EOcolors.success,
    boxShadow: `0 0 0 4px ${EOcolors.success}15`,
  },
};

// ============================================================================
// CARD STYLES
// ============================================================================
export const EOcardStyles = {
  base: {
    backgroundColor: "white",
    borderRadius: EOradius.xl,
    border: `2px solid ${EOcolors.lightSilver}`,
    padding: "2rem",
    boxShadow: EOshadows.sm,
    transition: EOtransitions.normal,
  },

  elevated: {
    boxShadow: EOshadows.lg,
  },

  highlighted: {
    border: `2px solid ${EOcolors.primary}`,
    boxShadow: `0 0 0 3px ${EOcolors.primary}10`,
  },
};

// ============================================================================
// ALERT STYLES
// ============================================================================
export const EOalertStyles = {
  success: {
    backgroundColor: `${EOcolors.success}15`,
    borderColor: EOcolors.success,
    color: "#065F46",
    padding: "1rem 1.25rem",
    borderRadius: EOradius.lg,
    border: `2px solid ${EOcolors.success}`,
  },

  error: {
    backgroundColor: "#FEE2E2",
    borderColor: EOcolors.error,
    color: "#7F1D1D",
    padding: "1rem 1.25rem",
    borderRadius: EOradius.lg,
    border: `2px solid ${EOcolors.error}`,
  },

  warning: {
    backgroundColor: `${EOcolors.warning}15`,
    borderColor: EOcolors.warning,
    color: "#92400E",
    padding: "1rem 1.25rem",
    borderRadius: EOradius.lg,
    border: `2px solid ${EOcolors.warning}`,
  },

  info: {
    backgroundColor: `${EOcolors.info}15`,
    borderColor: EOcolors.info,
    color: "#1E3A8A",
    padding: "1rem 1.25rem",
    borderRadius: EOradius.lg,
    border: `2px solid ${EOcolors.info}`,
  },

  citron: {
    backgroundColor: "#F9FF9F",
    borderColor: EOcolors.citron,
    color: "#4D5C0A",
    padding: "1rem 1.25rem",
    borderRadius: EOradius.lg,
    border: `2px solid ${EOcolors.citron}`,
  },
};

// ============================================================================
// ANIMATION KEYFRAMES
// ============================================================================
export const EOkeyframes = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  @keyframes checkmark {
    0% {
      stroke-dashoffset: 50;
      stroke-dasharray: 50;
    }
    100% {
      stroke-dashoffset: 0;
      stroke-dasharray: 50;
    }
  }
`;

// ============================================================================
// BADGE STYLES - Status Indicators
// ============================================================================
export const EObadgeStyles = {
  success: {
    backgroundColor: `${EOcolors.success}15`,
    color: "#047857",
    border: `1px solid ${EOcolors.success}`,
    padding: "0.375rem 0.875rem",
    borderRadius: EOradius.full,
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  pending: {
    backgroundColor: `${EOcolors.warning}15`,
    color: "#92400E",
    border: `1px solid ${EOcolors.warning}`,
    padding: "0.375rem 0.875rem",
    borderRadius: EOradius.full,
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  error: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    border: `1px solid ${EOcolors.error}`,
    padding: "0.375rem 0.875rem",
    borderRadius: EOradius.full,
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  info: {
    backgroundColor: `${EOcolors.tertiary}15`,
    color: EOcolors.tertiary,
    border: `1px solid ${EOcolors.tertiary}`,
    padding: "0.375rem 0.875rem",
    borderRadius: EOradius.full,
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  citron: {
    backgroundColor: "#F9FF9F",
    color: "#4D5C0A",
    border: `1px solid ${EOcolors.citron}`,
    padding: "0.375rem 0.875rem",
    borderRadius: EOradius.full,
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  tyrian: {
    backgroundColor: `${EOcolors.tyrian}20`,
    color: EOcolors.tyrian,
    border: `1px solid ${EOcolors.tyrian}`,
    padding: "0.375rem 0.875rem",
    borderRadius: EOradius.full,
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};

// ============================================================================
// UTILITY HELPERS
// ============================================================================
export const getHoverEffect = (color) => ({
  transition: EOtransitions.normal,
  transform: "translateY(-2px)",
  boxShadow: `0 12px 24px ${color}25`,
});

export const getCitronGlowEffect = () => ({
  boxShadow: `0 0 24px ${EOcolors.citron}60, inset 0 0 24px ${EOcolors.citron}20`,
});

export const getTyrianGlowEffect = () => ({
  boxShadow: `0 0 24px ${EOcolors.tyrian}60, inset 0 0 24px ${EOcolors.tyrian}20`,
});

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default {
  colors: EOcolors,
  shadows: EOshadows,
  typography: EOtypography,
  spacing: EOspacing,
  radius: EOradius,
  transitions: EOtransitions,
  buttonStyles: EObuttonStyles,
  formStyles: EOformStyles,
  cardStyles: EOcardStyles,
  alertStyles: EOalertStyles,
  badgeStyles: EObadgeStyles,
  keyframes: EOkeyframes,
  getHoverEffect,
  getCitronGlowEffect,
  getTyrianGlowEffect,
};
