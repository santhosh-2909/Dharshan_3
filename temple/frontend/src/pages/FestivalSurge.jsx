import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";

const fmtSurge = (pct) => `${pct >= 0 ? "+" : ""}${pct}%`;

function daysAwayLabel(t, n) {
  if (n <= 0) return t("modules.surge.today");
  if (n === 1) return t("modules.surge.tomorrow");
  return t("modules.surge.daysAway", { n });
}

export default function FestivalSurge() {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === "ta";
  const dateLocale = ta ? "ta-IN" : "en-IN";

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api.festivalSurge().then(setData).catch((e) => setError(e.message));
  }, []);

  // Tick the countdown every second.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (error) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!data) return <OpsLayout><Loader /></OpsLayout>;

  const next = data.next_high_risk;
  // Count down to the festival morning (06:00 local).
  const targetMs = next ? new Date(`${next.date}T06:00:00`).getTime() : null;
  const diff = targetMs ? Math.max(0, targetMs - now) : 0;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const unit = (value, label) => (
    <div style={{ textAlign: "center", minWidth: 64 }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.4rem", lineHeight: 1, fontWeight: 700 }}>
        {String(value).padStart(2, "0")}
      </div>
      <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(251,246,236,.7)" }}>
        {label}
      </div>
    </div>
  );

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.surge.kicker")}</p>
          <h1>{t("modules.surge.title")}</h1>
          <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--c-stone)" }}>
            {t("modules.surge.lede")}
          </p>
        </div>
      </header>

      {/* Countdown to the next high-risk day */}
      {next && (
        <section className="fr-overall" style={{ marginTop: 6 }}>
          <div className="label">{t("modules.surge.countdownTo", { name: ta ? next.title_ta : next.title_en })}</div>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-end", marginTop: 10, flexWrap: "wrap" }}>
            {unit(days, t("modules.surge.days"))}
            {unit(hours, t("modules.surge.hrs"))}
            {unit(mins, t("modules.surge.min"))}
            {unit(secs, t("modules.surge.sec"))}
          </div>
          <div className="delta" style={{ marginTop: 14 }}>
            <span className={`status-pill ${next.level_color}`}>{t(`modules.surge.levels.${next.level}`)}</span>
            <span style={{ marginLeft: 10 }}>
              {t("modules.surge.surgeExpected", { pct: fmtSurge(next.surge_pct) })} · {daysAwayLabel(t, next.days_away)}
            </span>
          </div>
        </section>
      )}

      {/* Upcoming festival calendar */}
      <article className="dash-card" style={{ marginTop: 18 }}>
        <header className="dash-card-head">
          <h3>{t("modules.surge.upcomingTitle")}</h3>
        </header>

        {data.festivals.length === 0 ? (
          <p>{t("modules.surge.noEvents")}</p>
        ) : (
          <div className="dash-feed">
            {data.festivals.map((f) => (
              <div key={f.id} className="dash-feed-row" style={{ alignItems: "center" }}>
                <div className="av" aria-hidden="true">{f.is_festival ? "✦" : "•"}</div>
                <div className="body" style={{ flex: 1 }}>
                  <p style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong>{ta ? f.title_ta : f.title_en}</strong>
                    <span className={`status-pill ${f.level_color}`}>
                      {t("modules.surge.surgeExpected", { pct: fmtSurge(f.surge_pct) })}
                    </span>
                  </p>
                  <small style={{ color: "var(--c-stone)" }}>
                    {new Date(f.date).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "long" })}
                    {" · "}{daysAwayLabel(t, f.days_away)}
                    {" · "}{t("modules.surge.normalVsPredicted", {
                      normal: f.normal_footfall.toLocaleString("en-IN"),
                      predicted: f.predicted_footfall.toLocaleString("en-IN"),
                    })}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </OpsLayout>
  );
}
