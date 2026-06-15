import { useTranslation } from "react-i18next";

const tiles = [
  { layout: "t1", img: "/images/gajalakshmi-mural.jpeg", t: 1 },
  { layout: "t2", img: "/images/gopuram-sculptures.jpeg", t: 2 },
  { layout: "t3", img: "/images/yali-pillar-color.jpeg", t: 3 },
  { layout: "t4", img: "/images/chariot-wheel.jpeg", t: 4 },
  { layout: "t5", img: "/images/elephant-sculpture.jpeg", t: 5 },
  { layout: "t6", img: "/images/tamil-inscription.jpeg", t: 6 },
];

export default function Gallery() {
  const { t } = useTranslation();
  return (
    <section className="l-section">
      <div className="container">
        <div className="l-section-head reveal">
          <span className="kicker">{t("landing.gallery.kicker")}</span>
          <h2>{t("landing.gallery.title")}</h2>
          <p>{t("landing.gallery.lede")}</p>
        </div>

        <div className="l-gallery">
          {tiles.map((tile, i) => (
            <figure
              key={tile.t}
              className={`tile ${tile.layout} reveal reveal-${Math.min(4, (i % 4) + 1)}`}
            >
              <img
                className="art"
                src={tile.img}
                alt={t(`landing.gallery.t${tile.t}`)}
                loading="lazy"
                draggable={false}
              />
              <figcaption className="cap">
                <strong>{t(`landing.gallery.t${tile.t}`)}</strong>
                <span>{t(`landing.gallery.s${tile.t}`)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
