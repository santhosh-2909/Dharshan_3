import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const bandClass = (band = "Calm") => "band " + band.toLowerCase().replace(" ", " ");

export default function CrowdHighlight({ crowd }) {
  const { t, i18n } = useTranslation();
  const bars = crowd?.today_hourly ?? [];
  const max = Math.max(...bars.map((b) => b.expected), 1);
  const nowHour = new Date().getHours();
  const week = crowd?.next_seven_days ?? [];
  const localizedBand = (b) => t(`bands.${b}`, { defaultValue: b });
  const weekdayLocale = i18n.language === "ta" ? "ta-IN" : "en-IN";

  return (
    <section className="l-section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="l-crowd">
          <div className="reveal">
            <span className="kicker">{t("landing.crowd.kicker")}</span>
            <h2 style={{ marginTop: 14 }}>{t("landing.crowd.title")}</h2>
            <ul className="l-crowd-points">
              <li>{t("landing.crowd.p1")}</li>
              <li>{t("landing.crowd.p2")}</li>
              <li>{t("landing.crowd.p3")}</li>
              <li>{t("landing.crowd.p4")}</li>
            </ul>
            <Link to="/dashboard" className="btn btn-primary">{t("landing.crowd.ctaOpen")}</Link>
          </div>

          <div className="l-crowd-card reveal reveal-2">
            <div className="l-crowd-meta">
              <div>
                <div className="kicker">{t("landing.crowd.liveNow")}</div>
                <div className="now">{crowd?.current_visitors?.toLocaleString("en-IN") ?? "—"}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--c-stone)" }}>
                  {t("landing.crowd.ofCapacity", { pct: crowd?.occupancy_pct ?? 0, cap: crowd?.capacity ?? "—" })}
                </div>
              </div>
              <span className={bandClass(crowd?.band)}>{localizedBand(crowd?.band ?? "Calm")}</span>
            </div>

            <div className="l-crowd-bars" role="img" aria-label={t("landing.preview.chartTitle")}>
              {bars.length === 0
                ? Array.from({ length: 17 }).map((_, i) => (
                    <span key={`ph-${i}`} className="b" style={{ height: `${20 + ((i * 11) % 70)}%` }} />
                  ))
                : bars.map((b) => (
                    <span
                      key={b.hour}
                      className={"b" + (b.hour === nowHour ? " is-now" : "")}
                      style={{ height: `${(b.expected / max) * 100}%` }}
                    />
                  ))}
            </div>

            <div className="l-crowd-week">
              {week.slice(0, 7).map((d) => {
                const dt = new Date(d.date);
                return (
                  <div key={d.date} className="d">
                    <strong>{dt.toLocaleDateString(weekdayLocale, { weekday: "short" })}</strong>
                    {dt.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
