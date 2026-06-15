import { useTranslation } from "react-i18next";

const heritage = [
  {
    img: "/images/temple-niches.jpeg",
    titleKey: "h1Title",
    descKey: "h1Desc",
  },
  {
    img: "/images/nataraja-relief.jpeg",
    titleKey: "h2Title",
    descKey: "h2Desc",
  },
  {
    img: "/images/narrative-relief.jpeg",
    titleKey: "h3Title",
    descKey: "h3Desc",
  },
  {
    img: "/images/elephant-stairway.jpeg",
    titleKey: "h4Title",
    descKey: "h4Desc",
  },
];

export default function CulturalHeritage() {
  const { t } = useTranslation();
  return (
    <section className="l-section l-heritage-section">
      <div className="container">
        <div className="l-section-head reveal">
          <span className="kicker">{t("landing.heritage.kicker", { defaultValue: "Living Heritage" })}</span>
          <h2>{t("landing.heritage.title", { defaultValue: "Sculpted in Stone, Preserved in Time" })}</h2>
          <p>{t("landing.heritage.lede", { defaultValue: "Every pillar, every inscription, every sculpture tells a story spanning millennia of devotion and artistry." })}</p>
        </div>

        <div className="l-heritage-grid">
          {heritage.map((item, i) => (
            <article
              key={item.titleKey}
              className={`l-heritage-card reveal reveal-${Math.min(4, (i % 4) + 1)}`}
            >
              <div className="l-heritage-img-wrap">
                <img
                  src={item.img}
                  alt={t(`landing.heritage.${item.titleKey}`, { defaultValue: "" })}
                  loading="lazy"
                  draggable={false}
                />
                <div className="l-heritage-img-overlay" />
              </div>
              <div className="l-heritage-body">
                <h3>{t(`landing.heritage.${item.titleKey}`, { defaultValue: fallbackTitles[i] })}</h3>
                <p>{t(`landing.heritage.${item.descKey}`, { defaultValue: fallbackDescs[i] })}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Decorative inscription strip */}
      <div className="l-inscription-strip" aria-hidden="true">
        <div className="l-inscription-scroll">
          <img src="/images/tamil-inscription-2.jpeg" alt="" loading="lazy" draggable={false} />
          <img src="/images/tamil-inscription-3.jpeg" alt="" loading="lazy" draggable={false} />
          <img src="/images/tamil-inscription-4.jpeg" alt="" loading="lazy" draggable={false} />
          <img src="/images/tamil-inscription-2.jpeg" alt="" loading="lazy" draggable={false} />
          <img src="/images/tamil-inscription-3.jpeg" alt="" loading="lazy" draggable={false} />
          <img src="/images/tamil-inscription-4.jpeg" alt="" loading="lazy" draggable={false} />
        </div>
      </div>
    </section>
  );
}

const fallbackTitles = [
  "Temple Sculptures",
  "Cosmic Dance",
  "Narrative Reliefs",
  "Sacred Guardians",
];

const fallbackDescs = [
  "Intricately carved niches house divine figures, each pose encoding centuries of sculptural tradition from the Pallava and Chola dynasties.",
  "The cosmic dance of Nataraja, captured in stone, symbolises the eternal cycle of creation and dissolution at the heart of Shaiva philosophy.",
  "Stone panels narrate epic tales from the Ramayana and Mahabharata, serving as visual scriptures for generations of devotees.",
  "Majestic elephants guard temple entrances, their ornate carvings embodying strength, wisdom, and the divine protection of sacred spaces.",
];
