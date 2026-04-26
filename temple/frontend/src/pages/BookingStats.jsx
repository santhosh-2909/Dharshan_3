import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";

export default function BookingStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.bookingStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!stats) return <OpsLayout><Loader /></OpsLayout>;

  const slotMax = Math.max(stats.by_slot.morning, stats.by_slot.afternoon, stats.by_slot.evening, 1);
  const trendMax = Math.max(...stats.by_day.map((d) => d.count), 1);

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.bookingOps.kicker")}</p>
          <h1>{t("modules.bookingOps.title")}</h1>
        </div>
        <Link to="/bookings" className="btn btn-ghost">{t("bookings.bookOne")} →</Link>
      </header>

      <section className="dash-stats">
        <div className="dash-stat">
          <div className="label">{t("modules.bookingOps.total")}</div>
          <div className="value">{stats.total_bookings.toLocaleString("en-IN")}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.bookingOps.totalDevotees")}</div>
          <div className="value">{stats.total_devotees.toLocaleString("en-IN")}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.bookingOps.morning")}</div>
          <div className="value">{stats.by_slot.morning}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.bookingOps.evening")}</div>
          <div className="value">{stats.by_slot.evening}</div>
        </div>
      </section>

      <div className="dash-grid" style={{ marginTop: 18 }}>
        <article className="dash-card">
          <header className="dash-card-head"><h3>{t("modules.bookingOps.title")}</h3></header>
          {[
            { key: "morning", label: t("modules.bookingOps.morning") },
            { key: "afternoon", label: t("modules.bookingOps.afternoon") },
            { key: "evening", label: t("modules.bookingOps.evening") },
          ].map((s) => (
            <div key={s.key} className="slot-row">
              <span className="t">{s.label}</span>
              <div className="meter">
                <span style={{ width: `${(stats.by_slot[s.key] / slotMax) * 100}%` }} />
              </div>
              <span className="n">{stats.by_slot[s.key]}</span>
            </div>
          ))}
        </article>

        <article className="dash-card">
          <header className="dash-card-head"><h3>{t("modules.bookingOps.trendTitle")}</h3></header>
          {stats.by_day.length === 0 ? (
            <p>{t("modules.bookingOps.noTrend")}</p>
          ) : (
            <>
              <div className="dash-chart" style={{ height: 140, gridTemplateColumns: `repeat(${stats.by_day.length}, 1fr)` }}>
                {stats.by_day.map((d) => (
                  <span
                    key={d.date}
                    className="b"
                    style={{ height: `${(d.count / trendMax) * 100}%` }}
                    title={`${d.date}: ${d.count}`}
                  />
                ))}
              </div>
              <div className="dash-chart-axis" style={{ gridTemplateColumns: `repeat(${stats.by_day.length}, 1fr)` }}>
                {stats.by_day.map((d) => (
                  <span key={d.date}>{d.date.slice(5)}</span>
                ))}
              </div>
            </>
          )}
        </article>
      </div>
    </OpsLayout>
  );
}
