import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Alert from "../components/Alert.jsx";

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

  if (error) return <Alert type="error">{t("common.error", { message: error })}</Alert>;
  if (!events) return <Loader />;

  const filtered = events.filter((e) => filter === "all" || (filter === "festival" && e.is_festival));

  return (
    <>
      <PageHeader
        kicker={t("events.kicker")}
        title={t("events.title")}
        lede={t("events.lede")}
      />

      <div className="filter-bar">
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
            <p className={`cause-item-sub ${isTa ? "" : "tamil"}`}>
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
