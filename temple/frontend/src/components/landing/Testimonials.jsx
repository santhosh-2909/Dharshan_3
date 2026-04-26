import { useTranslation } from "react-i18next";
import Stars from "../Stars.jsx";

export default function Testimonials({ items = [] }) {
  const { t } = useTranslation();
  const top = items.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="l-section">
      <div className="container">
        <div className="l-section-head reveal">
          <span className="kicker">{t("landing.testimonials.kicker")}</span>
          <h2>{t("landing.testimonials.title")}</h2>
        </div>

        <div className="l-testimonials">
          {top.map((tm, i) => (
            <article key={tm.id} className={"l-testimonial reveal reveal-" + Math.min(4, (i % 4) + 1)}>
              <p>{tm.message}</p>
              <footer>
                <span className="who">{tm.name}</span>
                <span className="stars">
                  <Stars value={tm.rating} />
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
