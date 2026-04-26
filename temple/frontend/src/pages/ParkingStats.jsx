import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";

const VEHICLE_TYPES = ["car", "bike", "bus", "auto"];

export default function ParkingStats() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";

  const [lots, setLots] = useState(null);
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState([]);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    Promise.all([api.parkingLots(), api.parkingActive(), api.parkingStats()])
      .then(([ls, ac, st]) => {
        setLots(ls);
        setActive(ac);
        setStats(st);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (error && !stats) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!lots || !stats) return <OpsLayout><Loader /></OpsLayout>;

  async function markExit(id) {
    try {
      await api.parkingExit(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const statusKey =
    stats.status_color === "green" ? "Comfortable"
    : stats.status_color === "yellow" ? "Filling"
    : "Full";

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.parkingOps.kicker")}</p>
          <h1>{t("modules.parkingOps.title")}</h1>
        </div>
        <Link to="/parking" className="btn btn-ghost">{t("parking.registerHeading")} →</Link>
      </header>

      <section className="dash-stats">
        <div className="dash-stat">
          <div className="label">{t("modules.parkingOps.entered")}</div>
          <div className="value">{stats.vehicles_entered.toLocaleString("en-IN")}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.parkingOps.currentlyParked")}</div>
          <div className="value">{stats.currently_parked.toLocaleString("en-IN")}</div>
          <div className="delta">
            <span className={`status-pill ${stats.status_color}`}>
              {t(`modules.parkingOps.status${statusKey}`)}
            </span>
          </div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.parkingOps.available")}</div>
          <div className="value">{stats.available_slots.toLocaleString("en-IN")}</div>
          <div className="delta">{t("modules.parkingOps.capacityPct", { pct: stats.occupancy_pct })}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.parkingOps.estimatedPeople")}</div>
          <div className="value">{stats.estimated_people.toLocaleString("en-IN")}</div>
        </div>
      </section>

      <article className="dash-card" style={{ marginTop: 18 }}>
        <header className="dash-card-head">
          <h3>{t("modules.parkingOps.byTypeTitle")}</h3>
          <span className={`status-pill ${stats.status_color}`}>
            {t("modules.parkingOps.capacityPct", { pct: stats.occupancy_pct })}
          </span>
        </header>
        <div className={`cap-bar ${stats.status_color}`} style={{ height: 14, marginBottom: 18 }}>
          <span style={{ width: `${Math.min(100, stats.occupancy_pct)}%` }} />
        </div>
        <div className="park-types">
          {VEHICLE_TYPES.map((vt) => {
            const occ = stats.by_type[vt];
            const cap = stats.by_type_capacity[vt];
            const full = cap > 0 && occ >= cap;
            return (
              <div key={vt} className={"t" + (full ? " full" : "")}>
                <span className="n">{occ}/{cap}</span>
                <span className="l">{t(`parking.types.${vt}`)}</span>
              </div>
            );
          })}
        </div>
        <p style={{ marginTop: 14, fontSize: "0.82rem", color: "var(--c-stone)" }}>
          {t("modules.parkingOps.logicNote")}
        </p>
      </article>

      <section className="section">
        <div className="section-head">
          <p className="kicker">{t("parking.lotsTitle")}</p>
          <button type="button" className="btn btn-ghost" onClick={refresh}>{t("common.refresh")}</button>
        </div>
        <div className="park-grid">
          {lots.map((s) => {
            const tight = s.occupancy_pct >= 75;
            return (
              <article key={s.lot.id} className="park-lot">
                <header>
                  <div>
                    <h3>{isTa ? s.lot.name_ta : s.lot.name_en}</h3>
                    <p className="loc">{s.lot.location}</p>
                  </div>
                  <span className="card-tag">{t("parking.occupancy", { pct: s.occupancy_pct })}</span>
                </header>
                <div className={"park-meter" + (tight ? " is-tight" : "")}>
                  <span style={{ width: `${Math.min(100, s.occupancy_pct)}%` }} />
                </div>
                <div className="park-types">
                  {VEHICLE_TYPES.map((vt) => {
                    const cap = s.lot[`capacity_${vt}`];
                    const occ = s.occupied[vt];
                    const avail = s.available[vt];
                    return (
                      <div key={vt} className={"t" + (avail === 0 ? " full" : "")}>
                        <span className="n">{avail}/{cap}</span>
                        <span className="l">{t(`parking.types.${vt}`)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="park-totals">
                  <span><strong>{s.total_capacity}</strong>{t("parking.totalCapacity")}</span>
                  <span><strong>{s.total_occupied}</strong>{t("parking.totalOccupied")}</span>
                  <span><strong>{s.total_available}</strong>{t("parking.available")}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <article className="dash-card" style={{ marginTop: 18 }}>
        <header className="dash-card-head">
          <h3>{t("parking.exitTitle")}</h3>
        </header>
        <div>
          {active.length === 0 ? (
            <p>{t("parking.exitNone")}</p>
          ) : (
            active.map((v) => {
              const lot = lots.find((l) => l.lot.id === v.lot_id);
              const enteredAt = new Date(v.entered_at).toLocaleString(
                isTa ? "ta-IN" : "en-IN",
                { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }
              );
              return (
                <div key={v.id} className="park-active-row">
                  <span className="plate">{v.vehicle_number}</span>
                  <div>
                    <div>{v.owner_name}</div>
                    <div className="when">
                      {t(`parking.types.${v.vehicle_type}`)} · {lot ? (isTa ? lot.lot.name_ta : lot.lot.name_en) : ""}
                    </div>
                    <div className="when">{enteredAt} · {v.reference}</div>
                  </div>
                  <span />
                  <button type="button" className="out-btn" onClick={() => markExit(v.id)}>
                    {t("parking.markExit")}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </article>
    </OpsLayout>
  );
}
