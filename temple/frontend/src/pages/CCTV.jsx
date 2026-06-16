import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import OpsLayout from "../components/OpsLayout.jsx";
import CrowdHeatmap from "../components/CrowdHeatmap.jsx";

// Live density band → existing status-pill colour.
const DENSITY_COLOR = { LOW: "green", MEDIUM: "yellow", HIGH: "red", VERY_HIGH: "red" };

export default function CCTV() {
  const { t } = useTranslation();

  const [streamOn, setStreamOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [live, setLive] = useState(null);       // { people_count, density }
  const [liveError, setLiveError] = useState(null);
  const [heatmap, setHeatmap] = useState(null);

  // Live people count — polled while the camera stream is on.
  useEffect(() => {
    if (!streamOn) return undefined;
    let alive = true;
    const poll = () =>
      api
        .liveCrowd()
        .then((d) => alive && (setLive(d), setLiveError(null)))
        .catch((e) => alive && setLiveError(e.message));
    poll();
    const id = setInterval(poll, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [streamOn]);

  // Forecast heatmap — loaded now, then refreshed every 15 minutes.
  const loadHeatmap = useCallback(() => {
    api.crowdHeatmap().then(setHeatmap).catch(() => {});
  }, []);
  useEffect(() => {
    loadHeatmap();
    const id = setInterval(loadHeatmap, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadHeatmap]);

  async function startCamera() {
    setStarting(true);
    setLiveError(null);
    try {
      await api.startCamera();
      setStreamOn(true);
    } catch (e) {
      setLiveError(e.message);
    } finally {
      setStarting(false);
    }
  }

  async function stopCamera() {
    setStreamOn(false);
    setLive(null);
    try {
      await api.stopCamera();
    } catch {
      /* best-effort */
    }
  }

  const expected = heatmap ? heatmap.expected_total : null;

  return (
    <OpsLayout>
      <header className="dash-head">
        <div>
          <p className="kicker">{t("modules.cctv.kicker")}</p>
          <h1>{t("modules.cctv.title")}</h1>
        </div>
      </header>

      {/* 1 · Live camera view */}
      <article className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="cctv-stage" style={{ position: "relative", padding: 0 }}>
          {streamOn ? (
            <>
              <img
                src={api.crowdStreamUrl}
                alt={t("modules.cctv.liveView")}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <span className="live-dot">{t("common.live")}</span>
            </>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.05rem",
                textAlign: "center",
                padding: "0 24px",
                maxWidth: "80%",
                color: liveError ? "var(--c-stone)" : undefined,
              }}
            >
              {liveError ? t("modules.cctv.offline") : t("modules.cctv.liveView")}
            </span>
          )}
        </div>
        <div style={{ padding: "12px 16px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {!streamOn ? (
            <button type="button" className="btn btn-primary" onClick={startCamera} disabled={starting}>
              {starting ? t("modules.cctv.starting") : t("modules.cctv.startCamera")}
            </button>
          ) : (
            <button type="button" className="btn" onClick={stopCamera}>
              {t("modules.cctv.stopCamera")}
            </button>
          )}
          {liveError && <span className="alert error" style={{ margin: 0, padding: "4px 10px" }}>{liveError}</span>}
        </div>
      </article>

      {/* 2 · People count + Expected count */}
      <section className="dash-stats" style={{ marginTop: 18 }}>
        <div className="dash-stat">
          <div className="label">{t("modules.cctv.countedToday")}</div>
          <div className="value">{live ? live.people_count.toLocaleString("en-IN") : "—"}</div>
          {live ? (
            <div className="delta">
              <span className={"status-pill " + (DENSITY_COLOR[live.density] || "")}>
                {t(`modules.cctv.bands.${live.density}`)}
              </span>
              <span style={{ marginLeft: 8 }}>{t("modules.cctv.inFrame", { n: live.in_frame })}</span>
            </div>
          ) : (
            <div className="delta">{t("modules.cctv.awaitingCamera")}</div>
          )}
        </div>
        <div className="dash-stat">
          <div className="label">{t("modules.cctv.expectedCount")}</div>
          <div className="value">{expected != null ? expected.toLocaleString("en-IN") : "—"}</div>
          {heatmap && (
            <div className="delta">{t("modules.cctv.ofCapacity", { cap: heatmap.capacity.toLocaleString("en-IN") })}</div>
          )}
        </div>
      </section>

      {/* 3 · Live crowd density heatmap (forecast-based, 15-min refresh) */}
      <article className="dash-card" style={{ marginTop: 18 }}>
        <header className="dash-card-head">
          <div>
            <h3>{t("modules.cctv.heatTitle")}</h3>
            <small style={{ color: "var(--c-stone)" }}>{t("modules.cctv.heatSub")}</small>
          </div>
          {heatmap && (
            <span className="card-tag">
              {t("modules.cctv.heatUpdated", { time: new Date(heatmap.generated_at).toLocaleTimeString() })}
            </span>
          )}
        </header>
        {heatmap ? <CrowdHeatmap data={heatmap} /> : <Loader />}
      </article>
    </OpsLayout>
  );
}
