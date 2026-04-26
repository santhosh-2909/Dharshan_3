import Sidebar from "./Sidebar.jsx";

export default function OpsLayout({ children }) {
  return (
    <div className="dash-shell">
      <Sidebar />
      <div className="dash-main">{children}</div>
    </div>
  );
}
