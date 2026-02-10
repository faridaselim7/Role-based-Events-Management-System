import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";

const CourtReservation = ({ user }) => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/Court");
        setCourts(res.data);
      } catch (err) {
        console.error("Error fetching courts:", err);
        setMessage({ type: "error", text: "Failed to load courts" });
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  const handleReservation = async () => {
    if (!selectedCourt || !selectedDate || !selectedTime) {
      setMessage({ type: "error", text: "Please select a court, date, and time" });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post(
        "http://localhost:5001/api/Court/reserve",
        {
          courtId: selectedCourt._id,
          date: selectedDate,
          time: selectedTime,
          studentName: `${currentUser.firstName} ${currentUser.lastName}`,
          gucId: currentUser.gucId,
          studentId: currentUser.id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage({
        type: "success",
        text: `Successfully reserved ${selectedCourt.name} on ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`,
      });

      // Refresh courts to update availability
      const res = await axios.get("http://localhost:5001/api/Court");
      setCourts(res.data);

      // Reset selections
      setSelectedCourt(null);
      setSelectedDate("");
      setSelectedTime("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to reserve court",
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
          <h2 className="text-xl font-semibold text-[#344C3D]">Reserve a Court</h2>
          <p className="text-[#566F5B] mt-1">Book your preferred court time</p>
        </div>
        <div className="p-6">
          <p className="text-center text-[#738A6E] py-8">
            No courts are currently available for reservation.
          </p>
        </div>
      </div>
    );
  }

  const courtsByType = courts.reduce((acc, court) => {
    const type = court.type || "court";
    if (!acc[type]) acc[type] = [];
    acc[type].push(court);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg border border-[#8EA58C] shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-[#BFCFBB]">
        <h2 className="text-xl font-semibold text-[#344C3D]">Reserve a Court</h2>
        <p className="text-[#566F5B] mt-1">Book your preferred court time</p>
        <div className="mt-3 text-sm text-[#566F5B]">
          <p>
            <strong>Reserving as:</strong> {currentUser.firstName} {currentUser.lastName}
          </p>
          <p>
            <strong>GUC ID:</strong> {currentUser.gucId}
          </p>
        </div>
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

      {/* Content */}
      <div className="p-6">
        <div className="space-y-8">
          {Object.entries(courtsByType).map(([type, typeCourts]) => (
            <div key={type}>
              <h3 className="text-[#344C3D] mb-4 font-semibold text-lg">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              <div className="space-y-4">
                {typeCourts.map((court) => {
                  const isSelected = selectedCourt?._id === court._id;
                  const availableDates = court.availability?.map((slot) => slot.date) || [];

                  return (
                    <div
                      key={court._id}
                      className={`bg-white rounded-lg border p-6 transition-all ${
                        isSelected
                          ? "border-[#344C3D] shadow-md"
                          : "border-[#BFCFBB] hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-[#344C3D]" />
                        <h3 className="text-[#344C3D] font-medium">{court.name}</h3>
                        <span className="px-3 py-1 bg-[#8EA58C] text-white rounded-full text-sm font-medium capitalize">
                          {court.type || "court"}
                        </span>
                      </div>

                      {/* Date Selection */}
                      {availableDates.length > 0 ? (
                        <div className="space-y-4">
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
                              <option value="">Choose a date...</option>
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
                                Select Time
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {getAvailableTimesForDate(court, selectedDate).map((time) => (
                                  <button
                                    key={time}
                                    onClick={() => {
                                      setSelectedTime(time);
                                      setMessage({ type: "", text: "" });
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                      selectedTime === time
                                        ? "bg-[#344C3D] text-white"
                                        : "border border-[#8EA58C] text-[#344C3D] bg-white hover:bg-[#F5F7F5]"
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reserve Button */}
                          {isSelected && selectedDate && selectedTime && (
                            <button
                              onClick={handleReservation}
                              disabled={submitting}
                              className={`w-full py-3 rounded-lg font-semibold transition ${
                                submitting
                                  ? "bg-[#BFCFBB] text-[#738A6E] cursor-not-allowed"
                                  : "bg-[#344C3D] text-white hover:bg-[#2a3d31]"
                              }`}
                            >
                              {submitting ? "Reserving..." : "Confirm Reservation"}
                            </button>
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

export default CourtReservation;