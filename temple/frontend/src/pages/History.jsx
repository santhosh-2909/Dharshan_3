import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtINR = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");

export default function History() {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === "ta";
  const dateLocale = ta ? "ta-IN" : "en-IN";

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.history().then(setRows).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const snapshot = async () => {
    setSaving(true);
    try {
      const data = await api.historySnapshot();
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !rows) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!rows) return <OpsLayout><Loader /></OpsLayout>;

  const totals = rows.reduce(
    (acc, r) => ({
      people: acc.people + r.people_count,
      vehicles: acc.vehicles + r.vehicles_entered,
      bookings: acc.bookings + r.bookings,
      devotees: acc.devotees + r.devotees,
      donation: acc.donation + r.donation_inr,
    }),
    { people: 0, vehicles: 0, bookings: 0, devotees: 0, donation: 0 },
  );

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.history.kicker")}</p>
          <h1>{t("modules.history.title")}</h1>
          <p style={{ marginTop: 8, maxWidth: "62ch", color: "var(--c-stone)" }}>
            {t("modules.history.lede")}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={snapshot} disabled={saving}>
          {saving ? t("modules.history.saving") : t("modules.history.snapshot")}
        </button>
      </header>

      {/* Lifetime totals across all recorded days */}
      <section className="dash-stats" style={{ marginTop: 4 }}>
        <div className="dash-stat">
          <div className="label">{t("modules.history.daysRecorded")}</div>
          <div className="value">{rows.length}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.history.totalPeople")}</div>
          <div className="value">{fmt(totals.people)}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.history.totalVehicles")}</div>
          <div className="value">{fmt(totals.vehicles)}</div>
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.history.totalDonations")}</div>
          <div className="value">{fmtINR(totals.donation)}</div>
        </div>
      </section>

      <article className="dash-card" style={{ marginTop: 16 }}>
        <header className="dash-card-head"><h3>{t("modules.history.byDay")}</h3></header>

        {rows.length === 0 ? (
          <p style={{ color: "var(--c-stone)" }}>{t("modules.history.empty")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="shift-table">
              <thead>
                <tr>
                  <th>{t("modules.history.colDate")}</th>
                  <th style={{ textAlign: "right" }}>{t("modules.history.colPeople")}</th>
                  <th style={{ textAlign: "right" }}>{t("modules.history.colVehicles")}</th>
                  <th style={{ textAlign: "right" }}>{t("modules.history.colBookings")}</th>
                  <th style={{ textAlign: "right" }}>{t("modules.history.colDevotees")}</th>
                  <th style={{ textAlign: "right" }}>{t("modules.history.colDonations")}</th>
                  <th style={{ textAlign: "right" }}>{t("modules.history.colPredicted")}</th>
                  <th>{t("modules.history.colFestival")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.summary_date}>
                    <td>{fmtDate(r.summary_date)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(r.people_count)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(r.vehicles_entered)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(r.bookings)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(r.devotees)}</td>
                    <td style={{ textAlign: "right" }}>{fmtINR(r.donation_inr)}</td>
                    <td style={{ textAlign: "right" }}>{r.predicted_peak ? fmt(r.predicted_peak) : "—"}</td>
                    <td>
                      {r.is_festival
                        ? <span className="status-pill yellow">{r.festival_name || t("modules.history.festival")}</span>
                        : <span style={{ color: "var(--c-stone)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </OpsLayout>
  );
}
