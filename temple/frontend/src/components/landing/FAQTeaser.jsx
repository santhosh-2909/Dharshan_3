import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function FAQTeaser({ items = [] }) {
  const { t, i18n } = useTranslation();
  const top = items.slice(0, 5);
  if (top.length === 0) return null;
  const isTa = i18n.language === "ta";

  return (
    <section className="l-section">
      <div className="container">
        <div className="l-section-head reveal">
          <span className="kicker">{t("landing.faqTeaser.kicker")}</span>
          <h2>{t("landing.faqTeaser.title")}</h2>
        </div>

        <div style={{ display: "grid", gap: 12, maxWidth: 820, margin: "0 auto" }}>
          {top.map((f, i) => (
            <details key={f.id} className={"faq reveal reveal-" + Math.min(4, (i % 4) + 1)}>
              <summary>{isTa ? f.question_ta : f.question_en}</summary>
              <div className="faq-body">
                <p>{isTa ? f.answer_ta : f.answer_en}</p>
              </div>
            </details>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link to="/faq" className="btn btn-outline">{t("landing.faqTeaser.ctaAll")}</Link>
        </div>
      </div>
    </section>
  );
}
