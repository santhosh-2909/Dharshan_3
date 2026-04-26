import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";

export default function FinalReport() {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.finalReport().then(setReport).catch((e) => setError(e.message));
  }, []);

  if (error) return <OpsLayout><div className="alert error">{error}</div></OpsLayout>;
  if (!report) return <OpsLayout><Loader /></OpsLayout>;

  const slices = [
    { key: "parking", label: t("modules.finalReport.parkingPeople"), value: report.parking_people },
    { key: "cctv", label: t("modules.finalReport.cctvPeople"), value: report.cctv_people },
    { key: "booking", label: t("modules.finalReport.bookingDevotees"), value: report.booking_devotees },
  ];
  const sliceMax = Math.max(...slices.map((s) => s.value), 1);

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.finalReport.kicker")}</p>
          <h1>{t("modules.finalReport.title")}</h1>
          <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--c-stone)" }}>
            {t("modules.finalReport.lede")}
          </p>
        </div>
      </header>

      <section className="fr-overall">
        <div className="label">{t("modules.finalReport.overallTotal")}</div>
        <div className="value">{report.overall_total_crowd.toLocaleString("en-IN")}</div>
        <div className="delta">
          {t("modules.finalReport.peakHour")} · {t("modules.finalReport.peakHourLabel", { hour: String(report.peak_hour).padStart(2, "0") })} ·{" "}
          {t("modules.finalReport.peakDetected", { count: report.peak_hour_total.toLocaleString("en-IN") })}
        </div>
      </section>

      <section className="fr-totals" style={{ marginTop: 18 }}>
        {slices.map((s) => (
          <article key={s.key} className="dash-stat">
            <div className="label">{s.label}</div>
            <div className="value">{s.value.toLocaleString("en-IN")}</div>
            <div className="delta" style={{ marginTop: 10 }}>
              <div className="cap-bar green">
                <span style={{ width: `${(s.value / sliceMax) * 100}%` }} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <article className="dash-card" style={{ marginTop: 18 }}>
        <header className="dash-card-head">
          <h3>{t("modules.finalReport.summaryTitle")}</h3>
        </header>
        <ul className="fr-summary">
          {report.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p style={{ marginTop: 14, fontSize: "0.85rem", color: "var(--c-stone)" }}>
          {t("modules.finalReport.exportNote")}
        </p>
      </article>
    </OpsLayout>
  );
}
