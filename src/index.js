/**
 * Alias AI — Zero-Knowledge Privacy Airgap Gateway
 * Main Module Export
 */

const AliasingEngine = require('./aliaser');
const ProxyServer = require('./server');
const SetupWizard = require('./wizard');
const CLI = require('./cli');

module.exports = {
  AliasingEngine,
  ProxyServer,
  SetupWizard,
  CLI
};
