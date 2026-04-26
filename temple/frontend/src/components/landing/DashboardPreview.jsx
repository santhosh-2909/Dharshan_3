import { useTranslation } from "react-i18next";
import Icon from "../Icon.jsx";

export default function DashboardPreview({ stats, crowd }) {
  const { t, i18n } = useTranslation();
  const bars = crowd?.today_hourly ?? [];
  const max = Math.max(...bars.map((b) => b.expected), 1);
  const nowHour = new Date().getHours();
  const locale = i18n.language === "ta" ? "ta-IN" : "en-IN";
  const todayLabel = new Date().toLocaleDateString(locale, { day: "numeric", month: "short" });

  return (
    <section className="l-section">
      <div className="container">
        <div className="l-section-head reveal">
          <span className="kicker">{t("landing.preview.kicker")}</span>
          <h2>{t("landing.preview.title")}</h2>
          <p>{t("landing.preview.lede")}</p>
        </div>

        <div className="l-preview reveal reveal-1">
          <div className="l-preview-grid">
            <aside className="l-preview-side">
              <div className="nav-row active"><Icon name="home" size={16} /> {t("landing.preview.navOverview")}</div>
              <div className="nav-row"><Icon name="trend" size={16} /> {t("landing.preview.navCrowd")}</div>
              <div className="nav-row"><Icon name="calendar" size={16} /> {t("landing.preview.navSevas")}</div>
              <div className="nav-row"><Icon name="lotus" size={16} /> {t("landing.preview.navDonations")}</div>
              <div className="nav-row"><Icon name="users" size={16} /> {t("landing.preview.navDevotees")}</div>
              <div className="nav-row"><Icon name="shield" size={16} /> {t("landing.preview.navSecurity")}</div>
            </aside>
            <div className="l-preview-main">
              <div className="l-preview-stat">
                <span className="label">{t("landing.preview.statDevotees")}</span>
                <span className="value">{stats?.devotees_served?.toLocaleString("en-IN") ?? "—"}</span>
              </div>
              <div className="l-preview-stat">
                <span className="label">{t("landing.preview.statBookings")}</span>
                <span className="value">{stats?.bookings_total ?? "—"}</span>
              </div>
              <div className="l-preview-stat">
                <span className="label">{t("landing.preview.statDonations")}</span>
                <span className="value">
                  ₹{stats?.donations_inr ? Math.round(stats.donations_inr / 1000) + "K" : "—"}
                </span>
              </div>
              <div className="l-preview-chart">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-stone)" }}>
                      {t("landing.preview.chartTitle")}
                    </div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginTop: 4 }}>
                      {t("landing.preview.chartToday", { date: todayLabel })}
                    </div>
                  </div>
                  <span className="band moderate">{t("common.live")}</span>
                </div>
                <div className="l-preview-chart-bars">
                  {bars.length === 0
                    ? Array.from({ length: 17 }).map((_, i) => (
                        <span key={`ph-${i}`} className="b" style={{ height: `${20 + ((i * 13) % 70)}%` }} />
                      ))
                    : bars.map((b) => (
                        <span
                          key={b.hour}
                          className={"b" + (b.hour === nowHour ? " is-now" : "")}
                          style={{ height: `${(b.expected / max) * 100}%` }}
                        />
                      ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
