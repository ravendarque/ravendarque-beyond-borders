#!/usr/bin/env node
/**
 * GitVersion-style semantic version calculator
 * 
 * Calculates version from git tags and commit history:
 * - Major.Minor from latest git tag (e.g., v0.1)
 * - Patch from commit count since tag
 * - Prerelease suffix from branch name
 * 
 * Examples:
 * - main branch, tag v0.1, 5 commits after: 0.1.5
 * - feature/auth, tag v0.1, 3 commits after: 0.1.3-pr
 * - beta/new-ui, tag v0.2, 2 commits after: 0.2.2-beta
 * - release/v1.0, tag v0.9, 1 commit after: 0.9.1-rc
 */

import { execSync } from 'child_process';
import fs from 'fs';
import { join } from 'path';
import { resolveFromScript } from './lib/paths.js';
import { logger } from './lib/logger.js';
import { exitWithError, FileError } from './lib/errors.js';

/**
 * Execute a git command and return the output
 * @param {string} command - Git command to execute
 * @returns {string} - Command output, trimmed
 */
function git(command) {
  try {
    return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
  } catch (error) {
    return '';
  }
}

/**
 * Get the current branch name
 * @returns {string} - Branch name
 */
export function getBranchName() {
  // Try to get from GitHub Actions environment
  const ghRef = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (ghRef) {
    return ghRef.replace('refs/heads/', '');
  }
  
  // Fallback to git command
  return git('rev-parse --abbrev-ref HEAD') || 'main';
}

/**
 * Get the latest git tag matching semantic version pattern
 * @returns {string} - Latest tag (e.g., "v0.1" or "v1.0.0")
 */
export function getLatestTag() {
  const tags = git('tag --list "v*" --sort=-version:refname');
  if (!tags) {
    return 'v0.0'; // Default if no tags exist
  }
  
  return tags.split('\n')[0] || 'v0.0';
}

/**
 * Parse a version tag into major and minor components
 * @param {string} tag - Version tag (e.g., "v0.1" or "v1.0.0")
 * @returns {{major: number, minor: number}} - Parsed version
 */
export function parseTag(tag) {
  const match = tag.match(/v?(\d+)\.(\d+)/);
  if (!match) {
    return { major: 0, minor: 0 };
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10)
  };
}

/**
 * Get commit count since the latest tag
 * @param {string} tag - Tag to count from
 * @returns {number} - Number of commits since tag
 */
export function getCommitsSinceTag(tag) {
  const count = git(`rev-list ${tag}..HEAD --count`);
  return parseInt(count, 10) || 0;
}

/**
 * Get the total commit count (for initial patch before first tag)
 * @returns {number} - Total commit count
 */
function getTotalCommitCount() {
  const count = git('rev-list --count HEAD');
  return parseInt(count, 10) || 0;
}

/**
 * Determine prerelease suffix based on branch name
 * @param {string} branch - Branch name
 * @returns {string} - Prerelease suffix (e.g., "pr", "beta", "rc") or empty string
 */
export function getPrereleaseSuffix(branch) {
  // Main/master branches: no suffix (stable)
  if (/^(main|master)$/.test(branch)) {
    return '';
  }
  
  // Release branches: rc (release candidate)
  if (/^(release|hotfix)\//.test(branch)) {
    return 'rc';
  }
  
  // Beta branches: beta
  if (/^beta\//.test(branch)) {
    return 'beta';
  }
  
  // Feature/bugfix branches: pr (pull request)
  if (/^(feature|feat|fix|bugfix)\//.test(branch)) {
    return 'pr';
  }
  
  // Default: pr for any other branch
  return 'pr';
}

/**
 * Calculate semantic version based on git history
 * @returns {string} - Calculated version (e.g., "0.1.5" or "0.1.3-alpha.3")
 */
export function calculateVersion() {
  const branch = getBranchName();
  const latestTag = getLatestTag();
  const { major, minor } = parseTag(latestTag);
  
  // Check if tag exists in git
  const tagExists = git(`tag -l "${latestTag}"`);
  let patch;
  
  if (tagExists) {
    // Tag exists: count commits since tag
    patch = getCommitsSinceTag(latestTag);
  } else {
    // No tag exists: use total commit count
    patch = getTotalCommitCount();
  }
  
  // Build base version
  let version = `${major}.${minor}.${patch}`;
  
  // Add prerelease suffix if not on main/master
  const prerelease = getPrereleaseSuffix(branch);
  if (prerelease) {
    version += `-${prerelease}`;
  }
  
  return version;
}

/**
 * Update package.json with calculated version (optional)
 * @param {string} version - Version to write to package.json
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 */
function updatePackageJson(version, importMetaUrl) {
  const packageJsonPath = join(resolveFromScript(importMetaUrl, '..'), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    exitWithError(new FileError('package.json not found', packageJsonPath));
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = version;
  
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8'
  );
  
  logger.success(`Updated package.json version to ${version}`);
}

// Main execution (runs when script is executed directly)
const version = calculateVersion();
const args = process.argv.slice(2);

// If --update flag is provided, update package.json
if (args.includes('--update')) {
  updatePackageJson(version, import.meta.url);
} else {
  // Otherwise, just output the version
  console.log(version);
}
