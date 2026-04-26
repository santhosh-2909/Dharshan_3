import { useTranslation } from "react-i18next";

const tiles = [
  { layout: "t1", art: "art-gopuram", t: 1 },
  { layout: "t2", art: "art-aarti", t: 2 },
  { layout: "t3", art: "art-flowers", t: 3 },
  { layout: "t4", art: "art-procession", t: 4 },
  { layout: "t5", art: "art-deepa", t: 5 },
  { layout: "t6", art: "art-tank", t: 6 },
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
              <div className={`art ${tile.art}`} aria-hidden="true" />
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
