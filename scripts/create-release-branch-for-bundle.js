#!/usr/bin/env node

const shell = require('shelljs');
const logger = require('./logger-util');

shell.set('-e');
shell.set('+v');

function getReleaseVersion() {
  const currentVersion = require('../packages/salesforcedx-vscode/package.json')
    .version;
  let [version, major, minor, patch] = currentVersion.match(/^(\d+)\.?(\d+)\.?(\*|\d+)$/);
  patch = getBetaVersion();
  return `${major}.${minor}.${patch}`;
}

function getBetaVersion() {
  //ISO returns UTC for consistency; new betas can be made every minute
  const yearMonthDateHourMin = new Date().toISOString().replace(/\D/g, '').substring(0, 12);
  return yearMonthDateHourMin;
}

shell.env['SALESFORCEDX_VSCODE_VERSION'] = getReleaseVersion();

const nextVersion = process.env['SALESFORCEDX_VSCODE_VERSION'];
logger.info(`Release version: ${nextVersion}`);

const releaseBranchName = `release/v${nextVersion}`;

// Check if release branch has already been created
const remoteReleaseBranchExists = shell
  .exec(`git ls-remote --heads origin ${releaseBranchName}`, {
    silent: true
  })
  .stdout.trim();

if (remoteReleaseBranchExists) {
  logger.error(
    `${releaseBranchName} already exists in remote. You might want to verify the value assigned to SALESFORCEDX_VSCODE_VERSION`
  );
  process.exit(-1);
}

// Create the new release branch and switch to it
shell.exec(`git checkout -b ${releaseBranchName}`);
console.log(releaseBranchName);

shell.exec(`npm install`);
// make sure no failure for compilation
shell.exec(`npm run compile`);
shell.exec(`git add .`);
shell.exec(`git commit -m "chore: update to version ${nextVersion}"`);
shell.exec(`git push -u origin ${releaseBranchName}`);
