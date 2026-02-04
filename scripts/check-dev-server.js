#!/usr/bin/env node
/**
 * Gate for E2E tests: exit immediately if the dev server isn't running.
 * Skip when CI=true (Playwright starts the server in that case).
 * Usage: node scripts/check-dev-server.js [port]
 */

import net from 'node:net';

const port = parseInt(process.argv[2] || '5173', 10);
const url = `http://localhost:${port}/`;

// Skip when CI or GitHub Actions (Playwright starts the server via webServer)
if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
  process.exit(0);
}

const socket = net.connect(port, 'localhost', () => {
  socket.end();
  process.exit(0);
});
socket.setTimeout(5000);
socket.on('error', () => {
  console.error(`Dev server not running at ${url}`);
  console.error('Start it with: pnpm dev');
  process.exit(1);
});
socket.on('timeout', () => {
  socket.destroy();
  console.error(`Dev server not running at ${url}`);
  console.error('Start it with: pnpm dev');
  process.exit(1);
});
