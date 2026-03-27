function SkeletonRow({ mode }) {
  return (
    <div className={`state-row ${mode}`}>
      {mode === "social" ? (
        <div className="state-head-group">
          <div className="skel state-avatar" />
          <div className="state-copy-stack">
            <div className="skel state-line meta short" />
            <div className="skel state-line title" />
          </div>
        </div>
      ) : (
        <div className="skel state-thumb" />
      )}
      <div className="state-copy-stack">
        {mode !== "social" && <div className="skel state-line meta short" />}
        <div className="skel state-line title" />
        <div className="skel state-line body" />
        <div className="skel state-line body short" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ mode = "news", title, detail, count = 3, showHero = false }) {
  return (
    <div className={`state-shell ${mode}`}>
      <div className="state-card">
        <div className="state-kicker">Loading</div>
        <div className="state-title">{title}</div>
        {detail && <div className="state-copy">{detail}</div>}
      </div>

      {showHero && (
        <div className="state-hero">
          <div className="skel state-line meta short" />
          <div className="skel state-line hero" />
          <div className="skel state-line body" />
          <div className="skel state-line body short" />
        </div>
      )}

      <div className="state-list">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonRow key={`${mode}-${index}`} mode={mode} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ mode = "news", label, title, copy, hint, actions = [] }) {
  const visibleActions = actions.filter(Boolean);

  return (
    <div className={`empty-panel ${mode}`}>
      <div className="empty-badge">{label}</div>
      <div className="empty-panel-title">{title}</div>
      {copy && <div className="empty-panel-copy">{copy}</div>}
      {hint && <div className="empty-panel-hint">{hint}</div>}
      {visibleActions.length > 0 && (
        <div className="empty-actions">
          {visibleActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`empty-action ${action.tone || ""}`.trim()}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
