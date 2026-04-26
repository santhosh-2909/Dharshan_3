import { useTranslation } from "react-i18next";

export default function Strip() {
  const { t } = useTranslation();
  const items = [
    "Madurai · Meenakshi Amman",
    "Thanjavur · Brihadeeswarar",
    "Rameswaram · Ramanathaswamy",
    "Chidambaram · Nataraja",
    "Srirangam · Ranganathaswamy",
    "Tiruvannamalai · Annamalaiyar",
  ];
  return (
    <div className="l-strip" aria-label={t("landing.strip.label")}>
      <div className="container l-strip-inner">
        {items.map((it, i) => (
          <span key={it}>
            {it}
            {i < items.length - 1 && <span className="sep" style={{ marginLeft: 28 }}>✦</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
