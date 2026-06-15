import { useTranslation } from "react-i18next";
import Icon from "../Icon.jsx";

const FEATURE_KEYS = [
  { icon: "calendar", t: "f1" },
  { icon: "lotus", t: "f2" },
  { icon: "trend", t: "f3" },
  { icon: "flame", t: "f4" },
  { icon: "globe", t: "f5" },
  { icon: "shield", t: "f6" },
];

export default function Features() {
  const { t } = useTranslation();
  return (
    <section className="l-section l-features-section">
      {/* Background image: temple figures */}
      <img
        className="l-features-bg"
        src="/images/temple-figures.jpeg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="container">
        <div className="l-section-head reveal">
          <span className="kicker">{t("landing.features.kicker")}</span>
          <h2>{t("landing.features.title")}</h2>
          <p>{t("landing.features.lede")}</p>
        </div>

        <div className="l-features">
          {FEATURE_KEYS.map((f, i) => (
            <article key={f.t} className={"l-feature reveal reveal-" + Math.min(4, (i % 4) + 1)}>
              <div className="icon">
                <Icon name={f.icon} size={22} />
              </div>
              <h3>{t(`landing.features.${f.t}Title`)}</h3>
              <p>{t(`landing.features.${f.t}Body`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
