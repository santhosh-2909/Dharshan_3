import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CTA() {
  const { t } = useTranslation();
  return (
    <section className="l-section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="l-cta-band reveal">
          <span className="kicker" style={{ color: "var(--c-gold-soft)" }}>{t("landing.cta.kicker")}</span>
          <h2 style={{ marginTop: 12 }}>{t("landing.cta.title")}</h2>
          <p>{t("landing.cta.lede")}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login?mode=register" className="btn btn-primary">{t("landing.cta.ctaCreate")}</Link>
            <Link to="/about" className="btn btn-secondary">{t("landing.cta.ctaStory")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
