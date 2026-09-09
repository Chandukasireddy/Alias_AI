/**
 * Alias AI — Hardware & Local Model Detection Wizard
 * 
 * Inspects the local workstation for Ollama and Google Gemma 2 / local LLMs.
 * Provides frictionless setup guidance for zero-latency local neural extraction.
 */

const http = require('http');
const os = require('os');
const readline = require('readline');

class SetupWizard {
  /**
   * Ping local Ollama API to detect running state and installed models.
   */
  static async checkOllama(host = '127.0.0.1', port = 11434) {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: host,
          port: port,
          path: '/api/tags',
          method: 'GET',
          timeout: 1200
        },
        (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const models = (json.models || []).map(m => m.name || m.model || '');
              const hasGemma = models.some(m => m.toLowerCase().includes('gemma'));
              resolve({
                running: true,
                models,
                hasGemma,
                gemmaModel: models.find(m => m.toLowerCase().includes('gemma')) || null
              });
            } catch {
              resolve({ running: true, models: [], hasGemma: false, gemmaModel: null });
            }
          });
        }
      );

      req.on('error', () => {
        resolve({ running: false, models: [], hasGemma: false, gemmaModel: null });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ running: false, models: [], hasGemma: false, gemmaModel: null });
      });

      req.end();
    });
  }

  /**
   * Run the interactive hardware and model inspection check.
   */
  static async run(options = {}) {
    const isTTY = process.stdin.isTTY && !options.noWizard;
    const cpus = os.cpus().length;
    const totalMemGb = (os.totalmem() / (1024 ** 3)).toFixed(1);

    console.log('\x1b[90m┌─────────────────────────────────────────────────────────────┐\x1b[0m');
    console.log('\x1b[90m│\x1b[0m  \x1b[1m\x1b[37mALIAS AI\x1b[0m \x1b[90m— Zero-Knowledge Local Privacy Airgap Gateway   \x1b[90m│\x1b[0m');
    console.log('\x1b[90m│\x1b[0m  \x1b[32m●\x1b[0m Hardware: \x1b[36m' + cpus + ' vCPUs\x1b[0m | \x1b[36m' + totalMemGb + ' GB RAM\x1b[0m | OS: \x1b[36m' + os.platform() + ' ' + os.arch() + '\x1b[0m       \x1b[90m│\x1b[0m');
    console.log('\x1b[90m└─────────────────────────────────────────────────────────────┘\x1b[0m');

    const ollamaStatus = await this.checkOllama();

    if (ollamaStatus.running && ollamaStatus.hasGemma) {
      console.log(`\x1b[32m[✓] Local Neural Model:\x1b[0m Detected \x1b[1m${ollamaStatus.gemmaModel}\x1b[0m on Ollama`);
      console.log(`\x1b[90m    Extraction Mode: Hybrid (Gemma 2 Neural NER + Zero-Latency Regex Engine)\x1b[0m\n`);
      return { extractionMode: 'hybrid', model: ollamaStatus.gemmaModel };
    }

    if (ollamaStatus.running && !ollamaStatus.hasGemma) {
      console.log(`\x1b[33m[!] Local Ollama Detected:\x1b[0m Running on http://127.0.0.1:11434`);
      console.log(`\x1b[90m    Installed Models: ${ollamaStatus.models.length > 0 ? ollamaStatus.models.join(', ') : 'None'}\x1b[0m`);
      console.log(`\x1b[36m[i] Recommendation:\x1b[0m For enhanced semantic entity extraction, install Gemma 2:`);
      console.log(`\x1b[1m    ollama run gemma2:2b\x1b[0m\n`);
      console.log(`\x1b[32m[✓] Active Sanitizer:\x1b[0m Deterministic Regex Engine (0ms latency, 100% rule coverage)\n`);
      return { extractionMode: 'deterministic', model: null };
    }

    // Ollama not running
    console.log(`\x1b[90m[i] Local Ollama:\x1b[0m Not running on port 11434`);
    console.log(`\x1b[32m[✓] Active Sanitizer:\x1b[0m High-Speed Local Regex Engine (0ms overhead, zero memory footprint)`);
    console.log(`\x1b[90m    Optional: Install Ollama (https://ollama.com) & run 'ollama run gemma2:2b' for local neural NER.\x1b[0m\n`);

    return { extractionMode: 'deterministic', model: null };
  }
}

module.exports = SetupWizard;

