import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Icon from "../components/Icon.jsx";

const fmtINR = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function Dashboard() {
  const { t } = useTranslation();

  const [parking, setParking] = useState(null);
  const [booking, setBooking] = useState(null);
  const [cctv, setCctv] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.parkingStats(),
      api.bookingStats(),
      api.cctvStats(),
      api.finalReport(),
    ]).then(([p, b, c, r]) => {
      if (p.status === "fulfilled") setParking(p.value);
      if (b.status === "fulfilled") setBooking(b.value);
      if (c.status === "fulfilled") setCctv(c.value);
      if (r.status === "fulfilled") setReport(r.value);
      const fail = [p, b, c, r].find((x) => x.status === "rejected");
      if (fail) setError(fail.reason?.message);
    });
  }, []);

  if (error && !parking && !booking && !cctv) {
    return <div className="alert error">{t("common.error", { message: error })}</div>;
  }
  if (!parking || !booking || !cctv || !report) return <Loader />;

  return (
    <div className="dash-shell">
      <Sidebar />

      <div className="dash-main">
        <header className="dash-head">
          <div>
            <p className="kicker">{t("modules.dashboardHome.kicker")}</p>
            <h1>{t("modules.dashboardHome.title")}</h1>
            <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--c-stone)" }}>
              {t("modules.dashboardHome.lede")}
            </p>
          </div>
        </header>

        <section className="dash-stats">
          <div className="dash-stat">
            <div className="label">{t("modules.dashboardHome.totalCrowd")}</div>
            <div className="value">{report.overall_total_crowd.toLocaleString("en-IN")}</div>
            <div className="delta">{t("modules.dashboardHome.totalCrowdSub")}</div>
          </div>
          <div className="dash-stat">
            <div className="label">{t("modules.dashboardHome.parkingStatus")}</div>
            <div className="value">{parking.occupancy_pct}%</div>
            <div className="delta">
              <span className={`status-pill ${parking.status_color}`}>
                {t(`modules.parkingOps.status${parking.status_color === "green" ? "Comfortable" : parking.status_color === "yellow" ? "Filling" : "Full"}`)}
              </span>
              <span style={{ marginLeft: 8 }}>
                {t("modules.dashboardHome.parkingStatusSub", { available: parking.available_slots })}
              </span>
            </div>
          </div>
          <div className="dash-stat">
            <div className="label">{t("modules.dashboardHome.totalBookings")}</div>
            <div className="value">{booking.total_bookings}</div>
            <div className="delta">
              {t("modules.dashboardHome.totalBookingsSub", { devotees: booking.total_devotees })}
            </div>
          </div>
          <div className="dash-stat">
            <div className="label">{t("modules.dashboardHome.cctvDetected")}</div>
            <div className="value">{cctv.total_detected_today.toLocaleString("en-IN")}</div>
            <div className="delta">
              {t("modules.dashboardHome.cctvDetectedSub", { cameras: cctv.cameras_online })}
            </div>
          </div>
        </section>

        <section className="section" style={{ marginTop: 32 }}>
          <div className="section-head">
            <p className="kicker">{t("modules.kicker")}</p>
            <span style={{ color: "var(--c-stone)", fontSize: "0.9rem" }}>
              {t("modules.dashboardHome.peakLine", { hour: String(report.peak_hour).padStart(2, "0") })}
            </span>
          </div>
          <div className="modules-grid">
            <Link to="/dashboard/parking" className="module-card">
              <div className="ico"><Icon name="parking" /></div>
              <h3>{t("nav.parking")}</h3>
              <span className="num">{parking.currently_parked}</span>
              <span className="sub">{t("modules.parkingOps.currentlyParked")}</span>
              <span style={{ marginTop: "auto", color: "var(--c-saffron-deep)", fontWeight: 600, fontSize: "0.85rem" }}>
                {t("modules.dashboardHome.openModule")} →
              </span>
            </Link>
            <Link to="/dashboard/bookings" className="module-card">
              <div className="ico"><Icon name="lotus" /></div>
              <h3>{t("nav.booking")}</h3>
              <span className="num">{booking.total_bookings}</span>
              <span className="sub">{t("modules.bookingOps.total")}</span>
              <span style={{ marginTop: "auto", color: "var(--c-saffron-deep)", fontWeight: 600, fontSize: "0.85rem" }}>
                {t("modules.dashboardHome.openModule")} →
              </span>
            </Link>
            <Link to="/cctv" className="module-card">
              <div className="ico"><Icon name="shield" /></div>
              <h3>{t("nav.cctv")}</h3>
              <span className="num">{cctv.current_count}</span>
              <span className="sub">{t("modules.cctv.currentCount")}</span>
              <span style={{ marginTop: "auto", color: "var(--c-saffron-deep)", fontWeight: 600, fontSize: "0.85rem" }}>
                {t("modules.dashboardHome.openModule")} →
              </span>
            </Link>
            <Link to="/prediction" className="module-card">
              <div className="ico"><Icon name="crystal" /></div>
              <h3>{t("nav.prediction")}</h3>
              <span className="num">5y</span>
              <span className="sub">{t("modules.prediction.kicker")}</span>
              <span style={{ marginTop: "auto", color: "var(--c-saffron-deep)", fontWeight: 600, fontSize: "0.85rem" }}>
                {t("modules.dashboardHome.openModule")} →
              </span>
            </Link>
            <Link to="/final-report" className="module-card">
              <div className="ico"><Icon name="layers" /></div>
              <h3>{t("nav.finalReport")}</h3>
              <span className="num">{report.overall_total_crowd.toLocaleString("en-IN")}</span>
              <span className="sub">{t("modules.finalReport.overallTotal")}</span>
              <span style={{ marginTop: "auto", color: "var(--c-saffron-deep)", fontWeight: 600, fontSize: "0.85rem" }}>
                {t("modules.dashboardHome.openModule")} →
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
