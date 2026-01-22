#!/usr/bin/env node
/**
 * Inspects the app's page structure and state
 * Opens the app in a browser and dumps DOM structure and state
 */

import fs from 'fs';
import { chromium } from 'playwright';
import { resolveTestResultsPath } from './lib/paths.js';
import { logger } from './lib/logger.js';
import { exitWithError, NetworkError } from './lib/errors.js';

const outDir = resolveTestResultsPath(import.meta.url, 'inspect');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ baseURL: 'http://localhost:5173' });
const page = await ctx.newPage();

const logs = [];
page.on('console', msg => {
  const text = `${msg.type()}: ${msg.text()}`;
  logs.push(text);
  logger.debug(text);
});

page.on('pageerror', err => {
  logs.push(`pageerror: ${err.toString()}`);
  logger.error('Page error:', err.toString());
});

try {
  await page.goto('/');
  await page.waitForTimeout(1500);

  // Capture screenshot and HTML
  const shotPath = resolveTestResultsPath(import.meta.url, 'inspect', 'inspect-screenshot.png');
  await page.screenshot({ path: shotPath, fullPage: true });

  const html = await page.content();
  const domPath = resolveTestResultsPath(import.meta.url, 'inspect', 'inspect-dom.html');
  fs.writeFileSync(domPath, html, 'utf8');

  const logsPath = resolveTestResultsPath(import.meta.url, 'inspect', 'inspect-console.log');
  fs.writeFileSync(logsPath, logs.join('\n'), 'utf8');

  logger.success('Wrote:', shotPath);
  logger.success('Wrote:', domPath);
  logger.success('Wrote:', logsPath);
} catch (err) {
  exitWithError(new NetworkError('Error during inspect', null, err));
} finally {
  await browser.close();
}
