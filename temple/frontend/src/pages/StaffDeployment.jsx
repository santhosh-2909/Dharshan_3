import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";
import Icon from "../components/Icon.jsx";

// Icon per role for the on-screen grouping.
const ROLE_ICON = {
  marshal: "users",
  security: "shield",
  prasad: "lotus",
  parking: "car",
  help: "bell",
  medical: "spark",
};

const BAND_COLOR = { Calm: "green", Moderate: "yellow", High: "red", "Very High": "red", Closed: "stone" };

export default function StaffDeployment() {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === "ta";
  const dateLocale = ta ? "ta-IN" : "en-IN";

  const [hours, setHours] = useState(6);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    api.staffing(hours).then(setData).catch((e) => setError(e.message));
  }, [hours]);

  // Group shift blocks by role, preserving first-seen order.
  const roleGroups = useMemo(() => {
    if (!data) return [];
    const order = [];
    const map = new Map();
    for (const b of data.blocks) {
      if (!map.has(b.role_id)) {
        map.set(b.role_id, { role_id: b.role_id, role_en: b.role_en, role_ta: b.role_ta, blocks: [] });
        order.push(b.role_id);
      }
      map.get(b.role_id).blocks.push(b);
    }
    return order.map((id) => map.get(id));
  }, [data]);

  if (error && !data) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!data) return <OpsLayout><Loader /></OpsLayout>;

  const today = new Date(data.generated_at);
  const genTime = today.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  const dateStr = today.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const maxStaff = Math.max(1, ...data.hourly.map((h) => h.total_staff));
  const roleName = (g) => (ta ? g.role_ta : g.role_en);
  const locName = (b) => (ta ? b.location_ta : b.location_en);

  return (
    <OpsLayout>
      <header className="dash-head no-print">
        <div>
          <p className="kicker">{t("modules.staff.kicker")}</p>
          <h1>{t("modules.staff.title")}</h1>
          <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--c-stone)" }}>
            {t("modules.staff.lede")}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          {t("modules.staff.exportPdf")}
        </button>
      </header>

      {/* Summary + horizon control (not printed) */}
      <section className="dash-stats no-print" style={{ marginTop: 4 }}>
        <div className="dash-stat">
          <div className="label">{t("modules.staff.deployNow")}</div>
          <div className="value">{data.current_total_staff}</div>
          <div className="delta"><span className="status-pill green">{t("common.live")}</span></div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.staff.peakStaff")}</div>
          <div className="value">{data.peak_total_staff}</div>
          <div className="delta">{t("modules.staff.peakAt", { time: data.peak_hour_label })}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.staff.horizon")}</div>
          <div className="value">{data.horizon_hours}h</div>
          <div className="delta" style={{ display: "flex", gap: 6 }}>
            {[6, 12].map((h) => (
              <button
                key={h}
                type="button"
                className={`btn ${hours === h ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "2px 12px", fontSize: "0.82rem" }}
                onClick={() => setHours(h)}
              >
                {t("modules.staff.nHours", { n: h })}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hourly staffing load strip (not printed) */}
      <article className="dash-card no-print" style={{ marginTop: 16 }}>
        <header className="dash-card-head"><h3>{t("modules.staff.hourlyLoad")}</h3></header>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 120, padding: "6px 2px" }}>
          {data.hourly.map((h) => (
            <div key={h.hour} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 86, display: "flex", alignItems: "flex-end" }}>
                <div
                  title={`${h.expected} expected`}
                  style={{
                    width: "100%",
                    height: `${Math.round((h.total_staff / maxStaff) * 100)}%`,
                    borderRadius: "6px 6px 0 0",
                    background: h.band === "High" ? "#d64545" : h.band === "Moderate" ? "#d6b23d" : "#4e9d6c",
                    transition: "height .4s ease",
                  }}
                />
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700 }}>{h.total_staff}</div>
              <small style={{ color: "var(--c-stone)" }}>{h.label}</small>
            </div>
          ))}
        </div>
      </article>

      {/* On-screen recommendation cards grouped by role (not printed) */}
      <article className="dash-card no-print" style={{ marginTop: 16 }}>
        <header className="dash-card-head"><h3>{t("modules.staff.recommendations")}</h3></header>
        {roleGroups.map((g) => (
          <div key={g.role_id} className="shift-role">
            <div className="shift-role-head">
              <span className="ico"><Icon name={ROLE_ICON[g.role_id] || "users"} size={18} /></span>
              <h4>{roleName(g)}</h4>
            </div>
            {g.blocks.map((b, idx) => (
              <div key={`${b.location_id}-${idx}`} className="shift-block">
                <span className="count">{b.count}</span>
                <span className="where">
                  <strong>{locName(b)}</strong>
                  <small>
                    {t("modules.staff.shiftRange", { start: b.start_label, end: b.end_label })}
                    {" · "}{t("modules.staff.peakExpected", { n: b.expected_peak.toLocaleString("en-IN") })}
                  </small>
                </span>
                <span className={`status-pill ${BAND_COLOR[b.band] || "stone"}`}>
                  {t(`modules.staff.bands.${b.band}`)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </article>

      {/* Printable daily shift schedule — this is what the PDF captures. */}
      <article className="dash-card staff-print" style={{ marginTop: 16 }}>
        <header className="dash-card-head" style={{ display: "block" }}>
          <h3 style={{ fontSize: "1.3rem" }}>{t("modules.staff.sheetTitle")}</h3>
          <p style={{ color: "var(--c-stone)", margin: "4px 0 0" }}>
            {dateStr} · {t("modules.staff.sheetMeta", { hours: data.horizon_hours, time: genTime })}
          </p>
        </header>
        <table className="shift-table">
          <thead>
            <tr>
              <th>{t("modules.staff.colRole")}</th>
              <th>{t("modules.staff.colLocation")}</th>
              <th>{t("modules.staff.colShift")}</th>
              <th style={{ textAlign: "center" }}>{t("modules.staff.colStaff")}</th>
              <th style={{ textAlign: "right" }}>{t("modules.staff.colExpected")}</th>
            </tr>
          </thead>
          <tbody>
            {roleGroups.map((g) =>
              g.blocks.map((b, idx) => (
                <tr key={`${g.role_id}-${b.location_id}-${idx}`}>
                  <td>{idx === 0 ? roleName(g) : ""}</td>
                  <td>{locName(b)}</td>
                  <td>{t("modules.staff.shiftRange", { start: b.start_label, end: b.end_label })}</td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{b.count}</td>
                  <td style={{ textAlign: "right" }}>{b.expected_peak.toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p style={{ color: "var(--c-stone)", fontSize: "0.82rem", marginTop: 12 }}>
          {t("modules.staff.peakNote", { staff: data.peak_total_staff, time: data.peak_hour_label })}
        </p>
      </article>
    </OpsLayout>
  );
}
