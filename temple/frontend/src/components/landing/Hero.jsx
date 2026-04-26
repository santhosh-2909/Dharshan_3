import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Hero({ stats }) {
  const { t } = useTranslation();
  return (
    <section className="l-hero">
      <div className="container">
        <div className="l-hero-grid">
          <div>
            <span className="l-eyebrow reveal">
              <span className="dot" />
              {t("landing.hero.eyebrow")}
            </span>
            <h1 className="l-display reveal reveal-1">
              {t("landing.hero.title1")} <em>{t("landing.hero.title2")}</em>
            </h1>
            <p className="l-tagline reveal reveal-2">{t("landing.hero.tagline")}</p>
            <p className="l-lede reveal reveal-2">{t("landing.hero.lede")}</p>
            <div className="l-cta-row reveal reveal-3">
              <Link to="/bookings" className="btn btn-primary">{t("landing.hero.ctaBook")}</Link>
              <Link to="/dashboard" className="btn btn-outline">{t("landing.hero.ctaDashboard")}</Link>
            </div>
            <div className="l-trust reveal reveal-4">
              <div>
                <strong>{stats?.devotees_served?.toLocaleString("en-IN") ?? "—"}</strong>
                {t("landing.hero.trustDevotees")}
              </div>
              <div>
                <strong>{stats?.active_temples ?? "—"}</strong>
                {t("landing.hero.trustTemples")}
              </div>
              <div>
                <strong>{stats?.average_rating?.toFixed(1) ?? "—"}</strong>
                {t("landing.hero.trustRating")}
              </div>
            </div>
          </div>

          <div className="l-hero-visual reveal reveal-2" aria-hidden="true">
            <div className="l-stack-card glass c1">
              <span className="label">{t("landing.hero.card1Label")}</span>
              <span className="value">
                {t("landing.hero.card1Value", { count: stats?.bookings_total ?? 0 })}
              </span>
              <span className="delta">{t("landing.hero.card1Delta")}</span>
              <div className="mini-bars">
                {[14, 22, 30, 26, 38, 44, 56, 70, 64, 50, 38, 28].map((h, i) => (
                  <span key={i} className="b" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="l-stack-card glass c2">
              <span className="label">{t("landing.hero.card2Label")}</span>
              <span className="value">{t("landing.hero.card2Value")}</span>
              <span className="delta">{t("landing.hero.card2Delta", { pct: 38 })}</span>
            </div>
            <div className="l-stack-card glass c3">
              <span className="label">{t("landing.hero.card3Label")}</span>
              <span className="value">{t("landing.hero.card3Value")}</span>
              <span className="delta">{t("landing.hero.card3Delta")}</span>
            </div>
            <div className="l-stack-card glass c4">
              <span className="label">{t("landing.hero.card4Label")}</span>
              <span className="value">
                ₹{stats?.donations_inr ? Math.round(stats.donations_inr / 1000) + "K" : "—"}
              </span>
              <span className="delta">{t("landing.hero.card4Delta")}</span>
            </div>
            <svg className="gopuram" viewBox="0 0 600 200" preserveAspectRatio="xMidYMax meet">
              <g fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.55" style={{ color: "var(--c-saffron-deep)" }}>
                <path d="M30 200 L30 90 L60 70 L60 50 L40 30 L60 30 L60 10 L80 10 L80 30 L100 30 L80 50 L80 70 L110 90 L110 200 Z" />
                <path d="M150 200 L150 100 L180 78 L180 56 L160 36 L180 36 L180 16 L200 16 L200 36 L220 36 L200 56 L200 78 L230 100 L230 200 Z" />
                <path d="M270 200 L270 90 L300 68 L300 46 L280 26 L300 26 L300 6 L320 6 L320 26 L340 26 L320 46 L320 68 L350 90 L350 200 Z" />
                <path d="M390 200 L390 100 L420 78 L420 56 L400 36 L420 36 L420 16 L440 16 L440 36 L460 36 L440 56 L440 78 L470 100 L470 200 Z" />
                <path d="M510 200 L510 110 L540 88 L540 66 L520 46 L540 46 L540 26 L560 26 L560 46 L580 46 L560 66 L560 88 L590 110 L590 200 Z" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
