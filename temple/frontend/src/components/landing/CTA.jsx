import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CTA() {
  const { t } = useTranslation();
  return (
    <section className="l-section l-section-flush">
      <div className="container">
        <div className="l-cta-band reveal">
          {/* Decorative temple arch overlay */}
          <img
            className="l-cta-arch"
            src="/images/temple-arch.jpeg"
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <span className="kicker l-cta-kicker">{t("landing.cta.kicker")}</span>
          <h2 className="l-cta-title">{t("landing.cta.title")}</h2>
          <p>{t("landing.cta.lede")}</p>
          <div className="l-cta-actions">
            <Link to="/login?mode=register" className="btn btn-primary">{t("landing.cta.ctaCreate")}</Link>
            <Link to="/about" className="btn btn-secondary">{t("landing.cta.ctaStory")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
