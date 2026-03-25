"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import BskyCard from "./components/BskyCard";
import FeedStatusBar from "./components/FeedStatusBar";
import NewsCard from "./components/NewsCard";
import SettingsDrawer from "./components/SettingsDrawer";
import TopStoryCard from "./components/TopStoryCard";
import useNow from "./hooks/useNow";
import usePersistentState from "./hooks/usePersistentState";
import {
  BSKY_ACCOUNTS,
  DEFAULT_PREFERENCES,
  NEWS_SOURCES,
  PLATFORM_FILTERS,
  SOCIAL_FILTERS,
  getArticleTopicText,
  getDateLabel,
  getSocialTopicText,
  getStatusTimeLabel,
  getTimeAgo,
  getTopStories,
  getTrendingKeywords,
  isDeal,
  isGamingRelevant,
  matchesArticleQuery,
  matchesSocialQuery,
  normalizeKeyword,
  parseDate,
  removeKeyword,
  stripHtml,
  upsertKeyword,
  withTimeout,
} from "./lib/feed-utils";

function createFeedStatus(totalCount) {
  return {
    totalCount,
    successfulCount: 0,
    failedNames: [],
    lastUpdatedAt: null,
  };
}

async function loadNewsSource(source) {
  try {
    const response = await withTimeout(fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`), 10000);
    if (response.ok) {
      const data = await response.json();
      if (data.status === "ok" && Array.isArray(data.items)) {
        return {
          source: source.name,
          ok: true,
          items: data.items.map((item) => ({
            title: (item.title || "").trim(),
            summary: stripHtml(item.description),
            categories: Array.isArray(item.categories) ? item.categories.map(stripHtml).filter(Boolean) : [],
            source: source.name,
            color: source.color,
            date: parseDate(item.pubDate),
            image: item.thumbnail || item.enclosure?.link || "",
            link: item.link || "",
          })).filter((article) => article.title && article.link),
        };
      }
    }
  } catch {}

  try {
    const response = await withTimeout(fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`), 10000);
    if (response.ok) {
      const json = await response.json();
      const xml = json.contents;
      if (xml && typeof xml === "string") {
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        if (!doc.querySelector("parsererror")) {
          return {
            source: source.name,
            ok: true,
            items: [...doc.querySelectorAll("item, entry")].map((entry) => {
              const title = (entry.querySelector("title")?.textContent || "").trim();
              const linkElement = entry.querySelector("link");
              const link = linkElement?.getAttribute("href") || linkElement?.textContent?.trim() || "";
              const rawDate = entry.querySelector("pubDate")?.textContent || entry.querySelector("published")?.textContent || entry.querySelector("updated")?.textContent || "";
              const summary = stripHtml(entry.querySelector("description")?.textContent || entry.querySelector("summary")?.textContent || "");
              const categories = [...entry.querySelectorAll("category")].map((category) => stripHtml(category.textContent)).filter(Boolean);
              const imageMatch = (entry.querySelector("description")?.textContent || "").match(/<img[^>]+src=["']([^"']+)/i);
              return {
                title,
                summary,
                categories,
                source: source.name,
                color: source.color,
                date: parseDate(rawDate),
                image: imageMatch ? imageMatch[1] : "",
                link,
              };
            }).filter((article) => article.title && article.link),
          };
        }
      }
    }
  } catch {}

  return {
    source: source.name,
    ok: false,
    items: [],
  };
}

async function loadSocialAccount(account) {
  try {
    const response = await withTimeout(fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${account.handle}&limit=20&filter=posts_no_replies`), 10000);
    if (!response.ok) {
      return { account: account.name, ok: false, items: [] };
    }

    const data = await response.json();
    if (!Array.isArray(data.feed)) {
      return { account: account.name, ok: false, items: [] };
    }

    return {
      account: account.name,
      ok: true,
      items: data.feed.map((entry) => {
        const post = entry.post || {};
        const record = post.record || {};
        const text = (typeof record.text === "string" ? record.text : "").trim();
        const uri = typeof post.uri === "string" ? post.uri : "";
        const postId = uri.split("/").pop() || "";
        const authorHandle = post.author?.handle || account.handle;
        const external = (post.embed || {}).external || null;

        return {
          id: uri || `${account.handle}:${record.createdAt || post.indexedAt || text}`,
          name: post.author?.displayName || account.name,
          handle: authorHandle,
          avatar: post.author?.avatar || "",
          text,
          date: parseDate(record.createdAt || post.indexedAt),
          link: postId ? `https://bsky.app/profile/${authorHandle}/post/${postId}` : `https://bsky.app/profile/${account.handle}`,
          extTitle: external?.title || "",
          extDescription: external?.description || "",
          extUrl: external?.uri || "",
          group: account.group,
        };
      }).filter((post) => post.text),
    };
  } catch {
    return {
      account: account.name,
      ok: false,
      items: [],
    };
  }
}

