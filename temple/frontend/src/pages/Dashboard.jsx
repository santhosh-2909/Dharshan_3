import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Icon from "../components/Icon.jsx";
import Alert from "../components/Alert.jsx";

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
    return <Alert type="error">{t("common.error", { message: error })}</Alert>;
  }
  if (!parking || !booking || !cctv || !report) return <Loader />;

  const modules = [
    {
      to: "/dashboard/parking", icon: "parking",
      label: t("nav.parking"), num: parking.currently_parked,
      sub: t("modules.parkingOps.currentlyParked"),
    },
    {
      to: "/dashboard/bookings", icon: "lotus",
      label: t("nav.booking"), num: booking.total_bookings,
      sub: t("modules.bookingOps.total"),
    },
    {
      to: "/cctv", icon: "shield",
      label: t("nav.cctv"), num: cctv.current_count,
      sub: t("modules.cctv.currentCount"),
    },
    {
      to: "/prediction", icon: "crystal",
      label: t("nav.prediction"), num: "5y",
      sub: t("modules.prediction.kicker"),
    },
    {
      to: "/final-report", icon: "layers",
      label: t("nav.finalReport"), num: report.overall_total_crowd.toLocaleString("en-IN"),
      sub: t("modules.finalReport.overallTotal"),
    },
  ];

  return (
    <div className="dash-shell">
      <Sidebar />

      <div className="dash-main">
        <header className="dash-head">
          <div>
            <p className="kicker">{t("modules.dashboardHome.kicker")}</p>
            <h1>{t("modules.dashboardHome.title")}</h1>
            <p className="page-header-lede">
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
              <span className="delta-extra">
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

        <section className="section">
          <div className="section-head">
            <p className="kicker">{t("modules.kicker")}</p>
            <span className="page-header-lede" style={{ fontSize: "0.9rem", marginTop: 0 }}>
              {t("modules.dashboardHome.peakLine", { hour: String(report.peak_hour).padStart(2, "0") })}
            </span>
          </div>
          <div className="modules-grid">
            {modules.map((m) => (
              <Link key={m.to} to={m.to} className="module-card">
                <div className="ico"><Icon name={m.icon} /></div>
                <h3>{m.label}</h3>
                <span className="num">{m.num}</span>
                <span className="sub">{m.sub}</span>
                <span className="module-link">
                  {t("modules.dashboardHome.openModule")} →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
