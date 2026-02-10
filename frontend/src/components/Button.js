import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  type = 'button',
  fullWidth = false,
  disabled = false,
  ...props 
}) => {
  const baseStyle = {
    padding: '12px 24px',
    borderRadius: '12px', // Rounded corners as requested
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? '#F1F2ED' : '#6F7EEA', // Cornflower Blue / Disabled
      color: disabled ? '#818C86' : '#FFFFFF', // Disabled text / White text
      '&:hover': !disabled ? {
        backgroundColor: '#5A67B8', // Darker blue on hover
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(111, 126, 234, 0.3)',
      } : {},
      '&:active': !disabled ? {
        backgroundColor: '#4C51BF', // Even darker on press
        transform: 'translateY(0)',
      } : {},
    },
    secondary: {
      backgroundColor: disabled ? '#F1F2ED' : '#E5E9D5', // Glass Green / Disabled
      color: disabled ? '#818C86' : '#816251', // Disabled text / Igiana Brown
      border: disabled ? '1px solid #E5E9D5' : '1px solid #D0D4C0',
      '&:hover': !disabled ? {
        backgroundColor: '#D0D4C0', // Darker green on hover
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(229, 233, 213, 0.3)',
      } : {},
      '&:active': !disabled ? {
        backgroundColor: '#B8BCA6', // Even darker on press
        transform: 'translateY(0)',
      } : {},
    },
    accent: {
      backgroundColor: disabled ? '#F1F2ED' : '#E5E59B', // Charlock Yellow / Disabled
      color: disabled ? '#818C86' : '#816251', // Disabled text / Igiana Brown
      '&:hover': !disabled ? {
        backgroundColor: '#D9D983', // Darker yellow on hover
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(229, 229, 155, 0.3)',
      } : {},
      '&:active': !disabled ? {
        backgroundColor: '#C9C973', // Even darker on press
        transform: 'translateY(0)',
      } : {},
    },
    danger: {
      backgroundColor: disabled ? '#F1F2ED' : '#EF4444', // Red for danger
      color: disabled ? '#818C86' : '#FFFFFF',
      '&:hover': !disabled ? {
        backgroundColor: '#DC2626',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      } : {},
      '&:active': !disabled ? {
        backgroundColor: '#B91C1C',
        transform: 'translateY(0)',
      } : {},
    }
  };

  const variantStyle = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={{
        ...baseStyle,
        backgroundColor: variantStyle.backgroundColor,
        color: variantStyle.color,
        border: variantStyle.border || 'none',
        opacity: disabled ? 0.6 : 1,
        ...(variantStyle['&:hover'] && !disabled ? {
          ':hover': variantStyle['&:hover']
        } : {}),
        ...(variantStyle['&:active'] && !disabled ? {
          ':active': variantStyle['&:active']
        } : {}),
      }}
      onMouseEnter={(e) => {
        if (!disabled && variantStyle['&:hover']) {
          Object.keys(variantStyle['&:hover']).forEach(key => {
            if (key !== 'transform' && key !== 'boxShadow') {
              e.target.style[key] = variantStyle['&:hover'][key];
            }
          });
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variantStyle['&:hover']) {
          e.target.style.backgroundColor = variantStyle.backgroundColor;
          e.target.style.color = variantStyle.color;
          e.target.style.border = variantStyle.border || 'none';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && variantStyle['&:active']) {
          Object.keys(variantStyle['&:active']).forEach(key => {
            if (key !== 'transform') {
              e.target.style[key] = variantStyle['&:active'][key];
            }
          });
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && variantStyle['&:hover']) {
          Object.keys(variantStyle['&:hover']).forEach(key => {
            if (key !== 'transform' && key !== 'boxShadow') {
              e.target.style[key] = variantStyle['&:hover'][key];
            }
          });
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;