import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import About from "./pages/About.jsx";
import Events from "./pages/Events.jsx";
import Bookings from "./pages/Bookings.jsx";
import BookingStats from "./pages/BookingStats.jsx";
import Donations from "./pages/Donations.jsx";
import Parking from "./pages/Parking.jsx";
import ParkingStats from "./pages/ParkingStats.jsx";
import CCTV from "./pages/CCTV.jsx";
import FinalReport from "./pages/FinalReport.jsx";
import Prediction from "./pages/Prediction.jsx";
import Feedback from "./pages/Feedback.jsx";
import FAQ from "./pages/FAQ.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? children : <Navigate to="/login?next=/bookings" replace />;
}

export default function App() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <Nav />
      <main id="main">
        {isLanding ? (
          <Routes>
            <Route path="/" element={<Landing />} />
          </Routes>
        ) : (
          <div className="container">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/events" element={<Events />} />
              <Route path="/bookings" element={<Protected><Bookings /></Protected>} />
              <Route path="/donations" element={<Donations />} />
              <Route path="/parking" element={<Parking />} />
              <Route path="/dashboard/parking" element={<ParkingStats />} />
              <Route path="/dashboard/bookings" element={<BookingStats />} />
              <Route path="/cctv" element={<CCTV />} />
              <Route path="/prediction" element={<Prediction />} />
              <Route path="/final-report" element={<FinalReport />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        )}
      </main>
      {!isLanding && <Footer />}
    </div>
  );
}
