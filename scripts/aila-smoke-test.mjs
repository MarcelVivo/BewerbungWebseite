#!/usr/bin/env node
/**
 * AILA-Smoke-Test: prueft den kritischen Begruessungs-Pfad automatisiert
 * (Video-Modus-Wechsel auf "speaking", Frame-Fortschritt, Rueckkehr zu
 * "idle", und dass die tatsaechlich erwartete Video-Datei geladen wird -
 * genau die Bug-Klasse, die frueher nur per Wegwerf-Playwright-Skript
 * gegen die Live-Seite gefunden wurde). Kein Ersatz fuer einen echten
 * Testrunner - nur ein wiederholbarer manueller Check vor AILA-Pushes.
 *
 * Aufruf: node scripts/aila-smoke-test.mjs [--url=http://localhost:3000] [--webkit]
 * Voraussetzung: `npm install` (playwright ist als devDependency gelistet).
 */

import { chromium, webkit, devices } from 'playwright';

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith('--url='));
const baseUrl = urlArg ? urlArg.split('=')[1] : 'http://localhost:3000';
const useWebkit = args.includes('--webkit');
const EXPECTED_SPEAKING_CLIP = 'aila-speaking-v1-greenscreen.mp4';

let failureCount = 0;
const pass = (message) => console.log(`PASS  ${message}`);
const fail = (message) => {
  console.error(`FAIL  ${message}`);
  failureCount += 1;
};

async function runScenario({ label, browserType, contextOptions, videoSelector }) {
  console.log(`\n=== ${label} ===`);
  const launchArgs = browserType === chromium ? ['--autoplay-policy=no-user-gesture-required'] : [];
  const browser = await browserType.launch({ args: launchArgs });
  const page = await browser.newPage(contextOptions);

  const videoRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/cinematic/aila/')) videoRequests.push(url.replace(/^.*\/cinematic\//, ''));
  });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(
      () => document.querySelector('[data-hero-phase]')?.getAttribute('data-hero-phase') === 'revealed',
      undefined,
      { timeout: 15000 },
    );
    await page.waitForTimeout(300);

    // A real gesture is required to unlock audio playback - without one the
    // greeting never leaves 'silent' mode and none of the checks below would
    // ever fire, which looks identical to a broken page from the outside.
    // A keypress (rather than a click/tap at a fixed pixel coordinate) is
    // used deliberately: AilaGreeting's gesture listener treats keydown the
    // same as click/touchstart, and it can't accidentally land on a real
    // interactive element and navigate away - a fixed-coordinate tap on
    // mobile once hit the "scroll to top" brand button and broke the page.
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');

    const reachedSpeaking = await page
      .waitForFunction(
        () => document.querySelector('[data-aila-state]')?.getAttribute('data-aila-state') === 'speaking',
        undefined,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false);

    if (reachedSpeaking) {
      pass(`${label}: data-aila-state="speaking" erreicht`);
    } else {
      fail(`${label}: data-aila-state hat "speaking" nicht innerhalb 5s erreicht`);
    }

    const loadedExpectedClip = videoRequests.some((url) => url.includes(EXPECTED_SPEAKING_CLIP));
    if (loadedExpectedClip) {
      pass(`${label}: ${EXPECTED_SPEAKING_CLIP} wurde geladen`);
    } else {
      fail(`${label}: erwartete Datei ${EXPECTED_SPEAKING_CLIP} wurde NICHT geladen (geladen: ${videoRequests.join(', ') || 'keine'})`);
    }

    if (reachedSpeaking) {
      const timeAtStart = await page.evaluate((selector) => document.querySelector(selector)?.currentTime ?? null, videoSelector);
      await page.waitForTimeout(1500);
      const timeAfterWait = await page.evaluate((selector) => document.querySelector(selector)?.currentTime ?? null, videoSelector);
      if (timeAtStart !== null && timeAfterWait !== null && timeAfterWait > timeAtStart) {
        pass(`${label}: Video-Frame-Fortschritt bestaetigt (${timeAtStart.toFixed(2)}s -> ${timeAfterWait.toFixed(2)}s)`);
      } else {
        fail(`${label}: Video scheint eingefroren (${timeAtStart} -> ${timeAfterWait})`);
      }
    }

    const returnedToIdle = await page
      .waitForFunction(
        () => document.querySelector('[data-aila-state]')?.getAttribute('data-aila-state') === 'idle',
        undefined,
        { timeout: 20000 },
      )
      .then(() => true)
      .catch(() => false);

    if (returnedToIdle) {
      pass(`${label}: Rueckkehr zu data-aila-state="idle" bestaetigt`);
    } else {
      fail(`${label}: keine Rueckkehr zu "idle" innerhalb 20s nach "speaking"`);
    }
  } catch (error) {
    fail(`${label}: unerwarteter Fehler - ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`AILA Smoke-Test gegen ${baseUrl}`);

  await runScenario({
    label: 'Desktop (Chromium)',
    browserType: chromium,
    contextOptions: { viewport: { width: 1440, height: 900 } },
    videoSelector: '[data-aila-state] video',
  });

  await runScenario({
    label: 'Mobile (Chromium, iPhone 13 Emulation)',
    browserType: chromium,
    contextOptions: { ...devices['iPhone 13'] },
    videoSelector: '[data-aila-entity="mobile"] video',
  });

  if (useWebkit) {
    await runScenario({
      label: 'Desktop (WebKit/Safari-Engine)',
      browserType: webkit,
      contextOptions: { viewport: { width: 1440, height: 900 } },
      videoSelector: '[data-aila-state] video',
    });
  }

  console.log(`\n${failureCount === 0 ? 'ALLE PRUEFUNGEN BESTANDEN' : `${failureCount} PRUEFUNG(EN) FEHLGESCHLAGEN`}`);
  process.exitCode = failureCount === 0 ? 0 : 1;
}

main();
