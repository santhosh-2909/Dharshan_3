import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import OpsLayout from "../components/OpsLayout.jsx";
import Alert from "../components/Alert.jsx";

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export default function Prediction() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ta" ? "ta-IN" : "en-IN";

  const [target, setTarget] = useState(tomorrowISO());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (target < tomorrowISO()) {
      setError(t("modules.prediction.errorPast"));
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.predict(target);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const trendMax = result ? Math.max(...result.prev_years.map((p) => p.footfall), 1) : 1;

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.prediction.kicker")}</p>
          <h1>{t("modules.prediction.title")}</h1>
          <p className="page-header-lede">
            {t("modules.prediction.lede")}
          </p>
        </div>
      </header>

      <article className="dash-card">
        <form onSubmit={submit} className="prediction-form">
          <div className="field">
            <label htmlFor="dt">{t("modules.prediction.datePicker")}</label>
            <input
              id="dt"
              type="date"
              className="input"
              min={tomorrowISO()}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("modules.prediction.submitting") : t("modules.prediction.submit")}
          </button>
        </form>
        {busy && (
          <div className="center-row" style={{ marginTop: 18 }}>
            <span className="spinner" />
            <span>{t("modules.prediction.submitting")}</span>
          </div>
        )}
        <Alert type="error">{error}</Alert>
      </article>

      {!result && !busy && (
        <p className="page-header-lede" style={{ marginTop: 20 }}>
          {t("modules.prediction.noPredictionYet")}
        </p>
      )}

      {result && (
        <>
          <section className="fr-overall">
            <div className="label">{t("modules.prediction.predictedCrowd")}</div>
            <div className="value">{result.predicted_crowd.toLocaleString("en-IN")}</div>
            <div className="delta">
              <span className={`status-pill ${result.level_color}`}>{result.level}</span>
              <span className="delta-extra">
                {t("modules.prediction.confidenceRange")}:{" "}
                {result.confidence_low.toLocaleString("en-IN")}–
                {result.confidence_high.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="fr-overall-date">
              {new Date(result.target_date).toLocaleDateString(dateLocale, {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
              {result.is_festival && (
                <> · ✦ {t("modules.prediction.festivalDetected", { name: result.festival_name })}</>
              )}
            </div>
          </section>

          <section className="dash-grid">
            <article className="dash-card">
              <header className="dash-card-head">
                <h3>{t("modules.prediction.suggestions")}</h3>
              </header>
              <div className="dash-feed">
                <div className="dash-feed-row">
                  <div className="av">P</div>
                  <div className="body">
                    <p><strong>{result.suggestions.prasadam_servings.toLocaleString("en-IN")}</strong> · {t("modules.prediction.prasadamServings")}</p>
                    <small>{t("modules.prediction.prasadamKg", { kg: result.suggestions.prasadam_kg })}</small>
                  </div>
                </div>
                <div className="dash-feed-row">
                  <div className="av">V</div>
                  <div className="body">
                    <p><strong>{result.suggestions.parking_slots_needed.toLocaleString("en-IN")}</strong> · {t("modules.prediction.parkingSlots")}</p>
                  </div>
                </div>
                <div className="dash-feed-row">
                  <div className="av">S</div>
                  <div className="body">
                    <p><strong>{result.suggestions.staff_required}</strong> · {t("modules.prediction.staffRequired")}</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="dash-card">
              <header className="dash-card-head">
                <h3>{t("modules.prediction.trendCompare")}</h3>
              </header>
              {result.prev_years.length === 0 ? (
                <p>{t("modules.prediction.noTrend")}</p>
              ) : (
                <>
                  <div
                    className="dash-chart"
                    style={{ height: 140, gridTemplateColumns: `repeat(${result.prev_years.length}, 1fr)` }}
                  >
                    {[...result.prev_years].reverse().map((p) => (
                      <span
                        key={p.year}
                        className={"b" + (p.is_festival ? " is-now" : "")}
                        style={{ height: `${(p.footfall / trendMax) * 100}%` }}
                        title={`${p.date}: ${p.footfall.toLocaleString("en-IN")}`}
                      />
                    ))}
                  </div>
                  <div
                    className="dash-chart-axis"
                    style={{ gridTemplateColumns: `repeat(${result.prev_years.length}, 1fr)` }}
                  >
                    {[...result.prev_years].reverse().map((p) => (
                      <span key={p.year}>{p.year}</span>
                    ))}
                  </div>
                </>
              )}
            </article>
          </section>

          <article className="dash-card">
            <header className="dash-card-head">
              <h3>{t("modules.prediction.notesTitle")}</h3>
              <span className="card-tag">{result.method}</span>
            </header>
            <dl className="kv" style={{ marginTop: 10 }}>
              <dt>{t("modules.prediction.weighted")}</dt>
              <dd>{result.weighted_baseline.toLocaleString("en-IN")}</dd>
              <dt>{t("modules.prediction.trend")}</dt>
              <dd>{result.trend_factor.toLocaleString("en-IN")}</dd>
              <dt>{t("modules.prediction.seasonal")}</dt>
              <dd>×{result.seasonal_factor.toFixed(3)}</dd>
              <dt>{t("modules.prediction.festival")}</dt>
              <dd>×{result.festival_factor.toFixed(2)}</dd>
            </dl>
            <ul className="fr-summary" style={{ marginTop: 14 }}>
              {result.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </article>
        </>
      )}
    </OpsLayout>
  );
}
