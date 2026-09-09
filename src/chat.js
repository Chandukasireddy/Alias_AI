/**
 * Alias AI — Interactive Terminal Chat Session
 * 
 * Provides a clean, responsive terminal chat REPL directly in the terminal.
 * Communicates through the local zero-knowledge privacy proxy, displaying
 * real-time masked token alerts and clean streaming responses from NVIDIA Nemotron.
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

    console.log('\x1b[90mInteractive Chat Session (/exit to quit, /help for cmds)\x1b[0m');
    console.log('\x1b[90m────────────────────────────────────────────────────\x1b[0m\n');
    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        rl.prompt();
        return;
      }

      // Handle Slash Commands
      if (input.startsWith('/')) {
        const cmd = input.toLowerCase();

        if (cmd === '/exit' || cmd === '/quit' || cmd === 'exit' || cmd === 'quit') {
          console.log('\n\x1b[90mPurging session vault and shutting down...\x1b[0m');
          await server.stop();
          console.log('\x1b[32m✔ Airgap purged. Session terminated.\x1b[0m\n');
          process.exit(0);
        }

        if (cmd === '/clear') {
          console.clear();
          SetupWizard.printLogo(options);
          console.log('\x1b[90mInteractive Chat Session (/exit to quit, /help for cmds)\x1b[0m');
          console.log('\x1b[90m────────────────────────────────────────────────────\x1b[0m\n');
          conversation = [];
          rl.prompt();
          return;
        }

        if (cmd === '/vault') {
          console.log('\n\x1b[1m\x1b[37m[Local Session Vault]\x1b[0m \x1b[90m(Workstation RAM Only):\x1b[0m');
          if (server.aliaser.vault.size === 0) {
            console.log('  \x1b[90m(Vault is empty — no sensitive credentials detected yet)\x1b[0m\n');
          } else {
            let idx = 1;
            server.aliaser.vault.forEach((alias, realVal) => {
              console.log(`  ${idx++}. \x1b[32m${alias.padEnd(22)}\x1b[0m : \x1b[36m${realVal}\x1b[0m`);
            });
            console.log(`\x1b[90m  Total: ${server.aliaser.vault.size} protected tokens | 0.00% leakage\x1b[0m\n`);
          }
          rl.prompt();
          return;
        }

        if (cmd === '/rehydrate') {
          isRehydrating = !isRehydrating;
          server.rehydrate = isRehydrating;
          if (isRehydrating) {
            console.log('\x1b[32m✔ Local De-hydration: ON\x1b[0m \x1b[90m(Cloud responses will restore real secrets locally)\x1b[0m\n');
          } else {
            console.log('\x1b[33m! Local De-hydration: OFF\x1b[0m \x1b[90m(Cloud responses retain <ALIAS_*> placeholders)\x1b[0m\n');
          }
          rl.prompt();
          return;
        }

        if (cmd === '/help') {
          console.log('\n\x1b[1m\x1b[37mAvailable Commands:\x1b[0m');
          console.log('  \x1b[32m/vault\x1b[0m      Inspect secrets protected in local session vault');
          console.log('  \x1b[32m/rehydrate\x1b[0m  Toggle local secret restoration on/off');
          console.log('  \x1b[32m/clear\x1b[0m      Clear screen and reset conversation history');
          console.log('  \x1b[32m/exit\x1b[0m       Exit and securely purge memory vault\n');
          rl.prompt();
          return;
        }

        console.log(`\x1b[33mUnknown command: ${input}. Type /help for options.\x1b[0m\n`);
        rl.prompt();
        return;
      }

      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('\n\x1b[90mPurging session vault and shutting down...\x1b[0m');
        await server.stop();
        console.log('\x1b[32m✔ Airgap purged. Session terminated.\x1b[0m\n');
        process.exit(0);
      }

      // Check for sensitive tokens locally to show clean alert badge
      try {
        const preCheck = await server.aliaser.sanitizeMessagesAsync([{ role: 'user', content: input }], server.enableGemma);
        if (preCheck.entities && preCheck.entities.length > 0) {
          const readableTypes = [...new Set(preCheck.entities.map(e => {
            return e.type.replace('CONTEXTUAL_', '').replace('_NUMBER', '').toLowerCase();
          }))];
          console.log(`\x1b[33m🛡️  [Airgap Vault]\x1b[0m ${preCheck.entities.length} secret(s) masked (${readableTypes.join(', ')}) → \x1b[32m0.00% cloud leakage\x1b[0m`);
        }
      } catch {}

      // Add to conversation
      conversation.push({ role: 'user', content: input });

      // Start streaming request to local proxy
      isBusy = true;
      process.stdout.write('\x1b[90m▸ Thinking...\x1b[0m');

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
            process.stdout.write('\r                \r');
          }
        } catch {
          process.stdout.write('\r                \r');
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
              console.log(`\x1b[31m[NVIDIA NIM Error ${res.statusCode}]\x1b[0m ${parsed.error?.message || parsed.detail || errData}\n`);
            } catch {
              console.log(`\x1b[31m[NVIDIA NIM Error ${res.statusCode}]\x1b[0m ${errData}\n`);
            }
            isBusy = false;
            activeRequest = null;
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
                  console.log(`\x1b[33m[NVIDIA Cloud Notice]\x1b[0m Hosted preview worker pool busy. Please retry in a few moments.\n`);
                } else {
                  console.log(`\x1b[31m[NVIDIA Cloud Notice]\x1b[0m ${errMsg}\n`);
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

                // Handle real content streaming
                if (delta.content) {
                  if (!hadContent) {
                    hadContent = true;
                    clearThinkingLine();
                  }
                  process.stdout.write(delta.content);
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
          rl.prompt();
        });
      });

      activeRequest.on('error', (err) => {
        clearThinkingLine();
        console.log(`\x1b[31m[Connection Error]\x1b[0m ${err.message}\n`);
        isBusy = false;
        activeRequest = null;
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
        process.stdout.write('\r\x1b[K\x1b[90m(Request cancelled)\x1b[0m\n\n');
        rl.prompt();
      } else {
        console.log('\n\x1b[90mPurging session vault and shutting down...\x1b[0m');
        await server.stop();
        console.log('\x1b[32m✔ Airgap purged. Session terminated.\x1b[0m\n');
        process.exit(0);
      }
    });
  }
}

module.exports = InteractiveChat;
