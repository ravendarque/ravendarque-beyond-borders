/**
 * Network utilities for fetching files from URLs
 * Handles retries, redirects, and error handling
 */

import https from 'https';
import fs from 'fs';
import { logger } from './logger.js';
import { NetworkError } from './errors.js';

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Fetch URL content as buffer
 * @param {string} url - URL to fetch
 * @param {number} attempts - Current retry attempt (default: 0)
 * @returns {Promise<Buffer>} - Fetched content
 */
export function fetchUrl(url, attempts = 0) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    opts.headers = {
      'User-Agent': 'beyond-borders-fetcher/1.0 (+https://github.com/ravendarque/beyond-borders)',
      'Referer': 'https://commons.wikimedia.org/',
      'Accept': '*/*'
    };
    https.get(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, 0));
      }
      if ((res.statusCode === 429 || (res.statusCode >= 500 && res.statusCode < 600) || res.statusCode === 403) && attempts < 5) {
        const backoff = 800 * Math.pow(2, attempts);
        logger.warn(`Retryable status ${res.statusCode} for ${url} -> retry in ${backoff}ms`);
        setTimeout(() => resolve(fetchUrl(url, attempts + 1)), backoff);
        return;
      }
      if (res.statusCode !== 200) {
        return reject(new NetworkError(`Bad status ${res.statusCode} for ${url}`, url));
      }
      const bufs = [];
      res.on('data', (d) => bufs.push(d));
      res.on('end', () => resolve(Buffer.concat(bufs)));
    }).on('error', reject);
  });
}

/**
 * Fetch URL and save to file
 * @param {string} url - URL to fetch
 * @param {string} dst - Destination file path
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @param {number} maxRedirects - Maximum redirects (default: 5)
 * @returns {Promise<number>} - File size in bytes
 */
export function fetchToFile(url, dst, timeoutMs = 30000, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new NetworkError('Too many redirects', url));
    const opts = new URL(url);
    opts.headers = {
      'User-Agent': 'beyond-borders-fetcher/1.0 (+https://github.com/ravendarque/beyond-borders)',
      'Referer': 'https://commons.wikimedia.org/',
      'Accept': '*/*'
    };
    const req = https.get(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        return resolve(fetchToFile(res.headers.location, dst, timeoutMs, maxRedirects - 1));
      }
      if ((res.statusCode === 429 || (res.statusCode >= 500 && res.statusCode < 600) || res.statusCode === 403)) {
        return reject(new NetworkError(`Retryable status ${res.statusCode} for ${url}`, url));
      }
      if (res.statusCode !== 200) {
        return reject(new NetworkError(`Bad status ${res.statusCode} for ${url}`, url));
      }
      const ws = fs.createWriteStream(dst);
      let finished = false;
      const onDone = () => {
        if (finished) return;
        finished = true;
        ws.close();
        try {
          const st = fs.statSync(dst);
          resolve(st.size);
        } catch (e) {
          resolve(0);
        }
      };
      const onError = (err) => {
        if (finished) return;
        finished = true;
        try {
          ws.destroy();
        } catch (e) {
          // Ignore
        }
        reject(err);
      };
      res.pipe(ws);
      res.on('error', onError);
      ws.on('finish', onDone);
      ws.on('error', onError);
      res.setTimeout(timeoutMs, () => onError(new NetworkError(`Timeout downloading ${url}`, url)));
    }).on('error', (err) => reject(err));
  });
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry (should return Promise)
 * @param {number} attempts - Number of attempts (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 500)
 * @returns {Promise<any>} - Result of function
 */
export async function retryWithBackoff(fn, attempts = 3, initialDelay = 500) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = initialDelay * Math.pow(2, i);
        logger.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms:`, err.message);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

/**
 * Get media URL from Wikimedia Commons file page URL
 * @param {string} filePageUrl - File page URL (e.g., https://commons.wikimedia.org/wiki/File:Flag.svg)
 * @returns {Promise<string|null>} - Direct media URL or null
 */
export async function getMediaUrlFromCommons(filePageUrl) {
  try {
    const parts = filePageUrl.split('/');
    const filename = parts[parts.length - 1] || '';
    if (!filename || !filename.startsWith('File:')) {
      return null;
    }
    const encoded = encodeURIComponent(filename);
    // Direct SVG URL pattern for Commons
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
  } catch (e) {
    logger.warn('Failed to extract media URL from Commons URL:', e.message);
    return null;
  }
}
