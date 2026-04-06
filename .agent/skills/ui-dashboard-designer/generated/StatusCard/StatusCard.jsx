export function StatusCard({ status, label, icon }) {
  return (
    <div className="card" data-status={status}>
      <span className="icon">{icon}</span>
      <div className="content">
        <h3>{label}</h3>
        <span className={`badge badge-${status}`}>{status}</span>
      </div>
    </div>
  );
}
