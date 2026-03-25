export const DEAL_WORDS = ["deal","deals","sale","discount","price drop","price cut","lowest price","clearance","save","savings","% off","cheapest","under $","giveaway","free game","free dlc","free download","free to keep","free play","bundle","flash sale","price match"];
export const GAMING_SIGNAL_TERMS = ["video game","videogame","gaming","gamer","dlc","expansion","patch","hotfix","mod","mods","remaster","remastered","steam","steam deck","epic games","gog","playstation","ps5","ps4","ps vr2","psvr2","xbox","game pass","nintendo","switch","switch 2","eshop","joy-con","console","controller","handheld","multiplayer","single-player","single player","co-op","coop","fps","rpg","jrpg","roguelike","metroidvania","mmo","mmorpg","battle royale","indie game","esports","nintendo direct","state of play","xbox showcase","game awards","capcom","bethesda","ubisoft","square enix","sega","devolver","larian","valve","blizzard","activision","bandai namco","fromsoftware","konami","remedy","supergiant","annapurna","505 games"];
export const GAMING_CONTEXT_TERMS = ["review","reviews","preview","previews","hands-on","hands on","interview","early access","release","release date","launch","launches","launching","out now","available now","coming soon","gameplay","demo","beta","alpha","roadmap","update","updates","patch notes","quest","quests","boss","bosses","trophy","trophies","achievement","achievements","developer","developers","studio","studios","publisher","publishers","franchise","sequel","port","ports","crossplay","cross-play","server","servers","build","class","classes","skill tree","inventory","battle pass","season pass","campaign","map","maps","matchmaking","player count","players","copies","sold","sales","wishlist","announcement","announced","delay","delayed"];
export const OFF_TOPIC_TERMS = ["movie","movies","film","films","tv show","television","netflix","hbo","disney+","disney plus","prime video","paramount+","peacock","box office","album","music video","concert","tour","comic","comics","manga","anime","novel","book","lego","funko","fashion","sneaker","apparel","collectible","collectibles","merch","merchandise","vinyl","blu-ray","bluray","soundtrack","episode","episodes","season finale","board game","tabletop","trading card","cosplay","action figure"];
export const STOP_WORDS = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","is","are","was","were","be","been","has","have","had","do","does","did","will","would","could","should","can","may","not","no","its","it","this","that","from","by","as","up","out","if","about","than","into","over","after","new","how","all","just","one","get","got","also","more","very","what","when","who","why","where","which","their","they","them","your","you","our","we","my","me","he","she","his","her","game","games","gaming"]);

