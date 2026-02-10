import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import NotificationBell from "./NotificationBell";
import NotificationList from "./NotificationList";
import logo from '../logo.png';
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EOradius,
  EOtransitions,
} from "../styles/EOdesignSystem";

export default function UnifiedDashboardLayout({
  user,
  onLogout,
  navigation = [],
  currentView,
  onViewChange,
  children,
  title = "Dashboard",
  headerActions,
}) {
  const [open, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className="bg-blue-50 p-6 text-[#103A57] flex flex-col shadow-md border-r transition-all duration-300 ease-in-out"
        style={{ width: sidebarExpanded ? "300px" : "160px" }}
      >
        {/* Logo */}
        <div className="mb-10 px-3 overflow-hidden flex flex-col items-center">
          {sidebarExpanded ? (
            <div className="flex flex-col items-center w-full">
              <div className="bg-gradient-to-br from-[#D7E5E0] to-[#B4D4C8] p-3 rounded-2xl shadow-lg mb-3">
                <img 
                  src={logo}
                  alt="BRAINS704 Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-[#2D5F4F] text-center">
                BRAINS704
              </h1>
              <div className="h-1 w-12 bg-[#3A6F5F] rounded-md mt-2" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-br from-[#D7E5E0] to-[#B4D4C8] p-2 rounded-xl shadow-md">
                <img 
                  src={logo}
                  alt="BRAINS704 Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          {navigation.map((item) => {
            const isActive = currentView === item.view;
            const isHovered = hoveredItem === item.view;
            const activeColor = item.color || "#2D5F4F";

            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                onMouseEnter={() => setHoveredItem(item.view)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 py-3 px-4 mb-2 rounded-xl text-left transition-all duration-200 border ${
                  isActive
                    ? `border-[${activeColor}] bg-[#F0F4F5]`
                    : isHovered
                    ? "bg-gray-100 border-gray-200"
                    : "border-transparent"
                }`}
                style={{ color: isActive ? activeColor : "#103A57", minHeight: "48px" }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    color: isActive ? activeColor : isHovered ? "#3A6F5F" : "#103A57",
                    width: "24px",
                    height: "24px",
                    marginLeft: sidebarExpanded ? "0" : "22px"
                  }}
                >
                  {item.icon && React.isValidElement(item.icon) ? (
                    React.cloneElement(item.icon, { 
                      style: { width: "20px", height: "20px" } 
                    })
                  ) : (
                    <div style={{ width: "20px", height: "20px" }} />
                  )}
                </div>
                {sidebarExpanded && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="pt-5 border-t">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-[#2D5F4F] w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-md"
              style={{
                marginLeft: sidebarExpanded ? "0" : "12px"
              }}>
                <FontAwesomeIcon icon={faUser} />
              </div>
              {sidebarExpanded && (
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold text-[#103A57] text-sm truncate">
                    {user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || user?.companyName|| "User")}
                  </div>
                  <div className="text-xs text-gray-600 font-medium capitalize">
                    {user?.role || user?.userType || "User"}
                  </div>
                </div>
              )}
            </div>
            
            {sidebarExpanded && (
              <button
                onClick={onLogout}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#B91C1C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#DC2626";
                }}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-white flex flex-col">
        <header className="bg-white px-8 py-5 flex justify-between items-center shadow-sm border-b relative">
          <div>
            {/* <h2 className="text-2xl font-bold text-[#2D5F4F]">
              {navigation.find((i) => i.view === currentView)?.name || title}
            </h2> */}
            <p className="text-sm text-gray-600 font-medium">
              
            </p>
          </div>

          <div className="flex items-center gap-3">{headerActions}</div>

          <NotificationBell onClick={() => setOpen(!open)} />

          {open && (
            <div className="absolute top-20 right-8 bg-white text-[#103A57] w-80 rounded-xl p-5 shadow-xl border z-50">
              <NotificationList />
            </div>
          )}
        </header>

        <main className="p-8 overflow-y-auto flex-1 bg-blue-50">{children}</main>
      </div>
    </div>
  );
}