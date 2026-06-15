import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Loader from "../components/Loader.jsx";

const ZONE_COLORS = {
  "Calm": { fill: "rgba(74, 125, 74, 0.35)", stroke: "#4a7d4a" },
  "Moderate": { fill: "rgba(200, 169, 74, 0.35)", stroke: "#c8a94a" },
  "High": { fill: "rgba(196, 90, 27, 0.35)", stroke: "#c45a1b" },
  "Very High": { fill: "rgba(168, 56, 43, 0.40)", stroke: "#a8382b" },
};

const ZONE_ICONS = {
  sanctum: "\u{1F6D5}",
  queue: "\u{1F6B6}",
  entry: "\u{1F6AA}",
  prasad: "\u{1F64F}",
  dining: "\u{1F37D}",
  open: "\u{1F30A}",
};

export default function Heatmap() {
  const [zones, setZones] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    api.zoneHeatmap().then(setZones).catch(() => setZones([]));
  }, []);

  if (!zones) return <Loader />;

  return (
    <>
      <PageHeader kicker="Live Density" title="Temple Zone Heatmap" />
      <p className="heatmap-lede">Real-time crowd density across temple zones. Tap a zone for details.</p>

      <div className="heatmap-legend">
        {["Calm", "Moderate", "High", "Very High"].map((b) => (
          <span key={b} className="heatmap-legend-item">
            <span className="heatmap-legend-dot" style={{ background: ZONE_COLORS[b].stroke }} />
            {b}
          </span>
        ))}
      </div>

      <div className="heatmap-container">
        <svg viewBox="0 0 100 70" className="heatmap-svg">
          {/* Temple outline */}
          <rect x="2" y="2" width="96" height="66" rx="3" fill="none" stroke="var(--c-border-strong)" strokeWidth="0.5" strokeDasharray="2,1" />
          <text x="50" y="5.5" textAnchor="middle" fontSize="2.2" fill="var(--c-stone)" opacity="0.6">Temple Floor Plan</text>

          {zones.map((z) => {
            const colors = ZONE_COLORS[z.band] || ZONE_COLORS["Calm"];
            const isHovered = hovered === z.zone_name;
            return (
              <g
                key={z.zone_name}
                onMouseEnter={() => setHovered(z.zone_name)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={z.x_pct}
                  y={z.y_pct}
                  width={z.width_pct}
                  height={z.height_pct}
                  rx="1.5"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isHovered ? "0.8" : "0.4"}
                  opacity={isHovered ? 1 : 0.85}
                />
                <text
                  x={z.x_pct + z.width_pct / 2}
                  y={z.y_pct + z.height_pct / 2 - 1.5}
                  textAnchor="middle"
                  fontSize="2.8"
                >
                  {ZONE_ICONS[z.zone_type] || ""}
                </text>
                <text
                  x={z.x_pct + z.width_pct / 2}
                  y={z.y_pct + z.height_pct / 2 + 2}
                  textAnchor="middle"
                  fontSize="1.8"
                  fill="var(--c-ink)"
                  fontWeight="600"
                >
                  {z.zone_name.split(" ")[0]}
                </text>
                <text
                  x={z.x_pct + z.width_pct / 2}
                  y={z.y_pct + z.height_pct / 2 + 4.5}
                  textAnchor="middle"
                  fontSize="1.6"
                  fill="var(--c-stone)"
                >
                  {z.people_count} people
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hovered && (() => {
        const z = zones.find((zz) => zz.zone_name === hovered);
        if (!z) return null;
        return (
          <div className="heatmap-tooltip card">
            <h3>{z.zone_name}</h3>
            <div className="heatmap-tooltip-grid">
              <span className="label">People</span><strong>{z.people_count}</strong>
              <span className="label">Density</span><strong>{z.density_pct}%</strong>
              <span className="label">Status</span><span className={`band ${z.band.toLowerCase()}`}>{z.band}</span>
              <span className="label">Camera</span><span>{z.camera_id}</span>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-3" style={{ marginTop: "24px" }}>
        {zones.map((z) => (
          <div key={z.zone_name} className="card">
            <span className="kicker">{z.zone_type.toUpperCase()}</span>
            <h3>{z.zone_name}</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <span className="stat-value" style={{ fontSize: "1.5rem", fontFamily: "var(--font-serif)" }}>{z.people_count}</span>
              <span className={`band ${z.band.toLowerCase()}`}>{z.band}</span>
            </div>
            <div style={{ marginTop: "6px", fontSize: "0.85rem", color: "var(--c-stone)" }}>
              Density: {z.density_pct}% | Camera: {z.camera_id}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