export const NEWS_SOURCES = [
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

export const PLATFORM_FILTERS = ["All", "PlayStation", "Xbox", "Nintendo", "PC"];

export const BSKY_ACCOUNTS = [
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
  { name: "Sucker Punch",   handle: "suckerpunchprod.bsky.social",   group: "Dev" },
  { name: "Bethesda Studios",handle: "bethesdastudios.com",          group: "Dev" },
  { name: "Bethesda",       handle: "bethesda.net",                  group: "Dev" },
  { name: "Annapurna",      handle: "annapurna.com",                 group: "Dev" },
  { name: "505 Games",      handle: "505games.com",                  group: "Dev" },
  { name: "Pure Xbox",      handle: "purexbox.com",                  group: "Xbox" },
  { name: "GOG",            handle: "gog.com",                       group: "PC" },
  { name: "Steam Deck",     handle: "steamdeck.com",                 group: "PC" },
  { name: "Valve",          handle: "valvesoftware.com",             group: "PC" },
  { name: "SteamDB",        handle: "steamdb.info",                  group: "PC" },
  { name: "Green Man Gaming",handle: "greenmangaming.com",           group: "Deals" },
  { name: "GameSpot",       handle: "gamespot.com",                  group: "Press" },
  { name: "World of Warcraft", handle: "worldofwarcraft.blizzard.com", group: "PC" },
  { name: "Blizzard",       handle: "blizzard.com",                  group: "Dev" },
  { name: "Sea of Thieves", handle: "seaofthieves.com",              group: "Xbox" },
  { name: "Megacrit",       handle: "megacrit.com",                  group: "Dev" },
  { name: "Larian",         handle: "larianstudios.com",             group: "Dev" },
  { name: "THQ Nordic",     handle: "thqnordic.com",                 group: "Dev" },
  { name: "Sega",           handle: "sega-west.bsky.social",         group: "Dev" },
  { name: "Konami",         handle: "konamina.bsky.social",          group: "Dev" },
  { name: "Sonic",          handle: "sonic-official.bsky.social",    group: "Dev" },
  { name: "Evil Empire",    handle: "evilempirestudio.bsky.social",  group: "Dev" },
  { name: "Team Cherry",    handle: "teamcherry.bsky.social",        group: "Dev" },
  { name: "Sabotage Studio",handle: "sabotagestudio.com",            group: "Dev" },
  { name: "Xbox Wire",      handle: "wire.xbox.com",                 group: "Xbox" },
  { name: "Ubisoft",        handle: "ubisoft.com",                   group: "Dev" },
  { name: "Evo",            handle: "evo.gg",                        group: "Press" }
];

export const SOCIAL_FILTERS = ["All", "Deals", "Press", "Xbox", "PlayStation", "Nintendo", "PC", "Dev"];

export const DEFAULT_PREFERENCES = {
  activeTab: "News",
  platformFilter: "All",
  activeFilter: "All",
  socialFilter: "All",
  dealsOnly: false,
  gamingOnly: true,
  strictRelevance: true,
  savedSort: "saved",
  mutedSources: [],
  mutedAccounts: [],
  customIncludeKeywords: [],
  customExcludeKeywords: [],
};

function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyword(text, keyword) {
  return new RegExp(`(^|[^a-z0-9])${escapeForRegex(keyword)}([^a-z0-9]|$)`, "i").test(text);
}

function getMatchedKeywords(text, keywords) {
  return [...new Set(keywords.map(normalizeKeyword).filter(Boolean))].filter(keyword => hasKeyword(text, keyword));
}

export function normalizeKeyword(keyword) {
  return String(keyword || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function upsertKeyword(keywords, keyword) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) return keywords;
  if (keywords.includes(normalizedKeyword)) return keywords;
  return [...keywords, normalizedKeyword];
}

export function removeKeyword(keywords, keyword) {
  const normalizedKeyword = normalizeKeyword(keyword);
  return keywords.filter(existingKeyword => existingKeyword !== normalizedKeyword);
}

export function isDeal(text) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return DEAL_WORDS.some(word => normalized.includes(word));
}

export function isGamingRelevant(text, options = {}) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const customIncludeKeywords = Array.isArray(options.includeKeywords) ? options.includeKeywords : [];
  const customExcludeKeywords = Array.isArray(options.excludeKeywords) ? options.excludeKeywords : [];
  const strictMode = Boolean(options.strictMode);
  const trustedSource = Boolean(options.trustedSource);

  if (getMatchedKeywords(normalized, customIncludeKeywords).length > 0) return true;
  if (getMatchedKeywords(normalized, customExcludeKeywords).length > 0) return false;

  const gamingSignalMatches = getMatchedKeywords(normalized, GAMING_SIGNAL_TERMS);
  const gamingContextMatches = getMatchedKeywords(normalized, GAMING_CONTEXT_TERMS);
  const offTopicMatches = getMatchedKeywords(normalized, OFF_TOPIC_TERMS);
  const gamingScore = gamingSignalMatches.length * 2 + gamingContextMatches.length;
  const offTopicScore = offTopicMatches.length * 2;

  if (isDeal(normalized)) return gamingScore > 0;
  if (offTopicScore > 0 && gamingScore === 0) return false;
  if (gamingScore > 0) return gamingScore >= offTopicScore;
  if (strictMode) return trustedSource && gamingContextMatches.length > 0 && offTopicMatches.length === 0;
  return trustedSource ? offTopicMatches.length === 0 : gamingContextMatches.length > 0 && offTopicMatches.length === 0;
}

