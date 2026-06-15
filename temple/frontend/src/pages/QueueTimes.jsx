import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import Loader from "../components/Loader.jsx";

export default function QueueTimes() {
  const [gates, setGates] = useState(null);

  useEffect(() => {
    api.queueWaitTimes().then(setGates).catch(() => setGates([]));
    const interval = setInterval(() => {
      api.queueWaitTimes().then(setGates).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!gates) return <Loader />;

  return (
    <>
      <PageHeader kicker="Queue Management" title="Gate Wait Times" />
      <p style={{ color: "var(--c-stone)", marginBottom: "24px" }}>
        Live estimated wait times at each entry gate. Updates every 30 seconds.
      </p>

      <div className="grid grid-2">
        {gates.map((g) => (
          <div key={g.gate_id} className={`card ${g.recommendation ? "queue-recommended" : ""} ${!g.is_open ? "queue-closed" : ""}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <span className="kicker">{g.is_open ? "OPEN" : "CLOSED"}</span>
                <h3>{g.name_en}</h3>
                <p className="tamil" style={{ fontSize: "0.9rem", color: "var(--c-stone)" }}>{g.name_ta}</p>
              </div>
              {g.recommendation && (
                <span className="band calm">{g.recommendation}</span>
              )}
              {!g.is_open && (
                <span className="band" style={{ background: "rgba(168,56,43,0.12)", color: "var(--c-danger)" }}>Closed</span>
              )}
            </div>

            {g.is_open ? (
              <div className="queue-stats">
                <div className="queue-wait">
                  <Icon name="clock" size={20} />
                  <span className="queue-wait-value">{g.estimated_wait_min}</span>
                  <span className="queue-wait-unit">min wait</span>
                </div>
                <div className="queue-meta">
                  <div><span className="label">People in queue</span><strong>{g.crowd_at_gate}</strong></div>
                  <div><span className="label">Throughput</span><strong>{g.throughput_per_min}/min</strong></div>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: "16px", color: "var(--c-stone)", fontStyle: "italic" }}>
                This gate is currently closed. Please use an alternative entry.
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
