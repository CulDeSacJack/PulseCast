"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════
   DEAL DETECTION
═══════════════════════════════════════════ */
const DEAL_WORDS = ["deal","deals","sale","discount","price drop","price cut","lowest price","clearance","save","savings","% off","cheapest","under $","giveaway","free game","free dlc","free download","free to keep","free play","bundle","flash sale","price match"];
function isDeal(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return DEAL_WORDS.some(w => t.includes(w));
}

/* ═══════════════════════════════════════════
   TOP STORIES CLUSTERING
═══════════════════════════════════════════ */
const STOP_WORDS = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","is","are","was","were","be","been","has","have","had","do","does","did","will","would","could","should","can","may","not","no","its","it","this","that","from","by","as","up","out","if","about","than","into","over","after","new","how","all","just","one","get","got","also","more","very","what","when","who","why","where","which","their","they","them","your","you","our","we","my","me","he","she","his","her","game","games","gaming"]);

function extractKeywords(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function getTopStories(articles) {
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  const recent = articles.filter(a => a.date && a.date.getTime() >= cutoff);
  if (recent.length < 4) return [];
  const clusters = [];
  const used = new Set();
  recent.forEach((a, i) => {
    if (used.has(i)) return;
    const kw = extractKeywords(a.title);
    if (kw.length < 2) return;
    const group = [{ article: a, idx: i }];
    recent.forEach((b, j) => {
      if (i === j || used.has(j)) return;
      const bkw = extractKeywords(b.title);
      const shared = kw.filter(w => bkw.includes(w));
      if (shared.length >= 2 && a.source !== b.source) group.push({ article: b, idx: j });
    });
    const sources = new Set(group.map(g => g.article.source));
    if (sources.size >= 3) {
      group.forEach(g => used.add(g.idx));
      clusters.push({ rep: group[0].article, count: sources.size, sources: [...sources] });
    }
  });
  return clusters.sort((a, b) => b.count - a.count).slice(0, 3);
}

function getTrendingKeywords(articles) {
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  const recent = articles.filter(a => a.date && a.date.getTime() >= cutoff);
  const counts = {};
  recent.forEach(a => {
    extractKeywords(a.title).forEach(w => { counts[w] = (counts[w] || 0) + 1; });
  });
  return Object.entries(counts)
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function parseDate(str) {
  if (!str) return new Date(0);
  if (str instanceof Date) return isNaN(str.getTime()) ? new Date(0) : str;
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  d = new Date(str.replace(" ", "T") + "Z");
  if (!isNaN(d.getTime())) return d;
  d = new Date(str.replace(" ", "T"));
  if (!isNaN(d.getTime())) return d;
  return new Date(0);
}

function getTimeAgo(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d || isNaN(d.getTime()) || d.getTime() === 0) return "";
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getDateLabel(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d || isNaN(d.getTime()) || d.getTime() === 0) return "";
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject("timeout"), ms);
    promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });
}

/* ═══════════════════════════════════════════
   SOURCES
═══════════════════════════════════════════ */
const NEWS_SOURCES = [
  { name: "IGN",            color: "#ff4500", platform: null,           url: "https://feeds.feedburner.com/ign/all" },
  { name: "GameSpot",       color: "#00c853", platform: null,           url: "https://www.gamespot.com/feeds/news/" },
  { name: "PC Gamer",       color: "#4fc3f7", platform: "PC",           url: "https://www.pcgamer.com/rss/" },
  { name: "Kotaku",         color: "#f43f5e", platform: null,           url: "https://kotaku.com/rss" },
  { name: "Eurogamer",      color: "#a855f7", platform: null,           url: "https://www.eurogamer.net/feed" },
  { name: "VGC",            color: "#eab308", platform: null,           url: "https://www.videogameschronicle.com/feed/" },
  { name: "Insider Gaming", color: "#00e5ff", platform: "Xbox",         url: "https://insider-gaming.com/feed/" },
  { name: "GamesRadar",     color: "#f5a623", platform: null,           url: "https://www.gamesradar.com/rss/" },
  { name: "Game Informer",  color: "#d4af37", platform: null,           url: "https://gameinformer.com/rss.xml" },
  { name: "Game Rant",      color: "#14b8a6", platform: null,           url: "https://gamerant.com/feed/" },
  { name: "Push Square",    color: "#3b82f6", platform: "PlayStation",  url: "https://www.pushsquare.com/feeds/latest" },
  { name: "Nintendo Life",  color: "#e60012", platform: "Nintendo",     url: "https://www.nintendolife.com/feeds/latest" },
];

