export function VesselTitle({ name = "", darkMode = false, className = "", as: Tag = "h1" }) {
  return (
    <Tag
      className={`vessel-title ${darkMode ? "vessel-title--dark" : "vessel-title--light"} ${className}`.trim()}
    >
      {name}
    </Tag>
  );
}
