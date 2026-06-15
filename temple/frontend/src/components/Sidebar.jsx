import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "./Icon.jsx";

export default function Sidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const modules = [
    { to: "/dashboard", end: true, icon: "home", label: t("nav.dashboard") },
    { to: "/dashboard/parking", icon: "parking", label: t("nav.parking") },
    { to: "/dashboard/bookings", icon: "lotus", label: t("nav.booking") },
    { to: "/cctv", icon: "shield", label: t("nav.cctv") },
    { to: "/prediction", icon: "crystal", label: t("nav.prediction") },
    { to: "/final-report", icon: "layers", label: t("nav.finalReport") },
    { to: "/heatmap", icon: "map", label: "Heatmap" },
    { to: "/queue", icon: "clock", label: "Queue Times" },
    { to: "/staff", icon: "staff", label: "Staff Planner" },
    { to: "/alerts", icon: "alert", label: "Alerts" },
    { to: "/revenue", icon: "dollar", label: "Revenue" },
    { to: "/festivals", icon: "flame", label: "Festival Surge" },
    { to: "/optimal-visit", icon: "compass", label: "Visit Planner" },
  ];

  const currentLabel = modules.find((m) =>
    m.end ? pathname === m.to : pathname.startsWith(m.to)
  )?.label ?? t("nav.dashboard");

  return (
    <aside className={`dash-side ${open ? "dash-side-open" : ""}`} aria-label={t("nav.dashboard")}>
      <button
        type="button"
        className="dash-side-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("nav.toggleNav")}
      >
        <span className="dash-side-toggle-label">
          <Icon name="home" size={16} />
          <span>{currentLabel}</span>
        </span>
        <span className={`dash-side-chevron ${open ? "open" : ""}`}>▾</span>
      </button>

      <div className="dash-side-body">
        <h4>{t("modules.kicker")}</h4>
        <nav className="dash-nav">
          {modules.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setOpen(false)}
            >
              <span className="ico"><Icon name={it.icon} size={18} /></span>
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <nav className="dash-nav dash-nav-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setOpen(false)}
          >
            <span className="ico"><Icon name="settings" size={18} /></span>
            <span>{t("nav.settings")}</span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
