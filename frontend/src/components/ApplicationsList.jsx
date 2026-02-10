// import { useState, useEffect } from "react";

// export default function ApplicationsList({ vendorId, onApplyForBooth }) {
//   const [bazaarApplications, setBazaarApplications] = useState([]);
//   const [boothApplications, setBoothApplications] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchApplications();
//   }, [vendorId]);

//   const fetchApplications = async () => {
//     try {
//       const res = await fetch(`http://localhost:5001/api/vendors/applications/${vendorId}`);
//       const data = await res.json();
//       setBazaarApplications(data.bazaarApplications || []);
//       setBoothApplications(data.boothApplications || []);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching applications:", error);
//       setLoading(false);
//     }
//   };
//   const handleResendQR = async (applicationId) => {
//     if (!window.confirm("Send all visitor QR codes to your email?")) return;  
//     try {
//       const token = JSON.parse(localStorage.getItem("user") || "{}")?.token;
//       const res = await fetch(`http://localhost:5001/api/vendors/applications/${applicationId}/send-qr-codes`, {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${token}`,
//           "Content-Type": "application/json"
//         }
//       });
  
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Server error");
  
//       alert("QR Codes sent successfully!");
//     } catch (err) {
//       alert("Failed: " + err.message);
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Accepted":
//         return "bg-green-100 text-green-800 border-green-300";
//       case "Pending":
//         return "bg-yellow-100 text-yellow-800 border-yellow-300";
//       case "Rejected":
//         return "bg-red-100 text-red-800 border-red-300";
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-300";
//     }
//   };

//   if (loading) {
//     return <div className="p-8 text-center">Loading applications...</div>;
//   }

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-8">My Applications</h1>

//       {/* Bazaar Applications */}
//       <div className="mb-12">
//         <h2 className="text-2xl font-semibold mb-4">Bazaar Applications</h2>
//         {bazaarApplications.length === 0 ? (
//           <p className="text-gray-500 italic">No bazaar applications yet.</p>
//         ) : (
//           <div className="grid gap-4">
//             {bazaarApplications.map((app) => (
//               <div
//                 key={app._id}
//                 className={`border-2 rounded-lg p-6 ${getStatusColor(app.status)}`}
//               >
//                 <div className="flex justify-between items-start">
//                   <div className="flex-1">
//                     <h3 className="text-xl font-bold mb-2">
//                       {app.bazaarId?.name || "Bazaar"}
//                     </h3>
//                     <p className="text-sm mb-1">
//                       <strong>Date:</strong>{" "}
//                       {app.bazaarId?.date
//                         ? new Date(app.bazaarId.date).toLocaleDateString()
//                         : "N/A"}
//                     </p>
//                     <p className="text-sm mb-1">
//                       <strong>Location:</strong> {app.bazaarId?.location || "N/A"}
//                     </p>
//                     <p className="text-sm mb-1">
//                       <strong>Booth Size:</strong> {app.boothSize}
//                     </p>
//                     <p className="text-sm mb-1">
//                       <strong>Attendees:</strong> {app.attendees.length}
//                     </p>
//                     <p className="text-sm font-semibold mt-2">
//                       Status: {app.status}
//                     </p>
//                   </div>

//                   {/* Apply for Booth button - only show if Accepted */}
//                   {app.status === "Accepted" && (
//                     <button
//                       onClick={() => onApplyForBooth(app)}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ml-4"
//                     >
//                       Apply for Booth
//                     </button>
//                   )}
//                 </div>

//                 {/* Show attendees details */}
//                 <details className="mt-4">
//                   <summary className="cursor-pointer font-semibold text-sm">
//                     View Attendees
//                   </summary>
//                   <ul className="mt-2 space-y-1">
//                     {app.attendees.map((attendee, idx) => (
//                       <li key={idx} className="text-sm">
//                         {attendee.name} - {attendee.email}
//                       </li>
//                     ))}
//                   </ul>
//                 </details>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Booth Applications */}
//       <div>
//         <h2 className="text-2xl font-semibold mb-4">Booth Applications</h2>
//         {boothApplications.length === 0 ? (
//           <p className="text-gray-500 italic">No booth applications yet.</p>
//         ) : (
//           <div className="grid gap-4">
//             {boothApplications.map((app) => (
//   <div
//     key={app._id}
//     className="border-2 border-gray-200 rounded-xl p-6 mb-6 bg-white shadow-sm hover:shadow-lg transition-shadow"
//   >
//     <div className="flex justify-between items-start">
//       <div className="flex-1">
//         <h3 className="text-xl font-bold text-[#103A57] mb-3">
//           Booth Application – {app.location}
//         </h3>
//         <div className="grid grid-cols-2 gap-4 text-sm">
//           <p><strong>Duration:</strong> {app.setupDuration}</p>
//           <p><strong>Size:</strong> {app.boothSize} meters</p>
//           <p><strong>Attendees:</strong> {app.attendees?.length || 0}</p>
//           <p><strong>Status:</strong> 
//             <span className={`ml-2 px-3 py-1 rounded-full text-white text-xs font-bold ${
//               app.status === 'Accepted' ? 'bg-green-600' : 
//               app.status === 'Pending' ? 'bg-amber-500' : 'bg-red-600'
//             }`}>
//               {app.status}
//             </span>
//           </p>
//         </div>
//         {app.paid && (
//           <p className="mt-3 inline-block px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold">
//             Paid
//           </p>
//         )}
//       </div>

