import React, { useState, useEffect } from "react";
import {
  Store,
  FileText,
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  Upload,
  Download,
  QrCode,
  Mail,
  Check,
  X,
} from "lucide-react";


export default function VendorQREmailSystem() {
  const [currentView, setCurrentView] = useState("qr-codes");
  const [registeredVisitors, setRegisteredVisitors] = useState(mockRegisteredVisitors);
  const [selectedVisitors, setSelectedVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: "Your QR Code for {bazaarName}",
    message: `Dear {visitorName},

Thank you for registering for {bazaarName}!

Please find your QR code attached to this email. You'll need to present this QR code at the entrance for quick check-in.

Event Details:
- Date: {eventDate}
- Time: {eventTime}
- Location: {eventLocation}

We look forward to seeing you there!

Best regards,
{vendorName}`
  });
  const [sendingStatus, setSendingStatus] = useState(null);

  const navigation = [
    { name: "QR Codes", icon: <QrCode className="w-4 h-4" />, view: "qr-codes" },
    { name: "Upcoming Bazaars", icon: <Store className="w-4 h-4" />, view: "upcoming" },
    { name: "Applications", icon: <FileText className="w-4 h-4" />, view: "applications" },
  ];

  // Toggle visitor selection
  const toggleVisitorSelection = (visitorId) => {
    setSelectedVisitors(prev =>
      prev.includes(visitorId)
        ? prev.filter(id => id !== visitorId)
        : [...prev, visitorId]
    );
  };

  // Select all visitors
  const selectAllVisitors = () => {
    if (selectedVisitors.length === registeredVisitors.length) {
      setSelectedVisitors([]);
    } else {
      setSelectedVisitors(registeredVisitors.map(v => v.id));
    }
  };

  // Send QR codes via email
  const handleSendQRCodes = async () => {
    setLoading(true);
    setSendingStatus("sending");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update email sent status
    setRegisteredVisitors(prev =>
      prev.map(visitor =>
        selectedVisitors.includes(visitor.id)
          ? { ...visitor, emailSent: true, status: "confirmed" }
          : visitor
      )
    );

    setSendingStatus("success");
    setTimeout(() => {
      setShowEmailModal(false);
      setSelectedVisitors([]);
      setSendingStatus(null);
    }, 2000);

    setLoading(false);
  };

  // Generate QR code (mock function)
  const generateQRCodeURL = (qrCode) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;
  };

  // Download QR code
  const downloadQRCode = (visitor) => {
    const link = document.createElement('a');
    link.href = generateQRCodeURL(visitor.qrCode);
    link.download = `QR-${visitor.name.replace(/\s/g, '-')}.png`;
    link.click();
  };

  const renderQRCodes = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registered Visitors</h2>
          <p className="text-gray-600 mt-1">
            Manage QR codes for visitors who registered for your booths
          </p>
        </div>
        <button
          onClick={() => setShowEmailModal(true)}
          disabled={selectedVisitors.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm transition-colors ${
            selectedVisitors.length > 0
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Mail className="w-5 h-5" />
          Send QR Codes ({selectedVisitors.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Registered</p>
              <p className="text-2xl font-bold text-gray-900">{registeredVisitors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {registeredVisitors.filter(v => v.emailSent).length}
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
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {registeredVisitors.filter(v => !v.emailSent).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={selectedVisitors.length === registeredVisitors.length}
            onChange={selectAllVisitors}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700">
            {selectedVisitors.length === registeredVisitors.length
              ? "Deselect All"
              : "Select All"}
          </span>
          {selectedVisitors.length > 0 && (
            <span className="text-sm text-gray-600">
              ({selectedVisitors.length} selected)
            </span>
          )}
        </div>
      </div>

      {/* Visitors List */}
      <div className="space-y-4">
        {registeredVisitors.map((visitor) => (
          <div
            key={visitor.id}
            className={`bg-white rounded-lg shadow-sm border transition-all ${
              selectedVisitors.includes(visitor.id)
                ? "border-emerald-500 ring-2 ring-emerald-200"
                : "border-gray-200 hover:shadow-md"
            }`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedVisitors.includes(visitor.id)}
                  onChange={() => toggleVisitorSelection(visitor.id)}
                  className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                />

                {/* QR Code */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={generateQRCodeURL(visitor.qrCode)}
                      alt={`QR Code for ${visitor.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Visitor Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{visitor.name}</h3>
                      <p className="text-sm text-gray-600">{visitor.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {visitor.emailSent ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Email Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Bazaar</p>
                      <p className="font-medium text-gray-900">{visitor.bazaarName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Registered</p>
                      <p className="font-medium text-gray-900">
                        {new Date(visitor.registeredDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </p>
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
                    <p className="text-xs text-gray-500">Code: {visitor.qrCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {registeredVisitors.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No registered visitors yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Visitors will appear here once they register for your booths
          </p>
        </div>
      )}
    </div>
  );

  // Email Modal
  const EmailModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">Send QR Codes via Email</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sending to {selectedVisitors.length} visitor{selectedVisitors.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowEmailModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Recipients List */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Recipients ({selectedVisitors.length})
            </label>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {registeredVisitors
                  .filter(v => selectedVisitors.includes(v.id))
                  .map(visitor => (
                    <div key={visitor.id} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-gray-900">{visitor.name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{visitor.email}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Email Template */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={emailTemplate.subject}
                onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Message
              </label>
              <textarea
                value={emailTemplate.message}
                onChange={(e) => setEmailTemplate(prev => ({ ...prev, message: e.target.value }))}
                rows={12}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Available placeholders: {"{visitorName}"}, {"{bazaarName}"}, {"{eventDate}"}, {"{eventTime}"}, {"{eventLocation}"}, {"{vendorName}"}
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {sendingStatus === "sending" && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 font-medium">Sending emails...</p>
              </div>
            </div>
          )}

          {sendingStatus === "success" && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 font-medium">
                  Successfully sent QR codes to {selectedVisitors.length} visitor{selectedVisitors.length !== 1 ? "s" : ""}!
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={() => setShowEmailModal(false)}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendQRCodes}
              disabled={loading || sendingStatus === "success"}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : sendingStatus === "success" ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Sent
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Emails
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
                <p className="text-emerald-100 text-sm">QR Code Management</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {navigation.map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                  currentView === item.view
                    ? "text-emerald-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.icon}
                {item.name}
                {currentView === item.view && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "qr-codes" && renderQRCodes()}
        {currentView === "upcoming" && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Upcoming Bazaars view</p>
          </div>
        )}
        {currentView === "applications" && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Applications view</p>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && <EmailModal />}
    </div>
  );
}