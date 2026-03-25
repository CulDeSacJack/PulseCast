import { useState } from "react";
import { getDomainLabel } from "../lib/feed-utils";

export default function BskyCard({
  name,
  handle,
  avatar,
  time,
  text,
  link,
  isDealFlag,
  extTitle,
  extUrl,
  onToggleMute,
  isMuted = false,
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare(event) {
    event.preventDefault();
    event.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({ text, url: link });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="bsky-card">
      <a href={link} target="_blank" rel="noopener noreferrer" className="bsky-main">
        <div className="bsky-head">
          {avatar ? (
            <div className="bsky-avatar bsky-avatar-image">
              {/* External avatars are user-provided remote images, so a raw img is intentional here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt="" className="bsky-avatar-img" />
            </div>
          ) : (
            <div className="bsky-avatar">{name.charAt(0)}</div>
          )}
          <div>
            <div className="bsky-name">{name}</div>
            <div className="bsky-handle">@{handle}</div>
          </div>
          <div className="bsky-time">{time}</div>
        </div>
        {isDealFlag && <span className="badge-deal" style={{ marginBottom: "6px", display: "inline-block" }}>DEAL</span>}
        <div className="bsky-text">{text}</div>
        {extTitle && (
          <div className="bsky-link">
            <div className="bsky-link-title">{extTitle}</div>
            {extUrl && <div className="bsky-link-domain">{getDomainLabel(extUrl)}</div>}
          </div>
        )}
      </a>
      <div className="card-actions bsky-actions">
        {onToggleMute && (
          <button type="button" className={`mute-btn ${isMuted ? "on" : ""}`} onClick={onToggleMute}>
            {isMuted ? "UNMUTE" : "MUTE"}
          </button>
        )}
        <button type="button" className={`share-btn ${copied ? "on" : ""}`} onClick={handleShare}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          {copied ? "COPIED" : "SHARE"}
        </button>
      </div>
    </div>
  );
}
