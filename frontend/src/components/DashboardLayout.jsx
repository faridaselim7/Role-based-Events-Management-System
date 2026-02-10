import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUser, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import ConferenceManagement from "./events-office/ConferenceManagement";
import NotificationBell from "./NotificationBell";
import NotificationList from "./NotificationList";
import { useState } from "react";

function DashboardLayout({ user, onLogout, navigation, currentView, onViewChange, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          backgroundColor: '#004A3A',
          padding: '20px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            marginBottom: '40px',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            paddingBottom: '15px',
          }}
        >
          <h1 style={{ fontSize: '25px', fontWeight: '600' }}>Brains704</h1>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ flex: 1 }}>
          {navigation.map((item) => {
            const isActive = currentView === item.view;

            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                style={{
                  borderLeft: isActive
                    ? '4px solid rgb(23, 73, 53)'
                    : '4px solid transparent',
                  paddingLeft: isActive ? '12px' : '16px',
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#2B4B3E' : '#FFFFFF',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#668E7C';
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.icon}
                <span style={{ fontSize: '18px', fontWeight: '500' }}>
                  {item.name}
                </span>
              </button>
            );
          })}

          {/* --- Added Conferences button --- */}
          <button
            onClick={() => onViewChange('conferences')}
            style={{
              borderLeft:
                currentView === 'conferences'
                  ? '4px solid rgb(23, 73, 53)'
                  : '4px solid transparent',
              paddingLeft: currentView === 'conferences' ? '12px' : '16px',
              width: '100%',
              textAlign: 'left',
              backgroundColor:
                currentView === 'conferences' ? '#FFFFFF' : 'transparent',
              color:
                currentView === 'conferences' ? '#2B4B3E' : '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'conferences')
                e.currentTarget.style.backgroundColor = '#668E7C';
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'conferences')
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FontAwesomeIcon icon={faCalendarDays} />
            <span style={{ fontSize: '18px', fontWeight: '500' }}>
              Conferences
            </span>
          </button>
        </nav>

        {/* User Section */}
        <div
          style={{
            borderTop: '1px solid rgba(245, 238, 238, 0.73)',
            paddingTop: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#668E7C',
              borderRadius: '10px',
              padding: '10px',
            }}
          >
            <div
              style={{
                backgroundColor: '#466856',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
              }}
            >
              <FontAwesomeIcon icon={faUser} style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <div style={{ fontWeight: '500' }}>
                {user?.name || 'Events Office'}
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#BFCFBB',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.target.style.color = '#BFCFBB')}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Section */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#BFCFBB',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: '#004A3A',
            color: 'white',
            padding: '15px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '30px', fontWeight: '600' }}>
            {navigation.find((item) => item.view === currentView)?.name ||
              (currentView === 'conferences'
                ? 'Conferences'
                : 'Dashboard')}
          </h2>

          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#466856',
              }}
            />
            <input
              type="search"
              placeholder="Search..."
              style={{
                padding: '8px 15px 8px 35px',
                border: '1px solid #EAECF0',
                borderRadius: '8px',
                width: '250px',
                backgroundColor: '#FFFFFF',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2B4B3E')}
              onBlur={(e) => (e.target.style.borderColor = '#EAECF0')}
            />
          </div>
           {/* NOTIFICATION BELL */}
            <div>
              <NotificationBell onClick={() => setOpen(!open)} />
            </div>
          
            {/* DROPDOWN */}
            {open && (
              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  right: "30px",
                  background: "white",
                  color: "black",
                  width: "300px",
                  borderRadius: "8px",
                  padding: "15px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  zIndex: 999,
                }}
              >
                <NotificationList />
              </div>
            )}
        </header>

        {/* Main Content Area */}
        <main style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
          {currentView === 'conferences' ? (
            <ConferenceManagement />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
