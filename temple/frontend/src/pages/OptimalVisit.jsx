import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import Loader from "../components/Loader.jsx";

export default function OptimalVisit() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.optimalVisit().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Loader />;

  return (
    <>
      <PageHeader kicker="Visit Planner" title="Best Times to Visit" />
      <p style={{ color: "var(--c-stone)", marginBottom: "24px" }}>
        AI-recommended visit times based on today's crowd predictions. Plan your darshan for the shortest wait.
      </p>

      <div className="grid grid-2" style={{ marginBottom: "32px" }}>
        <div className="stat">
          <span className="label">Current Status</span>
          <span className={`band ${data.current_band.toLowerCase()}`} style={{ marginTop: "8px", display: "inline-flex" }}>{data.current_band}</span>
        </div>
        <div className="stat">
          <span className="label">Current Wait</span>
          <span className="value">{data.current_wait_min} min</span>
        </div>
      </div>

      <h2 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>
        <Icon name="compass" size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
        Recommended Visit Slots
      </h2>
      <div className="grid grid-3" style={{ marginBottom: "32px" }}>
        {data.best_slots.map((slot, i) => (
          <div key={slot.hour} className="card optimal-slot">
            <div className="optimal-rank">#{i + 1}</div>
            <div className="optimal-time">{slot.hour}:00</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <div>
                <span className="label">Wait</span>
                <strong style={{ display: "block" }}>{slot.estimated_wait_min} min</strong>
              </div>
              <div>
                <span className="label">Crowd</span>
                <strong style={{ display: "block" }}>{slot.expected_visitors}</strong>
              </div>
            </div>
            <span className={`band ${slot.band.toLowerCase()}`} style={{ marginTop: "8px" }}>{slot.band}</span>
            {slot.recommendation && (
              <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--c-saffron)" }}>{slot.recommendation}</p>
            )}
          </div>
        ))}
      </div>

      {data.avoid_hours.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "var(--c-danger)" }}>
            <Icon name="alert" size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            Avoid These Hours
          </h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {data.avoid_hours.map((h) => (
              <span key={h} className="card-tag" style={{ background: "rgba(168,56,43,0.12)", color: "var(--c-danger)", fontSize: "0.9rem", padding: "8px 16px" }}>
                {h}:00
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}
