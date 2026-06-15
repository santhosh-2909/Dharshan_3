import Icon from "./Icon.jsx";

export default function EmptyState({ icon = "lotus", title, message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={32} />
      </div>
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
    </div>
  );
}