//       {/* THIS IS THE BUTTON YOU WERE MISSING */}
//       {app.status === "Accepted" && app.paid && (
//         <button
//           onClick={() => handleResendQR(app._id)}
//           className="ml-6 px-6 py-3 bg-[#307B8E] hover:bg-[#256a7a] text-white font-bold rounded-lg shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
//         >
//           Send All QR Codes to My Email
//         </button>
//       )}
//     </div>

//     {/* Optional: Show attendees */}
//     {app.attendees && app.attendees.length > 0 && (
//       <details className="mt-4">
//         <summary className="cursor-pointer text-sm font-semibold text-[#307B8E]">
//           View Attendees ({app.attendees.length})
//         </summary>
//         <ul className="mt-2 ml-6 list-disc text-sm">
//           {app.attendees.map((a, i) => (
//             <li key={i}>{a.name} – {a.email}</li>
//           ))}
//         </ul>
//       </details>
//     )}
//   </div>
// ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";

export default function ApplicationsList({ vendorId, onApplyForBooth }) {
  const [bazaarApplications, setBazaarApplications] = useState([]);
  const [boothApplications, setBoothApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [vendorId]);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/vendors/applications/${vendorId}`);
      const data = await res.json();
      setBazaarApplications(data.bazaarApplications || []);
      setBoothApplications(data.boothApplications || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setLoading(false);
    }
  };

  const handleResendQR = async (applicationId) => {
    if (!window.confirm("Send all visitor QR codes to your email?")) return;

    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}")?.token;
      const res = await fetch(`http://localhost:5001/api/vendors/applications/${applicationId}/send-qr-codes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Server error");

      alert("QR Codes sent successfully! Check your email");
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted":  return "border-green-400 bg-green-50";
      case "Pending":   return "border-amber-400 bg-amber-50";
      case "Rejected":  return "border-red-400 bg-red-50";
      default:          return "border-gray-300 bg-gray-50";
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading applications...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-10 text-[#103A57]">My Applications</h1>

      {/* Bazaar Applications */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-[#103A57]">Bazaar Applications</h2>
        {bazaarApplications.length === 0 ? (
          <p className="text-gray-500 italic">No bazaar applications yet.</p>
        ) : (
          <div className="grid gap-6">
            {bazaarApplications.map((app) => (
              <div key={app._id} className={`border-2 rounded-xl p-6 shadow-lg ${getStatusColor(app.status)}`}>
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-[#103A57]">
                      {app.bazaarId?.name || "Bazaar Event"}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><strong>Date:</strong> {app.bazaarId?.date ? new Date(app.bazaarId.date).toLocaleDateString() : "N/A"}</p>
                      <p><strong>Location:</strong> {app.bazaarId?.location || "N/A"}</p>
                      <p><strong>Booth Size:</strong> {app.boothSize}</p>
                      <p><strong>Attendees:</strong> {app.attendees.length}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-lg font-bold">Status: {app.status}</span>
                      {app.paid && <span className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold">Paid</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {app.status === "Accepted" && !app.paid && (
                      <button
                        onClick={() => onApplyForBooth(app)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
                      >
                        Apply for Booth
                      </button>
                    )}

                    {/* QR Button - Only when Accepted */}
                    {app.status === "Accepted" && (
                      <button
                        onClick={() => handleResendQR(app._id)}
                        className="px-6 py-3 bg-[#307B8E] hover:bg-[#256a7a] text-white font-bold rounded-lg shadow-md transition transform hover:scale-105"
                      >
                        Send All QR Codes
                      </button>
                    )}
                  </div>
                </div>

                <details className="mt-6">
                  <summary className="cursor-pointer text-[#307B8E] font-semibold">View Attendees</summary>
                  <ul className="mt-3 ml-6 list-disc text-sm space-y-1">
                    {app.attendees.map((a, i) => (
                      <li key={i}>{a.name} – {a.email}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booth Applications */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-[#103A57]">Booth Applications</h2>
        {boothApplications.length === 0 ? (
          <p className="text-gray-500 italic">No booth applications yet.</p>
        ) : (
          <div className="grid gap-6">
            {boothApplications.map((app) => (
              <div key={app._id} className={`border-2 rounded-xl p-6 shadow-lg ${getStatusColor(app.status)}`}>
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-[#103A57]">
                      Booth at {app.location}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><strong>Duration:</strong> {app.setupDuration}</p>
                      <p><strong>Size:</strong> {app.boothSize} meters</p>
                      <p><strong>Attendees:</strong> {app.attendees.length}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-3 px-4 py-1 rounded-full text-white font-bold text-sm ${
                          app.status === "Accepted" ? "bg-green-600" : 
                          app.status === "Pending" ? "bg-amber-600" : "bg-red-600"
                        }`}>
                          {app.status}
                        </span>
                      </p>
                    </div>
                    {app.paid && <span className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold">Paid</span>}
                  </div>

                  {/* QR Button - Only when status is Accepted */}
                  {app.status === "Accepted" && (
                    <button
                      onClick={() => handleResendQR(app._id)}
                      className="px-6 py-3 bg-[#307B8E] hover:bg-[#256a7a] text-white font-bold rounded-lg shadow-md transition transform hover:scale-105"
                    >
                      Send All QR Codes
                    </button>
                  )}
                </div>

                <details className="mt-6">
                  <summary className="cursor-pointer text-[#307B8E] font-semibold">View Attendees</summary>
                  <ul className="mt-3 ml-6 list-disc text-sm space-y-1">
/stdin                    {app.attendees.map((a, i) => (
                      <li key={i}>{a.name} – {a.email}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}