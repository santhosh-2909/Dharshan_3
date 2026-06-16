import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";
import Icon from "../components/Icon.jsx";

// All gate ids, in display order — used to seed the open/closed toggles.
const ALL_GATES = ["north", "east", "south", "west"];

export default function QueueWait() {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === "ta";

  // Which gates the operator has opened (defaults to all open).
  const [openIds, setOpenIds] = useState(ALL_GATES);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api
      .queueWait(openIds)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, [openIds]);

  // Re-fetch whenever the open-gate set changes, then poll every 5s (real time).
  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const toggleGate = (id) =>
    setOpenIds((prev) => {
      const next = prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id];
      return next.length ? next : prev; // never close the last open gate
    });

  if (error && !data) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!data) return <OpsLayout><Loader /></OpsLayout>;

  const rec = data.recommended_gate_id;
  const maxWait = Math.max(1, ...data.gates.map((g) => g.wait_minutes));

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.queue.kicker")}</p>
          <h1>{t("modules.queue.title")}</h1>
          <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--c-stone)" }}>
            {t("modules.queue.lede")}
          </p>
        </div>
      </header>

      {/* Redirect recommendation + live load summary */}
      <section className="fr-overall" style={{ marginTop: 6 }}>
        <div className="label">{t("modules.queue.recommend")}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 700 }}>
            {rec ? (ta ? data.recommended_gate_ta : data.recommended_gate_en) : "—"}
          </span>
          {rec && (
            <span className="status-pill green">
              {t("modules.queue.minWait", { n: data.recommended_wait })}
            </span>
          )}
        </div>
        <div className="delta" style={{ marginTop: 12 }}>
          {t("modules.queue.loadSummary", {
            queue: data.queue_total.toLocaleString("en-IN"),
            open: data.open_gate_count,
            rate: data.total_throughput_per_min,
          })}
          <span style={{ marginLeft: 8 }}>
            <span className="status-pill green">{t("common.live")}</span>
            {data.live_in_frame > 0 && (
              <span style={{ marginLeft: 8 }}>
                {t("modules.queue.inFrame", { n: data.live_in_frame })}
              </span>
            )}
          </span>
        </div>
      </section>

      {/* Per-gate wait times */}
      <article className="dash-card" style={{ marginTop: 18 }}>
        <header className="dash-card-head">
          <h3>{t("modules.queue.perGate")}</h3>
          <span style={{ color: "var(--c-stone)", fontSize: "0.85rem" }}>
            {t("modules.queue.tapToToggle")}
          </span>
        </header>

        <div className="dash-feed">
          {data.gates.map((g) => {
            const open = g.is_open;
            const isRec = g.id === rec;
            const barPct = open ? Math.round((g.wait_minutes / maxWait) * 100) : 0;
            return (
              <div key={g.id} className="dash-feed-row" style={{ alignItems: "center", opacity: open ? 1 : 0.55 }}>
                <div className="av" aria-hidden="true">
                  <Icon name="gate" size={20} />
                </div>
                <div className="body" style={{ flex: 1 }}>
                  <p style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <strong>
                      {ta ? g.name_ta : g.name_en}
                      {isRec && open && (
                        <span className="status-pill green" style={{ marginLeft: 8 }}>
                          {t("modules.queue.redirectHere")}
                        </span>
                      )}
                    </strong>
                    <span className={`status-pill ${g.status_color}`}>
                      {open ? t("modules.queue.waitLabel", { n: g.wait_minutes }) : t("modules.queue.closed")}
                    </span>
                  </p>

                  {/* Wait-time bar (longer = worse) */}
                  <div
                    style={{
                      height: 8,
                      borderRadius: 6,
                      background: "rgba(120,113,108,.18)",
                      overflow: "hidden",
                      margin: "8px 0 6px",
                    }}
                  >
                    <div
                      style={{
                        width: `${barPct}%`,
                        height: "100%",
                        background:
                          g.status_color === "red"
                            ? "#d64545"
                            : g.status_color === "yellow"
                            ? "#d6b23d"
                            : "#4e9d6c",
                        transition: "width .4s ease",
                      }}
                    />
                  </div>

                  <small style={{ color: "var(--c-stone)" }}>
                    {open
                      ? t("modules.queue.gateDetail", {
                          people: g.queue_people.toLocaleString("en-IN"),
                          rate: g.throughput_per_min,
                        })
                      : t("modules.queue.gateClosedDetail")}
                  </small>
                </div>

                <button
                  type="button"
                  className={`btn ${open ? "btn-ghost" : "btn-primary"}`}
                  style={{ marginLeft: 12, whiteSpace: "nowrap" }}
                  onClick={() => toggleGate(g.id)}
                >
                  {open ? t("modules.queue.close") : t("modules.queue.open")}
                </button>
              </div>
            );
          })}
        </div>
      </article>
    </OpsLayout>
  );
}
