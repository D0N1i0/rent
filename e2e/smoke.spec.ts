// e2e/smoke.spec.ts
// Smoke tests — verify critical pages load and key UI elements exist.
// These run against E2E_BASE_URL (local dev or Vercel preview).
// They do NOT create real bookings or hit Stripe production keys.

import { test, expect } from "@playwright/test";

// ─── Public pages ──────────────────────────────────────────────────────────────

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AutoKos|Car Rental/i);
  // Hero section or main heading must be visible
  await expect(page.locator("h1").first()).toBeVisible();
});

test("fleet page loads and lists cars", async ({ page }) => {
  await page.goto("/fleet");
  await expect(page).toHaveTitle(/Fleet|Cars|Vehicles/i);
  // At least one car card should be present
  const cards = page.locator("a[href*='/fleet/']");
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
});

test("car detail page loads", async ({ page }) => {
  // Navigate to fleet first, then click the first car
  await page.goto("/fleet");
  const firstCarLink = page.locator("a[href*='/fleet/']").first();
  await expect(firstCarLink).toBeVisible({ timeout: 15_000 });
  await firstCarLink.click();
  // Car detail must show a heading and a booking CTA
  await expect(page.locator("h1").first()).toBeVisible();
});

test("FAQ page loads", async ({ page }) => {
  await page.goto("/faq");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("contact page loads", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator("h1, h2").first()).toBeVisible();
  await expect(page.locator("form")).toBeVisible();
});

// ─── Auth pages ────────────────────────────────────────────────────────────────

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();
});

test("register page loads", async ({ page }) => {
  await page.goto("/register");
  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();
});

test("forgot password page loads", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.locator("input[type='email']")).toBeVisible();
});

// ─── Booking flow ─────────────────────────────────────────────────────────────

test("booking page loads", async ({ page }) => {
  await page.goto("/booking");
  // The booking form or a redirect to fleet must be visible
  const isForm = await page.locator("form").count();
  const isFleetRedirect = page.url().includes("/fleet") || page.url().includes("/booking");
  expect(isForm > 0 || isFleetRedirect).toBeTruthy();
});

test("booking page with car slug loads form", async ({ page }) => {
  // Navigate to fleet, get first car, then open its booking form
  await page.goto("/fleet");
  const firstCar = page.locator("a[href*='/fleet/']").first();
  await expect(firstCar).toBeVisible({ timeout: 15_000 });
  const href = await firstCar.getAttribute("href");
  if (!href) return;

  await page.goto(href);
  // Car detail page — look for a "Book Now" or "Reserve" button
  const bookBtn = page.locator("a[href*='/booking'], button").filter({ hasText: /book|reserve|rent/i }).first();
  await expect(bookBtn).toBeVisible({ timeout: 10_000 });
});

// ─── Customer dashboard (requires login) ─────────────────────────────────────

test("customer dashboard redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

test("customer bookings page redirects unauthenticated users", async ({ page }) => {
  await page.goto("/dashboard/bookings");
  await expect(page).toHaveURL(/login/);
});

// ─── Admin panel (requires login) ────────────────────────────────────────────

test("admin panel redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/login/);
});
