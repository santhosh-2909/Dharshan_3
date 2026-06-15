import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import Loader from "../components/Loader.jsx";

const SEVERITY_STYLES = {
  critical: { bg: "rgba(168,56,43,0.12)", color: "#a8382b", icon: "alert" },
  warning: { bg: "rgba(196,122,27,0.12)", color: "#c47a1b", icon: "alert" },
  info: { bg: "rgba(74,100,125,0.12)", color: "var(--c-stone)", icon: "bell" },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [checking, setChecking] = useState(false);

  function load() {
    api.alerts().then(setAlerts).catch(() => setAlerts([]));
  }

  useEffect(() => { load(); }, []);

  async function runCheck() {
    setChecking(true);
    try {
      const newAlerts = await api.alertsCheck();
      if (newAlerts.length > 0) {
        load();
      }
    } catch { /* ignore */ }
    setChecking(false);
  }

  if (!alerts) return <Loader />;

  return (
    <>
      <PageHeader kicker="Monitoring" title="Anomaly Alerts" />

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={runCheck} disabled={checking}>
          <Icon name="shield" size={16} />
          {checking ? "Checking..." : "Run Anomaly Check"}
        </button>
        <button className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="shield" size={28} /></div>
          <h3>All Clear</h3>
          <p>No active anomaly alerts. The temple is operating within expected parameters.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {alerts.map((a) => {
            const style = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info;
            return (
              <div key={a.id} className="card" style={{ borderLeft: `4px solid ${style.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                    <span style={{ background: style.bg, color: style.color, borderRadius: "50%", width: 36, height: 36, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name={style.icon} size={18} />
                    </span>
                    <div>
                      <span className="kicker" style={{ color: style.color }}>{a.severity.toUpperCase()} — {a.alert_type}</span>
                      <p style={{ marginTop: "4px", color: "var(--c-ink)" }}>{a.message}</p>
                      <div className="card-meta" style={{ marginTop: "8px" }}>
                        <span>Expected: {a.expected_value}</span>
                        <span>Actual: {a.actual_value}</span>
                        <span>Deviation: {a.deviation_pct > 0 ? "+" : ""}{a.deviation_pct}%</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "var(--c-stone)", whiteSpace: "nowrap" }}>
                    {new Date(a.detected_at).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
