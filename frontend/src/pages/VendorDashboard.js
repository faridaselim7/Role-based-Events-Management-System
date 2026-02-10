import React, { useState, useEffect } from "react";
import {Store,FileText,Plus,RefreshCw,Calendar,Clock,MapPin,User,CheckCircle,Upload,Download,QrCode, X, Package, Users, Eye} from "lucide-react";
import UnifiedDashboardLayout from "../components/UnifiedDashboardLayout";
import BoothApplicationForm from "../components/BoothApplicationForm";
import ApplyForm from "../components/ApplyForm";
import Button from "../components/Button";
import useNotifications from "../stores/notifications";
import VendorPaymentModal from "./VendorPaymentModal";

import VendorLostAndFound from "./VendorLostAndFound"; 
import { Trash2, Search } from "lucide-react";
import {
  CardSkeleton,
  NoBazaarsState,
  NoApplicationsState,
  NoDocumentsState,
  NoVisitorsState,
  EmptyState
} from '../components/LoadingEmptyStates';
import BazaarList from "../components/BazaarList";           // ← ADD THIS
import ApplicationsList from "../components/ApplicationsList"; // ← ADD THIS
// ——— BEAUTIFUL ATTENDEES CHIPS (exact same as ApplicationsList.jsx) ———
const AttendeesChips = ({ attendees = [] }) => {
  if (!attendees || attendees.length === 0) return null;

  const COLORS = [
    "#366B2B", "#103A57", "#307B8E", "#5E929F",
    "#AAC9BA", "#E1EABB", "#B1AE77", "#305165"
  ];

  const visible = attendees.slice(0, 6);
  const extra = attendees.length - visible.length;

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {visible.map((person, i) => {
        const bg = COLORS[i % COLORS.length];
        const initials = person.name
          .split(" ")
          .map(n => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={i}
            className="group flex items-center gap-3 px-5 py-3 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300 cursor-default"
            style={{ backgroundColor: bg }}
          >
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-xs font-extrabold backdrop-blur-sm">
              {initials}
            </div>
            <span className="tracking-wider">
              {person.name.split(" ")[0]}
            </span>
          </div>
        );
      })}
      {extra > 0 && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 text-gray-700 font-bold text-sm shadow-lg">
          +{extra}
        </div>
      )}
    </div>
  );
};

export default function VendorEventDashboard({ user, onLogout }) {
  /* ------------------------------------------------------------------ *
   *  State
   * ------------------------------------------------------------------ */
  const [currentView, setCurrentView] = useState("upcoming");
  const [upcomingBazaars, setUpcomingBazaars] = useState([]);
  const [applications, setApplications] = useState({
    bazaarApplications: [],
    boothApplications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBazaarModal, setShowBazaarModal] = useState(false);
  const [showBoothModal, setShowBoothModal] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  // const currentUser = user || JSON.parse(localStorage.getItem("user"));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedApplication, setSelectedApplication] = useState(null);
const [selectedApplicationType, setSelectedApplicationType] = useState(null);

  // ---------- Document Upload ----------
  const [vendorDocuments, setVendorDocuments] = useState({
    taxCard: null,
    logo: null,
  });
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [bazaarStatusFilter, setBazaarStatusFilter] = useState('Accepted');
  const [boothStatusFilter, setBoothStatusFilter] = useState('Accepted');
  const { addNotification } = useNotifications();
  const [viewingDocument, setViewingDocument] = useState(null);
  // ---------- Loyalty ----------
  const [loyaltyStatus, setLoyaltyStatus] = useState({ isEnrolled: false });
  const [showLoyaltyForm, setShowLoyaltyForm] = useState(false);

  // ---------- QR Code System ----------
  const [registeredVisitors, setRegisteredVisitors] = useState([]);

// Get current user from props or localStorage
let currentUser = user;
if (!currentUser) {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      currentUser = JSON.parse(userStr);
    } catch (e) {
      console.error("Failed to parse user from localStorage:", e);
    }
  }
}

// Extract vendorId with better fallback logic
const storedVendorId = localStorage.getItem("vendorId");
let vendorId = storedVendorId;

if (!vendorId && currentUser) {
  // Try all possible ID fields
  vendorId = currentUser._id || currentUser.id;
  
  console.log('🔍 Extracted vendorId from currentUser:', vendorId);
  
  // If we found an ID, save it to localStorage for next time
  if (vendorId) {
    localStorage.setItem("vendorId", vendorId);
  }
}

console.log('🔍 Final vendorId:', vendorId);
console.log('🔍 currentUser object:', currentUser);

