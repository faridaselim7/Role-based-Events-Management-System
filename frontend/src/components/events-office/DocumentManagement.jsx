import React, { useState, useEffect } from 'react';
import { FileText, Download, User, Calendar, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';

// Import the EXACT same design system used in BazaarManagement
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
} from '../../styles/EOdesignSystem';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5001/api/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        console.error(err);
        alert('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem('token')?.replace(/^"|"$/g, '').trim();
      if (!token) throw new Error('No token');
      const link = document.createElement('a');
      link.href = `http://localhost:5001/api/documents/${doc._id}/download?token=${token}`;
      link.download = doc.fileName;
      link.click();
    } catch (err) {
      alert('Download failed. Please refresh or log in again.');
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
                        
        <CardContent className="px-0">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 border-2 border-dashed rounded-xl animate-pulse"
                style={{ borderColor: EOcolors.lightSilver }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{`
        @keyframes docSlideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .doc-card {
          animation: docSlideInUp 0.4s ease-out;
          transition: ${EOtransitions.normal};
        }
        .doc-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
      `}</style>

      <div className="space-y-6">
        <Card
          style={{
            ...EOcardStyles.base,
            border: `2px solid ${EOcolors.lightSilver}`,
          }}
          className="border-0 shadow-none bg-transparent"
        >
          <CardHeader className="px-0" style={{ paddingBottom: '1.5rem' }}>
            {/* <div className="text-center">
              <CardTitle
                className="text-2xl font-semibold"
                style={{ color: EOcolors.secondary }}
              >
                Uploaded Vendor Documents
              </CardTitle>
              <p className="mt-1" style={{ color: EOcolors.text.secondary }}>
                {documents.length} document{documents.length !== 1 ? 's' : ''} available for download
              </p>
            </div> */}
            <CardTitle style={{
              fontSize: "2rem",
              fontWeight: "800",
              color: EOcolors.secondary,
              marginBottom: "0.5rem",
            }}>
              Uploaded Vendor Documents
            </CardTitle>
              <p style={{
                color: EOcolors.text.secondary,
                fontSize: "0.9375rem",
             }}>
              {documents.length} document{documents.length !== 1 ? 's' : ''} available for download                        </p>
          </CardHeader>

          <CardContent className="px-0">
            {documents.length === 0 ? (
              <div
                className="text-center py-20 rounded-2xl border-2 border-dashed"
                style={{
                  background: 'linear-gradient(to bottom, #f8f9fa, white)',
                  borderColor: EOcolors.lightSilver,
                }}
              >
                <AlertCircle className="w-20 h-20 mx-auto mb-6 opacity-30" style={{ color: EOcolors.text.muted }} />
                <p className="text-2xl font-bold" style={{ color: EOcolors.secondary }}>
                  No Documents Uploaded Yet
                </p>
                <p className="mt-3" style={{ color: EOcolors.text.muted }}>
                  Vendor documents will appear here once submitted
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="doc-card flex items-center justify-between gap-8 p-8 rounded-3xl border-2 bg-white"
                    style={{
                      borderColor: EOcolors.lightSilver,
                      boxShadow: EOshadows.sm,
                    }}
                  >
                    {/* Left: File Icon + Details */}
                    <div className="flex items-center gap-6 flex-1">
                      {/* Icon Box */}
                      <div
                        className="p-5 rounded-2xl shadow-lg flex-shrink-0"
                        style={{
                          background: EOcolors.secondary,
                        }}
                      >
                        <FileText className="w-14 h-14 text-white" />
                      </div>

                      {/* Text Content */}
                      <div className="space-y-3">
                        <h3
                          className="text-xl font-bold"
                          style={{ color: EOcolors.secondary }}
                        >
                          {doc.fileName}
                        </h3>

                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <span className="flex items-center gap-2" style={{ color: EOcolors.text.secondary }}>
                            <User className="w-4 h-4" />
                            {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                          </span>
                          <span className="flex items-center gap-2" style={{ color: EOcolors.text.secondary }}>
                            <Calendar className="w-4 h-4" />
                            {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <span
                            className="px-5 py-2 rounded-full font-bold text-white text-xs shadow-sm"
                            style={{ background: EOcolors.tertiary }}
                          >
                            {doc.documentType.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    
                    {/* Right: Download Button - EXACT same as BazaarManagement */}
                    {/* <button
                      onClick={() => handleDownload(doc)}
                      style={{
                        ...EObuttonStyles.primary,
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderRadius: EOradius.lg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minWidth: '160px',
                        justifyContent: 'center',
                      }}
                      className="transform transition-all hover:scale-105 hover:shadow-xl"
                    >
                      <Download className="w-6 h-6" />
                      Download
                    </button> */}
                    {/* VIEW BUTTON – now works perfectly */}
<button
  onClick={() => {
    const token = localStorage.getItem('token')?.replace(/^"|"$/g, '').trim();
    if (!token) {
      alert('Session expired. Please log in again.');
      return;
    }

    // Method that forces the browser to send the Authorization header
    const viewUrl = `http://localhost:5001/api/documents/${doc._id}/download`;
    
    fetch(viewUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Clean up the object URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    })
    .catch(err => {
      console.error(err);
      alert('Failed to open document. Try downloading instead.');
    });
  }}
  style={{
    ...EObuttonStyles.primary,
    padding: '0.75rem 1.8rem',
    borderRadius: EOradius.lg,
  }}
  className="flex items-center gap-2 font-semibold transform transition-all hover:scale-105 hover:shadow-xl"
>
  View
</button>
                    <button
                                onClick={() => handleDownload(doc)}
                                style={{
                                  ...EObuttonStyles.outline,
                                  padding: "0.5rem 0.9rem",
                                  fontSize: "1.3rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  borderColor: "#FACC15",
                                  color: "#B45309",
                                }}
                                className="transform transition-all hover:scale-105 hover:shadow-xl"
                              >
                                <Download className="w-6 h-6" />
                                Download
                              </button>
                              
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DocumentManagement;