const PLATFORM_FILTERS = ["All", "PlayStation", "Xbox", "Nintendo", "PC"];

const BSKY_ACCOUNTS = [
  { name: "Wario64",        handle: "wario64.bsky.social",           group: "Deals" },
  { name: "CheapAssGamer",  handle: "cheapassgamer.com",             group: "Deals" },
  { name: "OW Calvary",     handle: "owcavalry.com",                 group: "Deals" },
  { name: "Jason Schreier", handle: "jasonschreier.bsky.social",     group: "Press" },
  { name: "Tom Warren",     handle: "tomwarren.co.uk",               group: "Press" },
  { name: "Geoff Keighley", handle: "geoffkeighley.bsky.social",     group: "Press" },
  { name: "Shinobi602",     handle: "shinobi602.bsky.social",        group: "Press" },
  { name: "Stealth40k",     handle: "stealth40k.bsky.social",        group: "Press" },
  { name: "Knoebel",        handle: "knoebel.bsky.social",           group: "Press" },
  { name: "Mat Piscatella", handle: "matpiscatella.bsky.social",     group: "Press" },
  { name: "Digital Foundry",handle: "digitalfoundry.bsky.social",    group: "Press" },
  { name: "Polygon",        handle: "polygon.com",                   group: "Press" },
  { name: "IGN",            handle: "ign.com",                       group: "Press" },
  { name: "Eurogamer",      handle: "eurogamer.bsky.social",         group: "Press" },
  { name: "Gematsu",        handle: "gematsu.com",                   group: "Press" },
  { name: "GamesIndustry",  handle: "gibiz.bsky.social",             group: "Press" },
  { name: "Hazzadorgamin",  handle: "hazzadorgamin.bsky.social",     group: "Press" },
  { name: "VGC",            handle: "videogameschronicle.com",       group: "Press" },
  { name: "Xbox",           handle: "xbox.com",                      group: "Xbox" },
  { name: "Game Pass",      handle: "gamepass.xbox.com",             group: "Xbox" },
  { name: "PlayStation",    handle: "playstation.com",               group: "PlayStation" },
  { name: "Nintendo Life",  handle: "nintendolife.com",              group: "Nintendo" },
  { name: "Steam",          handle: "steampowered.com",              group: "PC" },
  { name: "Capcom USA",     handle: "capcomusa.com",                 group: "Dev" },
  { name: "Remedy",         handle: "remedygames.com",               group: "Dev" },
  { name: "Devolver",       handle: "devolverdigital.com",           group: "Dev" },
  { name: "Supergiant",     handle: "supergiantgames.bsky.social",   group: "Dev" },
  { name: "RGG Studio",     handle: "rggwest.bsky.social",           group: "Dev" },
  { name: "Square Enix",    handle: "square-enix-games.com",         group: "Dev" },
  { name: "Focus Ent.",     handle: "focus-entmt.com",               group: "Dev" },
  { name: "Sucker Punch",          handle: "suckerpunchprod.bsky.social",  group: "Dev" },
  { name: "Bethesda Studios",      handle: "bethesdastudios.com",          group: "Dev" },
  { name: "Bethesda",              handle: "bethesda.net",                 group: "Dev" },
  { name: "Annapurna",             handle: "annapurna.com",                group: "Dev" },
  { name: "505 Games",             handle: "505games.com",                 group: "Dev" },
  { name: "Pure Xbox",             handle: "purexbox.com",                 group: "Xbox" },
  { name: "GOG",                   handle: "gog.com",                      group: "PC" },
  { name: "Steam Deck",            handle: "steamdeck.com",                group: "PC" },
  { name: "Valve",                 handle: "valvesoftware.com",            group: "PC" },
  { name: "SteamDB",               handle: "steamdb.info",                 group: "PC" },
  { name: "Green Man Gaming",      handle: "greenmangaming.com",           group: "Deals" },
  { name: "GameSpot",              handle: "gamespot.com",                 group: "Press" },
];

