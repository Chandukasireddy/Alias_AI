# 💻 Alias AI — CLI & Terminal Reference

`alias-ai` is a zero-dependency CLI and local transparent privacy proxy for developers, terminal agents, and automated pipelines.

---

## ⚡ Quick Reference

```bash
# Start interactive airgap chat session (default):
alias-ai

# Start local proxy gateway on port 8080:
alias-ai start

# Start on custom port and custom upstream LLM endpoint:
alias-ai start --port 8081 --upstream https://integrate.api.nvidia.com/v1

# Enable local secret re-hydration (default is pass-through placeholders):
alias-ai start --rehydrate

# Run system diagnostic checks:
alias-ai doctor

# Run mathematical airgap self-test:
alias-ai test

# Offline prompt sanitization inspector:
alias-ai sanitize "Contact Chandu at chandu@example.com with VIN WDB2110761A123456"

# Print ready-to-use configuration blocks for Cursor, Python, and shell:
alias-ai config
```

---

## 🕹️ Interactive Chat Session Commands

When running in interactive chat mode (`alias-ai`), the following slash commands are supported directly in the prompt:

| Command | Shortcut | Description |
|---|---|---|
| `/vault` | `/v` | Inspect all active session secrets stored in the local RAM enclave |
| `/rehydrate` | `/r` | Toggle local secret re-hydration mode ON/OFF |
| `/clear` | `/c` | Flush the ephemeral session vault and wipe secret memory |
| `/help` | `?` | Display inline command shortcuts and keybindings |
| `/exit` | `/q` | Exit the interactive session safely |

---

## ⚙️ Global Flags & Options

All flags can be passed to `alias-ai start` or `alias-ai`:

### `--port`, `-p <number>`
- **Default:** `8080` (or dynamic auto-increment to `8081` if in use)
- **Description:** Local port to bind the HTTP proxy server.

### `--upstream`, `-u <url>`
- **Default:** `https://api.openai.com` (or value of `UPSTREAM_URL` from `.env`)
- **Description:** Target upstream OpenAI-compatible LLM endpoint (e.g. `https://integrate.api.nvidia.com/v1`).

### `--rehydrate`, `-r`
- **Default:** `false` (pass-through placeholders)
- **Description:** When enabled, replaces `<ALIAS_*>` tokens in streamed responses with real secrets on the client side before display.

### `--gemma`, `-g`
- **Default:** Enabled if Ollama is running with `gemma2:2b`
- **Description:** Forces local neural Named Entity Recognition via Google Gemma 2.

### `--no-gemma`
- **Default:** `false`
- **Description:** Disables local Ollama connection; relies exclusively on the deterministic zero-latency regex engine (< 1ms).

### `--model <name>`
- **Default:** `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` (when using NVIDIA NIM) or `gpt-4o-mini`
- **Description:** Upstream LLM model identifier.

---

## 🌐 Environment Variables

Alias AI automatically resolves configuration from:
1. Active environment variables (`process.env`)
2. Current working directory `.env`
3. Repository package root `.env`
4. User profile home enclave `~/.alias-ai/.env`

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | - | Cloud LLM API key (NVIDIA `nvapi-...` or OpenAI `sk-...`) |
| `UPSTREAM_URL` | `https://api.openai.com` | Upstream provider URL |
| `ALIAS_PORT` | `8080` | Default listening port |
| `ALIAS_MODEL` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | Default target model |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Endpoint for local Gemma 2 Ollama daemon |
| `OLLAMA_MODEL` | `gemma2:2b` | Target local neural extraction model |
| `REHYDRATE` | `false` | Enable/disable client-side token restoration |

---

## 🔍 Diagnostic Commands

### `alias-ai doctor`
Verifies your local environment for airgap readiness:
- Node.js runtime version (>= 18.0.0 required)
- Port `8080` availability
- Ollama daemon connection status (`http://127.0.0.1:11434`)
- Google Gemma 2 model presence (`gemma2:2b`)
- End-to-end regex classifier latency benchmark (typically < 0.5ms)

### `alias-ai test`
Performs an automated self-test across 5 synthetic test cases containing:
1. German IBANs (SEPA compliance)
2. ISO 3779 Vehicle Identification Numbers (VIN)
3. OpenAI & Cloud API Keys (`sk-...`, `AKIA...`)
4. PostgreSQL / MySQL connection strings with plaintext passwords
5. European personal names and addresses

Asserts that $E_{leak} \equiv 0.00\%$ across all test payloads.
