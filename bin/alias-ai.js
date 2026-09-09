#!/usr/bin/env node

/**
 * Alias AI — Zero-Knowledge Privacy Airgap Gateway
 * Universal CLI Entrypoint
 */

const CLI = require('../src/cli');

CLI.run(process.argv).catch(err => {
  console.error('\x1b[31m[FATAL ERROR]\x1b[0m', err);
  process.exit(1);
});

