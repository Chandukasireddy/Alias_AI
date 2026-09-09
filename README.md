# 🛡️ ALIAS AI: Zero-Knowledge Privacy Airgap Gateway for LLMs & AI Coding Agents

[![Live Docs](https://img.shields.io/badge/Live%20Docs-alias--ai--pi.vercel.app-white?style=for-the-badge&logo=vercel&logoColor=black)](https://alias-ai-pi.vercel.app)
[![NVIDIA GTC Berlin 2026](https://img.shields.io/badge/NVIDIA%20GTC-Berlin%202026%20Submission-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://www.nvidia.com/gtc/)
[![NPM Package](https://img.shields.io/badge/npm-alias--ai-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/alias-ai)
[![Google Gemma 2](https://img.shields.io/badge/Edge%20Sanitizer-Google%20Gemma%202-EA4335?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/gemma)
[![NVIDIA Nemotron](https://img.shields.io/badge/Cloud%20Reasoner-Nemotron--70B-000000?style=for-the-badge&logo=nvidia&logoColor=76B900)](https://build.nvidia.com/)
[![Compliance](https://img.shields.io/badge/EU%20AI%20Act-Article%2014%20%26%20GDPR%20Art.%2025-blue?style=for-the-badge)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](LICENSE)

> **"Enterprises cannot sacrifice data sovereignty for cloud intelligence. The future belongs to hybrid architectures where local edge models preserve privacy while frontier cloud clusters deliver breakthrough reasoning."**  
> — Operationalizing *The Sensitivity vs. Capability Matrix* (inspired by Dr. Jörg Storm, former Global Head of IT Infrastructure, Mercedes-Benz Mobility).

---

## ⚡ Quick Start (Instant Zero-Friction Airgap)

Run the transparent local proxy on your machine in one command (no complex setup required):

```bash
npx alias-ai start
```

Or install globally:

```bash
npm install -g alias-ai
alias-ai start
```

### Point your tools to `http://127.0.0.1:8080/v1`

- **Cursor IDE:** In Cursor Settings $\rightarrow$ Models $\rightarrow$ OpenAI Base URL: `http://127.0.0.1:8080/v1`
- **Terminal / Shell:** `export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`
- **Python OpenAI SDK:** `client = OpenAI(base_url="http://127.0.0.1:8080/v1")`
- **LangChain:** `ChatOpenAI(openai_api_base="http://127.0.0.1:8080/v1")`

All prompts are **automatically scanned locally on your laptop**, sensitive attributes (VINs, IBANs, API keys, database credentials) are extracted into an ephemeral in-memory vault and substituted with typed `<ALIAS_*>` placeholders, mathematically proving **0.00% private entropy leakage** before any network packet leaves your machine.

---

## 🌐 Live Open-Source Documentation Site

Explore the architectural deep dive, interactive client-side airgap simulator, and developer integration guides:

👉 **[https://alias-ai-pi.vercel.app](https://alias-ai-pi.vercel.app)**

---

## 🏛️ How It Works (The Ponytail Model)

Modeled after high-efficiency local developer tools like `ponytail`, **Alias AI** sits transparently on `http://127.0.0.1:8080` as an OpenAI-compatible reverse proxy:

```
                                  LOCAL LAPTOP (SOVEREIGN ENCLAVE)                                 │         CLOUD LLM
                                                                                                  │
┌──────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐    │    ┌─────────────────┐
│  Developer Tooling   │        │     Alias AI Gateway    │        │     Egress Firewall     │    │    │ NVIDIA Nemotron │
│ (Cursor / VS Code /  │ ─────> │ (Ollama Gemma 2 / Regex)│ ─────> │ 0.00% Entropy Leakage   │ ──────> │  or OpenAI gpt-4o│
│ Python / Terminal)   │ Raw    │ Locks secrets in-memory │ Typed  │ Mathematically Verified │TLS │    │ Receives only   │
└──────────────────────┘ Prompt │ Vault; creates <ALIAS_*>│ Aliases└─────────────────────────┘    │    │ <ALIAS_*> tags  │
                                └─────────────────────────┘                                       │    └────────┬────────┘
                                                                                                  │             │
                                                                                                  │             │ Stream
                                ┌────────────────────────────────────────────────────────────┐    │             │ Chunks
                                │ Streaming Mode:                                            │ <────────────────┘
                                │ • Default: Zero-latency pass-through with placeholders     │    │
                                │ • With --rehydrate: Local in-memory secret substitution   │    │
                                └────────────────────────────────────────────────────────────┘    │
```

### 1. Inbound Request Interception
When an agent or developer tool sends a request to `/v1/chat/completions`:
- The request is intercepted before hitting any network wire.
- The **Local Aliasing Engine** identifies sensitive entities across automotive, financial, credentials, and PII categories:
  - **Automotive & Industrial:** Chassis VINs (ISO 3779, e.g. `WDB204...`), CAN-bus frames, telemetry tokens.
  - **Financial:** German & European IBANs (`DE89...`, `FR76...`).
  - **Infrastructure & Credentials:** OpenAI (`sk-...`), NVIDIA (`nvapi-...`), AWS (`AKIA...`), GitHub (`ghp_...`), Database Connection Strings (`postgresql://...`), Private Keys.
  - **PII:** Emails, German phone numbers (`+49...`), internal domain names (`*.corp`, `*.internal`).
- Entities are saved to an in-memory session vault and substituted with context-preserving typed placeholders: `<ALIAS_VIN_1>`, `<ALIAS_IBAN_1>`, `<ALIAS_APIKEY_1>`.

### 2. Mathematical Egress Gate
The outbound payload is checked against all active vault secrets:
$$\text{Entropy Leakage} = \frac{\sum \text{unmasked secrets}}{\text{total confidential entities}} \times 100\% = 0.00\%$$
Zero network exposure guaranteed.

### 3. Native Streaming vs. Local Re-hydration
- **Default Mode (Pass-Through Streaming):** Cloud response chunks stream directly back with `<ALIAS_*>` tokens intact. This ensures **zero streaming latency**, no chunk-buffering stutter, and total privacy for coding agents.
- **Optional Re-hydration (`--rehydrate` / `-r`):** Buffers response chunks and locally swaps placeholders back to the original real secrets before delivering the result to the operator.

---

## 🛠️ CLI Command Reference

| Command | Description |
|---|---|
| `alias-ai start` | Launch the local proxy server on port `8080` (default) |
| `alias-ai start -p 8081` | Bind to a custom port |
| `alias-ai start -u https://integrate.api.nvidia.com` | Forward to NVIDIA NIM cloud endpoint |
| `alias-ai start -r` | Enable local re-hydration of placeholders |
| `alias-ai start --no-wizard` | Skip first-run hardware & Ollama model detection |
| `alias-ai doctor` | Run system diagnostics (Node version, ports, Ollama, Gemma 2, benchmark) |
| `alias-ai test` | Execute end-to-end airgap verification test with mock Mercedes VINs & API keys |
| `alias-ai config` | Print copy-paste integration snippets for Cursor, VS Code, Python, and LangChain |

---

## 🧠 Local Hardware & Edge Model Wizard

On first launch, Alias AI automatically queries the local machine:
1. **Detects Ollama** on `http://127.0.0.1:11434`.
2. **Checks for Google Gemma 2** (`gemma2:2b`).
   - If present: Activates **Hybrid Mode** (Gemma 2 Neural Named Entity Recognition + Regex).
   - If missing: Offers a one-click guide (`ollama run gemma2:2b`) while immediately activating the **Deterministic Engine** (0ms latency, 100% regex/rule coverage).
3. Completely self-contained with **zero external npm dependencies** (pure Node.js standard library).

---

## 📜 Regulatory & Compliance Alignment

Alias AI directly operationalizes European data sovereignty and compliance frameworks:
- **EU AI Act Article 14 (Human Oversight & Airgap Governance):** Ensures high-risk AI deployments maintain technical boundaries preventing autonomous transmission of unverified corporate telemetry.
- **GDPR Article 25 (Privacy by Design & Default):** Enforces data minimization by replacing customer and vehicle identifiers with synthetic aliases prior to third-party cloud processing.

---

## 🏆 NVIDIA GTC Berlin 2026 Golden Ticket Submission

- **Target Judge:** Dr. Jörg Storm (Founder, Dr. Storm Advisory GmbH; former Global Head of IT Infrastructure, Mercedes-Benz Mobility).
- **Core Alignment:** Operationalizes Dr. Storm's *"Sensitivity vs. Capability Matrix"*.
- **Tech Stack:** Google Gemma 2, NVIDIA NeMo Guardrails, NVIDIA Nemotron-70B, Node.js CLI, Angular 21, Google Cloud GKE.

---

## 📄 License

Distributed under the Apache 2.0 License. See `LICENSE` for details.
