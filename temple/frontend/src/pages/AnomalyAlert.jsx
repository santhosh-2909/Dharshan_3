import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";
import Icon from "../components/Icon.jsx";

const fmt = (n) => Number(n).toLocaleString("en-IN");

export default function AnomalyAlert() {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === "ta";

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [count, setCount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.anomalyStatus().then(setData).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // keep the baseline fresh
    return () => clearInterval(id);
  }, []);

  const check = async (e) => {
    e.preventDefault();
    const n = parseInt(count, 10);
    if (Number.isNaN(n) || n < 0) return;
    setSubmitting(true);
    try {
      const res = await api.anomalyCheck(n);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !data) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!data) return <OpsLayout><Loader /></OpsLayout>;

  const festival = ta ? data.festival_ta : data.festival_en;
  const reasonParams = { pct: data.abs_pct, threshold: data.threshold_pct, festival: festival || "" };
  // Big banner only once a reading has been checked.
  const banner = data.has_check
    ? (data.is_anomaly ? "alert" : "ok")
    : "idle";

  const checkedTime = data.checked_at
    ? new Date(data.checked_at).toLocaleTimeString(ta ? "ta-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.anomaly.kicker")}</p>
          <h1>{t("modules.anomaly.title")}</h1>
          <p style={{ marginTop: 8, maxWidth: "62ch", color: "var(--c-stone)" }}>
            {t("modules.anomaly.lede")}
          </p>
        </div>
      </header>

      {/* Verdict banner */}
      <section
        className="dash-card"
        style={{
          marginTop: 6,
          borderLeft: `5px solid ${data.has_check ? (data.is_anomaly ? (data.severity_color === "red" ? "#d64545" : "#d6b23d") : "#4e9d6c") : "var(--c-border)"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span
            className={`anomaly-ico ${banner}`}
            aria-hidden="true"
            style={{
              width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 12,
              background: banner === "alert" ? "rgba(214,69,69,.14)" : banner === "ok" ? "rgba(78,157,108,.14)" : "rgba(120,113,108,.12)",
              color: banner === "alert" ? "#d64545" : banner === "ok" ? "#4e9d6c" : "var(--c-stone)",
            }}
          >
            <Icon name={banner === "ok" ? "shield" : "alert"} size={24} />
          </span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", margin: 0, fontSize: "1.4rem" }}>
              {banner === "alert" ? t("modules.anomaly.somethingOff")
                : banner === "ok" ? t("modules.anomaly.nominal")
                : t("modules.anomaly.monitoring")}
            </h2>
            {data.has_check && (
              <p style={{ margin: "6px 0 0", color: "var(--c-stone)" }}>
                {t(`modules.anomaly.reasons.${data.reason_key}`, reasonParams)}
              </p>
            )}
          </div>
          {data.has_check && (
            <span className={`status-pill ${data.severity_color}`}>
              {data.deviation_pct >= 0 ? "+" : ""}{data.deviation_pct}%
            </span>
          )}
        </div>

        {data.has_check && (
          <div className="anomaly-action" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "var(--c-bg-elev)", border: "1px solid var(--c-border)" }}>
            <strong style={{ display: "block", marginBottom: 4 }}>{t("modules.anomaly.recommendedAction")}</strong>
            <span>{t(`modules.anomaly.actions.${data.reason_key}`, reasonParams)}</span>
          </div>
        )}
      </section>

      {/* Expected vs actual numbers */}
      <section className="dash-stats" style={{ marginTop: 16 }}>
        <div className="dash-stat">
          <div className="label">{t("modules.anomaly.forecastNow")}</div>
          <div className="value">{fmt(data.expected)}</div>
          <div className="delta"><span className="status-pill green">{t("common.live")}</span></div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.anomaly.actualCount")}</div>
          <div className="value">{data.actual != null ? fmt(data.actual) : "—"}</div>
          <div className="delta">
            {checkedTime ? t("modules.anomaly.checkedAt", { time: checkedTime }) : t("modules.anomaly.noReading")}
          </div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.anomaly.festivalToday")}</div>
          <div className="value" style={{ fontSize: festival ? "1.3rem" : undefined }}>
            {festival || t("modules.anomaly.none")}
          </div>
          <div className="delta">
            {data.is_festival_today ? t("modules.anomaly.festivalContext") : t("modules.anomaly.normalDay")}
          </div>
        </div>
      </section>

      {/* Manual gate-count input */}
      <article className="dash-card" style={{ marginTop: 16 }}>
        <header className="dash-card-head"><h3>{t("modules.anomaly.enterCount")}</h3></header>
        <p style={{ color: "var(--c-stone)", marginTop: 0 }}>{t("modules.anomaly.enterHint")}</p>
        <form onSubmit={check} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder={t("modules.anomaly.countPlaceholder")}
            style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-bg-elev)", color: "var(--c-ink)" }}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting || count === ""}>
            {submitting ? t("modules.anomaly.checking") : t("modules.anomaly.checkNow")}
          </button>
        </form>
        <p style={{ color: "var(--c-stone)", fontSize: "0.82rem", marginTop: 12 }}>
          {t("modules.anomaly.thresholdNote", { threshold: data.threshold_pct })}
        </p>
      </article>
    </OpsLayout>
  );
}
