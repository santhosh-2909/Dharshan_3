import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import OpsLayout from "../components/OpsLayout.jsx";

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

// Festival tiers exactly as the XGBoost model was trained on.
const TIERS = ["NORMAL", "WEEKEND", "MEDIUM_LOW", "MEDIUM", "HIGH", "PEAK"];
const TEMPLES = ["Meenakshi Amman Temple", "Brihadeeswarar Temple"];
const LEVEL_COLOR = { Low: "green", Medium: "yellow", High: "red", "Very High": "red" };

export default function Prediction() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ta" ? "ta-IN" : "en-IN";

  const [form, setForm] = useState({
    date: tomorrowISO(),
    temple: TEMPLES[0],
    festival_tier: "NORMAL",
    temperature: 30,
    rainfall: 0,
    holiday: false,
    prasadam_sales: 0,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [todayCount, setTodayCount] = useState(null);

  // Live detected-people count for today (refreshed every 10s).
  useEffect(() => {
    const load = () => api.crowdToday().then(setTodayCount).catch(() => {});
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const res = await api.predictXgb({
        date: form.date,
        temple: form.temple,
        temperature: Number(form.temperature),
        rainfall: Number(form.rainfall),
        holiday: form.holiday ? 1 : 0,
        festival_tier: form.festival_tier,
        prasadam_sales: Number(form.prasadam_sales) || 0,
      });
      setResult(res);
      // Persist the predicted people count to the temple backend.
      api
        .storePrediction({
          expected_people: res.expected_footfall,
          source: "xgboost",
          predicted_for: `${form.date}T00:00:00`,
        })
        .then(() => setSaved(true))
        .catch(() => setSaved(false));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Operational planning estimates derived from the predicted footfall.
  const planning = result
    ? {
        prasadam_servings: Math.round(result.expected_footfall * 1.15),
        prasadam_kg: Math.round(result.expected_footfall * 0.12),
        parking_slots: Math.max(20, Math.round(result.expected_footfall / 5)),
        staff_required: Math.max(8, Math.round(result.expected_footfall / 75)),
      }
    : null;

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.prediction.kicker")}</p>
          <h1>{t("modules.prediction.title")}</h1>
          <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--c-stone)" }}>
            {t("modules.prediction.lede")}
          </p>
        </div>
      </header>

      {todayCount && (
        <section className="dash-stats" style={{ marginBottom: 18 }}>
          <div className="dash-stat">
            <div className="label">{t("modules.prediction.detectedToday")}</div>
            <div className="value">{todayCount.current_count.toLocaleString("en-IN")}</div>
            <div className="delta">
              <span className="status-pill green">{t("common.live")}</span>
              <span style={{ marginLeft: 8 }}>{t("modules.prediction.peakToday", { peak: todayCount.peak_count })}</span>
            </div>
          </div>
          <div className="dash-stat">
            <div className="label">{t("modules.prediction.detectionsToday")}</div>
            <div className="value">{todayCount.detections.toLocaleString("en-IN")}</div>
            <div className="delta">{t("modules.prediction.detectionsTodaySub")}</div>
          </div>
        </section>
      )}

      <article className="dash-card">
        <header className="dash-card-head">
          <h3>{t("modules.prediction.datePicker")}</h3>
          <span className="card-tag">{t("modules.prediction.engine")}</span>
        </header>

        <form
          onSubmit={submit}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 12 }}
        >
          <div className="field">
            <label htmlFor="dt">{t("modules.prediction.datePicker")}</label>
            <input id="dt" type="date" className="input" min={tomorrowISO()} value={form.date} onChange={set("date")} required />
          </div>

          <div className="field">
            <label htmlFor="tmp">{t("modules.prediction.temple")}</label>
            <select id="tmp" className="input" value={form.temple} onChange={set("temple")}>
              {TEMPLES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor="tier">{t("modules.prediction.festivalTier")}</label>
            <select id="tier" className="input" value={form.festival_tier} onChange={set("festival_tier")}>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>{t(`modules.prediction.tierLabels.${tier}`)}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="temp">{t("modules.prediction.temperature")}</label>
            <input id="temp" type="number" step="0.1" className="input" value={form.temperature} onChange={set("temperature")} required />
          </div>

          <div className="field">
            <label htmlFor="rain">{t("modules.prediction.rainfall")}</label>
            <input id="rain" type="number" step="0.1" min="0" className="input" value={form.rainfall} onChange={set("rainfall")} required />
          </div>

          <div className="field">
            <label htmlFor="pras">{t("modules.prediction.prasadam")}</label>
            <input id="pras" type="number" min="0" className="input" value={form.prasadam_sales} onChange={set("prasadam_sales")} />
          </div>

          <div className="field" style={{ alignSelf: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.holiday} onChange={set("holiday")} />
              {t("modules.prediction.holiday")}
            </label>
          </div>

          <div className="field" style={{ alignSelf: "end" }}>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%" }}>
              {busy ? t("modules.prediction.predicting") : t("modules.prediction.submit")}
            </button>
          </div>
        </form>

        {busy && (
          <div className="center-row" style={{ marginTop: 18 }}>
            <span className="spinner" />
            <span>{t("modules.prediction.predicting")}</span>
          </div>
        )}
        {error && <div className="alert error" style={{ marginTop: 14 }}>{error}</div>}
      </article>

      {!result && !busy && (
        <p style={{ marginTop: 20, color: "var(--c-stone)" }}>{t("modules.prediction.noPredictionYet")}</p>
      )}

      {result && (
        <>
          <section className="fr-overall" style={{ marginTop: 18 }}>
            <div className="label">{t("modules.prediction.expectedFootfall")}</div>
            <div className="value">{result.expected_footfall.toLocaleString("en-IN")}</div>
            <div className="delta">
              <span className={`status-pill ${LEVEL_COLOR[result.crowd_level] || ""}`}>
                {t(`modules.prediction.levels.${result.crowd_level}`, result.crowd_level)}
              </span>
              <span style={{ marginLeft: 10 }}>{t(`modules.prediction.tierLabels.${result.festival_tier}`)}</span>
            </div>
            <div style={{ marginTop: 12, color: "rgba(251,246,236,.7)", fontSize: "0.85rem" }}>
              {result.temple} ·{" "}
              {new Date(result.date).toLocaleDateString(dateLocale, {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
              {saved && <> · ✓ {t("modules.prediction.saved")}</>}
            </div>
          </section>

          <article className="dash-card" style={{ marginTop: 18 }}>
            <header className="dash-card-head">
              <h3>{t("modules.prediction.planning")}</h3>
              <span className="status-pill green">{t("modules.prediction.engine")}</span>
            </header>
            <div className="dash-feed">
              <div className="dash-feed-row">
                <div className="av">P</div>
                <div className="body">
                  <p><strong>{planning.prasadam_servings.toLocaleString("en-IN")}</strong> · {t("modules.prediction.prasadamServings")}</p>
                  <small>{t("modules.prediction.prasadamKg", { kg: planning.prasadam_kg.toLocaleString("en-IN") })}</small>
                </div>
              </div>
              <div className="dash-feed-row">
                <div className="av">V</div>
                <div className="body">
                  <p><strong>{planning.parking_slots.toLocaleString("en-IN")}</strong> · {t("modules.prediction.parkingSlots")}</p>
                </div>
              </div>
              <div className="dash-feed-row">
                <div className="av">S</div>
                <div className="body">
                  <p><strong>{planning.staff_required.toLocaleString("en-IN")}</strong> · {t("modules.prediction.staffRequired")}</p>
                </div>
              </div>
            </div>
          </article>
        </>
      )}
    </OpsLayout>
  );
}
