/**
 * Alias AI — Interactive Terminal Chat Session (Google Antigravity & Claude Code Inspired)
 * 
 * Provides an elegant, minimalist terminal chat REPL with clear visual hierarchy:
 *   [PROMPT]     > user prompt
 *   [PROCESSING] ● Airgap Enclave: secrets vaulted · 0.00% cloud leakage
 *   [OUTPUT]     2-space indented readable response from NVIDIA Nemotron NIM
 *   [STATUS]     Divider line with shortcuts and model status
 */

const http = require('http');
const readline = require('readline');
const SetupWizard = require('./wizard');

class InteractiveChat {
  static start(server, options = {}) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[1m\x1b[32m> \x1b[0m'
    });

    let conversation = [];
    let isRehydrating = Boolean(server.rehydrate);
    let activeRequest = null;
    let isBusy = false;

    const printStatusLine = () => {
      const width = 52;
      const left = '? for shortcuts';
      const right = 'NVIDIA Nemotron · 0.00% airgap';
      const pad = Math.max(width - left.length - right.length, 4);
      console.log('\x1b[90m' + left + ' '.repeat(pad) + right + '\x1b[0m\n');
    };

    const printDividerAndStatus = () => {
      const width = 52;
      const divider = '─'.repeat(width);
      console.log('\x1b[90m' + divider + '\x1b[0m');
      printStatusLine();
    };

    printStatusLine();
    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        rl.prompt();
        return;
      }

