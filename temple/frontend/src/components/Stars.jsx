export default function Stars({ value = 0, max = 5, size = "1rem" }) {
  return (
    <span className="stars" aria-label={`${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden="true" style={{ fontSize: size }}>
          {i < value ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}
