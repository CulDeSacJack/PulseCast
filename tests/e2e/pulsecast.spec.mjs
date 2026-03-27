import { expect, test } from "@playwright/test";
import { mockPulsecastFeeds } from "./helpers/mockFeeds.mjs";

test.beforeEach(async ({ page }) => {
  await mockPulsecastFeeds(page);
});

test("loads the news front page with mocked feeds", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("PULSECAST")).toBeVisible();
  await expect(page.getByText("Catch the stories everyone is chasing.")).toBeVisible();
  await expect(page.getByText("Top Stories", { exact: true })).toBeVisible();
  await expect(page.getByText("Mario Kart World update adds mirror mode")).toBeVisible();
  await expect(page.getByText("12/12 sources", { exact: true })).toBeVisible();
});

test("supports search, saving, and settings interactions", async ({ page }) => {
  await page.goto("/");

  const search = page.getByPlaceholder("Search headlines, summaries, and shared links...");
  await expect(page.getByRole("button", { name: "Open keyboard shortcuts" })).toBeVisible();

  await page.keyboard.press("/");
  await expect(search).toBeFocused();

  await page.keyboard.press("Control+K");
  await expect(search).toBeFocused();

  await search.fill("Definitely not a real PulseCast query");
  await expect(page.getByText("No headlines matched that search.")).toBeVisible();
  await page.locator(".empty-panel").getByRole("button", { name: "Clear search" }).click();
  await expect(search).toHaveValue("");

  await page.getByRole("button", { name: "Open keyboard shortcuts" }).click();
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toHaveCount(0);

  await search.fill("Mario Kart World");
  await expect(page.getByText("Mario Kart World update adds mirror mode")).toBeVisible();
  await expect(page.getByText("Ghost of Yotei gameplay deep dive teases stance swaps")).toHaveCount(0);

  const marioCard = page.locator("article").filter({ hasText: "Mario Kart World update adds mirror mode" });
  await marioCard.getByRole("button", { name: "SAVE" }).click();
  await expect(page.getByText("Saved to reading list")).toBeVisible();

  await page.locator(".nav").getByRole("button", { name: "Saved" }).click();
  await expect(page.getByText("Mario Kart World update adds mirror mode")).toBeVisible();

  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByText("Tune filtering and manage what the feed hides.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Tune filtering and manage what the feed hides.")).toHaveCount(0);
});

test("loads the social feed and lets you mute a post source", async ({ page }) => {
  await page.goto("/");

  await page.locator(".nav").getByRole("button", { name: "Social" }).click();
  await page.getByRole("button", { name: "Deals" }).click();

  const warioCard = page.locator(".bsky-card").filter({ hasText: "@wario64.bsky.social" });
  await expect(warioCard).toContainText("Deal: Hades II is 20% off on Steam today.");
  await warioCard.getByRole("button", { name: "MUTE" }).click();
  await expect(page.locator(".bsky-card").filter({ hasText: "@wario64.bsky.social" })).toHaveCount(0);
});