      // Handle Slash Commands & Quick '?'
      if (input === '?' || input.startsWith('/') || input.toLowerCase() === 'help') {
        const cmd = input.toLowerCase();

        if (cmd === '/exit' || cmd === '/quit' || cmd === 'exit' || cmd === 'quit') {
          console.log('\n  \x1b[90mPurging session vault and shutting down...\x1b[0m');
          await server.stop();
          console.log('  \x1b[32m✔ Airgap purged. Session terminated.\x1b[0m\n');
          process.exit(0);
        }

        if (cmd === '/clear') {
          console.clear();
          SetupWizard.printLogo(options);
          conversation = [];
          printDividerAndStatus();
          rl.prompt();
          return;
        }

        if (cmd === '/vault') {
          console.log('\n  \x1b[1m\x1b[37m● Local Session Vault\x1b[0m \x1b[90m(Workstation RAM Only):\x1b[0m');
          if (server.aliaser.vault.size === 0) {
            console.log('    \x1b[90m(Vault is empty — zero sensitive credentials detected yet)\x1b[0m\n');
          } else {
            let idx = 1;
            server.aliaser.vault.forEach((alias, realVal) => {
              console.log(`    ${idx++}. \x1b[32m${alias.padEnd(22)}\x1b[0m : \x1b[36m${realVal}\x1b[0m`);
            });
            console.log(`\n    \x1b[90mProtected: ${server.aliaser.vault.size} tokens | Cloud leakage: 0.00%\x1b[0m\n`);
          }
          printDividerAndStatus();
          rl.prompt();
          return;
        }

        if (cmd === '/rehydrate') {
          isRehydrating = !isRehydrating;
          server.rehydrate = isRehydrating;
          console.log('');
          if (isRehydrating) {
            console.log('  \x1b[32m● Local De-hydration: ON\x1b[0m \x1b[90m(Cloud responses will restore real secrets locally)\x1b[0m\n');
          } else {
            console.log('  \x1b[33m● Local De-hydration: OFF\x1b[0m \x1b[90m(Cloud responses retain <ALIAS_*> placeholders)\x1b[0m\n');
          }
          printDividerAndStatus();
          rl.prompt();
          return;
        }

        if (cmd === '?' || cmd === '/help' || cmd === 'help') {
          console.log('\n  \x1b[1m\x1b[37mCommands & Shortcuts:\x1b[0m');
          console.log('    \x1b[32m/vault\x1b[0m      Inspect secrets vaulted in local session RAM');
          console.log('    \x1b[32m/rehydrate\x1b[0m  Toggle local secret restoration on/off');
          console.log('    \x1b[32m/clear\x1b[0m      Clear screen and reset conversation history');
          console.log('    \x1b[32m/exit\x1b[0m       Purge local session vault and exit\n');
          printDividerAndStatus();
          rl.prompt();
          return;
        }

        console.log(`\n  \x1b[33mUnknown command: ${input}. Type ? for options.\x1b[0m\n`);
        printDividerAndStatus();
        rl.prompt();
        return;
      }

      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('\n  \x1b[90mPurging session vault and shutting down...\x1b[0m');
        await server.stop();
        console.log('  \x1b[32m✔ Airgap purged. Session terminated.\x1b[0m\n');
        process.exit(0);
      }

      console.log('');

      // Check for sensitive tokens locally to show clean alert badge
      try {
        const preCheck = await server.aliaser.sanitizeMessagesAsync([{ role: 'user', content: input }], server.enableGemma);
        if (preCheck.entities && preCheck.entities.length > 0) {
          const readableTypes = [...new Set(preCheck.entities.map(e => {
            return e.type.replace('CONTEXTUAL_', '').replace('_NUMBER', '').toLowerCase();
          }))];
          console.log(`  \x1b[32m●\x1b[0m \x1b[1m\x1b[37mAirgap Enclave:\x1b[0m \x1b[33m${preCheck.entities.length} secret(s) vaulted\x1b[0m \x1b[90m(${readableTypes.join(', ')}) · \x1b[32m0.00% cloud leakage\x1b[0m\n`);
        }
      } catch {}

      // Add to conversation
      conversation.push({ role: 'user', content: input });

      // Start streaming request to local proxy
      isBusy = true;
      process.stdout.write('  \x1b[90m▸ Thinking...\x1b[0m');

      let hadContent = false;
      let assistantResponse = '';

      const postData = JSON.stringify({
        model: server.nvidiaModel,
        messages: conversation,
        stream: true
      });

      const reqOptions = {
        hostname: '127.0.0.1',
        port: server.port,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-alias-client': 'terminal-chat',
          'x-alias-rehydrate': isRehydrating ? 'true' : 'false'
        }
      };

      const clearThinkingLine = () => {
        try {
          if (process.stdout.isTTY) {
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
          } else {
            process.stdout.write('\r                        \r');
          }
        } catch {
          process.stdout.write('\r                        \r');
        }
      };

      activeRequest = http.request(reqOptions, (res) => {
        let buffer = '';

        if (res.statusCode < 200 || res.statusCode >= 300) {
          clearThinkingLine();
          let errData = '';
          res.on('data', d => { errData += d; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(errData);
              console.log(`  \x1b[31m[NVIDIA NIM Error ${res.statusCode}]\x1b[0m ${parsed.error?.message || parsed.detail || errData}\n`);
            } catch {
              console.log(`  \x1b[31m[NVIDIA NIM Error ${res.statusCode}]\x1b[0m ${errData}\n`);
            }
            isBusy = false;
            activeRequest = null;
            printDividerAndStatus();
            rl.prompt();
          });
          return;
        }

        res.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            if (trimmed === 'data: [DONE]') continue;

            try {
              const data = JSON.parse(trimmed.slice(6));

              // Handle inline stream error from NVIDIA
              if (data.error) {
                if (!hadContent) {
                  clearThinkingLine();
                }
                const errMsg = data.error.message || 'Worker pool busy';
                if (errMsg.includes('Worker local total request limit reached')) {
                  console.log(`  \x1b[33m[NVIDIA Cloud Notice]\x1b[0m Hosted preview worker pool busy. Please retry in a few moments.\n`);
                } else {
                  console.log(`  \x1b[31m[NVIDIA Cloud Notice]\x1b[0m ${errMsg}\n`);
                }
                hadContent = true;
                continue;
              }

              if (data.choices && data.choices[0] && data.choices[0].delta) {
                const delta = data.choices[0].delta;

                // Handle reasoning chunks silently
                if (delta.reasoning_content && !hadContent) {
                  continue;
                }

                // Handle real content streaming with 2-space indentation
                if (delta.content) {
                  if (!hadContent) {
                    hadContent = true;
                    clearThinkingLine();
                    process.stdout.write('  ');
                  }
                  const formattedChunk = delta.content.replace(/\n/g, '\n  ');
                  process.stdout.write(formattedChunk);
                  assistantResponse += delta.content;
                }
              }
            } catch {}
          }
        });

        res.on('end', () => {
          if (!hadContent) {
            clearThinkingLine();
          }
          process.stdout.write('\n\n');
          if (assistantResponse) {
            conversation.push({ role: 'assistant', content: assistantResponse });
          }
          isBusy = false;
          activeRequest = null;
          printDividerAndStatus();
          rl.prompt();
        });
      });

      activeRequest.on('error', (err) => {
        clearThinkingLine();
        console.log(`  \x1b[31m[Connection Error]\x1b[0m ${err.message}\n`);
        isBusy = false;
        activeRequest = null;
        printDividerAndStatus();
        rl.prompt();
      });

      activeRequest.write(postData);
      activeRequest.end();
    });

    // Handle Ctrl+C
    rl.on('SIGINT', async () => {
      if (isBusy && activeRequest) {
        activeRequest.destroy();
        activeRequest = null;
        isBusy = false;
        process.stdout.write('\r\x1b[K  \x1b[90m(Request cancelled)\x1b[0m\n\n');
        printDividerAndStatus();
        rl.prompt();
      } else {
        console.log('\n  \x1b[90mPurging session vault and shutting down...\x1b[0m');
        await server.stop();
        console.log('  \x1b[32m✔ Airgap purged. Session terminated.\x1b[0m\n');
        process.exit(0);
      }
    });
  }
}

module.exports = InteractiveChat;
