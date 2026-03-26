const FIXTURE_TIME = "2026-03-26T14:00:00.000Z";

const NEWS_FIXTURES = new Map([
  ["https://feeds.feedburner.com/ign/all", {
    title: "Starfield DLC showcase reveals new raid zone",
    description: "Bethesda shared a first look at the next Starfield raid update.",
    categories: ["Xbox", "RPG"],
    link: "https://example.com/news/ign-starfield-raid",
    pubDate: "2026-03-26T13:58:00.000Z",
  }],
  ["https://www.gamespot.com/feeds/news/", {
    title: "Starfield DLC showcase confirms new raid zone",
    description: "GameSpot reports that the Starfield DLC rollout includes a raid-style endgame activity.",
    categories: ["Xbox", "Bethesda"],
    link: "https://example.com/news/gamespot-starfield-raid",
    pubDate: "2026-03-26T13:56:00.000Z",
  }],
  ["https://www.pcgamer.com/rss/", {
    title: "RimWorld Odyssey update adds orbital caravans",
    description: "A new RimWorld update expands colony management in space.",
    categories: ["PC", "Simulation"],
    link: "https://example.com/news/pcgamer-rimworld-odyssey",
    pubDate: "2026-03-26T13:54:00.000Z",
  }],
  ["https://kotaku.com/rss", {
    title: "Monster Hunter Wilds patch fixes camp crashes",
    description: "Capcom's latest Monster Hunter Wilds patch focuses on crash fixes and stability.",
    categories: ["PlayStation", "Capcom"],
    link: "https://example.com/news/kotaku-monster-hunter-patch",
    pubDate: "2026-03-26T13:52:00.000Z",
  }],
  ["https://www.eurogamer.net/feed", {
    title: "Starfield DLC showcase locks in new raid release",
    description: "Eurogamer says the Starfield DLC showcase pinned down the raid release window.",
    categories: ["Xbox", "Bethesda"],
    link: "https://example.com/news/eurogamer-starfield-raid",
    pubDate: "2026-03-26T13:50:00.000Z",
  }],
  ["https://www.videogameschronicle.com/feed/", {
    title: "Starfield DLC showcase brings new raid dungeon",
    description: "VGC details the new Starfield raid dungeon shown during the DLC showcase.",
    categories: ["Xbox", "Bethesda"],
    link: "https://example.com/news/vgc-starfield-raid",
    pubDate: "2026-03-26T13:48:00.000Z",
  }],
  ["https://insider-gaming.com/feed/", {
    title: "Xbox handheld rumor points to late 2026 target",
    description: "A fresh report says Microsoft's handheld plans are still taking shape.",
    categories: ["Xbox", "Hardware"],
    link: "https://example.com/news/insider-gaming-handheld",
    pubDate: "2026-03-26T13:46:00.000Z",
  }],
  ["https://www.gamesradar.com/rss/", {
    title: "Hades 2 roadmap outlines the next biome update",
    description: "Supergiant has shared another development roadmap for Hades 2.",
    categories: ["PC", "Indie"],
    link: "https://example.com/news/gamesradar-hades-roadmap",
    pubDate: "2026-03-26T13:44:00.000Z",
  }],
  ["https://gameinformer.com/rss.xml", {
    title: "Clair Obscur preview highlights reactive combat",
    description: "A new preview digs into timing-based combat systems and party synergy.",
    categories: ["RPG", "Preview"],
    link: "https://example.com/news/gameinformer-clair-obscur",
    pubDate: "2026-03-26T13:42:00.000Z",
  }],
  ["https://gamerant.com/feed/", {
    title: "Dragon Age sale drops deluxe edition to $29",
    description: "A limited-time PC deal cuts the Dragon Age deluxe edition price.",
    categories: ["Deals", "PC"],
    link: "https://example.com/news/gamerant-dragon-age-sale",
    pubDate: "2026-03-26T13:40:00.000Z",
  }],
  ["https://www.pushsquare.com/feeds/latest", {
    title: "Ghost of Yotei gameplay deep dive teases stance swaps",
    description: "Push Square breaks down the combat systems from the latest showcase.",
    categories: ["PlayStation", "Action"],
    link: "https://example.com/news/pushsquare-ghost-yotei",
    pubDate: "2026-03-26T13:38:00.000Z",
  }],
  ["https://www.nintendolife.com/feeds/latest", {
    title: "Mario Kart World update adds mirror mode",
    description: "Nintendo Life rounds up the latest Mario Kart World balance changes and tracks.",
    categories: ["Nintendo", "Racing"],
    link: "https://example.com/news/nintendolife-mario-kart-world",
    pubDate: "2026-03-26T13:36:00.000Z",
  }],
]);

const SOCIAL_OVERRIDES = {
  "wario64.bsky.social": {
    displayName: "Wario64",
    text: "Deal: Hades II is 20% off on Steam today.",
    extTitle: "Hades II on Steam",
    extUrl: "https://store.steampowered.com/app/1145350/Hades_II/",
  },
  "xbox.com": {
    displayName: "Xbox",
    text: "Game Pass adds South of Midnight next week.",
    extTitle: "Game Pass update",
    extUrl: "https://news.xbox.com/game-pass-update",
  },
  "blizzard.com": {
    displayName: "Blizzard",
    text: "World of Warcraft patch notes are live for the next raid test.",
    extTitle: "WoW patch notes",
    extUrl: "https://news.blizzard.com/world-of-warcraft",
  },
};

function getNewsItem(feedUrl) {
  return NEWS_FIXTURES.get(feedUrl) || {
    title: "Fallback gaming roundup",
    description: "This fallback item exists only for smoke tests.",
    categories: ["Gaming"],
    link: `https://example.com/news/${encodeURIComponent(feedUrl)}`,
    pubDate: FIXTURE_TIME,
  };
}

function toDisplayName(actor) {
  const override = SOCIAL_OVERRIDES[actor];
  if (override?.displayName) return override.displayName;

  return actor
    .split(".")[0]
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSocialPayload(actor) {
  const override = SOCIAL_OVERRIDES[actor] || {};
  const displayName = toDisplayName(actor);

  return {
    feed: [
      {
        post: {
          uri: `at://${actor}/app.bsky.feed.post/smoke-${actor.replace(/[^a-z0-9]/gi, "")}`,
          indexedAt: FIXTURE_TIME,
          author: {
            handle: actor,
            displayName,
            avatar: "",
          },
          record: {
            text: override.text || `${displayName} shares a gaming update with patch notes and release timing.`,
            createdAt: FIXTURE_TIME,
          },
          embed: override.extTitle
            ? {
                external: {
                  title: override.extTitle,
                  description: `${displayName} shared a related link for smoke testing.`,
                  uri: override.extUrl,
                },
              }
            : undefined,
        },
      },
    ],
  };
}

export async function mockPulsecastFeeds(page) {
  await page.route(/https:\/\/api\.rss2json\.com\/v1\/api\.json.*/, async (route) => {
    const requestUrl = new URL(route.request().url());
    const feedUrl = requestUrl.searchParams.get("rss_url") || "";
    const item = getNewsItem(feedUrl);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        items: [item],
      }),
    });
  });

  await page.route(/https:\/\/api\.allorigins\.win\/get.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ contents: "" }),
    });
  });

  await page.route(/https:\/\/public\.api\.bsky\.app\/xrpc\/app\.bsky\.feed\.getAuthorFeed.*/, async (route) => {
    const requestUrl = new URL(route.request().url());
    const actor = requestUrl.searchParams.get("actor") || "unknown.bsky.social";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildSocialPayload(actor)),
    });
  });
}
