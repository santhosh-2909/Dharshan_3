import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import Loader from "../components/Loader.jsx";

export default function FestivalSurge() {
  const [surges, setSurges] = useState(null);

  useEffect(() => {
    api.festivalSurges().then(setSurges).catch(() => setSurges([]));
  }, []);

  if (!surges) return <Loader />;

  return (
    <>
      <PageHeader kicker="Festival Intelligence" title="Surge Predictions" />
      <p style={{ color: "var(--c-stone)", marginBottom: "24px" }}>
        Predicted crowd surges for upcoming festivals based on 5 years of historical data.
      </p>

      {surges.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="calendar" size={28} /></div>
          <h3>No Upcoming Festivals</h3>
          <p>No festival events scheduled in the coming period.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {surges.map((s) => (
            <div key={s.event_id} className="card festival-surge-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <span className="kicker">{s.risk_level.toUpperCase()} RISK</span>
                  <h3>{s.title_en}</h3>
                  <p className="tamil" style={{ fontSize: "0.9rem", color: "var(--c-stone)" }}>{s.title_ta}</p>
                </div>
                <div className="festival-countdown">
                  <span className="festival-countdown-num">{s.days_away}</span>
                  <span className="festival-countdown-label">days away</span>
                </div>
              </div>

              <div className="festival-surge-bar-wrap">
                <div className="festival-surge-bar-bg">
                  <div
                    className="festival-surge-bar-fill"
                    style={{ width: `${Math.min(100, (s.surge_pct / 400) * 100)}%` }}
                  />
                </div>
                <span className="festival-surge-pct">+{Math.round(s.surge_pct)}%</span>
              </div>

              <div className="grid grid-3" style={{ marginTop: "12px", gap: "8px" }}>
                <div>
                  <span className="label" style={{ fontSize: "0.72rem" }}>Normal Day</span>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>{s.normal_footfall.toLocaleString()}</div>
                </div>
                <div>
                  <span className="label" style={{ fontSize: "0.72rem" }}>Predicted</span>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--c-saffron)" }}>{s.predicted_footfall.toLocaleString()}</div>
                </div>
                <div>
                  <span className="label" style={{ fontSize: "0.72rem" }}>Date</span>
                  <div style={{ fontSize: "0.95rem" }}>{new Date(s.starts_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