function getFailureTitle(label, failedNames) {
  if (!failedNames.length) return "";
  return `${label}: ${failedNames.join(", ")}`;
}

async function refreshNewsFeed({
  activeTabRef,
  seenLinksRef,
  setArticles,
  setIsNewsLoading,
  setNewArticleCount,
  setNewsStatus,
}) {
  setIsNewsLoading(true);

  const results = await Promise.all(NEWS_SOURCES.map(loadNewsSource));
  const fresh = results.flatMap((result) => result.items);
  const successfulCount = results.filter((result) => result.ok).length;
  const failedNames = results.filter((result) => !result.ok).map((result) => result.source);
  const seen = new Set();
  const deduped = fresh.filter((article) => {
    if (seen.has(article.link)) return false;
    seen.add(article.link);
    return true;
  });

  deduped.sort((left, right) => right.date - left.date);

  if (deduped.length > 0) {
    if (seenLinksRef.current.size === 0) {
      deduped.forEach((article) => seenLinksRef.current.add(article.link));
    } else {
      const newItems = deduped.filter((article) => !seenLinksRef.current.has(article.link));
      deduped.forEach((article) => seenLinksRef.current.add(article.link));
      if (newItems.length > 0 && activeTabRef.current !== "News") {
        setNewArticleCount((previous) => previous + newItems.length);
      }
    }

    setArticles(deduped);
  }

  setNewsStatus((previous) => ({
    totalCount: NEWS_SOURCES.length,
    successfulCount,
    failedNames,
    lastUpdatedAt: successfulCount > 0 ? Date.now() : previous.lastUpdatedAt,
  }));
  setIsNewsLoading(false);
}

async function refreshSocialFeed({
  activeTabRef,
  seenSocialIdsRef,
  setIsSocialLoading,
  setNewSocialCount,
  setSocialLoaded,
  setSocialPosts,
  setSocialStatus,
}) {
  setIsSocialLoading(true);

  const results = await Promise.all(BSKY_ACCOUNTS.map(loadSocialAccount));
  const fresh = results.flatMap((result) => result.items);
  const successfulCount = results.filter((result) => result.ok).length;
  const failedNames = results.filter((result) => !result.ok).map((result) => result.account);
  const seen = new Set();
  const deduped = fresh.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });

  deduped.sort((left, right) => right.date - left.date);

  if (deduped.length > 0) {
    if (seenSocialIdsRef.current.size === 0) {
      deduped.forEach((post) => seenSocialIdsRef.current.add(post.id));
    } else {
      const newItems = deduped.filter((post) => !seenSocialIdsRef.current.has(post.id));
      deduped.forEach((post) => seenSocialIdsRef.current.add(post.id));
      if (newItems.length > 0 && activeTabRef.current !== "Social") {
        setNewSocialCount((previous) => previous + newItems.length);
      }
    }

    setSocialPosts(deduped);
  }

  setSocialStatus((previous) => ({
    totalCount: BSKY_ACCOUNTS.length,
    successfulCount,
    failedNames,
    lastUpdatedAt: successfulCount > 0 ? Date.now() : previous.lastUpdatedAt,
  }));
  setIsSocialLoading(false);
  setSocialLoaded(true);
}

