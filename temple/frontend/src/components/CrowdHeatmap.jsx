import { useTranslation } from "react-i18next";

// Floor-plan positions for each zone (viewBox 0 0 360 320). The backend returns
// the density data keyed by zone id; this component owns only the layout.
const LAYOUT = {
  sanctum: { x: 120, y: 24, w: 120, h: 76 },
  queue: { x: 70, y: 114, w: 220, h: 78 },
  prasad: { x: 28, y: 206, w: 140, h: 92 },
  parking: { x: 192, y: 206, w: 140, h: 92 },
};

const BANDS = ["Calm", "Moderate", "High", "Very High"];
const BAND_COLOR = { Calm: "#4e9d6c", Moderate: "#d6b23d", High: "#e0823c", "Very High": "#d64545" };

export default function CrowdHeatmap({ data }) {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === "ta";

  return (
    <div
      className="heatmap-wrap"
      style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) auto", gap: 20, alignItems: "start" }}
    >
      <svg
        viewBox="0 0 360 320"
        role="img"
        aria-label={t("modules.cctv.heatTitle")}
        style={{ width: "100%", height: "auto", borderRadius: 12, background: "rgba(0,0,0,0.18)" }}
      >
        {/* Premises outline */}
        <rect x="6" y="6" width="348" height="308" rx="14" fill="none" stroke="rgba(200,169,74,0.35)" strokeWidth="2" />

        {data.zones.map((z) => {
          const L = LAYOUT[z.id];
          if (!L) return null;
          const cx = L.x + L.w / 2;
          const cy = L.y + L.h / 2;
          return (
            <g key={z.id}>
              <rect x={L.x} y={L.y} width={L.w} height={L.h} rx="10" fill={z.color} fillOpacity="0.82" stroke="rgba(255,255,255,0.2)" />
              <text x={cx} y={cy - 9} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#fff">
                {ta ? z.name_ta : z.name_en}
              </text>
              <text x={cx} y={cy + 11} textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">
                {z.people.toLocaleString("en-IN")}
              </text>
              <text x={cx} y={cy + 27} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)">
                {t("modules.cctv.zoneOccupancy", { pct: z.occupancy_pct })}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="heatmap-legend" style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 150 }}>
        {BANDS.map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: BAND_COLOR[b], display: "inline-block" }} />
            {t(`modules.cctv.bandsHeat.${b}`)}
          </div>
        ))}
        <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.12)", fontSize: "0.78rem", color: "var(--c-stone)" }}>
          {t("modules.cctv.heatLegendNote")}
        </div>
      </div>
    </div>
  );
}
