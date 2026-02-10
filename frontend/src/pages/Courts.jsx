import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";

const Courts = ({ user }) => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  // Debug: Log user object to see what fields are available
  useEffect(() => {
    console.log("Current user object:", currentUser);
  }, [currentUser]);

  const fetchCourts = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/Court");
      console.log("Courts fetched:", res.data);
      setCourts(res.data);
    } catch (err) {
      console.error("Error fetching courts:", err);
      setMessage({ type: "error", text: "Failed to load courts" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleReservation = async () => {
    if (!selectedCourt || !selectedDate || !selectedTime) {
      setMessage({ type: "error", text: "Please select a court, date, and time" });
      return;
    }

    if (!currentUser?.id && !currentUser?._id) {
      setMessage({ type: "error", text: "User information is missing. Please log in again." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    // Use whatever ID field exists
    const userId = currentUser.id || currentUser._id;
    // Use gucId if it exists, otherwise use email or a placeholder
    const gucId = currentUser.gucId || currentUser.studentId || currentUser.email || "N/A";
    const studentName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || currentUser.name || "Student";

    const reservationData = {
      courtId: selectedCourt._id,
      date: selectedDate,
      time: selectedTime,
      studentName: studentName,
      gucId: gucId,
      studentId: userId,
    };

    console.log("Submitting reservation:", reservationData);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/Court/reserve",
        reservationData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Reservation response:", response.data);

      setMessage({
        type: "success",
        text: `Successfully reserved ${selectedCourt.name} on ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`,
      });

      // Refresh courts to update availability
      await fetchCourts();

      // Reset selections after a delay so user can see success message
      setTimeout(() => {
        setSelectedCourt(null);
        setSelectedDate("");
        setSelectedTime("");
      }, 2000);
    } catch (err) {
      console.error("Reservation error:", err.response?.data || err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to reserve court. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableTimesForDate = (court, date) => {
    const slot = court.availability?.find((s) => s.date === date);
    return slot?.time || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-[#344C3D] font-semibold">
        Loading courts...
      </div>
    );
  }

  if (!courts.length) {
    return (
      <div className="bg-white rounded-lg border border-[#8EA58C] shadow-sm">
        <div className="p-6 border-b border-[#BFCFBB]">
          <h2 className="text-xl font-semibold text-[#344C3D]">Courts Availability</h2>
          <p className="text-[#566F5B] mt-1">
            View available court times for booking
          </p>
        </div>
        <div className="p-6">
          <p className="text-center text-[#738A6E] py-8">
            No courts are currently available for booking.
          </p>
        </div>
      </div>
    );
  }
  const typeStyles = {
  basketball: "border-orange-300 bg-orange-100/50 text-orange-700",
  tennis: "border-green-300 bg-green-100/50 text-green-700",
  football: "border-blue-300 bg-blue-100/50 text-blue-700",
};

  const courtsByType = courts.reduce((acc, court) => {
    const type = court.type || "court";
    if (!acc[type]) acc[type] = [];
    acc[type].push(court);
    return acc;
  }, {});

  // Get display values for user info
  const displayName = currentUser 
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || currentUser.name || "User"
    : "Guest";
  const displayId = currentUser?.gucId || currentUser?.studentId || currentUser?.email || "N/A";

  return (
    <div className="bg-white rounded-lg border border-[#8EA58C] shadow-sm">
      {/* Card Header */}
      <div className="p-6 border-b border-[#BFCFBB]">
        <h2 className="text-xl font-semibold text-[#344C3D]">Courts Availability & Reservation</h2>
        <p className="text-[#566F5B] mt-1">
          View available court times and make reservations
        </p>
        {currentUser && (
          <div className="mt-3 text-sm text-[#566F5B]">
            <p>
              <strong>Reserving as:</strong> {displayName}
            </p>
            
          </div>
        )}
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mx-6 mt-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      {/* Card Content */}
      <div className="p-6">
        <div className="space-y-8">
          {Object.entries(courtsByType).map(([type, typeCourts]) => (
            <div key={type}>
              <h3 className="text-[#344C3D] mb-4 font-semibold text-lg">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {typeCourts.map((court) => {
                  const isSelected = selectedCourt?._id === court._id;
                  const availableDates = court.availability?.map((slot) => slot.date) || [];

                  return (
                    <div
                      key={court._id}
                     className={`
    rounded-2xl border p-6 transition-all
    ${court.type === "basketball" ? "bg-orange-50" :
      court.type === "tennis" ? "bg-green-50" :
      court.type === "football" ? "bg-blue-50" :
      "bg-gray-50"
    } 
                       ${court.type === "basketball" ? "bg-orange-50 shadow-[0_4px_10px_rgb(251_146_60_/_0.15)]" :
      court.type === "tennis" ? "bg-green-50 shadow-[0_4px_10px_rgb(74_222_128_/_0.15)]" :
      court.type === "football" ? "bg-blue-50 shadow-[0_4px_10px_rgb(96_165_250_/_0.15)]" :
      "bg-gray-50 shadow-sm"
    }

    ${court.type === "basketball" ? "bg-orange-50" :
    court.type === "tennis" ? "bg-green-50" :
    court.type === "football" ? "bg-blue-50" :
    "bg-gray-50"
  }
    ${isSelected 
      ? "border-[#344C3D] shadow-md ring-2 ring-[#344C3D]/30" 
      : "border-gray-200 hover:shadow"}`
  }
                    >


                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full 
  ${court.type === "basketball" ? "bg-orange-200/40" :
    court.type === "tennis" ? "bg-green-200/40" :
    court.type === "football" ? "bg-blue-200/40" :
    "bg-gray-200/40"
  }
`}>
  <MapPin className="w-4 h-4 text-gray-700" />
</div>



                        <h3 className="text-[#344C3D] font-medium">{court.name}</h3>
                        <span
  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize 
              ${typeStyles[court.type] || "border-gray-300 bg-gray-100/50 text-gray-700"}`}
>
                          {court.type || "court"}
                        </span>
                      </div>

                      

                      {/* Availability Display and Reservation */}
                      {availableDates.length > 0 ? (
                        <div className="space-y-4">
                          {/* Date Selection */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#344C3D] mb-2">
                              <Calendar className="w-4 h-4" />
                              Select Date
                            </label>
                            <select
                              value={isSelected ? selectedDate : ""}
                              onChange={(e) => {
                                setSelectedCourt(court);
                                setSelectedDate(e.target.value);
                                setSelectedTime("");
                                setMessage({ type: "", text: "" });
                              }}
                              className="w-full border border-[#8EA58C] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#344C3D]"
                            >
                              <option value="">Choose a date to reserve...</option>
                              {availableDates.map((date) => (
                                <option key={date} value={date}>
                                  {new Date(date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Time Selection */}
                          {isSelected && selectedDate && (
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-[#344C3D] mb-2">
                                <Clock className="w-4 h-4" />
                                Select Time Slot
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {getAvailableTimesForDate(court, selectedDate).length > 0 ? (
                                  getAvailableTimesForDate(court, selectedDate).map((time) => (
                                    <button
                                      key={time}
                                      onClick={() => {
                                        setSelectedTime(time);
                                        setMessage({ type: "", text: "" });
                                      }}
                                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                        selectedTime === time
                                          ? "bg-[#344C3D] text-white shadow-md"
                                          : "border border-[#8EA58C] text-[#344C3D] bg-white hover:bg-[#F5F7F5]"
                                      }`}
                                    >
                                      {time}
                                    </button>
                                  ))
                                ) : (
                                  <p className="text-[#738A6E] italic">No time slots available for this date.</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Reserve Button */}
                          {isSelected && selectedDate && selectedTime && (
                            <button
                              onClick={handleReservation}
                              disabled={submitting}
                              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                                submitting
                                  ? "bg-[#BFCFBB] text-[#738A6E] cursor-not-allowed"
                                  : "bg-[#344C3D] text-white hover:bg-[#2a3d31] shadow-md"
                              }`}
                            >
                              {submitting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Reserving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Confirm Reservation
                                </>
                              )}
                            </button>
                          )}

                          {/* Show all available slots if not selected */}
                          {!isSelected && (
                            <div className="space-y-3 pt-2">
                              <p className="text-sm font-medium text-[#344C3D]">Available Slots:</p>
                              {court.availability?.map((slot, idx) => (
                                <div key={`${court._id}-${slot.date}-${idx}`}>
                                  <p className="text-sm text-[#566F5B] mb-2">
                                    {new Date(slot.date).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {slot.time.map((time, i) => (
                                      <span
                                        key={`${court._id}-${slot.date}-${time}-${i}`}
                                        className="px-3 py-1 border border-[#8EA58C] text-[#344C3D] bg-white rounded-full text-sm"
                                      >
                                        {time}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[#738A6E] italic">No available slots.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Courts;