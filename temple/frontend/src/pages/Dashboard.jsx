import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Icon from "../components/Icon.jsx";

const fmtINR = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === "ta";

  const [parking, setParking] = useState(null);
  const [booking, setBooking] = useState(null);
  const [today, setToday] = useState(null);
  const [live, setLive] = useState(null);
  const [report, setReport] = useState(null);
  const [surge, setSurge] = useState(null);
  const [queue, setQueue] = useState(null);
  const [staff, setStaff] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = () =>
      Promise.allSettled([
        api.parkingStats(),
        api.bookingStats(),
        api.crowdToday(),
        api.finalReport(),
        api.liveCrowd(), // drives continuous counting + the rising live total
        api.festivalSurge(),
        api.queueWait(),
        api.staffing(6),
      ]).then(([p, b, c, r, l, s, q, st]) => {
        if (p.status === "fulfilled") setParking(p.value);
        if (b.status === "fulfilled") setBooking(b.value);
        if (c.status === "fulfilled") setToday(c.value);
        if (r.status === "fulfilled") setReport(r.value);
        setLive(l.status === "fulfilled" ? l.value : null);
        if (s.status === "fulfilled") setSurge(s.value);
        if (q.status === "fulfilled") setQueue(q.value);
        if (st.status === "fulfilled") setStaff(st.value);
        const fail = [p, b, c, r].find((x) => x.status === "rejected");
        if (fail) setError(fail.reason?.message);
      });
    load();
    const id = setInterval(load, 5000); // refresh live data every 5s
    return () => clearInterval(id);
  }, []);

  if (error && !parking && !booking && !today) {
    return <div className="alert error">{t("common.error", { message: error })}</div>;
  }
  if (!parking || !booking || !today || !report) return <Loader />;

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
            <div className="label">{t("modules.dashboardHome.peopleDetected")}</div>
            <div className="value">{(live ? live.people_count : today.current_count).toLocaleString("en-IN")}</div>
            <div className="delta">
              <span className="status-pill green">{t("common.live")}</span>
              <span style={{ marginLeft: 8 }}>
                {live
                  ? t("modules.dashboardHome.inFrameNow", { n: live.in_frame })
                  : t("modules.dashboardHome.peopleDetectedSub", { peak: today.peak_count })}
              </span>
            </div>
          </div>
          <div className="dash-stat">
            <div className="label">{t("modules.dashboardHome.vehiclesParked")}</div>
            <div className="value">{parking.currently_parked.toLocaleString("en-IN")}</div>
            <div className="delta">
              {t("modules.dashboardHome.vehiclesParkedSub", { entered: parking.vehicles_entered, available: parking.available_slots })}
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
              <span className="num">{live ? live.people_count : today.current_count}</span>
              <span className="sub">{t("modules.cctv.countedToday")}</span>
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
            <Link to="/surge" className="module-card">
              <div className="ico"><Icon name="flame" /></div>
              <h3>{t("nav.surge")}</h3>
              <span className="num">
                {surge?.next_high_risk ? `${surge.next_high_risk.surge_pct >= 0 ? "+" : ""}${surge.next_high_risk.surge_pct}%` : "—"}
              </span>
              <span className="sub">
                {surge?.next_high_risk
                  ? (ta ? surge.next_high_risk.title_ta : surge.next_high_risk.title_en)
                  : t("modules.surge.kicker")}
              </span>
              <span style={{ marginTop: "auto", color: "var(--c-saffron-deep)", fontWeight: 600, fontSize: "0.85rem" }}>
                {t("modules.dashboardHome.openModule")} →
              </span>
            </Link>
            <Link to="/queue" className="module-card">
              <div className="ico"><Icon name="gate" /></div>
              <h3>{t("nav.queue")}</h3>
              <span className="num">
                {queue?.recommended_wait != null ? t("modules.queue.minWait", { n: queue.recommended_wait }) : "—"}
              </span>
              <span className="sub">
                {queue?.recommended_gate_id
                  ? (ta ? queue.recommended_gate_ta : queue.recommended_gate_en)
                  : t("modules.queue.kicker")}
              </span>
              <span style={{ marginTop: "auto", color: "var(--c-saffron-deep)", fontWeight: 600, fontSize: "0.85rem" }}>
                {t("modules.dashboardHome.openModule")} →
              </span>
            </Link>
            <Link to="/staffing" className="module-card">
              <div className="ico"><Icon name="users" /></div>
              <h3>{t("nav.staffing")}</h3>
              <span className="num">{staff ? staff.current_total_staff : "—"}</span>
              <span className="sub">{t("modules.staff.deployNow")}</span>
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
