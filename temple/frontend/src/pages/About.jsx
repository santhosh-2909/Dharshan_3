import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";

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

  if (error) return <div className="alert error">{t("common.error", { message: error })}</div>;
  if (!temples) return <Loader />;

  const temple = temples.find((tt) => tt.slug === active) || temples[0];
  const name = isTa ? temple.name_ta : temple.name_en;
  const subname = isTa ? temple.name_en : temple.name_ta;
  const deity = isTa ? temple.deity_ta : temple.deity_en;
  const deitySub = isTa ? temple.deity_en : temple.deity_ta;

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <p className="kicker">{t("about.kicker")}</p>
        <h1>{t("about.title")}</h1>
      </header>

      {temples.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
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

      <article className="card">
        <p className="kicker">{temple.location}</p>
        <h2 style={{ marginTop: 4 }}>{name}</h2>
        <p className={isTa ? "" : "tamil"} style={{ fontSize: "1.1rem", color: "var(--c-stone)", marginTop: 4 }}>
          {subname}
        </p>

        <hr className="divider" />

        <dl className="kv">
          <dt>{t("about.deity")}</dt>
          <dd>
            {deity}
            <div className={isTa ? "" : "tamil"} style={{ color: "var(--c-stone)", fontSize: "0.95rem" }}>{deitySub}</div>
          </dd>
          <dt>{t("about.morning")}</dt>
          <dd>{temple.timings_morning}</dd>
          <dt>{t("about.evening")}</dt>
          <dd>{temple.timings_evening}</dd>
        </dl>

        <hr className="divider" />

        <h3>{t("about.history")}</h3>
        <p style={{ marginTop: 8 }}>{temple.history}</p>

        <h3 style={{ marginTop: 24 }}>{t("about.architecture")}</h3>
        <p style={{ marginTop: 8 }}>{temple.architecture}</p>

        <h3 style={{ marginTop: 24 }}>{t("about.rituals")}</h3>
        <p style={{ marginTop: 8 }}>{temple.rituals}</p>
      </article>
    </>
  );
}
