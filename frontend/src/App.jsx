import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage  from "./LoginPage";
import ToastContainer from "./components/ToastContainer"; // Add this import
import VendorLostAndFound from "./pages/VendorLostAndFound";

// Dashboards
import  {StudentDashboard} from "./pages/StudentDashboard";
import { StaffDashboard } from "./pages/StaffDashboard";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import  AdminDashboard  from "./pages/AdminDashboard";
import EventsOfficeDashboard from "./pages/EventsOfficeDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import { TADashboard } from "./pages/TaDashboard";

// Vendor/Bazaar pages
import ApplyForm from "./components/ApplyForm";
import ApplicationsList from "./components/ApplicationsList";
import BoothApplicationForm from "./components/BoothApplicationForm";
import Events from "./pages/Events";
import CreateBazaar from "./pages/CreateBazaar";
import CreateTrip from "./pages/CreateTrip";
import EditBazaar from "./pages/EditBazaar";
import EditTrip from "./pages/EditTrip";
import Signup from "./SignupPage";
import RegisterEvent from "./pages/EventRegistration";
import MyEvents from "./pages/MyRegisteredEvents";
import Courts from "./pages/Courts";
import VendorRequests from "./components/events-office/VendorRequests";
import EventRegistrationPage from "./pages/EventRegistration";
import { Tab } from "@headlessui/react";

import VisitorQuiz from "./pages/VisitorQuiz"; // adjust path if needed
import ResetPasswordPage from "./pages/ResetPasswordPage"; // Import the ResetPasswordPage component

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [bazaars, setBazaars] = useState([]);
  const [selectedBazaar, setSelectedBazaar] = useState(null);
  const [selectedAcceptedBazaar, setSelectedAcceptedBazaar] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "Vendor" && user?.id) {
      fetch(`/api/vendors/bazaars/${user.id}`)
        .then((res) => res.json())
        .then((data) => setBazaars(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      {/* Add your custom ToastContainer here */}
      <ToastContainer />
      
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={<LoginPage onLogin={setUser} onSwitchToSignup={() => navigate("/signup")} />}
        />

        {/* SIGN UP */}
        <Route
          path="/signup"
          element={
            <Signup
              onSignup={() => navigate("/login")}
              onSwitchToLogin={() => navigate("/login")}
            />
          }
        />

        {/* DASHBOARDS BY ROLE */}
        <Route
          path="/student-dashboard"
          element={<StudentDashboard onLogout={handleLogout} />}
        />

        <Route
          path="/staff-dashboard"
          element={<StaffDashboard onLogout={handleLogout} />}
        />

        <Route
          path="/ta-dashboard"
          element={<TADashboard onLogout={handleLogout} />}
        />

        <Route
          path="/admin-dashboard"
          element={<AdminDashboard onLogout={handleLogout} />}
        />

        <Route
          path="/events-office"
          element={<EventsOfficeDashboard user={user} onLogout={handleLogout} />}
        />

        <Route
          path="/vendor-dashboard"
          element={<VendorDashboard onLogout={handleLogout} />}
        />

        {/* VENDOR ROUTES */}
        <Route
          path="/apply"
          element={
            user?.role === "Vendor" && selectedBazaar ? (
              <ApplyForm
                bazaar={selectedBazaar}
                vendorId={user.id}
                onSubmit={() => navigate("/applications")}
              />
            ) : (
              <Navigate to="/vendor-dashboard" />
            )
          }
        />

        <Route
          path="/applications"
          element={
            user?.role === "Vendor" ? (
              <ApplicationsList
                vendorId={user.id}
                onApplyForBooth={(bazaarApp) => {
                  setSelectedAcceptedBazaar(bazaarApp);
                  navigate("/apply-booth");
                }}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/apply-booth"
          element={
            user?.role === "Vendor" && selectedAcceptedBazaar ? (
              <BoothApplicationForm
                bazaarApplication={selectedAcceptedBazaar}
                vendorId={user.id}
                onSubmit={() => navigate("/applications")}
              />
            ) : (
              <Navigate to="/applications" />
            )
          }
        />
        <Route path="/vendor/lost-found" element={<VendorLostAndFound />} />

        {/* PROFESSOR DASHBOARD ROUTE */}
        <Route
          path="/professor-dashboard"
          element={<ProfessorDashboard user={user} onLogout={handleLogout} />}
        />

        <Route path="/register" element={<RegisterEvent />} />

        <Route
          path="/my-events"
          element={
            user ? (
              <>
                {console.log("🔍 Full User object in App.js:", user)}
                {console.log("🔍 User ID being passed:", user?.id || user?._id)}
                {console.log("🔍 User Type being passed:", user?.role)}
                <MyEvents
                  userId={user?.id || user?._id}
                  userType={user?.role}
                />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* DEFAULT */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? user.role === "EventsOffice"
                    ? "/events-office"
                    : user.role === "Vendor"
                    ? "/vendor-dashboard"
                    : ["Unknown", "unknown"].includes(user.role)
                    ? "/login"
                    : user.role
                    ? `/${user.role.toLowerCase()}-dashboard`
                    : "/login"
                  : "/login"
              }
            />
          }
        />

        {/* Events and Creation Pages (Shared / Admin) */}
        <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
        <Route path="/create-bazaar" element={user ? <CreateBazaar /> : <Navigate to="/login" />} />
        <Route path="/create-trip" element={user ? <CreateTrip /> : <Navigate to="/login" />} />
        <Route path="/edit-bazaar/:id" element={user ? <EditBazaar /> : <Navigate to="/login" />} />
        <Route path="/edit-trip/:id" element={user ? <EditTrip /> : <Navigate to="/login" />} />
        <Route path="/test1" element={<ProfessorDashboard />} />
        <Route path="/test2" element={<AdminDashboard />} />
        <Route path="/test3" element={<StudentDashboard />} />
        <Route path="/test4" element={<TADashboard />} />
       
        <Route path="/visitor-quiz" element={<VisitorQuiz />} />
        <Route path="/test4" element={<EventsOfficeDashboard />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </div>
  );
}