export default function Home() {
  const now = useNow();
  const [preferences, setPreferences] = usePersistentState("pulsecast_preferences", DEFAULT_PREFERENCES);
  const [savedArticles, setSavedArticles] = usePersistentState("pulsecast_bookmarks", []);
  const [dismissedStories, setDismissedStories] = usePersistentState("pulsecast_dismissed", []);
  const [articles, setArticles] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [socialLoaded, setSocialLoaded] = useState(false);
  const [newsRenderLimit, setNewsRenderLimit] = useState(30);
  const [socialRenderLimit, setSocialRenderLimit] = useState(30);
  const [newArticleCount, setNewArticleCount] = useState(0);
  const [newSocialCount, setNewSocialCount] = useState(0);
  const [newsStatus, setNewsStatus] = useState(() => createFeedStatus(NEWS_SOURCES.length));
  const [socialStatus, setSocialStatus] = useState(() => createFeedStatus(BSKY_ACCOUNTS.length));
  const [searchQuery, setSearchQuery] = useState("");
  const [lastDismissedStory, setLastDismissedStory] = useState(null);
  const [lastClearedSaved, setLastClearedSaved] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewsSourceTrayOpen, setIsNewsSourceTrayOpen] = useState(false);
  const seenLinksRef = useRef(new Set());
  const seenSocialIdsRef = useRef(new Set());
  const activeTabRef = useRef("News");

  const mergedPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
  const {
    activeTab,
    platformFilter,
    activeFilter,
    socialFilter,
    dealsOnly,
    gamingOnly,
    strictRelevance,
    savedSort,
    mutedSources,
    mutedAccounts,
    customIncludeKeywords,
    customExcludeKeywords,
  } = mergedPreferences;

  const updatePreferences = (patch) => {
    setPreferences((previous) => ({
      ...DEFAULT_PREFERENCES,
      ...previous,
      ...(typeof patch === "function" ? patch({ ...DEFAULT_PREFERENCES, ...previous }) : patch),
    }));
  };

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const fetchNews = useEffectEvent(async () => {
    await refreshNewsFeed({
      activeTabRef,
      seenLinksRef,
      setArticles,
      setIsNewsLoading,
      setNewArticleCount,
      setNewsStatus,
    });
  });

  const fetchSocial = useEffectEvent(async () => {
    await refreshSocialFeed({
      activeTabRef,
      seenSocialIdsRef,
      setIsSocialLoading,
      setNewSocialCount,
      setSocialLoaded,
      setSocialPosts,
      setSocialStatus,
    });
  });

  function handleRefresh() {
    void refreshNewsFeed({
      activeTabRef,
      seenLinksRef,
      setArticles,
      setIsNewsLoading,
      setNewArticleCount,
      setNewsStatus,
    });
    if (socialLoaded || activeTab === "Social") {
      void refreshSocialFeed({
        activeTabRef,
        seenSocialIdsRef,
        setIsSocialLoading,
        setNewSocialCount,
        setSocialLoaded,
        setSocialPosts,
        setSocialStatus,
      });
    }
  }

  useEffect(() => {
    async function refreshFeeds() {
      await fetchNews();
      if (socialLoaded) await fetchSocial();
    }

    void refreshFeeds();
    const interval = setInterval(() => {
      void refreshFeeds();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [socialLoaded]);

  useEffect(() => {
    async function loadSocialIfNeeded() {
      if (activeTab === "Social" && !socialLoaded && !isSocialLoading) {
        await fetchSocial();
      }
    }

    void loadSocialIfNeeded();
  }, [activeTab, isSocialLoading, socialLoaded]);

  function switchTab(tab) {
    updatePreferences({
      activeTab: tab,
      activeFilter: "All",
      platformFilter: "All",
      dealsOnly: false,
      socialFilter: "All",
    });
    setSearchQuery("");
    if (tab !== "News") setIsNewsSourceTrayOpen(false);
    setNewsRenderLimit(30);
    setSocialRenderLimit(30);
    if (tab === "News") setNewArticleCount(0);
    if (tab === "Social") setNewSocialCount(0);
  }

  function switchPlatform(platform) {
    updatePreferences({
      platformFilter: platform,
      activeFilter: "All",
    });
    setNewsRenderLimit(30);
  }

  function handleDismissTopStory(story) {
    setDismissedStories((previous) => (previous.includes(story.link) ? previous : [...previous, story.link]));
    setLastDismissedStory(story);
  }

  function undoLastDismissedStory() {
    if (!lastDismissedStory) return;
    setDismissedStories((previous) => previous.filter((link) => link !== lastDismissedStory.link));
    setLastDismissedStory(null);
  }

  function resetHiddenStories() {
    setDismissedStories([]);
    setLastDismissedStory(null);
  }

  function toggleSave(article) {
    setSavedArticles((previous) => (
      previous.some((savedArticle) => savedArticle.link === article.link)
        ? previous.filter((savedArticle) => savedArticle.link !== article.link)
        : [...previous, { ...article, date: article.date?.toISOString?.() || article.date, savedAt: Date.now() }]
    ));
  }

  function clearSavedArticles() {
    if (!savedArticles.length) return;
    setLastClearedSaved(savedArticles);
    setSavedArticles([]);
  }

  function undoClearSavedArticles() {
    if (!lastClearedSaved.length) return;
    setSavedArticles(lastClearedSaved);
    setLastClearedSaved([]);
  }

  function toggleMutedSource(source) {
    updatePreferences((previous) => ({
      mutedSources: previous.mutedSources.includes(source)
        ? previous.mutedSources.filter((name) => name !== source)
        : [...previous.mutedSources, source],
    }));
    setNewsRenderLimit(30);
  }

  function toggleMutedAccount(handle) {
    updatePreferences((previous) => ({
      mutedAccounts: previous.mutedAccounts.includes(handle)
        ? previous.mutedAccounts.filter((name) => name !== handle)
        : [...previous.mutedAccounts, handle],
    }));
    setSocialRenderLimit(30);
  }

  function clearMutedSources() {
    updatePreferences({ mutedSources: [] });
    setNewsRenderLimit(30);
  }

  function clearMutedAccounts() {
    updatePreferences({ mutedAccounts: [] });
    setSocialRenderLimit(30);
  }

  function addCustomIncludeKeyword(keyword) {
    const normalizedKeyword = normalizeKeyword(keyword);
    if (!normalizedKeyword) return;

    updatePreferences((previous) => ({
      customIncludeKeywords: upsertKeyword(previous.customIncludeKeywords, normalizedKeyword),
    }));
    setNewsRenderLimit(30);
    setSocialRenderLimit(30);
  }

  function removeCustomIncludeKeyword(keyword) {
    updatePreferences((previous) => ({
      customIncludeKeywords: removeKeyword(previous.customIncludeKeywords, keyword),
    }));
    setNewsRenderLimit(30);
    setSocialRenderLimit(30);
  }

  function addCustomExcludeKeyword(keyword) {
    const normalizedKeyword = normalizeKeyword(keyword);
    if (!normalizedKeyword) return;

    updatePreferences((previous) => ({
      customExcludeKeywords: upsertKeyword(previous.customExcludeKeywords, normalizedKeyword),
    }));
    setNewsRenderLimit(30);
    setSocialRenderLimit(30);
  }

  function removeCustomExcludeKeyword(keyword) {
    updatePreferences((previous) => ({
      customExcludeKeywords: removeKeyword(previous.customExcludeKeywords, keyword),
    }));
    setNewsRenderLimit(30);
    setSocialRenderLimit(30);
  }

  function restoreFilterDefaults() {
    updatePreferences((previous) => ({
      ...previous,
      activeFilter: DEFAULT_PREFERENCES.activeFilter,
      platformFilter: DEFAULT_PREFERENCES.platformFilter,
      socialFilter: DEFAULT_PREFERENCES.socialFilter,
      dealsOnly: DEFAULT_PREFERENCES.dealsOnly,
      gamingOnly: DEFAULT_PREFERENCES.gamingOnly,
      strictRelevance: DEFAULT_PREFERENCES.strictRelevance,
      mutedSources: DEFAULT_PREFERENCES.mutedSources,
      mutedAccounts: DEFAULT_PREFERENCES.mutedAccounts,
      customIncludeKeywords: DEFAULT_PREFERENCES.customIncludeKeywords,
      customExcludeKeywords: DEFAULT_PREFERENCES.customExcludeKeywords,
    }));
    setSearchQuery("");
    setNewsRenderLimit(30);
    setSocialRenderLimit(30);
  }

  const platformSources = platformFilter === "All"
    ? null
    : new Set(NEWS_SOURCES.filter((source) => source.platform === platformFilter).map((source) => source.name));

  const filterButtons = ["All", ...(platformFilter === "All"
    ? NEWS_SOURCES.map((source) => source.name)
    : NEWS_SOURCES.filter((source) => source.platform === platformFilter).map((source) => source.name))];

  const relevanceOptions = {
    strictMode: strictRelevance,
    includeKeywords: customIncludeKeywords,
    excludeKeywords: customExcludeKeywords,
    trustedSource: true,
  };

  const articlePool = articles
    .filter((article) => !mutedSources.includes(article.source))
    .filter((article) => !gamingOnly || isGamingRelevant(getArticleTopicText(article), relevanceOptions));

  const socialPool = socialPosts
    .filter((post) => !mutedAccounts.includes(post.handle))
    .filter((post) => !gamingOnly || isGamingRelevant(getSocialTopicText(post), relevanceOptions));

  const filteredArticles = articlePool
    .filter((article) => !platformSources || platformSources.has(article.source))
    .filter((article) => activeFilter === "All" || article.source === activeFilter)
    .filter((article) => !dealsOnly || isDeal(article.title))
    .filter((article) => matchesArticleQuery(article, searchQuery));

  const filteredSocial = socialPool
    .filter((post) => socialFilter === "All" || post.group === socialFilter)
    .filter((post) => matchesSocialQuery(post, searchQuery));

  const filteredSaved = [...savedArticles]
    .sort((left, right) => (
      savedSort === "saved"
        ? (right.savedAt || 0) - (left.savedAt || 0)
        : parseDate(right.date) - parseDate(left.date)
    ))
    .filter((article) => matchesArticleQuery(article, searchQuery));

  const topStories = getTopStories(articlePool, now);
  const dealCount = articlePool.filter((article) => isDeal(article.title)).length;
  const trending = getTrendingKeywords(articlePool, now);
  const visibleTopStories = topStories.filter((story) => !dismissedStories.includes(story.rep.link));
  const isRefreshing = isNewsLoading || isSocialLoading;
  const pageModeClass = activeTab === "Social" ? "social-mode" : activeTab === "Saved" ? "saved-mode" : "news-mode";
  const showNewsHighlights = activeFilter === "All" && platformFilter === "All" && !dealsOnly && !searchQuery;
  const leadTopStory = showNewsHighlights ? visibleTopStories[0] : null;
  const supportingTopStories = showNewsHighlights ? visibleTopStories.slice(1) : [];
  const isNewsSourceTrayVisible = isNewsSourceTrayOpen || activeFilter !== "All";

  const newsStatusItems = [
    {
      label: isNewsLoading ? "Refreshing news..." : getStatusTimeLabel(newsStatus.lastUpdatedAt, now),
      tone: isNewsLoading ? "info" : "good",
    },
    {
      label: `${newsStatus.successfulCount}/${newsStatus.totalCount} sources`,
      tone: newsStatus.successfulCount === newsStatus.totalCount ? "good" : newsStatus.successfulCount > 0 ? "warn" : "bad",
    },
    newsStatus.failedNames.length > 0
      ? {
          label: `${newsStatus.failedNames.length} failed`,
          tone: "bad",
          title: getFailureTitle("Failed sources", newsStatus.failedNames),
        }
      : null,
    mutedSources.length > 0
      ? {
          label: `${mutedSources.length} muted`,
          tone: "muted",
          title: `Muted sources: ${mutedSources.join(", ")}`,
        }
      : null,
    dismissedStories.length > 0
      ? {
          label: `${dismissedStories.length} hidden`,
          tone: "muted",
        }
      : null,
    strictRelevance
      ? {
          label: "Strict filter",
          tone: "info",
        }
      : null,
    customIncludeKeywords.length > 0 || customExcludeKeywords.length > 0
      ? {
          label: `Tune ${customIncludeKeywords.length}/${customExcludeKeywords.length}`,
          tone: "muted",
          title: `Keep ${customIncludeKeywords.length}, hide ${customExcludeKeywords.length}`,
        }
      : null,
  ];

  const socialStatusItems = [
    {
      label: isSocialLoading ? "Refreshing posts..." : getStatusTimeLabel(socialStatus.lastUpdatedAt, now),
      tone: isSocialLoading ? "info" : "good",
    },
    {
      label: `${socialStatus.successfulCount}/${socialStatus.totalCount} accounts`,
      tone: socialStatus.successfulCount === socialStatus.totalCount ? "good" : socialStatus.successfulCount > 0 ? "warn" : "bad",
    },
    socialStatus.failedNames.length > 0
      ? {
          label: `${socialStatus.failedNames.length} failed`,
          tone: "bad",
          title: getFailureTitle("Failed accounts", socialStatus.failedNames),
        }
      : null,
    mutedAccounts.length > 0
      ? {
          label: `${mutedAccounts.length} muted`,
          tone: "muted",
          title: `Muted accounts: ${mutedAccounts.join(", ")}`,
        }
      : null,
    strictRelevance
      ? {
          label: "Strict filter",
          tone: "info",
        }
      : null,
    customIncludeKeywords.length > 0 || customExcludeKeywords.length > 0
      ? {
          label: `Tune ${customIncludeKeywords.length}/${customExcludeKeywords.length}`,
          tone: "muted",
          title: `Keep ${customIncludeKeywords.length}, hide ${customExcludeKeywords.length}`,
        }
      : null,
  ];

  const savedStatusItems = [
    {
      label: `${filteredSaved.length} visible`,
      tone: "info",
    },
    savedArticles.length !== filteredSaved.length
      ? {
          label: `${savedArticles.length} total saved`,
          tone: "muted",
        }
      : null,
  ];

  const newsStatusActions = [
    lastDismissedStory
      ? {
          label: "Undo last hide",
          onClick: undoLastDismissedStory,
        }
      : null,
    dismissedStories.length > 0
      ? {
          label: `Reset hidden (${dismissedStories.length})`,
          onClick: resetHiddenStories,
        }
      : null,
    mutedSources.length > 0
      ? {
          label: `Clear muted (${mutedSources.length})`,
          onClick: clearMutedSources,
        }
      : null,
  ];

  const socialStatusActions = [
    mutedAccounts.length > 0
      ? {
          label: `Clear muted (${mutedAccounts.length})`,
          onClick: clearMutedAccounts,
        }
      : null,
  ];

  const savedStatusActions = [
    lastClearedSaved.length > 0
      ? {
          label: `Undo clear (${lastClearedSaved.length})`,
          onClick: undoClearSavedArticles,
        }
      : null,
    savedArticles.length > 0
      ? {
          label: `Clear saved (${savedArticles.length})`,
          tone: "danger",
          onClick: clearSavedArticles,
        }
      : null,
  ];

  return (
    <div className={`wrap ${pageModeClass}`}>
      <header>
        <div className="header-row">
          <div>
            <div className="logo">PULSECAST</div>
            <div className="tagline">Gaming News · Curated</div>
          </div>
          <div className="header-actions">
            <button type="button" className={`settings-btn ${isSettingsOpen ? "active" : ""}`} onClick={() => setIsSettingsOpen(true)} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button type="button" className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing} title="Refresh">
              <svg className={isRefreshing ? "spinning" : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="nav">
        {["News", "Social", "Saved"].map((tab) => (
          <button type="button" key={tab} className={`nav-btn ${activeTab === tab ? "active" : ""}`} onClick={() => switchTab(tab)}>
            {tab}
            {tab === "News" && newArticleCount > 0 && <span className="nav-badge">{newArticleCount}</span>}
            {tab === "Social" && newSocialCount > 0 && <span className="nav-badge">{newSocialCount}</span>}
          </button>
        ))}
      </div>

      <div className="search-wrap">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8888a0" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search headlines, summaries, and shared links..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          {searchQuery && <button type="button" className="search-clear" onClick={() => setSearchQuery("")}>x</button>}
        </div>
      </div>

      {activeTab === "News" && (
        <>
          <div className="tab-intro news-intro">
            <div>
              <div className="tab-kicker">Front Page</div>
              <div className="tab-title">Catch the stories everyone is chasing.</div>
              <div className="tab-copy">
                Track the biggest gaming headlines across trusted outlets, then zoom into a platform or source when you want a tighter read.
              </div>
            </div>
            <div className="tab-stats">
              <span className="tab-stat">{filteredArticles.length} headlines</span>
              {visibleTopStories.length > 0 && <span className="tab-stat">{visibleTopStories.length} top stories</span>}
              {dealCount > 0 && <span className="tab-stat">{dealCount} live deals</span>}
            </div>
          </div>
          <FeedStatusBar items={newsStatusItems} actions={newsStatusActions} />
          <div className="filter-deck">
            <div className="filter-deck-head">
              <div>
                <div className="filter-deck-label">Quick Filters</div>
                <div className="filter-deck-copy">Keep the common controls up front and tuck the long source list into a tray.</div>
              </div>
              <button
                type="button"
                className={`filter-tray-toggle ${isNewsSourceTrayVisible ? "active" : ""}`}
                onClick={() => setIsNewsSourceTrayOpen((previous) => !previous)}
              >
                {activeFilter === "All" ? "Browse Sources" : `Source: ${activeFilter}`}
              </button>
            </div>
            <div className="pills filter-row primary">
              {PLATFORM_FILTERS.map((platform) => (
                <button type="button" key={platform} className={`pill ${platformFilter === platform ? "on" : ""}`} onClick={() => switchPlatform(platform)}>
                  {platform}
                </button>
              ))}
              {dealCount > 0 && (
                <button
                  type="button"
                  className={`pill deal ${dealsOnly ? "on" : ""}`}
                  onClick={() => {
                    updatePreferences({ dealsOnly: !dealsOnly });
                    setNewsRenderLimit(30);
                  }}
                >
                  Hot Deals ({dealCount})
                </button>
              )}
              <button
                type="button"
                className={`pill ${gamingOnly ? "on" : ""}`}
                onClick={() => {
                  updatePreferences({ gamingOnly: !gamingOnly });
                  setNewsRenderLimit(30);
                  setSocialRenderLimit(30);
                }}
              >
                Gaming Only
              </button>
            </div>
            {isNewsSourceTrayVisible && (
              <div className="filter-tray">
                <div className="filter-tray-meta">
                  <span>Source Filters</span>
                  {activeFilter !== "All" && (
                    <button
                      type="button"
                      className="filter-tray-clear"
                      onClick={() => {
                        updatePreferences({ activeFilter: "All" });
                        setNewsRenderLimit(30);
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="pills filter-row secondary">
                  {filterButtons.map((name) => (
                    <button
                      type="button"
                      key={name}
                      className={`pill ${activeFilter === name ? "on" : ""}`}
                      onClick={() => {
                        updatePreferences({ activeFilter: name });
                        setNewsRenderLimit(30);
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "Social" && (
        <>
          <div className="tab-intro social-intro">
            <div>
              <div className="tab-kicker">Live Feed</div>
              <div className="tab-title">See what gaming Bluesky is talking about right now.</div>
              <div className="tab-copy">
                Keep press, platform, dev, and deals chatter in one stream without losing the pace of a social feed.
              </div>
            </div>
            <div className="tab-stats">
              <span className="tab-stat">{filteredSocial.length} posts</span>
              <span className="tab-stat">{socialStatus.successfulCount}/{socialStatus.totalCount} accounts live</span>
              {mutedAccounts.length > 0 && <span className="tab-stat">{mutedAccounts.length} muted</span>}
            </div>
          </div>
          <FeedStatusBar items={socialStatusItems} actions={socialStatusActions} />
          <div className="filter-deck social-filter-deck">
            <div className="filter-deck-head">
              <div>
                <div className="filter-deck-label">Channel Mix</div>
                <div className="filter-deck-copy">Shift between press, platform, deal, and dev chatter without crowding the feed controls.</div>
              </div>
            </div>
            <div className="pills filter-row secondary social-filter-row">
              {SOCIAL_FILTERS.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={`pill ${socialFilter === name ? "on" : ""}`}
                  onClick={() => {
                    updatePreferences({ socialFilter: name });
                    setSocialRenderLimit(30);
                  }}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                className={`pill ${gamingOnly ? "on" : ""}`}
                onClick={() => {
                  updatePreferences({ gamingOnly: !gamingOnly });
                  setNewsRenderLimit(30);
                  setSocialRenderLimit(30);
                }}
              >
                Gaming Only
              </button>
            </div>
          </div>
        </>
      )}

      <div className="content">
        {activeTab === "News" && (
          <>
            {isNewsLoading && articles.length === 0 ? (
              <div className="empty">
                <div className="empty-title">Loading the Pulse...</div>
                <div style={{ color: "var(--text2)", fontSize: "13px" }}>Fetching from {NEWS_SOURCES.length} sources</div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">NEWS</div>
                <div className="empty-title">{searchQuery ? "No results" : gamingOnly ? "No gaming articles loaded" : "No articles loaded"}</div>
              </div>
            ) : (
              <>
                {showNewsHighlights && trending.length > 0 && (
                  <div className="trending">
                    <div className="trending-label">Trending</div>
                    <div className="trending-pills">
                      {trending.map((word) => (
                        <button type="button" key={word} className="trending-pill" onClick={() => setSearchQuery(word)}>
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showNewsHighlights && visibleTopStories.length > 0 && (
                  <div className="top-stories">
                    <div className="section-head">
                      <div>
                        <div className="ts-label">Top Stories</div>
                        <div className="section-copy">Cross-source stories surfacing across the gaming press in the last 12 hours.</div>
                      </div>
                    </div>
                    <div className="ts-grid">
                      {leadTopStory && (
                        <TopStoryCard
                          key={leadTopStory.rep.link}
                          title={leadTopStory.rep.title}
                          source={leadTopStory.rep.source}
                          color={leadTopStory.rep.color}
                          time={getTimeAgo(leadTopStory.rep.date, now)}
                          count={leadTopStory.count}
                          link={leadTopStory.rep.link}
                          isLead={true}
                          onDismiss={() => handleDismissTopStory({ link: leadTopStory.rep.link, title: leadTopStory.rep.title })}
                        />
                      )}
                      {supportingTopStories.length > 0 && (
                        <div className="ts-stack">
                          {supportingTopStories.map((story) => (
                            <TopStoryCard
                              key={story.rep.link}
                              title={story.rep.title}
                              source={story.rep.source}
                              color={story.rep.color}
                              time={getTimeAgo(story.rep.date, now)}
                              count={story.count}
                              link={story.rep.link}
                              onDismiss={() => handleDismissTopStory({ link: story.rep.link, title: story.rep.title })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="divider">All Headlines</div>
                  </div>
                )}

                {filteredArticles.slice(0, newsRenderLimit).map((article) => (
                  <NewsCard
                    key={article.link}
                    title={article.title}
                    source={article.source}
                    time={getTimeAgo(article.date, now)}
                    color={article.color}
                    image={article.image}
                    link={article.link}
                    isSaved={savedArticles.some((savedArticle) => savedArticle.link === article.link)}
                    onSave={() => toggleSave(article)}
                    isDealFlag={isDeal(article.title)}
                    isBreaking={Boolean(article.date && now && (now - article.date.getTime()) < 1800000)}
                    isSourceMuted={mutedSources.includes(article.source)}
                    onToggleMute={() => toggleMutedSource(article.source)}
                  />
                ))}

                {filteredArticles.length > newsRenderLimit && (
                  <button type="button" className="load-more" onClick={() => setNewsRenderLimit((previous) => previous + 30)}>
                    Show more ({filteredArticles.length - newsRenderLimit} remaining)
                  </button>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "Social" && (
          <>
            {isSocialLoading && socialPosts.length === 0 ? (
              <div className="empty">
                <div className="empty-title">Loading Bluesky feeds...</div>
                <div style={{ color: "var(--text2)", fontSize: "13px" }}>Fetching from {BSKY_ACCOUNTS.length} accounts</div>
              </div>
            ) : filteredSocial.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">SKY</div>
                <div className="empty-title">{searchQuery ? "No results" : gamingOnly ? "No gaming posts loaded" : "No posts loaded"}</div>
              </div>
            ) : (
              <>
                {filteredSocial.slice(0, socialRenderLimit).map((post) => (
                  <BskyCard
                    key={post.id}
                    name={post.name}
                    handle={post.handle}
                    avatar={post.avatar}
                    time={getTimeAgo(post.date, now)}
                    text={post.text}
                    link={post.link}
                    isDealFlag={isDeal(post.text)}
                    extTitle={post.extTitle}
                    extUrl={post.extUrl}
                    isMuted={mutedAccounts.includes(post.handle)}
                    onToggleMute={() => toggleMutedAccount(post.handle)}
                  />
                ))}
                {filteredSocial.length > socialRenderLimit && (
                  <button type="button" className="load-more" onClick={() => setSocialRenderLimit((previous) => previous + 30)}>
                    Show more ({filteredSocial.length - socialRenderLimit} remaining)
                  </button>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "Saved" && (
          <>
            <FeedStatusBar items={savedStatusItems} actions={savedStatusActions} />
            {filteredSaved.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">SAVE</div>
                <div className="empty-title">{searchQuery ? "No match" : "No saved articles yet"}</div>
                <div style={{ color: "var(--text2)", fontSize: "13px" }}>Tap SAVE on any headline</div>
              </div>
            ) : (
              <>
                <div className="saved-header">
                  <span style={{ fontSize: "11px", color: "var(--text2)", fontWeight: 600, letterSpacing: ".1em" }}>
                    {filteredSaved.length} SAVED
                  </span>
                  <div className="saved-controls">
                    <div className="sort-toggle">
                      <button
                        type="button"
                        className={`sort-btn ${savedSort === "saved" ? "on" : ""}`}
                        onClick={() => updatePreferences({ savedSort: "saved" })}
                      >
                        Date Saved
                      </button>
                      <button
                        type="button"
                        className={`sort-btn ${savedSort === "published" ? "on" : ""}`}
                        onClick={() => updatePreferences({ savedSort: "published" })}
                      >
                        Published
                      </button>
                    </div>
                  </div>
                </div>
                {filteredSaved.map((article) => (
                  <NewsCard
                    key={article.link}
                    title={article.title}
                    source={article.source}
                    time={getDateLabel(article.date, now)}
                    color={article.color || "var(--green)"}
                    image={article.image}
                    link={article.link}
                    isSaved={true}
                    onSave={() => toggleSave(article)}
                    isDealFlag={isDeal(article.title)}
                    isBreaking={false}
                    isSourceMuted={mutedSources.includes(article.source)}
                    onToggleMute={() => toggleMutedSource(article.source)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gamingOnly={gamingOnly}
        strictRelevance={strictRelevance}
        dealsOnly={dealsOnly}
        onToggleGamingOnly={() => {
          updatePreferences({ gamingOnly: !gamingOnly });
          setNewsRenderLimit(30);
          setSocialRenderLimit(30);
        }}
        onToggleStrictRelevance={() => {
          updatePreferences({ strictRelevance: !strictRelevance });
          setNewsRenderLimit(30);
          setSocialRenderLimit(30);
        }}
        onToggleDealsOnly={() => {
          updatePreferences({ dealsOnly: !dealsOnly });
          setNewsRenderLimit(30);
        }}
        customIncludeKeywords={customIncludeKeywords}
        customExcludeKeywords={customExcludeKeywords}
        onAddIncludeKeyword={addCustomIncludeKeyword}
        onRemoveIncludeKeyword={removeCustomIncludeKeyword}
        onAddExcludeKeyword={addCustomExcludeKeyword}
        onRemoveExcludeKeyword={removeCustomExcludeKeyword}
        mutedSources={mutedSources}
        mutedAccounts={mutedAccounts}
        onRemoveMutedSource={toggleMutedSource}
        onRemoveMutedAccount={toggleMutedAccount}
        hiddenStoriesCount={dismissedStories.length}
        onResetHiddenStories={resetHiddenStories}
        savedArticlesCount={savedArticles.length}
        onClearSavedArticles={clearSavedArticles}
        onRestoreFilterDefaults={restoreFilterDefaults}
      />
    </div>
  );
}
