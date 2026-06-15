import { useTranslation } from "react-i18next";

export default function Strip() {
  const { t } = useTranslation();
  const items = [
    "Madurai \u00b7 Meenakshi Amman",
    "Thanjavur \u00b7 Brihadeeswarar",
    "Rameswaram \u00b7 Ramanathaswamy",
    "Chidambaram \u00b7 Nataraja",
    "Srirangam \u00b7 Ranganathaswamy",
    "Tiruvannamalai \u00b7 Annamalaiyar",
  ];
  return (
    <div className="l-strip" aria-label={t("landing.strip.label")}>
      {/* Decorative sculpture figures behind the strip */}
      <img
        className="l-strip-decor l-strip-decor-left"
        src="/images/yali-pillar-line.jpeg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="l-strip-decor l-strip-decor-right"
        src="/images/yali-pillar-line.jpeg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="container l-strip-inner">
        {items.map((it, i) => (
          <span key={it}>
            {it}
            {i < items.length - 1 && <span className="sep">{"\u2726"}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
