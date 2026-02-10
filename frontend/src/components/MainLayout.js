import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { colors } from '../styles/colors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCalendarAlt, faSearch, faUser } from '@fortawesome/free-solid-svg-icons';

const MainLayout = ({ children }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = (path) => ({
    color: 'white',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '8px',
    backgroundColor: isActive(path) ? colors.darkEvergreen : 'transparent',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: colors.darkEvergreen,
    }
  });

  const iconStyle = {
    marginRight: '10px',
    width: '20px',
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
    }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: colors.evergreen,
        padding: '20px',
        color: 'white',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ 
          marginBottom: '40px',
          padding: '10px',
          borderBottom: `1px solid ${colors.moss}`,
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            margin: 0,
            color: colors.white,
            fontWeight: '600',
          }}>Brains704</h1>
        </div>
        
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link to="/" style={linkStyle('/')}>
                <FontAwesomeIcon icon={faHome} style={iconStyle} />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/events" style={linkStyle('/events')}>
                <FontAwesomeIcon icon={faCalendarAlt} style={iconStyle} />
                Events
              </Link>
            </li>
          </ul>
        </nav>

        <div style={{
          marginTop: 'auto',
          borderTop: `1px solid ${colors.moss}`,
          paddingTop: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: colors.darkEvergreen,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: colors.moss,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
            }}>
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Events Office</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        backgroundColor: colors.lightGray,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: colors.white,
          padding: '15px 30px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ 
              margin: 0, 
              color: colors.evergreen,
              fontSize: '20px',
              fontWeight: '600',
            }}>
              {location.pathname === '/' ? 'Dashboard' : 'Events'}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}>
              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <FontAwesomeIcon 
                  icon={faSearch} 
                  style={{ 
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.gray,
                  }}
                />
                <input
                  type="search"
                  placeholder="Search..."
                  style={{
                    padding: '8px 15px 8px 35px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    width: '250px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    '&:focus': {
                      borderColor: colors.evergreen,
                      boxShadow: `0 0 0 2px ${colors.lightGreen}`,
                      outline: 'none',
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main style={{
          padding: '30px',
          flex: 1,
          overflowY: 'auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;