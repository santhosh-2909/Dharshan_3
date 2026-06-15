import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Loader from "./components/Loader.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const Landing = lazy(() => import("./pages/Landing.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Events = lazy(() => import("./pages/Events.jsx"));
const Bookings = lazy(() => import("./pages/Bookings.jsx"));
const BookingStats = lazy(() => import("./pages/BookingStats.jsx"));
const Donations = lazy(() => import("./pages/Donations.jsx"));
const Parking = lazy(() => import("./pages/Parking.jsx"));
const ParkingStats = lazy(() => import("./pages/ParkingStats.jsx"));
const CCTV = lazy(() => import("./pages/CCTV.jsx"));
const FinalReport = lazy(() => import("./pages/FinalReport.jsx"));
const Prediction = lazy(() => import("./pages/Prediction.jsx"));
const Feedback = lazy(() => import("./pages/Feedback.jsx"));
const FAQ = lazy(() => import("./pages/FAQ.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Heatmap = lazy(() => import("./pages/Heatmap.jsx"));
const QueueTimes = lazy(() => import("./pages/QueueTimes.jsx"));
const StaffPlanner = lazy(() => import("./pages/StaffPlanner.jsx"));
const Alerts = lazy(() => import("./pages/Alerts.jsx"));
const Revenue = lazy(() => import("./pages/Revenue.jsx"));
const FestivalSurge = lazy(() => import("./pages/FestivalSurge.jsx"));
const OptimalVisit = lazy(() => import("./pages/OptimalVisit.jsx"));

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
        <Suspense fallback={<div className="container"><Loader /></div>}>
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
                <Route path="/heatmap" element={<Heatmap />} />
                <Route path="/queue" element={<QueueTimes />} />
                <Route path="/staff" element={<StaffPlanner />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/revenue" element={<Revenue />} />
                <Route path="/festivals" element={<FestivalSurge />} />
                <Route path="/optimal-visit" element={<OptimalVisit />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          )}
        </Suspense>
      </main>
      {!isLanding && <Footer />}
    </div>
  );
}