const SOCIAL_FILTERS = ["All", "Deals", "Press", "Xbox", "PlayStation", "Nintendo", "PC", "Dev"];

/* ═══════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════ */
function NewsCard({ title, source, time, color, image, link, isSaved, onSave, isDealFlag, isBreaking }) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title, url: link }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-meta">
          <span className="card-src" style={{ color }}>{source}</span>
          {time && <span className="card-time">· {time}</span>}
          {isBreaking && <span className="badge-brk">BREAKING</span>}
          {isDealFlag && <span className="badge-deal">DEAL</span>}
        </div>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <div className="card-title">{title}</div>
        </a>
        <div className="card-actions">
          <button className={`save-btn ${isSaved ? "on" : ""}`} onClick={onSave}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {isSaved ? "SAVED" : "SAVE"}
          </button>
          <button className={`share-btn ${copied ? "on" : ""}`} onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            {copied ? "COPIED" : "SHARE"}
          </button>
        </div>
      </div>
      {image && (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <img className="card-thumb" src={image} alt="" onError={(e) => { e.target.style.display = "none"; }} />
        </a>
      )}
    </div>
  );
}

function TopStoryCard({ title, source, color, time, count, link, onDismiss }) {
  return (
    <div className="ts-card" style={{ position: "relative" }}>
      {/* The Dismiss 'X' Button */}
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(); }}
        style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "16px", padding: "4px", zIndex: 10 }}
      >
        ✕
      </button>
      
      {/* Clicking the link ALSO triggers the dismiss! */}
      <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "block", paddingRight: "20px" }} onClick={() => onDismiss()}>
        <div className="ts-title">{title}</div>
        <div className="ts-meta">
          <span className="ts-src" style={{ color }}>{source}</span>
          {time && <span className="card-time">· {time}</span>}
          <span className="ts-count">+{count} sources</span>
        </div>
      </a>
    </div>
  );
}

