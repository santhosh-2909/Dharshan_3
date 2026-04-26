import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";

export default function Events() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";
  const dateLocale = isTa ? "ta-IN" : "en-IN";
  const fmt = (d) => new Date(d).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

  const [events, setEvents] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    api.events({ upcoming_only: "true" })
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert error">{t("common.error", { message: error })}</div>;
  if (!events) return <Loader />;

  const filtered = events.filter((e) => filter === "all" || (filter === "festival" && e.is_festival));

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <p className="kicker">{t("events.kicker")}</p>
        <h1>{t("events.title")}</h1>
        <p style={{ marginTop: 8, maxWidth: "60ch" }}>{t("events.lede")}</p>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { id: "all", label: t("events.all") },
          { id: "festival", label: t("events.festivalOnly") },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className={"btn " + (filter === f.id ? "btn-primary" : "btn-ghost")}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-2">
        {filtered.map((e) => (
          <article key={e.id} className="card hover">
            <span className={"card-tag" + (e.is_festival ? " festival" : "")}>
              {e.is_festival ? t("events.festival") : e.category}
            </span>
            <h3 style={{ marginTop: 12 }}>{isTa ? e.title_ta : e.title_en}</h3>
            <p className={isTa ? "" : "tamil"} style={{ color: "var(--c-stone)" }}>
              {isTa ? e.title_en : e.title_ta}
            </p>
            <p style={{ marginTop: 12 }}>{e.description}</p>
            <div className="card-meta">
              <span>📅 {fmt(e.starts_on)}{e.ends_on !== e.starts_on ? ` – ${fmt(e.ends_on)}` : ""}</span>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p>{t("events.noMatch")}</p>}
      </div>
    </>
  );
}
