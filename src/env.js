/**
 * Alias AI — Multi-Location Environment Configuration Loader
 * 
 * Automatically loads .env from:
 * 1. Current working directory: process.cwd()/.env
 * 2. Repository/Package installation root: __dirname/../.env
 * 3. User home directory: ~/.alias-ai/.env or ~/.env
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function loadEnv() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(os.homedir(), '.alias-ai', '.env'),
    path.resolve(os.homedir(), '.env')
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key && val && !process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {}
    }
  }
}

loadEnv();

module.exports = loadEnv;
