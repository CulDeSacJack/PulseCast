export default function TopStoryCard({ title, source, color, time, count, link, onDismiss, isLead = false }) {
  return (
    <article className={`ts-card ${isLead ? "lead" : "stack"}`}>
      <button
        type="button"
        aria-label={`Dismiss ${title}`}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDismiss(); }}
        className="ts-dismiss"
      >
        x
      </button>

      <a href={link} target="_blank" rel="noopener noreferrer" className="ts-link">
        <div className="ts-kicker">{isLead ? "Lead Story" : "Cross-Source Pickup"}</div>
        <div className="ts-title">{title}</div>
        {isLead && (
          <div className="ts-dek">
            Tracked across {count} sources{time ? ` · ${time}` : ""}.
          </div>
        )}
        <div className="ts-meta">
          <span className="ts-src" style={{ color }}>{source}</span>
          {!isLead && time && <span className="card-time">· {time}</span>}
          <span className="ts-count">+{count} sources</span>
        </div>
      </a>
    </article>
  );
}
