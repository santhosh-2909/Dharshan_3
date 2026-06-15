import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Alert from "../components/Alert.jsx";

export default function About() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";
  const [temples, setTemples] = useState(null);
  const [active, setActive] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.temples()
      .then((list) => {
        setTemples(list);
        setActive(list[0]?.slug || null);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert type="error">{t("common.error", { message: error })}</Alert>;
  if (!temples) return <Loader />;

  const temple = temples.find((tt) => tt.slug === active) || temples[0];
  const name = isTa ? temple.name_ta : temple.name_en;
  const subname = isTa ? temple.name_en : temple.name_ta;
  const deity = isTa ? temple.deity_ta : temple.deity_en;
  const deitySub = isTa ? temple.deity_en : temple.deity_ta;

  return (
    <>
      <PageHeader
        kicker={t("about.kicker")}
        title={t("about.title")}
      />

      {temples.length > 1 && (
        <div className="filter-bar">
          {temples.map((tt) => (
            <button
              key={tt.slug}
              type="button"
              className={"btn " + (tt.slug === active ? "btn-primary" : "btn-ghost")}
              onClick={() => setActive(tt.slug)}
            >
              {isTa ? tt.name_ta : tt.name_en}
            </button>
          ))}
        </div>
      )}

      <article className="card about-content">
        <p className="kicker">{temple.location}</p>
        <h2>{name}</h2>
        <p className={`cause-item-sub about-subname ${isTa ? "" : "tamil"}`}>
          {subname}
        </p>

        <hr className="divider" />

        <dl className="kv">
          <dt>{t("about.deity")}</dt>
          <dd>
            {deity}
            <div className={`cause-item-sub about-deity-sub ${isTa ? "" : "tamil"}`}>{deitySub}</div>
          </dd>
          <dt>{t("about.morning")}</dt>
          <dd>{temple.timings_morning}</dd>
          <dt>{t("about.evening")}</dt>
          <dd>{temple.timings_evening}</dd>
        </dl>

        <hr className="divider" />

        <h3>{t("about.history")}</h3>
        <p>{temple.history}</p>

        <h3>{t("about.architecture")}</h3>
        <p>{temple.architecture}</p>

        <h3>{t("about.rituals")}</h3>
        <p>{temple.rituals}</p>
      </article>
    </>
  );
}
