import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit } from "@fortawesome/free-solid-svg-icons";
import CreateBazaar from "./CreateBazaar";
import CreateTrip from "./CreateTrip";
import EditBazaar from "./EditBazaar";
import EditTrip from "./EditTrip";
import { sharedStyles } from "../styles/components";
import { colors } from "../styles/colors";

const Events = () => {
  const [events, setEvents] = useState({ bazaars: [], trips: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  
  // Hover states
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [addButtonHovered, setAddButtonHovered] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Fetch events whenever searchQuery changes
  useEffect(() => {
    fetchEvents(searchQuery);
  }, [searchQuery]);

  const fetchEvents = async (query = "") => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/events/search?name=${encodeURIComponent(query)}`);
      const bazaars = res.data.events.filter((e) => e.category === "bazaar");
      const trips = res.data.events.filter((e) => e.category === "trip");
      setEvents({ bazaars, trips });
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents({ bazaars: [], trips: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => setShowAddMenu((prev) => !prev);

  const handleCreateBazaar = () => {
    setModalContent(<CreateBazaar onClose={handleCloseModal} />);
    setShowModal(true);
    setShowAddMenu(false);
  };

  const handleCreateTrip = () => {
    setModalContent(<CreateTrip onClose={handleCloseModal} />);
    setShowModal(true);
    setShowAddMenu(false);
  };

  const handleEditBazaar = (bazaar) => {
    setModalContent(<EditBazaar bazaar={bazaar} onClose={handleCloseModal} />);
    setShowModal(true);
  };

  const handleEditTrip = (trip) => {
    setModalContent(<EditTrip trip={trip} onClose={handleCloseModal} />);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalContent(null);
    fetchEvents(searchQuery);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isEditable = (event) => {
    const now = new Date();
    return event.startDateTime
      ? now < new Date(event.startDateTime)
      : now <= new Date(event.endDateTime);
  };

  return (
    <div style={sharedStyles.pageContainer}>
      <h2 style={sharedStyles.pageHeader}>Events</h2>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search events..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        style={inputFocused ? { ...sharedStyles.input, ...sharedStyles.inputFocus } : sharedStyles.input}
      />

      {loading && <p style={{ color: colors.Mughal, marginTop: '20px' }}>Loading events...</p>}

      {/* Bazaars */}
      <div style={{ marginBottom: "40px" }}>
        <h3 style={sharedStyles.sectionHeader}>Bazaars</h3>
        {events.bazaars.length === 0 && !loading && (
          <p style={{ color: colors.Mughal }}>No bazaars found.</p>
        )}
        {events.bazaars.map((b) => (
          <div
            key={b._id}
            style={hoveredCard === b._id ? sharedStyles.cardHover : sharedStyles.card}
            onMouseEnter={() => setHoveredCard(b._id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={sharedStyles.cardTitle}>{b.name}</h4>
                <p style={sharedStyles.cardSubtext}>📍 {b.location}</p>
                <p style={sharedStyles.cardDetail}>
                  🗓️ {formatDate(b.startDateTime)} - {formatDate(b.endDateTime)}
                </p>
              </div>
              {isEditable(b) && (
                <button
                  style={
                    hoveredButton === `bazaar-${b._id}`
                      ? { ...sharedStyles.editButton, ...sharedStyles.editButtonHover }
                      : sharedStyles.editButton
                  }
                  onMouseEnter={() => setHoveredButton(`bazaar-${b._id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handleEditBazaar(b)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trips */}
      <div>
        <h3 style={sharedStyles.sectionHeader}>Trips</h3>
        {events.trips.length === 0 && !loading && (
          <p style={{ color: colors.Mughal }}>No trips found.</p>
        )}
        {events.trips.map((t) => (
          <div
            key={t._id}
            style={hoveredCard === t._id ? sharedStyles.cardHover : sharedStyles.card}
            onMouseEnter={() => setHoveredCard(t._id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={sharedStyles.cardTitle}>{t.name}</h4>
                <p style={sharedStyles.cardSubtext}>📍 {t.location}</p>
                <p style={sharedStyles.cardDetail}>
                  🗓️ {formatDate(t.startDateTime)} - {formatDate(t.endDateTime)}
                </p>
                <p style={sharedStyles.cardSubtext}>💰 Price: ${t.price}</p>
              </div>
              {isEditable(t) && (
                <button
                  style={
                    hoveredButton === `trip-${t._id}`
                      ? { ...sharedStyles.editButton, ...sharedStyles.editButtonHover }
                      : sharedStyles.editButton
                  }
                  onMouseEnter={() => setHoveredButton(`trip-${t._id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handleEditTrip(t)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        style={
          addButtonHovered
            ? { ...sharedStyles.addButton, ...sharedStyles.addButtonHover }
            : sharedStyles.addButton
        }
        onMouseEnter={() => setAddButtonHovered(true)}
        onMouseLeave={() => setAddButtonHovered(false)}
        onClick={handleAddClick}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>

      {/* Add Menu */}
      {showAddMenu && (
        <div style={sharedStyles.menu}>
          <button
            style={
              hoveredButton === 'create-bazaar'
                ? { ...sharedStyles.menuButton, ...sharedStyles.menuButtonHover }
                : sharedStyles.menuButton
            }
            onMouseEnter={() => setHoveredButton('create-bazaar')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={handleCreateBazaar}
          >
            Create Bazaar
          </button>
          <button
            style={
              hoveredButton === 'create-trip'
                ? { ...sharedStyles.menuButton, ...sharedStyles.menuButtonHover }
                : { ...sharedStyles.menuButton, marginBottom: 0 }
            }
            onMouseEnter={() => setHoveredButton('create-trip')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={handleCreateTrip}
          >
            Create Trip
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={sharedStyles.overlay}>
          <div style={sharedStyles.modal}>{modalContent}</div>
        </div>
      )}
    </div>
  );
};

export default Events;