const API_BASE = "http://localhost:5001/api/vendors";

  /* ------------------------------------------------------------------ *
   *  Effects
   * ------------------------------------------------------------------ */
  useEffect(() => {
    fetchUpcomingBazaars();
    fetchApplications();
    fetchVendorDocuments();
    fetchLoyaltyStatus();
    fetchRegisteredVisitors();
  }, []);

  /* ------------------------------------------------------------------ *
   *  API Calls
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/notifications");
        const data = await res.json();
        data.forEach((notif) => addNotification(notif));
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUpcomingBazaars = async () => {
    try {
      setLoading(true);
      if (!vendorId) {
        const msg = "Vendor identifier missing. Please log in again.";
        console.error(msg);
        setError(msg);
        return;
      }

      const res = await fetch(`${API_BASE}/bazaars/${vendorId}`);
      if (!res.ok) {
        let errMsg = `Failed to fetch bazaars (status ${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) errMsg = `Failed to fetch bazaars: ${body.message}`;
          else if (body?.error) errMsg = `Failed to fetch bazaars: ${body.error}`;
        } catch (e) {
          console.warn('Could not parse error body from /bazaars:', e);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setUpcomingBazaars(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications/${vendorId}`);
      if (!res.ok) throw new Error("Failed to fetch applications");
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error(err);
    }
  };

// Replace your handleDocumentUpload function with this fixed version:

// ============================================================================
// FIXED DOCUMENT UPLOAD FUNCTIONS
// ============================================================================

const handleDocumentUpload = async (type, file) => {
  setUploadingDoc(type);
  const form = new FormData();
  form.append("file", file);
  form.append("documentType", type);
  
  try {
    const token = localStorage.getItem("token");
    
    // ✅ FIX: Make sure token exists
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }
    
    const res = await fetch(`http://localhost:5001/api/vendor-documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Upload failed");
    }
    
    const data = await res.json();
    
    // ✅ FIX: Update to match backend response structure
    setVendorDocuments((prev) => ({ 
      ...prev, 
      [type]: data.url || data.uploaded?.filePath 
    }));
    
    alert(`✅ ${type === 'taxCard' ? 'Tax Card' : 'Logo'} uploaded successfully!`);
  } catch (err) {
    alert(`❌ Upload failed: ${err.message}`);
    console.error('Upload error:', err);
  } finally {
    setUploadingDoc(null);
  }
};

const fetchVendorDocuments = async () => {
  try {
    const token = localStorage.getItem("token");
    
    // ✅ FIX: Check token exists
    if (!token) {
      console.error("No auth token found");
      return;
    }
    
    // ✅ FIX: Remove double slash in URL
    const res = await fetch(`http://localhost:5001/api/vendor-documents/documents`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // ✅ FIX: Backend now returns direct URLs
      setVendorDocuments({
        taxCard: data.taxCard || null,
        logo: data.logo || null,
      });
    }
  } catch (err) {
    console.error('Error fetching documents:', err);
  }
};
  const fetchLoyaltyStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/vendors/loyalty/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyStatus(data.loyaltyProgram || { isEnrolled: false });
      }
    } catch (err) {
      console.error("Failed to fetch loyalty status:", err);
    }
  };

  const fetchRegisteredVisitors = async () => {
    try {
      const res = await fetch(`${API_BASE}/visitors/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setRegisteredVisitors(data);
      }
    } catch (err) {
      console.error("Failed to fetch registered visitors:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:5001/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Update localStorage and currentUser state
        localStorage.setItem("user", JSON.stringify(data.user));
        // Force re-render by updating state (if needed)
        // Since currentUser is derived from localStorage, this should work
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  };
  const handleCancelApplication = async (applicationId, applicationType) => {
  if (!window.confirm("⚠️ Are you sure you want to cancel this application? This action cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch(`http://localhost:5001/api/vendors/applications/${applicationId}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to cancel application");
    }

    alert("✅ Application cancelled successfully");
     await Promise.all([
      fetchApplications(),
      fetchUpcomingBazaars() // Add this line!
    ]);
  } catch (err) {
    alert("❌ " + err.message);
  }
};

  // const handleRefresh = async () => {
  //   setRefreshing(true);
  //   await Promise.all([
  //     fetchUpcomingBazaars(),
  //     fetchApplications(),
  //     fetchVendorDocuments(),
  //     fetchLoyaltyStatus(),
  //     fetchRegisteredVisitors(),
  //   ]);
  //   setRefreshing(false);
  // };

  /* ------------------------------------------------------------------ *
   *  Helpers
   * ------------------------------------------------------------------ */
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

  const formatTime = (start, end) => {
    const s = new Date(start).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const e = new Date(end).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${s} - ${e}`;
  };

  const handleApplyForBazaar = (bazaar) => {
    setSelectedBazaar(bazaar);
    setShowBazaarModal(true);
  };


  const navigation = [
    { name: "Upcoming Bazaars", icon: <Store className="w-4 h-4" />, view: "upcoming" },
    { name: "My Applications", icon: <FileText className="w-4 h-4" />, view: "applications" },
    { name: "Documents", icon: <FileText className="w-4 h-4" />, view: "documents" },
    { name: "Lost & Found", icon: <Search className="w-4 h-4" />, view: "lostfound" },
    { name: "Loyalty Program", icon: <User className="w-4 h-4" />, view: "loyalty" },
  ];

  /* ------------------------------------------------------------------ *
   *  Loyalty Handlers
   * ------------------------------------------------------------------ */
  const handleLoyaltyApply = async (formData) => {
    try {
      const res = await fetch(`${API_BASE}/loyalty/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, ...formData }),
      });
      if (!res.ok) throw new Error("Application failed");
      setShowLoyaltyForm(false);
      await fetchLoyaltyStatus();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLoyaltyCancel = async () => {
    if (!window.confirm("⚠️ Are you sure you want to cancel your participation in the loyalty program? This action cannot be undone.")) {
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/vendors/loyalty/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "Vendor requested cancellation" }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.message || "Cancellation failed");
      }
  
      alert("✅ Successfully cancelled loyalty program participation");
      await fetchLoyaltyStatus();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  /* ------------------------------------------------------------------ *
   *  QR Code System Handlers
   * ------------------------------------------------------------------ */
  const generateQRCodeURL = (qrCode) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;
  };

  const downloadQRCode = (visitor) => {
    const link = document.createElement('a');
    link.href = generateQRCodeURL(visitor.qrCode);
    link.download = `QR-${visitor.name.replace(/\s/g, '-')}-${visitor.qrCode}.png`;
    link.click();
  };

  const handlePrintQRCode = (visitor) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${visitor.name}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { margin: 20px 0; }
            .visitor-info { margin: 10px 0; }
            .bazaar-name { font-size: 18px; font-weight: bold; }
            .visitor-name { font-size: 16px; }
            .qr-code { margin: 20px auto; }
          </style>
        </head>
        <body>
          <div class="bazaar-name">${visitor.bazaarName}</div>
          <div class="visitor-name">${visitor.name}</div>
          <div class="qr-container">
            <img src="${generateQRCodeURL(visitor.qrCode)}" alt="QR Code" class="qr-code" />
          </div>
          <div class="visitor-info">
            <div>QR Code: ${visitor.qrCode}</div>
            <div>Registered: ${formatDate(visitor.registeredDate)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  /* ------------------------------------------------------------------ *
   *  Render Helpers
   * ------------------------------------------------------------------ */
  // ============================================================================
// UPDATED: renderUpcomingBazaars() - Teal Color Palette
// ============================================================================

const renderUpcomingBazaars = () => {
  const colors = {
    primary: "#307B8E",      // Teal Blue
    secondary: "#A9D3C5",    // Light Teal
    tertiary: "#CEE5D6",     // Soft Mint
    accent: "#103A57",       // Deep Prussian
    light: "#F8FAFB",        // Light background
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-between items-center mb-6"></div>
        <CardSkeleton count={3} />
      </>
    );
  }

  return (
    <>
      <style>{`
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

        .bazaar-card {
          animation: slideInUp 0.4s ease-out;
          transition: all 0.3s ease;
        }

        .bazaar-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px ${colors.primary}20;
          border-color: ${colors.secondary};
        }

        .add-to-calendar-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .add-to-calendar-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px ${colors.primary}40;
        }
      `}</style>

      {/* Header Row - Apply for Booth and Wallet */}
      <div className="flex justify-between items-center mb-4">
        {/* Apply for Booth Button - Left */}
        <button
          onClick={() => setShowBoothModal(true)}
          className="add-to-calendar-btn flex items-center justify-center gap-3 px-10 py-4 text-white rounded-xl font-bold text-base shadow-xl"
          style={{
            background: colors.primary,
            boxShadow: `0 6px 20px ${colors.primary}40`,
            minWidth: '220px',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#276f78';
            e.currentTarget.style.boxShadow = `0 8px 28px ${colors.primary}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}40`;
          }}
        >
          Apply for Booth
        </button>

        {/* Wallet Display - Right */}
        <div 
          className="flex items-center gap-3 px-6 py-3 rounded-xl"
          style={{
            background: colors.light,
            border: `2px solid ${colors.tertiary}`
          }}
        >
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: colors.tertiary }}
          >
            <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs font-medium mb-0.5" style={{ color: '#6B7280' }}>Wallet Balance</div>
            <div className="text-xl font-bold" style={{ lineHeight: '1.2', color: colors.accent }}>
              ${(() => {
                console.log('Current User:', currentUser);
                console.log('Wallet value:', currentUser?.wallet);
                console.log('Wallet balance:', currentUser?.walletBalance);
                const walletAmount = currentUser?.wallet || currentUser?.walletBalance || 0;
                return typeof walletAmount === 'number' ? walletAmount.toFixed(2) : '0.00';
              })()}
            </div>
          </div>
        </div>
      </div>

      {upcomingBazaars.length === 0 ? (
        <NoBazaarsState />
      ) : (
        <div className="space-y-6">
          {upcomingBazaars.map((bazaar, index) => {
            const startDate = new Date(bazaar.startDateTime);
            const endDate = new Date(bazaar.endDateTime);
            const isToday = startDate.toDateString() === new Date().toDateString();
            
            // Format date range
            const dateRange = startDate.getDate() === endDate.getDate()
              ? startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()
              : `${startDate.getDate()} - ${endDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}`;

            return (
              <div
                key={bazaar._id}
                className="bazaar-card bg-white rounded-2xl shadow-lg transition-all duration-300"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  background: 'white',
                  border: `2px solid ${colors.tertiary}`
                }}
              >
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    {/* Date/Time Box */}
                    <div 
                      className="flex-shrink-0 text-center p-6 rounded-2xl"
                      style={{
                        background: colors.light,
                        minWidth: '140px',
                        border: `2px solid ${colors.tertiary}`,
                        boxShadow: `0 4px 12px ${colors.primary}10`
                      }}
                    >
                      <div 
                        className="text-xs font-bold mb-2 tracking-wider"
                        style={{ color: '#6B7280' }}
                      >
                        {isToday ? 'TODAY' : dateRange}
                      </div>
                      <div 
                        className="text-5xl font-bold mb-1"
                        style={{ color: colors.accent }}
                      >
                        {startDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2" style={{ color: colors.accent }}>
                            {bazaar.name}
                          </h3>
                          <p className="leading-relaxed" style={{ color: '#6B7280' }}>
                            {bazaar.description}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: colors.tertiary }}
                          >
                            <Clock className="w-5 h-5" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Duration</div>
                            <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                              {formatTime(bazaar.startDateTime, bazaar.endDateTime)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: colors.tertiary }}
                          >
                            <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Location</div>
                            <div className="text-sm font-semibold" style={{ color: colors.accent }}>{bazaar.location}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: colors.tertiary }}
                          >
                            <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Deadline</div>
                            <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                              {formatDate(bazaar.registrationDeadline)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleApplyForBazaar(bazaar)}
                          className="add-to-calendar-btn flex items-center gap-2 px-8 py-3.5 text-white rounded-xl font-semibold text-sm shadow-lg"
                          style={{
                            background: colors.primary,
                            boxShadow: `0 4px 14px ${colors.primary}40`,
                            border: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#276f78';
                            e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}50`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.primary;
                            e.currentTarget.style.boxShadow = `0 4px 14px ${colors.primary}40`;
                          }}
                        >
                          <Plus className="w-5 h-5" />
                          Apply to Bazaar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================================================
// UPDATED: renderApplications() - Teal Palette + Original Status Badges
// ============================================================================

const renderApplications = () => {
  const colors = {
    primary: "#307B8E",      // Teal Blue
    secondary: "#A9D3C5",    // Light Teal
    tertiary: "#CEE5D6",     // Soft Mint
    accent: "#103A57",       // Deep Prussian
    light: "#F8FAFB",        // Light background
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-between items-center mb-6"></div>
        <CardSkeleton count={3} />
      </>
    );
  }

  // Original status badge style
  const statusBadge = (status) => {
    const statusStyles = {
      Accepted: {
        bg: "#D1FAE5",
        color: "#065F46",
        border: "#10B981",
      },
      Rejected: {
        bg: "#FEE2E2",
        color: "#991B1B",
        border: "#DC2626",
      },
      Pending: {
        bg: "#FEF3C7",
        color: "#92400E",
        border: "#F59E0B",
      },
    };

    const style = statusStyles[status] || statusStyles.Pending;

    return (
      <div 
        className="text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1"
        style={{
          background: style.bg,
          color: style.color,
          border: `2px solid ${style.border}`
        }}
      >
        {status === "Accepted" && "✓"}
        {status === "Rejected" && "✕"}
        {status === "Pending" && "⏳"}
        {" " + status}
      </div>
    );
  };

  return (
    <>
      <style>{`
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

        .application-card {
          animation: slideInUp 0.4s ease-out;
          transition: all 0.3s ease;
        }

        .application-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px ${colors.primary}20;
          border-color: ${colors.secondary};
        }

        .action-btn-app {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-btn-app:hover {
          transform: scale(1.05);
        }
      `}</style>

      {/* Header Row - Wallet and Bazaar Applications Title */}
      <div className="flex justify-between items-center mb-3">
        {/* Bazaar Applications Title */}
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: colors.primary,
              boxShadow: `0 4px 12px ${colors.primary}30`
            }}
          >
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: colors.accent }}>Bazaar Applications</h3>
          </div>
        </div>

        {/* Wallet Display */}
        <div 
          className="flex items-center gap-3 px-6 py-3 rounded-xl"
          style={{
            background: colors.light,
            border: `2px solid ${colors.tertiary}`
          }}
        >
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: colors.tertiary }}
          >
            <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs font-medium mb-0.5" style={{ color: '#6B7280' }}>Wallet Balance</div>
            <div className="text-xl font-bold" style={{ lineHeight: '1.2', color: colors.accent }}>
              ${(() => {
                console.log('Applications - Current User:', currentUser);
                console.log('Applications - Wallet value:', currentUser?.wallet);
                console.log('Applications - Wallet balance:', currentUser?.walletBalance);
                const walletAmount = currentUser?.wallet || currentUser?.walletBalance || 0;
                return typeof walletAmount === 'number' ? walletAmount.toFixed(2) : '0.00';
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Bazaar Applications */}
        <div>
          {applications.bazaarApplications.length === 0 ? (
            <div 
              className="rounded-2xl p-12 text-center"
              style={{
                background: colors.light,
                border: `2px dashed ${colors.tertiary}`
              }}
            >
              <Store className="w-16 h-16 mx-auto mb-4" style={{ color: colors.secondary }} />
              <h4 className="text-xl font-bold mb-2" style={{ color: colors.accent }}>No Bazaar Applications</h4>
              <p style={{ color: '#6B7280' }}>You haven't applied to any bazaars yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.bazaarApplications.map((app, index) => {
                const appliedDate = new Date(app.appliedAt || app.createdAt);
                const isToday = appliedDate.toDateString() === new Date().toDateString();
                
                const dateRange = appliedDate.toLocaleDateString('en-US', { 
                  day: 'numeric', 
                  month: 'short' 
                }).toUpperCase();

                return (
                  <div
                    key={app._id}
                    className="application-card bg-white rounded-2xl shadow-lg transition-all duration-300"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      background: 'white',
                      border: `2px solid ${colors.tertiary}`
                    }}
                  >
                    <div className="p-8">
                      <div className="flex items-start gap-6">
                        {/* Date Box */}
                        <div 
                          className="flex-shrink-0 text-center p-6 rounded-2xl relative"
                          style={{
                            background: colors.light,
                            minWidth: '140px',
                            border: `2px solid ${colors.tertiary}`,
                            boxShadow: `0 4px 12px ${colors.primary}10`
                          }}
                        >
                          <div 
                            className="text-xs font-bold mb-2 tracking-wider"
                            style={{ color: '#6B7280' }}
                          >
                            {isToday ? 'TODAY' : 'APPLIED'}
                          </div>
                          <div 
                            className="text-3xl font-bold mb-3"
                            style={{ color: colors.accent }}
                          >
                            {dateRange}
                          </div>
                          
                          {/* Status Badge */}
                          {statusBadge(app.status)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold mb-2" style={{ color: colors.accent }}>
                                {app.bazaarId?.name || "Bazaar Event"}
                              </h3>
                              <p className="leading-relaxed" style={{ color: '#6B7280' }}>
                                {app.bazaarId?.description || "Your application to participate in this bazaar"}
                              </p>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: colors.tertiary }}
                              >
                                <Package className="w-5 h-5" style={{ color: colors.primary }} />
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Booth Size</div>
                                <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                                  {app.boothSize || "Standard"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: colors.tertiary }}
                              >
                                <Users className="w-5 h-5" style={{ color: colors.primary }} />
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Attendees</div>
                                <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                                  {app.attendees?.length || 0} registered
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: colors.tertiary }}
                              >
                                <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Event Date</div>
                                <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                                  {app.bazaarId?.startDateTime ? new Date(app.bazaarId.startDateTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Attendee Chips */}
                          {app.attendees && app.attendees.length > 0 && (
                            <div className="mb-6">
                              <div className="text-xs font-medium mb-3" style={{ color: '#6B7280' }}>Your Team</div>
                              <div className="flex flex-wrap gap-2">
                                {app.attendees.map((attendee, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                                    style={{
                                      background: colors.tertiary,
                                      border: `1px solid ${colors.secondary}`
                                    }}
                                  >
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{
                                        background: colors.primary
                                      }}
                                    >
                                      {attendee.name ? attendee.name.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: colors.accent }}>
                                      {attendee.name || 'Attendee'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ID Upload Section */}
                          {app.nationalId && (
                            <div 
                              className="mb-6 p-4 rounded-xl"
                              style={{
                                background: colors.tertiary,
                                border: `2px solid ${colors.primary}`
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" style={{ color: colors.primary }} />
                                <div className="flex-1">
                                  <div className="text-sm font-bold" style={{ color: colors.accent }}>National ID Uploaded</div>
                                  <div className="text-xs" style={{ color: '#6B7280' }}>Document verified and on file</div>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                            </div>
                          )}

                          {/* Payment Section for Accepted */}
                          {app.status === 'Accepted' && !app.paid && (
                            <div 
                              className="mb-6 p-4 rounded-xl"
                              style={{
                                background: colors.light,
                                border: `2px solid ${colors.tertiary}`
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-medium mb-1" style={{ color: '#6B7280' }}>
                                    Participation Fee
                                  </div>
                                  <div className="text-2xl font-bold" style={{ color: colors.accent }}>
                                    ${(app.amountDue || 0).toFixed(2)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setSelectedApplicationType('bazaar');
                                    setShowPaymentModal(true);
                                  }}
                                  className="action-btn-app px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
                                  style={{
                                    background: colors.primary,
                                    border: 'none'
                                  }}
                                >
                                  Pay Now
                                </button>
                              </div>
                            </div>
                          )}

                          {app.paid && (
                            <div 
                              className="mb-6 p-4 rounded-xl flex items-center gap-3"
                              style={{
                                background: '#D1FAE5',
                                border: '2px solid #10B981'
                              }}
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                              <div>
                                <div className="text-sm font-bold" style={{ color: colors.accent }}>Payment Complete</div>
                                <div className="text-xs" style={{ color: '#6B7280' }}>You're all set for the bazaar!</div>
                              </div>
                            </div>
                          )}
                          {app.status === 'Accepted' && app.attendees?.length > 0 && (
  <div className="mt-4">
    <button
      onClick={async () => {
        if (window.confirm("Send all visitor QR codes to your email?")) {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5001/api/vendors/qr/send-to-vendor/${app._id}`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            const data = await res.json();
            if (res.ok) {
              alert(`QR codes sent to your email! (${data.count} visitors)`);
            } else {
              alert("Failed: " + data.message);
            }
          } catch (err) {
            alert("Error sending QR codes");
          }
        }
      }}
      className="flex items-center gap-2 px-6 py-3 bg-[#307B8E] text-white rounded-xl font-bold hover:bg-[#276f78] transition-all shadow-lg"
    >
      <QrCode className="w-5 h-5" />
      Send All QR Codes to My Email
    </button>
  </div>
)}
{app.status === 'Accepted' && app.attendees?.length > 0 && (
<div className="mt-4">
<button
  onClick={async () => {
    if (window.confirm("Send quiz links to all attendees?")) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5001/api/vendors/qr/${app._id}/send-qr-codes`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const data = await res.json();
        if (res.ok) {
          alert(`Quiz emails sent to attendees! (${data.successCount} sent)`);
        } else {
          alert("Failed: " + data.message);
        }
      } catch (err) {
        alert("Error sending attendee quiz links");
      }
    }
  }}
   className="flex items-center gap-2 px-6 py-3 bg-[#307B8E] text-white rounded-xl font-bold hover:bg-[#276f78] transition-all shadow-lg"
    >
  Send Quiz Links to Attendees
</button>
</div>
)}


                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {!app.paid && app.status !== 'Rejected' && (
                              <div className="mt-4">
                              <button
                                onClick={() => handleCancelApplication(app._id, 'bazaar')}
                                className="action-btn-app flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                                style={{
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  border: '2px solid #FCA5A5'
                                }}
                              >
                                <X className="w-5 h-5" />
                                Cancel Application
                              </button>
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booth Applications */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: colors.primary,
                boxShadow: `0 4px 12px ${colors.primary}30`
              }}
            >
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: colors.accent }}>Booth Applications</h3>
            </div>
          </div>

          {applications.boothApplications.length === 0 ? (
            <div 
              className="rounded-2xl p-12 text-center"
              style={{
                background: colors.light,
                border: `2px dashed ${colors.tertiary}`
              }}
            >
              <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: colors.secondary }} />
              <h4 className="text-xl font-bold mb-2" style={{ color: colors.accent }}>No Booth Applications</h4>
              <p style={{ color: '#6B7280' }}>You haven't applied for any booths yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.boothApplications.map((app, index) => {
                const appliedDate = new Date(app.appliedAt || app.createdAt);
                const isToday = appliedDate.toDateString() === new Date().toDateString();
                
                const dateRange = appliedDate.toLocaleDateString('en-US', { 
                  day: 'numeric', 
                  month: 'short' 
                }).toUpperCase();

                return (
                  <div
                    key={app._id}
                    className="application-card bg-white rounded-2xl shadow-lg transition-all duration-300"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      background: 'white',
                      border: `2px solid ${colors.tertiary}`
                    }}
                  >
                    <div className="p-8">
                      <div className="flex items-start gap-6">
                        {/* Date Box */}
                        <div 
                          className="flex-shrink-0 text-center p-6 rounded-2xl relative"
                          style={{
                            background: colors.light,
                            minWidth: '140px',
                            border: `2px solid ${colors.tertiary}`,
                            boxShadow: `0 4px 12px ${colors.primary}10`
                          }}
                        >
                          <div 
                            className="text-xs font-bold mb-2 tracking-wider"
                            style={{ color: '#6B7280' }}
                          >
                            {isToday ? 'TODAY' : 'APPLIED'}
                          </div>
                          <div 
                            className="text-3xl font-bold mb-3"
                            style={{ color: colors.accent }}
                          >
                            {dateRange}
                          </div>
                          
                          {/* Status Badge */}
                          {statusBadge(app.status)}
                        </div>

                        {/* Content - Same structure as Bazaar Applications */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold mb-2" style={{ color: colors.accent }}>
                                {app.bazaarId?.name || "Booth Application"}
                              </h3>
                              <p className="leading-relaxed" style={{ color: '#6B7280' }}>
                                {app.bazaarId?.description || "Your application for booth space"}
                              </p>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: colors.tertiary }}
                              >
                                <Package className="w-5 h-5" style={{ color: colors.primary }} />
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Booth Size</div>
                                <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                                  {app.boothSize || "Standard"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: colors.tertiary }}
                              >
                                <Users className="w-5 h-5" style={{ color: colors.primary }} />
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Attendees</div>
                                <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                                  {app.attendees?.length || 0} registered
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: colors.tertiary }}
                              >
                                <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Event Date</div>
                                <div className="text-sm font-semibold" style={{ color: colors.accent }}>
                                  {(() => {
                                    const dateValue = app.bazaarId?.startDateTime || app.eventDate || app.createdAt;
                                    return dateValue ? new Date(dateValue).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Attendee Chips */}
                          {app.attendees && app.attendees.length > 0 && (
                            <div className="mb-6">
                              <div className="text-xs font-medium mb-3" style={{ color: '#6B7280' }}>Your Team</div>
                              <div className="flex flex-wrap gap-2">
                                {app.attendees.map((attendee, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                                    style={{
                                      background: colors.tertiary,
                                      border: `1px solid ${colors.secondary}`
                                    }}
                                  >
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{
                                        background: colors.primary
                                      }}
                                    >
                                      {attendee.name ? attendee.name.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: colors.accent }}>
                                      {attendee.name || 'Attendee'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ID Upload Section */}
                          {app.nationalId && (
                            <div 
                              className="mb-6 p-4 rounded-xl"
                              style={{
                                background: colors.tertiary,
                                border: `2px solid ${colors.primary}`
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" style={{ color: colors.primary }} />
                                <div className="flex-1">
                                  <div className="text-sm font-bold" style={{ color: colors.accent }}>National ID Uploaded</div>
                                  <div className="text-xs" style={{ color: '#6B7280' }}>Document verified and on file</div>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                            </div>
                          )}

                          {/* Payment Section for Accepted */}
                          {app.status === 'Accepted' && app.attendees?.length > 0 && (
  <div className="mt-4">
    <button
      onClick={async () => {
        if (window.confirm("Send all visitor QR codes to your email?")) {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5001/api/vendors/qr/send-to-vendor/${app._id}`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            const data = await res.json();
            if (res.ok) {
              alert(`QR codes sent to your email! (${data.count} visitors)`);
            } else {
              alert("Failed: " + data.message);
            }
          } catch (err) {
            alert("Error sending QR codes");
          }
        }
      }}
      className="flex items-center gap-2 px-6 py-3 bg-[#307B8E] text-white rounded-xl font-bold hover:bg-[#276f78] transition-all shadow-lg"
    >
      <QrCode className="w-5 h-5" />
      Send All QR Codes to My Email
    </button>
  </div>
)}
{app.status === 'Accepted' && app.attendees?.length > 0 && (
<div className="mt-4">
<button
  onClick={async () => {
    if (window.confirm("Send quiz links to all booth attendees?")) {
      try {
       const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5001/api/vendors/qr/${app._id}/send-q-codes`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const data = await res.json();
        if (res.ok) {
          alert(`Quiz links sent to ${data.results.length} attendees`);
        } else {
          alert("Failed: " + data.message);
        }
      } catch (err) {
        alert("Error sending attendee quiz links.");
      }
    }
  }}
   className="flex items-center gap-2 px-6 py-3 bg-[#307B8E] text-white rounded-xl font-bold hover:bg-[#276f78] transition-all shadow-lg"
    >
  Send Quiz links to Attendees
</button>
</div>
)}

                          {app.paid && (
                            <div 
                              className="mb-6 p-4 rounded-xl flex items-center gap-3"
                              style={{
                                background: '#D1FAE5',
                                border: '2px solid #10B981'
                              }}
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                              <div>
                                <div className="text-sm font-bold" style={{ color: colors.accent }}>Payment Complete</div>
                                <div className="text-xs" style={{ color: '#6B7280' }}>Your booth is reserved!</div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {!app.paid && app.status !== 'Rejected' && (
                              <div className="mt-4">
                              <button
                                onClick={() => handleCancelApplication(app._id, 'booth')}
                                className="action-btn-app flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                                style={{
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  border: '2px solid #FCA5A5'
                                }}
                              >
                                <X className="w-5 h-5" />
                                Cancel Application
                              </button>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ============================================================================
// REPLACE your renderDocuments() function with this version
// Shows documents inline in the same tab
// ============================================================================

const renderDocuments = () => {
  const colors = {
    primary: "#307B8E",
    secondary: "#A9D3C5",
    tertiary: "#CEE5D6",
    accent: "#103A57",
    success: "#10B981",
    light: "#F8FAFB",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold" style={{ color: colors.accent }}>
          Document Management
        </h2>
        <CardSkeleton count={2} />
      </div>
    );
  }

  const isPDF = (url) => url?.toLowerCase().endsWith('.pdf');
  const isImage = (url) => url?.match(/\.(jpg|jpeg|png|gif|svg)$/i);

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .doc-card { animation: slideIn 0.45s ease-out forwards; }
        .doc-card:hover { border-color: ${colors.secondary}; box-shadow: 0 12px 32px ${colors.primary}20; transform: translateY(-2px); }
        .upload-btn, .view-btn { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .upload-btn:hover:not(:disabled), .view-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px ${colors.primary}40; }
      `}</style>

      {/* Header – Tighter */}
      <div className="mb-5">
        <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: colors.accent }}>
          Document Management
        </h2>
        <p className="text-base mt-1" style={{ color: "#4B5563" }}>
          Upload and manage your vendor documents to establish business credibility
        </p>
      </div>

      {/* Full-width, taller cards – no wasted space */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 w-full max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-24 2xl:px-32">        {/* Tax Card */}
        <div
         className="doc-card bg-white rounded-2xl p-12 shadow-xl border-2 transition-all duration-300 w-full"
          style={{ borderColor: colors.tertiary, minHeight: "480px", display: "flex", flexDirection: "column" }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: colors.tertiary }}>
              <FileText className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: colors.accent }}>Tax Card</h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>PDF, JPG, or PNG</p>
            </div>
          </div>

          {/* Uploaded / Empty State – takes remaining space */}
          <div className="flex-1 mb-6 flex items-center justify-center">
            {vendorDocuments.taxCard ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: colors.tertiary }}>
                  <CheckCircle className="w-14 h-14" style={{ color: colors.success }} />
                </div>
                <p className="text-lg font-bold" style={{ color: colors.accent }}>Document Uploaded</p>
                <p className="text-sm" style={{ color: "#6B7280" }}>Ready for verification</p>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-20 h-20 mx-auto mb-4 opacity-40" style={{ color: colors.secondary }} />
                <p className="text-lg" style={{ color: "#6B7280" }}>No tax card uploaded yet</p>
              </div>
            )}
          </div>

          {/* Buttons – always at bottom */}
          <div className="flex gap-3 mt-auto">
            {vendorDocuments.taxCard && (
              <button
                onClick={() => setViewingDocument({ url: vendorDocuments.taxCard, type: 'Tax Card' })}
                className="view-btn flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: colors.primary, boxShadow: `0 6px 16px ${colors.primary}40` }}
              >
                <Eye className="w-5 h-5" /> View
              </button>
            )}
            <label className="flex-1">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleDocumentUpload("taxCard", e.target.files[0])}
                className="hidden"
                disabled={uploadingDoc === "taxCard"}
              />
              <span
                className="upload-btn block py-4 rounded-xl font-bold text-center cursor-pointer"
                style={{
                  background: vendorDocuments.taxCard ? "white" : colors.primary,
                  color: vendorDocuments.taxCard ? colors.primary : "white",
                  border: vendorDocuments.taxCard ? `2px solid ${colors.primary}` : "none",
                  boxShadow: vendorDocuments.taxCard ? "0 4px 12px rgba(0,0,0,0.1)" : `0 6px 16px ${colors.primary}40`,
                }}
              >
                <Upload className="w-5 h-5 inline-block mr-2" />
                {uploadingDoc === "taxCard" ? "Uploading…" : vendorDocuments.taxCard ? "Replace" : "Upload"}
              </span>
            </label>
          </div>
        </div>

        {/* Company Logo – identical layout */}
        <div
          className="doc-card bg-white rounded-2xl p-8 shadow-xl border-2 transition-all duration-300"
          style={{ borderColor: colors.tertiary, minHeight: "480px", display: "flex", flexDirection: "column" }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: colors.tertiary }}>
              <Store className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: colors.accent }}>Company Logo</h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>JPG, PNG, or SVG</p>
            </div>
          </div>

          <div className="flex-1 mb-6 flex items-center justify-center">
            {vendorDocuments.logo ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: colors.tertiary }}>
                  <CheckCircle className="w-14 h-14" style={{ color: colors.success }} />
                </div>
                <p className="text-lg font-bold" style={{ color: colors.accent }}>Logo Uploaded</p>
                <p className="text-sm" style={{ color: "#6B7280" }}>Ready for use</p>
              </div>
            ) : (
              <div className="text-center">
                <Store className="w-20 h-20 mx-auto mb-4 opacity-40" style={{ color: colors.secondary }} />
                <p className="text-lg" style={{ color: "#6B7280" }}>No logo uploaded yet</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-auto">
            {vendorDocuments.logo && (
              <button
                onClick={() => setViewingDocument({ url: vendorDocuments.logo, type: 'Company Logo' })}
                className="view-btn flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: colors.primary, boxShadow: `0 6px 16px ${colors.primary}40` }}
              >
                <Eye className="w-5 h-5" /> View
              </button>
            )}
            <label className="flex-1">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.svg"
                onChange={(e) => e.target.files?.[0] && handleDocumentUpload("logo", e.target.files[0])}
                className="hidden"
                disabled={uploadingDoc === "logo"}
              />
              <span
                className="upload-btn block py-4 rounded-xl font-bold text-center cursor-pointer"
                style={{
                  background: vendorDocuments.logo ? "white" : colors.primary,
                  color: vendorDocuments.logo ? colors.primary : "white",
                  border: vendorDocuments.logo ? `2px solid ${colors.primary}` : "none",
                  boxShadow: vendorDocuments.logo ? "0 4px 12px rgba(0,0,0,0.1)" : `0 6px 16px ${colors.primary}40`,
                }}
              >
                <Upload className="w-5 h-5 inline-block mr-2" />
                {uploadingDoc === "logo" ? "Uploading…" : vendorDocuments.logo ? "Replace" : "Upload"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Slim info banner – no extra top margin */}
      <div className="mt-5 p-5 rounded-2xl" style={{ background: `${colors.primary}08`, border: `2px solid ${colors.tertiary}` }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-lg font-bold" style={{ background: colors.primary }}>i</div>
          <div>
            <p className="font-bold text-lg" style={{ color: colors.accent, marginBottom: "0.25rem" }}>Why upload documents?</p>
            <p className="text-base leading-relaxed" style={{ color: "#374151" }}>
              These documents help establish your company's credibility and legitimacy. They're required for certain applications and help accelerate verification processes.
            </p>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal – unchanged (kept exactly as you had it) */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setViewingDocument(null)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold" style={{ color: colors.accent }}>{viewingDocument.type}</h3>
              <button onClick={() => setViewingDocument(null)} className="w-12 h-12 rounded-xl border flex items-center justify-center hover:bg-gray-100 transition" style={{ borderColor: colors.tertiary }}>
                <X className="w-6 h-6" style={{ color: colors.accent }} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
              {isPDF(viewingDocument.url) ? (
                <iframe src={viewingDocument.url} className="w-full h-full min-h-[600px] rounded-lg border-0" title={viewingDocument.type} />
              ) : isImage(viewingDocument.url) ? (
                <img src={viewingDocument.url} alt={viewingDocument.type} className="max-w-full max-h-full mx-auto rounded-lg shadow-lg" />
              ) : (
                <div className="text-center py-20">
                  <FileText className="w-20 h-20 mx-auto mb-4 opacity-50" style={{ color: colors.secondary }} />
                  <p className="text-xl font-semibold" style={{ color: colors.accent }}>Preview not available</p>
                  <a href={viewingDocument.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mt-2 inline-block">Open in new tab</a>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-white">
              <button onClick={() => setViewingDocument(null)} className="w-full py-4 rounded-xl font-bold text-white" style={{ background: colors.primary }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
  const renderLoyalty = () => {
    const colors = {
      primary: "#366B2B",      
      secondary: "#C7DA91",    
      accent: "#103A67",       
      light: "#E8F0D7",        
      bg: "#F8FBF3",          
      text: "#1F2937",         
    };
  
    return (
      <>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
  
          .loyalty-card {
            animation: fadeIn 0.6s ease-out;
          }
  
          .apply-button {
            transition: all 0.3s ease;
          }
  
          .apply-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(54, 107, 43, 0.3);
          }
  
          .info-badge {
            transition: all 0.3s ease;
          }
  
          .info-badge:hover {
            transform: translateX(3px);
          }
        `}</style>
  
        <div style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              color: colors.accent,
              marginBottom: "0.5rem",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            🎁 GUC Loyalty Program
          </h2>
          <p style={{ color: "#6B7280", fontSize: "1rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            Join our loyalty program to offer exclusive benefits to GUC community members
          </p>
        </div>
  
        {loyaltyStatus.isEnrolled ? (
          <div
            className="loyalty-card"
            style={{
              background: "white",
              borderRadius: "1.5rem",
              border: `3px solid ${colors.light}`,
              padding: "2.5rem",
              boxShadow: "0 10px 30px rgba(16, 58, 103, 0.08)",
            }}
          >
            {/* Active Member Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "16px",
                    background: colors.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 20px rgba(54, 107, 43, 0.2)",
                  }}
                >
                  <CheckCircle style={{ width: "2.25rem", height: "2.25rem", color: "white", strokeWidth: 2.5 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: colors.accent, margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                    Active Member
                  </h3>
                  <p style={{ color: "#6B7280", margin: "0.375rem 0 0 0", fontSize: "0.9375rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                    Offering exclusive benefits to GUC community
                  </p>
                </div>
              </div>
              <button
                onClick={handleLoyaltyCancel}
                className="apply-button"
                style={{
                  padding: "0.875rem 1.5rem",
                  background: "#DC2626",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
                }}
              >
                Cancel Participation
              </button>
            </div>
  
            {/* Program Details Grid */}
            <div
              style={{
                background: colors.bg,
                borderRadius: "1.25rem",
                padding: "2rem",
                marginBottom: "2rem",
                border: `2px solid ${colors.light}`,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
                <div className="info-badge">
                  <p style={{ fontSize: "0.8125rem", color: colors.text, fontWeight: "600", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                    Discount Rate
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
                    <p style={{ fontSize: "2.5rem", fontWeight: "800", color: colors.primary, margin: 0, lineHeight: 1, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                      {loyaltyStatus.discountRate}
                    </p>
                    <span style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.accent, fontFamily: "system-ui, -apple-system, sans-serif" }}>%</span>
                  </div>
                </div>
  
                <div className="info-badge">
                  <p style={{ fontSize: "0.8125rem", color: colors.text, fontWeight: "600", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                    Promo Code
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.625rem 1.25rem",
                      background: colors.secondary,
                      borderRadius: "10px",
                      border: `2px solid ${colors.primary}`,
                    }}
                  >
                    <span style={{ fontSize: "1.25rem", fontWeight: "700", color: colors.accent, fontFamily: "monospace", letterSpacing: "0.1em" }}>
                      {loyaltyStatus.promoCode}
                    </span>
                  </div>
                </div>
  
                <div className="info-badge">
                  <p style={{ fontSize: "0.8125rem", color: colors.text, fontWeight: "600", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                    Loyalty Tier
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.625rem 1.25rem",
                      background: colors.accent,
                      color: "white",
                      borderRadius: "10px",
                    }}
                  >
                    <span style={{ fontSize: "1.125rem" }}>⭐</span>
                    <span style={{ fontSize: "1.0625rem", fontWeight: "700", textTransform: "capitalize", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                      {loyaltyStatus.tier}
                    </span>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Status Info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1.5rem",
                padding: "1.75rem",
                background: "white",
                borderRadius: "1rem",
                border: `2px solid ${colors.light}`,
              }}
            >
              <div>
                <p style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "0.375rem", fontWeight: "600", fontFamily: "system-ui, -apple-system, sans-serif" }}>Enrolled Since</p>
                <p style={{ fontWeight: "600", color: colors.text, margin: 0, fontSize: "0.9375rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  {formatDate(loyaltyStatus.enrolledAt)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "0.375rem", fontWeight: "600", fontFamily: "system-ui, -apple-system, sans-serif" }}>Status</p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.375rem 1rem",
                    background: colors.light,
                    color: colors.primary,
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  <CheckCircle style={{ width: "1rem", height: "1rem" }} />
                  Active
                </div>
              </div>
              <div>
                <p style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "0.375rem", fontWeight: "600", fontFamily: "system-ui, -apple-system, sans-serif" }}>Loyalty Points</p>
                <p style={{ fontWeight: "600", color: colors.text, margin: 0, fontSize: "0.9375rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  {loyaltyStatus.points || 0} points
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="loyalty-card"
            style={{
              background: colors.bg,
              borderRadius: "1.5rem",
              padding: "3.5rem 2.5rem",
              textAlign: "center",
              border: `3px solid ${colors.light}`,
              boxShadow: "0 10px 30px rgba(199, 218, 145, 0.15)",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "24px",
                background: colors.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.75rem auto",
                boxShadow: "0 10px 25px rgba(16, 58, 103, 0.2)",
              }}
            >
              <User style={{ width: "3rem", height: "3rem", color: "white", strokeWidth: 2 }} />
            </div>
            <h3 style={{ fontSize: "2rem", fontWeight: "700", color: colors.accent, marginBottom: "1rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Join the Loyalty Program
            </h3>
            <p style={{ color: "#6B7280", marginBottom: "2rem", fontSize: "1.0625rem", maxWidth: "600px", margin: "0 auto 2rem auto", lineHeight: "1.6", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Offer exclusive discounts to GUC students, staff, and faculty. Get priority access and special promotions for your business.
            </p>
            <button
              onClick={() => setShowLoyaltyForm(true)}
              className="apply-button"
              style={{
                padding: "1.125rem 2.5rem",
                background: colors.primary,
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "1.0625rem",
                cursor: "pointer",
                fontFamily: "system-ui, -apple-system, sans-serif",
                boxShadow: "0 6px 20px rgba(54, 107, 43, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <Plus style={{ width: "1.25rem", height: "1.25rem" }} />
              Apply Now
            </button>
          </div>
        )}
      </>
    );
  };

  const renderQRCodes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-[#103A57] font-bold text-gray-900">Visitor QR Codes</h2>
          <p className="text-gray-600 mt-1">
            QR codes for visitors who have registered for your booths
          </p>
        </div>
        {/* <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#307B8E" }}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Visitors</p>
              <p className="text-4xl font-bold text-[#103A57] font-bold text-gray-900">{registeredVisitors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-4xl font-bold text-[#103A57] font-bold text-gray-900">
                {registeredVisitors.filter(v => v.checkedIn).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Check-in</p>
              <p className="text-4xl font-bold text-[#103A57] font-bold text-gray-900">
                {registeredVisitors.filter(v => !v.checkedIn).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {registeredVisitors.map((visitor) => (
          <div
            key={visitor.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={generateQRCodeURL(visitor.qrCode)}
                      alt={`QR Code for ${visitor.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold font-semibold text-gray-900">{visitor.name}</h3>
                      <p className="text-sm text-gray-600">{visitor.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {visitor.checkedIn ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                          <Clock className="w-3 h-3" />
                          Not Checked In
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Bazaar</p>
                      <p className="font-medium text-gray-900">{visitor.bazaarName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Registered</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(visitor.registeredDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Booth</p>
                      <p className="font-medium text-gray-900">{visitor.boothNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">QR Code</p>
                      <p className="font-medium text-gray-900 text-xs">{visitor.qrCode}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => downloadQRCode(visitor)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download QR
                    </button>
                    <button
                      onClick={() => handlePrintQRCode(visitor)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4"/>
                      Print QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {registeredVisitors.length === 0 && <NoVisitorsState />}
    </div>
  );

  const renderContent = () => {
    if (loading) {
  return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CardSkeleton count={3} />
    </div>
  );
}
    if (error) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error: {error}
          </div>
        </div>
      );
    }


    return (
<div className="w-full max-w-none px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 pt-0 pb-8">
          {currentView === "upcoming" && renderUpcomingBazaars()}
        {currentView === "applications" && renderApplications()}
        {currentView === "documents" && renderDocuments()}
        {currentView === "lostfound" && <VendorLostAndFound user={currentUser} />}
        {currentView === "loyalty" && renderLoyalty()}
      </div>
    );
  };

  /* ------------------------------------------------------------------ *
   *  Modal Components
   * ------------------------------------------------------------------ */
  const LoyaltyApplicationForm = () => {
    const colors = {
      primary: "#366B2B",      
      secondary: "#C7DA91",    
      accent: "#103A67",       
      light: "#E8F0D7",        
      bg: "#F8FBF3",          
      text: "#1F2937",         
    };
  
    const [formData, setFormData] = useState({
      discountRate: "",
      promoCode: "",
      termsAccepted: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");
  
      if (!formData.termsAccepted) {
        setError("You must accept the terms and conditions");
        setLoading(false);
        return;
      }
  
      if (formData.discountRate < 0 || formData.discountRate > 100) {
        setError("Discount rate must be between 0 and 100");
        setLoading(false);
        return;
      }
  
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5001/api/vendors/loyalty/apply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.message || "Application failed");
        }
  
        alert("✅ Successfully enrolled in loyalty program!");
        setShowLoyaltyForm(false);
        await fetchLoyaltyStatus();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ 
          background: "rgba(31, 41, 55, 0.75)",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.3s ease-out"
        }}
        onClick={() => !loading && setShowLoyaltyForm(false)}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
  
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
  
          .modal-container {
            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
  
          .form-input {
            transition: all 0.3s ease;
            font-family: system-ui, -apple-system, sans-serif;
          }
  
          .form-input:focus {
            transform: translateY(-2px);
          }
  
          .close-button {
            transition: all 0.3s ease;
          }
  
          .close-button:hover {
            transform: rotate(90deg) scale(1.1);
          }
  
          .submit-button {
            transition: all 0.3s ease;
          }
  
          .submit-button:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(54, 107, 43, 0.3);
          }
        `}</style>
  
        <div
          className="modal-container"
          style={{
            background: "white",
            borderRadius: "1.5rem",
            maxWidth: "750px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px rgba(31, 41, 55, 0.3)",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowLoyaltyForm(false)}
            disabled={loading}
            className="close-button"
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              width: "44px",
              height: "44px",
              border: `2px solid ${colors.light}`,
              background: "white",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = colors.bg;
                e.currentTarget.style.borderColor = colors.accent;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = colors.light;
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke={colors.text}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
  
          {/* Header */}
          <div
            style={{
              padding: "2.5rem 2.5rem 1.75rem 2.5rem",
              borderBottom: `2px solid ${colors.bg}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "14px",
                  background: colors.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(16, 58, 103, 0.2)",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: colors.accent,
                    margin: 0,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  Join Loyalty Program
                </h3>
              </div>
            </div>
            <p style={{ color: "#6B7280", fontSize: "0.9375rem", margin: 0, paddingLeft: "80px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Offer exclusive benefits and grow with the GUC community
            </p>
          </div>
  
          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "2rem 2.5rem 2.5rem 2.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {/* Discount Rate */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9375rem",
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: "0.75rem",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  Discount Rate *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.discountRate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discountRate: e.target.value }))}
                  placeholder="e.g., 20"
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "1rem 1.25rem",
                    border: `2px solid ${colors.light}`,
                    borderRadius: "12px",
                    fontSize: "1rem",
                    fontWeight: "700",
                    outline: "none",
                    background: "white",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}15`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.light;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  disabled={loading}
                />
                <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0.625rem 0 0 0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  Percentage discount for GUC members (0-100)
                </p>
              </div>
  
              {/* Promo Code */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: "0.75rem",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.promoCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., GUC2024"
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "1rem 1.25rem",
                    border: `2px solid ${colors.light}`,
                    borderRadius: "12px",
                    fontSize: "1rem",
                    fontWeight: "700",
                    outline: "none",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    letterSpacing: "0.1em",
                    background: "white",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}15`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.light;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  disabled={loading}
                />
                <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0.625rem 0 0 0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  Unique code for GUC members (letters and numbers only)
                </p>
              </div>
  
              {/* Terms */}
              <div
                style={{
                  padding: "1.75rem",
                  background: colors.bg,
                  borderRadius: "12px",
                  border: `2px solid ${colors.light}`,
                }}
              >
                <label style={{ display: "flex", alignItems: "start", gap: "0.875rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                    style={{
                      width: "20px",
                      height: "20px",
                      marginTop: "2px",
                      cursor: "pointer",
                      accentColor: colors.primary,
                    }}
                    disabled={loading}
                  />
                  <div>
                    <p style={{ fontWeight: "600", fontSize: "0.9375rem", color: colors.text, margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                      I accept the terms and conditions *
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0.625rem 0 0 0", lineHeight: "1.6", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                      By checking this box, you agree to maintain the offered discount rate for GUC community members and honor the promo code across all your participating events and services.
                    </p>
                  </div>
                </label>
              </div>
  
              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: "1.125rem 1.25rem",
                    background: "#FEE2E2",
                    border: `2px solid #DC2626`,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#DC2626" strokeWidth="2"/>
                    <path d="M10 6V10M10 13H10.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p style={{ color: "#991B1B", fontSize: "0.9375rem", fontWeight: "600", margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>{error}</p>
                </div>
              )}
  
              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.875rem", paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowLoyaltyForm(false)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "1.125rem",
                    border: `2px solid ${colors.light}`,
                    background: "white",
                    color: colors.text,
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "1rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = colors.bg;
                      e.currentTarget.style.borderColor = colors.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = colors.light;
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="submit-button"
                  style={{
                    flex: 1,
                    padding: "1.125rem",
                    background: loading ? "#9CA3AF" : colors.primary,
                    color: colors.bg,
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "1rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : `0 6px 20px rgba(54, 107, 43, 0.25)`,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ *
   *  Main Return
   * ------------------------------------------------------------------ */
  return (
    <>
      <UnifiedDashboardLayout
         user={currentUser}
        onLogout={onLogout}
        navigation={navigation}
        currentView={currentView}
        onViewChange={setCurrentView}
        title="Vendor Dashboard"

        // Move refresh to the right
        headerActions={
          <div className="flex items-center gap-3 justify-end ml-auto">
            {/* <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E9D5] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{
                cursor: refreshing ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.backgroundColor = "#F0F2FF";
                  e.currentTarget.style.borderColor = "#307B8E";
                }
              }}
              onMouseLeave={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.borderColor = "#E5E9D5";
                }
              }}
            >
              <RefreshCw
                className={refreshing ? 'animate-spin' : ''}
                style={{ width: "18px", height: "18px", color: "##307B8E" }}
              />
            </button> */}
          </div>
        }
      >
        {renderContent()}
      </UnifiedDashboardLayout>

      {/* Bazaar Application Modal */}
      {showBazaarModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBazaarModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <ApplyForm
              bazaar={selectedBazaar}
              vendorId={vendorId}
              onSubmit={() => {
                setShowBazaarModal(false);
                Promise.all([fetchUpcomingBazaars(), fetchApplications()]);
              }}
            />
            <button
              className="absolute top-4 right-4 text-4xl font-bold text-[#103A57] font-bold text-gray-500 hover:text-gray-700"
              onClick={() => setShowBazaarModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Booth Application Modal - styled header to match sidebar / "Apply Now" color */}
      /*{showBoothModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBoothModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header with sidebar color */}
            {/* <div className="rounded-t-xl px-6 py-4" style={{ backgroundColor: "#307B8E" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-white text-2xl font-bold font-semibold">Apply for Booth</h3> */}
                <button
              className="absolute top-4 right-4 text-4xl font-bold text-[#103A57] font-bold text-gray-500 hover:text-gray-700"
              onClick={() => setShowBoothModal(false)}
            >
              ×
            </button>
              {/* </div> */}
            {/* </div> */}

            {/* Form body */}
            <div className="p-8">
              <BoothApplicationForm
                bazaarApplication={{ bazaarId: { name: "Platform Booth" } }}
                vendorId={vendorId}
                onSubmit={() => {
                  setShowBoothModal(false);
                  fetchApplications();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Application Modal */}
      {showLoyaltyForm && <LoyaltyApplicationForm />}

      {/* Payment Modal */}
{showPaymentModal && selectedApplication && (
  <VendorPaymentModal
    application={selectedApplication}
    applicationType={selectedApplicationType}
    onClose={() => {
      setShowPaymentModal(false);
      setSelectedApplication(null);
      setSelectedApplicationType(null);
    }}
    onSuccess={async () => {
      await fetchCurrentUser(); // Refresh user data including wallet
      await fetchApplications(); // Refresh applications
    }}
  />
)}
    </>
  );
}