import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";

export default function CCTV() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ people_count: "", camera_id: "main" });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);

  const refresh = useCallback(() => {
    api.cctvStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  if (error && !stats) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!stats) return <OpsLayout><Loader /></OpsLayout>;

  const max = Math.max(...stats.hourly.map((h) => h.people_count), 1);
  const nowHour = new Date().getHours();

  async function submit(e) {
    e.preventDefault();
    if (!form.people_count) return;
    setBusy(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await api.cctvIngest({
        people_count: Number(form.people_count),
        camera_id: form.camera_id || "main",
      });
      setSuccess(t("modules.cctv.ingestSuccess", { at: new Date(res.recorded_at).toLocaleTimeString() }));
      setForm({ ...form, people_count: "" });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.cctv.kicker")}</p>
          <h1>{t("modules.cctv.title")}</h1>
        </div>
      </header>

      <div className="dash-grid">
        <article className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="cctv-stage">
            <span className="live-dot">{t("common.live")}</span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", textAlign: "center", padding: "0 24px", maxWidth: "70%" }}>
              {t("modules.cctv.feedPlaceholder")}
            </span>
          </div>
        </article>

        <article className="dash-card">
          <header className="dash-card-head">
            <h3>{t("modules.cctv.ingestTitle")}</h3>
          </header>
          {error && <div className="alert error" style={{ marginBottom: 12 }}>{error}</div>}
          {success && <div className="alert success" style={{ marginBottom: 12 }}>{success}</div>}
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="cnt">{t("modules.cctv.ingestPeople")}</label>
              <input
                id="cnt"
                type="number"
                min="0"
                className="input"
                value={form.people_count}
                onChange={(e) => setForm({ ...form, people_count: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cam">{t("modules.cctv.ingestCamera")}</label>
              <input
                id="cam"
                className="input"
                value={form.camera_id}
                onChange={(e) => setForm({ ...form, camera_id: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t("modules.cctv.ingestSubmitting") : t("modules.cctv.ingestSubmit")}
            </button>
          </form>
        </article>
      </div>

      <section className="dash-stats" style={{ marginTop: 18 }}>
        <div className="dash-stat">
          <div className="label">{t("modules.cctv.totalDetected")}</div>
          <div className="value">{stats.total_detected_today.toLocaleString("en-IN")}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.cctv.currentCount")}</div>
          <div className="value">{stats.current_count}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.cctv.lastHour")}</div>
          <div className="value">{stats.last_hour.toLocaleString("en-IN")}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.cctv.camerasOnline")}</div>
          <div className="value">{stats.cameras_online}</div>
        </div>
      </section>

      <article className="dash-card" style={{ marginTop: 18 }}>
        <header className="dash-card-head">
          <h3>{t("modules.cctv.hourlyTitle")}</h3>
          <span className="status-pill green">{t("common.live")}</span>
        </header>
        {stats.hourly.length === 0 ? (
          <p>{t("modules.cctv.noData")}</p>
        ) : (
          <>
            <div className="cctv-bars">
              {stats.hourly.map((h) => (
                <span
                  key={h.hour}
                  className={"b" + (h.hour === nowHour ? " is-now" : "")}
                  style={{ height: `${(h.people_count / max) * 100}%` }}
                  title={`${h.hour}:00 — ${h.people_count}`}
                />
              ))}
            </div>
            <div className="dash-chart-axis" style={{ gridTemplateColumns: `repeat(${stats.hourly.length}, 1fr)` }}>
              {stats.hourly.map((h) => (
                <span key={h.hour}>{String(h.hour).padStart(2, "0")}</span>
              ))}
            </div>
          </>
        )}
      </article>
    </OpsLayout>
  );
}