function BskyCard({ name, handle, avatar, time, text, link, isDealFlag, extTitle, extUrl }) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ text: text, url: link }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
      <div className="bsky-card">
        <div className="bsky-head">
          {avatar ? (
            <div className="bsky-avatar" style={{ overflow: "hidden", padding: 0 }}>
              <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
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
            {extUrl && <div className="bsky-link-domain">{(() => { try { return new URL(extUrl).hostname.replace("www.", ""); } catch { return ""; } })()}</div>}
          </div>
        )}
        {/* The New Share Button! */}
        <div className="card-actions" style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
          <button className={`share-btn ${copied ? "on" : ""}`} onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            {copied ? "COPIED" : "SHARE"}
          </button>
        </div>
      </div>
    </a>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function Home() {
  const [activeTab, setActiveTab]         = useState("News");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [activeFilter, setActiveFilter]   = useState("All");
  const [socialFilter, setSocialFilter]   = useState("All");
  const [dealsOnly, setDealsOnly]         = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [articles, setArticles]           = useState([]);
  const [socialPosts, setSocialPosts]     = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [socialLoaded, setSocialLoaded]   = useState(false);
  const [savedArticles, setSavedArticles] = useState([]);
  const [newsRenderLimit, setNewsRenderLimit]   = useState(30);
  const [socialRenderLimit, setSocialRenderLimit] = useState(30);
  const [newArticleCount, setNewArticleCount]   = useState(0);
  const [newSocialCount, setNewSocialCount]     = useState(0);
  const [savedSort, setSavedSort]         = useState("saved");
  
  // The New Dismissed Stories Notepad!
  const [dismissedStories, setDismissedStories] = useState([]);

  const seenLinksRef      = useRef(new Set());
  const seenSocialIdsRef  = useRef(new Set());
  const activeTabRef      = useRef("News");
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Load bookmarks
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pulsecast_bookmarks");
      if (stored) setSavedArticles(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("pulsecast_bookmarks", JSON.stringify(savedArticles)); } catch {}
  }, [savedArticles]);

  // Load and save dismissed stories
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pulsecast_dismissed");
      if (stored) setDismissedStories(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("pulsecast_dismissed", JSON.stringify(dismissedStories)); } catch {}
  }, [dismissedStories]);

  function handleDismissTopStory(link) {
    if (!dismissedStories.includes(link)) {
      setDismissedStories(prev => [...prev, link]);
    }
  }

  function toggleSave(article) {
    const isAlreadySaved = savedArticles.some(s => s.link === article.link);
    if (isAlreadySaved) {
      setSavedArticles(prev => prev.filter(s => s.link !== article.link));
    } else {
      setSavedArticles(prev => [...prev, { ...article, date: article.date?.toISOString?.() || article.date, savedAt: Date.now() }]);
    }
  }

  const fetchNews = useCallback(async () => {
    setIsNewsLoading(true);
    const fresh = [];

    await Promise.allSettled(NEWS_SOURCES.map(async (source) => {
      try {
        const r = await withTimeout(fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`), 10000);
        if (r.ok) {
          const data = await r.json();
          if (data.status === "ok" && data.items?.length) {
            fresh.push(...data.items.map(item => ({
              title: (item.title || "").trim(),
              source: source.name,
              color: source.color,
              date: parseDate(item.pubDate),
              image: item.thumbnail || item.enclosure?.link || "",
              link: item.link || "",
            })).filter(a => a.title && a.link));
            return;
          }
        }
      } catch {}

      try {
        const r = await withTimeout(fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`), 10000);
        if (r.ok) {
          const json = await r.json();
          const xml = json.contents;
          if (xml && typeof xml === "string") {
            const doc = new DOMParser().parseFromString(xml, "application/xml");
            if (!doc.querySelector("parsererror")) {
              fresh.push(...[...doc.querySelectorAll("item, entry")].map(el => {
                const title = (el.querySelector("title")?.textContent || "").trim();
                const linkEl = el.querySelector("link");
                const link = linkEl?.getAttribute("href") || linkEl?.textContent?.trim() || "";
                const rawDate = el.querySelector("pubDate")?.textContent || el.querySelector("published")?.textContent || el.querySelector("updated")?.textContent || "";
                const m = (el.querySelector("description")?.textContent || "").match(/<img[^>]+src=["']([^"']+)/i);
                return { title, source: source.name, color: source.color, date: parseDate(rawDate), image: m ? m[1] : "", link };
              }).filter(a => a.title && a.link));
            }
          }
        }
      } catch {}
    }));

    const seen = new Set();
    const deduped = fresh.filter(a => { if (seen.has(a.link)) return false; seen.add(a.link); return true; });
    deduped.sort((a, b) => b.date - a.date);

    if (seenLinksRef.current.size === 0) {
      deduped.forEach(a => seenLinksRef.current.add(a.link));
    } else {
      const newOnes = deduped.filter(a => !seenLinksRef.current.has(a.link));
      deduped.forEach(a => seenLinksRef.current.add(a.link));
      if (newOnes.length > 0 && activeTabRef.current !== "News") {
        setNewArticleCount(prev => prev + newOnes.length);
      }
    }

    setArticles(deduped);
    setIsNewsLoading(false);
  }, []);

  const fetchSocial = useCallback(async () => {
    setIsSocialLoading(true);
    const fresh = [];

    await Promise.allSettled(BSKY_ACCOUNTS.map(async (account) => {
      try {
        const r = await withTimeout(fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${account.handle}&limit=20&filter=posts_no_replies`), 10000);
        if (!r.ok) return;
        const data = await r.json();
        if (!data.feed) return;

        fresh.push(...data.feed.map(entry => {
          const post = entry.post || {};
          const rec = post.record || {};
          const text = (typeof rec.text === "string" ? rec.text : "").trim();
          const uri = typeof post.uri === "string" ? post.uri : "";
          const postId = uri.split("/").pop() || "";
          const authorHandle = post.author?.handle || account.handle;
          const ext = (post.embed || {}).external || null;
          return {
            id: uri || Math.random().toString(),
            name: post.author?.displayName || account.name,
            handle: authorHandle,
            avatar: post.author?.avatar || "",
            text,
            date: parseDate(rec.createdAt || post.indexedAt),
            link: postId ? `https://bsky.app/profile/${authorHandle}/post/${postId}` : `https://bsky.app/profile/${account.handle}`,
            extTitle: ext?.title || "",
            extUrl: ext?.uri || "",
            group: account.group,
          };
        }).filter(p => p.text));
      } catch {}
    }));

    const seen = new Set();
    const deduped = fresh.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
    deduped.sort((a, b) => b.date - a.date);

    if (seenSocialIdsRef.current.size === 0) {
      deduped.forEach(p => seenSocialIdsRef.current.add(p.id));
    } else {
      const newOnes = deduped.filter(p => !seenSocialIdsRef.current.has(p.id));
      deduped.forEach(p => seenSocialIdsRef.current.add(p.id));
      if (newOnes.length > 0 && activeTabRef.current !== "Social") {
        setNewSocialCount(prev => prev + newOnes.length);
      }
    }

    setSocialPosts(deduped);
    setIsSocialLoading(false);
    setSocialLoaded(true);
  }, []);

  function handleRefresh() {
    fetchNews();
    if (socialLoaded) fetchSocial();
  }

  useEffect(() => {
    fetchNews();
    const interval = setInterval(() => {
      fetchNews();
      if (socialLoaded) fetchSocial();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews, fetchSocial, socialLoaded]);

  useEffect(() => {
    if (activeTab === "Social" && !socialLoaded && !isSocialLoading) fetchSocial();
  }, [activeTab, socialLoaded, isSocialLoading, fetchSocial]);

  useEffect(() => { setNewsRenderLimit(30); }, [activeFilter, platformFilter, activeTab]);
  useEffect(() => { setSocialRenderLimit(30); }, [activeTab, socialFilter]);

  function switchTab(tab) {
    setActiveTab(tab);
    setSearchQuery("");
    setActiveFilter("All");
    setPlatformFilter("All");
    setDealsOnly(false);
    setSocialFilter("All");
    if (tab === "News") setNewArticleCount(0);
    if (tab === "Social") setNewSocialCount(0);
  }

  function switchPlatform(p) {
    setPlatformFilter(p);
    setActiveFilter("All");
  }

  // Platform-aware source list and article filtering
  const platformSources = platformFilter === "All"
    ? null
    : new Set(NEWS_SOURCES.filter(s => s.platform === platformFilter).map(s => s.name));

  const filterButtons = ["All", ...(platformFilter === "All"
    ? NEWS_SOURCES.map(s => s.name)
    : NEWS_SOURCES.filter(s => s.platform === platformFilter).map(s => s.name))];

  const filteredArticles = articles
    .filter(a => !platformSources || platformSources.has(a.source))
    .filter(a => activeFilter === "All" || a.source === activeFilter)
    .filter(a => !dealsOnly || isDeal(a.title))
    .filter(a => !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.source.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredSocial = socialPosts
    .filter(p => socialFilter === "All" || p.group === socialFilter)
    .filter(p => !searchQuery || p.text.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.handle.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredSaved = [...savedArticles]
    .sort((a, b) => savedSort === "saved"
      ? (b.savedAt || 0) - (a.savedAt || 0)
      : parseDate(b.date) - parseDate(a.date))
    .filter(a => !searchQuery || (a.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (a.source || "").toLowerCase().includes(searchQuery.toLowerCase()));

  const topStories = getTopStories(articles);
  const dealCount  = articles.filter(a => isDeal(a.title)).length;
  const trending   = getTrendingKeywords(articles);

  return (
    <div className="wrap">
      <header>
        <div className="header-row">
          <div>
            <div className="logo">PULSECAST</div>
            <div className="tagline">Gaming News · Curated</div>
          </div>
          <button className="refresh-btn" onClick={handleRefresh} disabled={isNewsLoading} title="Refresh">
            <svg className={isNewsLoading ? "spinning" : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="nav">
        {["News", "Social", "Saved"].map(tab => (
          <button key={tab} className={`nav-btn ${activeTab === tab ? "active" : ""}`} onClick={() => switchTab(tab)}>
            {tab}
            {tab === "News"   && newArticleCount > 0 && <span className="nav-badge">{newArticleCount}</span>}
            {tab === "Social" && newSocialCount > 0  && <span className="nav-badge">{newSocialCount}</span>}
          </button>
        ))}
      </div>

      <div className="search-wrap">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8888a0" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")}>×</button>}
        </div>
      </div>

      {/* ═══ NEWS FILTERS ═══ */}
      {activeTab === "News" && (
        <>
          <div className="pills">
            {PLATFORM_FILTERS.map(p => (
              <button key={p} className={`pill ${platformFilter === p ? "on" : ""}`} onClick={() => switchPlatform(p)}>
                {p}
              </button>
            ))}
          </div>
          <div className="pills" style={{ paddingTop: 0 }}>
            {filterButtons.map(name => (
              <button key={name} className={`pill ${activeFilter === name ? "on" : ""}`} onClick={() => setActiveFilter(name)}>
                {name}
              </button>
            ))}
            {dealCount > 0 && (
              <button className={`pill deal ${dealsOnly ? "on" : ""}`} onClick={() => setDealsOnly(!dealsOnly)}>
                🔥 DEALS ({dealCount})
              </button>
            )}
          </div>
        </>
      )}

      {/* ═══ SOCIAL FILTERS ═══ */}
      {activeTab === "Social" && (
        <div className="pills">
          {SOCIAL_FILTERS.map(name => (
            <button key={name} className={`pill ${socialFilter === name ? "on" : ""}`} onClick={() => setSocialFilter(name)}>
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="content">

        {/* ═══ NEWS TAB ═══ */}
        {activeTab === "News" && (
          <>
            {isNewsLoading && articles.length === 0 ? (
              <div className="empty">
                <div className="empty-title">Loading the Pulse...</div>
                <div style={{ color: "var(--text2)", fontSize: "13px" }}>Fetching from {NEWS_SOURCES.length} sources</div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📡</div>
                <div className="empty-title">{searchQuery ? "No results" : "No articles loaded"}</div>
              </div>
            ) : (
              <>
                {/* Trending keywords */}
                {activeFilter === "All" && platformFilter === "All" && !dealsOnly && !searchQuery && trending.length > 0 && (
                  <div className="trending">
                    <div className="trending-label">Trending</div>
                    <div className="trending-pills">
                      {trending.map(word => (
                        <button key={word} className="trending-pill" onClick={() => setSearchQuery(word)}>
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Stories */}
                {activeFilter === "All" && platformFilter === "All" && !dealsOnly && !searchQuery && topStories.filter(c => !dismissedStories.includes(c.rep.link)).length > 0 && (
                  <div className="top-stories">
                    <div className="ts-label">📈 Top Stories</div>
                    {topStories
                      .filter(c => !dismissedStories.includes(c.rep.link))
                      .map((c, i) => (
                      <TopStoryCard 
                        key={i} 
                        title={c.rep.title} 
                        source={c.rep.source} 
                        color={c.rep.color} 
                        time={getTimeAgo(c.rep.date)} 
                        count={c.count} 
                        link={c.rep.link} 
                        onDismiss={() => handleDismissTopStory(c.rep.link)}
                      />
                    ))}
                    <div className="divider">All Headlines</div>
                  </div>
                )}

                {filteredArticles.slice(0, newsRenderLimit).map((article) => (
                  <NewsCard
                    key={article.link}
                    title={article.title}
                    source={article.source}
                    time={getTimeAgo(article.date)}
                    color={article.color}
                    image={article.image}
                    link={article.link}
                    isSaved={savedArticles.some(s => s.link === article.link)}
                    onSave={() => toggleSave(article)}
                    isDealFlag={isDeal(article.title)}
                    isBreaking={article.date && (Date.now() - article.date.getTime()) < 1800000}
                  />
                ))}

                {filteredArticles.length > newsRenderLimit && (
                  <button className="load-more" onClick={() => setNewsRenderLimit(prev => prev + 30)}>
                    Show more ({filteredArticles.length - newsRenderLimit} remaining)
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ═══ SOCIAL TAB ═══ */}
        {activeTab === "Social" && (
          <>
            {isSocialLoading && socialPosts.length === 0 ? (
              <div className="empty">
                <div className="empty-title">Loading Bluesky feeds...</div>
                <div style={{ color: "var(--text2)", fontSize: "13px" }}>Fetching from {BSKY_ACCOUNTS.length} accounts</div>
              </div>
            ) : filteredSocial.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🦋</div>
                <div className="empty-title">{searchQuery ? "No results" : "No posts loaded"}</div>
              </div>
            ) : (
              <>
                {filteredSocial.slice(0, socialRenderLimit).map((post) => (
                  <BskyCard
                    key={post.id}
                    name={post.name}
                    handle={post.handle}
                    avatar={post.avatar}
                    time={getTimeAgo(post.date)}
                    text={post.text}
                    link={post.link}
                    isDealFlag={isDeal(post.text)}
                    extTitle={post.extTitle}
                    extUrl={post.extUrl}
                  />
                ))}
                {filteredSocial.length > socialRenderLimit && (
                  <button className="load-more" onClick={() => setSocialRenderLimit(prev => prev + 30)}>
                    Show more ({filteredSocial.length - socialRenderLimit} remaining)
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ═══ SAVED TAB ═══ */}
        {activeTab === "Saved" && (
          <>
            {filteredSaved.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📑</div>
                <div className="empty-title">{searchQuery ? "No match" : "No saved articles yet"}</div>
                <div style={{ color: "var(--text2)", fontSize: "13px" }}>Tap SAVE on any headline</div>
              </div>
            ) : (
              <>
                <div className="saved-header">
                  <span style={{ fontSize: "11px", color: "var(--text2)", fontWeight: 600, letterSpacing: ".1em" }}>
                    {filteredSaved.length} SAVED
                  </span>
                  <div className="sort-toggle">
                    <button className={`sort-btn ${savedSort === "saved" ? "on" : ""}`} onClick={() => setSavedSort("saved")}>Date Saved</button>
                    <button className={`sort-btn ${savedSort === "published" ? "on" : ""}`} onClick={() => setSavedSort("published")}>Published</button>
                  </div>
                </div>
                {filteredSaved.map((article) => (
                  <NewsCard
                    key={article.link}
                    title={article.title}
                    source={article.source}
                    time={getDateLabel(article.date)}
                    color={article.color || "var(--green)"}
                    image={article.image}
                    link={article.link}
                    isSaved={true}
                    onSave={() => toggleSave(article)}
                    isDealFlag={isDeal(article.title)}
                    isBreaking={false}
                  />
                ))}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}