export function extractKeywords(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

export function getTopStories(articles, now) {
  if (!now) return [];
  const cutoff = now - 12 * 60 * 60 * 1000;
  const recent = articles.filter(article => article.date && article.date.getTime() >= cutoff);
  if (recent.length < 4) return [];

  const clusters = [];
  const used = new Set();

  recent.forEach((article, index) => {
    if (used.has(index)) return;

    const keywords = extractKeywords(article.title);
    if (keywords.length < 2) return;

    const group = [{ article, idx: index }];

    recent.forEach((candidate, candidateIndex) => {
      if (index === candidateIndex || used.has(candidateIndex)) return;
      const candidateKeywords = extractKeywords(candidate.title);
      const sharedKeywords = keywords.filter(keyword => candidateKeywords.includes(keyword));
      if (sharedKeywords.length >= 2 && article.source !== candidate.source) {
        group.push({ article: candidate, idx: candidateIndex });
      }
    });

    const sources = new Set(group.map(entry => entry.article.source));
    if (sources.size >= 3) {
      group.forEach(entry => used.add(entry.idx));
      clusters.push({ rep: group[0].article, count: sources.size, sources: [...sources] });
    }
  });

  return clusters.sort((left, right) => right.count - left.count).slice(0, 3);
}

export function getTrendingKeywords(articles, now) {
  if (!now) return [];
  const cutoff = now - 12 * 60 * 60 * 1000;
  const recent = articles.filter(article => article.date && article.date.getTime() >= cutoff);
  const counts = {};

  recent.forEach(article => {
    extractKeywords(article.title).forEach(keyword => {
      counts[keyword] = (counts[keyword] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
}

export function parseDate(value) {
  if (!value) return new Date(0);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? new Date(0) : value;

  let date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date;

  date = new Date(String(value).replace(" ", "T") + "Z");
  if (!Number.isNaN(date.getTime())) return date;

  date = new Date(String(value).replace(" ", "T"));
  if (!Number.isNaN(date.getTime())) return date;

  return new Date(0);
}

export function stripHtml(text) {
  return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function getTimeAgo(date, now) {
  const parsedDate = date instanceof Date ? date : parseDate(date);
  if (!now || !parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) return "";

  const minutes = Math.floor((now - parsedDate.getTime()) / 60000);
  if (minutes <= 0) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getDateLabel(date, now) {
  const parsedDate = date instanceof Date ? date : parseDate(date);
  if (!now || !parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) return "";

  const minutes = Math.floor((now - parsedDate.getTime()) / 60000);
  if (minutes <= 0) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getStatusTimeLabel(lastUpdatedAt, now) {
  if (!lastUpdatedAt) return "Waiting for first update";
  return `Updated ${getTimeAgo(lastUpdatedAt, now) || "recently"}`;
}

export function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(`Request timed out after ${Math.round(ms / 1000)}s`);
      error.name = "TimeoutError";
      error.code = "timeout";
      reject(error);
    }, ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export function getDomainLabel(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export function getArticleTopicText(article) {
  return [
    article.title,
    article.summary,
    Array.isArray(article.categories) ? article.categories.join(" ") : "",
  ].filter(Boolean).join(" ");
}

export function getSocialTopicText(post) {
  return [
    post.text,
    post.extTitle,
    post.extDescription,
    getDomainLabel(post.extUrl),
  ].filter(Boolean).join(" ");
}

export function matchesArticleQuery(article, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    article.title,
    article.source,
    article.summary,
    Array.isArray(article.categories) ? article.categories.join(" ") : "",
  ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
}

export function matchesSocialQuery(post, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    post.text,
    post.name,
    post.handle,
    post.extTitle,
    post.extDescription,
    getDomainLabel(post.extUrl),
  ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
}
