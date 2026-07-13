import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://hrms-app-chi.vercel.app";
const outputDir = "../../test-results/performance";
const samplesPerRoute = 3;

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function getDemoStorageState(browser, role) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: role === "admin" ? /Admin demo/i : /Employee demo/i })
    .click();
  await page.waitForURL(`${baseURL}/`);
  const state = await context.storageState();
  await context.close();
  return state;
}

async function measureNavigation(browser, route, storageState) {
  const context = await browser.newContext({
    storageState,
    viewport: { width: 1440, height: 900 },
  });
  await context.addInitScript(() => {
    window.__taazurPerf = { cls: 0, lcp: 0 };
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) window.__taazurPerf.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        if (!entry.hadRecentInput) window.__taazurPerf.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  const page = await context.newPage();
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: "load", timeout: 30_000 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const result = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    return {
      ttfb: nav.responseStart - nav.requestStart,
      responseEnd: nav.responseEnd,
      domInteractive: nav.domInteractive,
      dcl: nav.domContentLoadedEventEnd,
      load: nav.loadEventEnd,
      fcp,
      lcp: window.__taazurPerf?.lcp ?? 0,
      cls: window.__taazurPerf?.cls ?? 0,
      transferSize: nav.transferSize,
      encodedBodySize: nav.encodedBodySize,
    };
  });
  await context.close();
  return { status: response?.status() ?? null, ...result };
}

async function measureRoute(browser, route, storageState) {
  const samples = [];
  for (let index = 0; index < samplesPerRoute; index += 1) {
    samples.push(await measureNavigation(browser, route, storageState));
  }
  const metrics = ["ttfb", "responseEnd", "domInteractive", "dcl", "load", "fcp", "lcp", "cls"];
  const summary = { status: samples[0].status };
  for (const metric of metrics) {
    const values = samples.map((sample) => sample[metric]);
    summary[metric] = round(median(values));
    summary[`${metric}Min`] = round(Math.min(...values));
    summary[`${metric}Max`] = round(Math.max(...values));
  }
  summary.transferSize = Math.round(median(samples.map((sample) => sample.transferSize)));
  return { route, summary, samples };
}

async function checkViewport(browser, label, route, storageState, width, height, screenshot = false) {
  const context = await browser.newContext({ storageState, viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(`${baseURL}${route}`, { waitUntil: "load", timeout: 30_000 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const result = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    pageHeight: document.documentElement.scrollHeight,
    headingVisible: Boolean(document.querySelector("h1")),
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).length,
  }));
  if (screenshot) {
    await page.screenshot({ path: `${outputDir}/${label}-${width}x${height}.png`, fullPage: true });
  }
  await context.close();
  return { label, route, width, height, ...result };
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const [adminState, employeeState] = await Promise.all([
    getDemoStorageState(browser, "admin"),
    getDemoStorageState(browser, "employee"),
  ]);

  const routes = [
    ["public-login", "/login", undefined],
    ["admin-dashboard", "/", adminState],
    ["module-catalog", "/modules", adminState],
    ["government-workspace", "/modules/government-integrations", adminState],
    ["employee-dashboard", "/", employeeState],
    ["employee-profile", "/profile", employeeState],
    ["employee-expenses", "/modules/travel-expenses", employeeState],
  ];

  const latency = [];
  for (const [label, route, state] of routes) {
    latency.push({ label, ...(await measureRoute(browser, route, state)) });
  }

  const viewportDefinitions = [
    [360, 800],
    [390, 844],
    [768, 1024],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ];
  const resolution = [];
  for (const [width, height] of viewportDefinitions) {
    resolution.push(
      await checkViewport(browser, "public-login", "/login", undefined, width, height, width === 390),
      await checkViewport(browser, "employee-dashboard", "/", employeeState, width, height, width === 390),
      await checkViewport(browser, "admin-dashboard", "/", adminState, width, height, width === 768 || width === 1920),
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    methodology: "Three fresh Chromium contexts per route; medians reported. Viewport checks use full-page DOM overflow and image integrity checks.",
    latency,
    resolution,
  };
  await writeFile(`${outputDir}/production-performance.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
