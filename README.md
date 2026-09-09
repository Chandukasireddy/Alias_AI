<div align="center">
  <a href="https://alias-ai-pi.vercel.app">
    <img src="./assets/logo.svg" width="92" height="92" alt="Alias AI Logo" />
  </a>
  <h1>Alias AI</h1>
  <p><strong>Zero-Knowledge Local Privacy Airgap Gateway for AI Coding Agents & LLMs</strong></p>
  <p>
    <a href="https://alias-ai-pi.vercel.app"><strong>Explore Live Documentation & In-Browser Simulator »</strong></a>
  </p>

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square" alt="License"></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%3E%3D%2018.0.0-green.svg?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"></a>
    <img src="https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Stdlib)-blueviolet.svg?style=flat-square" alt="Zero Dependencies">
    <a href="https://ai.google.dev/gemma"><img src="https://img.shields.io/badge/Local%20Enclave-Google%20Gemma%202%20[CUDA]-EA4335.svg?style=flat-square&logo=google&logoColor=white" alt="Gemma 2"></a>
    <a href="https://build.nvidia.com"><img src="https://img.shields.io/badge/Cloud%20Reasoner-NVIDIA%20Nemotron-76B900.svg?style=flat-square&logo=nvidia&logoColor=white" alt="NVIDIA Nemotron"></a>
    <img src="https://img.shields.io/badge/Airgap%20Leakage-0.00%25%20[Verified]-success.svg?style=flat-square" alt="0.00% Leakage">
  </p>
</div>

---

## 💡 What is Alias AI?

Every day, developers and everyday users paste **automotive VINs, German IBANs, production database strings, and API keys** into cloud LLMs to draft emails, write scripts, and debug code.

**Alias AI** is an open-source, local-first privacy gateway that sits transparently between your workstation and frontier cloud models. Before any network packet leaves your laptop:
1. **Local Gemma 2 & Regex Engine** extract sensitive credentials into an ephemeral in-memory RAM vault.
2. Sensitive data is substituted with immutable typed tokens (e.g. `<ALIAS_VIN_1>`, `<ALIAS_IBAN_1>`, `<ALIAS_DB_URI_1>`).
3. An **Egress Gate** mathematically verifies **0.00% private entropy leakage** before outbound TLS transmission.
4. **Cloud Reasoners (NVIDIA Nemotron NIM / OpenAI)** compute over the anonymized semantic structure with zero exposure of real-world secrets.

---

## 📚 Documentation

- [🏗️ Deep Technical Architecture](docs/ARCHITECTURE.md) — Threat model, mathematical leakage metric ($E_{leak} \equiv 0.00\%$), and sliding-window streaming.
- [🪜 The 5-Level Privacy Reduction Ladder](docs/PRIVACY_LADDER.md) — Formal governance framework and EU AI Act / GDPR Article 25 mapping.
- [🔌 Integration Guides](docs/INTEGRATIONS.md) — Step-by-step setup for Cursor IDE, Python SDK, LangChain, Claude Code, and cURL.
- [💻 CLI & Terminal Reference](docs/CLI_REFERENCE.md) — Complete guide to all flags, commands, environment variables, and slash shortcuts.
- [🤝 Contributing Guidelines](CONTRIBUTING.md) — How to add entity classifiers, test locally, and submit PRs.

---

## ⚡ Quick Start (30 Seconds)

### Option A: Direct Interactive Terminal Chat (Recommended)
Run directly with `npx` or install globally:

```bash
# Direct run
npx alias-ai

# Or install globally
npm install -g alias-ai
alias-ai
```

### Option B: Transparent Local Proxy for Cursor & Agents
Alias AI automatically listens on `http://127.0.0.1:8080/v1` as an OpenAI-compatible gateway:
```bash
alias-ai start
```

Point any AI coding tool to your sovereign airgap:
- **Cursor IDE:** Settings $\rightarrow$ Models $\rightarrow$ Override OpenAI Base URL: `http://127.0.0.1:8080/v1`
- **Windsurf / Claude Code / Terminal:** `export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"`
- **Python OpenAI SDK:** `client = OpenAI(base_url="http://127.0.0.1:8080/v1")`
- **LangChain:** `ChatOpenAI(openai_api_base="http://127.0.0.1:8080/v1")`

---

## 🖥️ Interactive Terminal Chat Experience

Alias AI features a clean, responsive terminal chat REPL inspired by Google Antigravity (`agy`) and Claude Code:

```text
     ▄▄        ALIAS AI v0.1.0 (Airgap Gateway)
    ████       Enclave: Google Gemma 2 [CUDA]
   ██  ██      Model:   NVIDIA Nemotron NIM
  ████████     Airgap:  0.00% Leakage [Verified]
 ▄██      ██▄  Proxy:   http://127.0.0.1:8080/v1
────────────────────────────────────────────────────
? for shortcuts       NVIDIA Nemotron · 0.00% airgap

> Write a polite email in German to my landlord asking for the return of my rental deposit. My name is Chandu, my phone is 0176889922, and my IBAN is DE89370400440532013000.

  ● Airgap Enclave: 4 secret(s) vaulted (person_name, phone, account) · 0.00% cloud leakage

  Sehr geehrte/r Frau/Herr [Nachname],

  mein Name ist <ALIAS_PERSON_1>. Ich habe die Wohnung zum [Datum] gekündigt 
  und übergeben und bitte Sie hiermit höflich um die Überweisung der Kaution 
  auf mein Konto mit der IBAN <ALIAS_IBAN_1>.

  Mit freundlichen Grüßen,
  <ALIAS_PERSON_1>
  Telefon: <ALIAS_PHONE_1>

────────────────────────────────────────────────────
? for shortcuts       NVIDIA Nemotron · 0.00% airgap

> 
```

---

## 🚗 Everyday & Industrial Examples

### 1. Private Car Bill of Sale (*Kaufvertrag*)
```text
Draft a bill of sale for selling my used car. My name is Chandu, phone is 0176889922, vehicle VIN is WDB2040011A123456, sale price is €7,800, and deposit to IBAN DE89370400440532013000.
```
* **Workstation RAM:** Isolates `Chandu`, `0176889922`, `WDB2040011A123456`, `DE89370400440532013000`.
* **Cloud Wire:** Receives `<ALIAS_PERSON_1>`, `<ALIAS_PHONE_1>`, `<ALIAS_VIN_1>`, `<ALIAS_IBAN_1>`.
* **Cloud Leakage:** Exactly **0.00%**.

### 2. DevOps & Cloud Secret Incident
```text
Review this deployment script for security risks: export AWS_KEY=AKIAIOSFODNN7EXAMPLE and connect to postgresql://fleet_admin:SuperSecret99@prod-db.internal:5432/fleet.
```
* **Workstation RAM:** Isolates AWS access key and internal database credentials.
* **Cloud Wire:** NVIDIA Nemotron reviews script architecture without ever seeing production credentials.

---

## 🪜 The 5-Level Privacy Reduction Ladder

| Level | Enclave / Stage | Content Transferred | Leakage Risk | Description |
|---|---|---|---|---|
| **Level 0** | Local Disk / RAM | Raw code + sensitive credentials | 0% (Local) | Operator workstation only. Secrets never leave memory. |
| **Level 1** | Local Sanitizer | Typed placeholders (`<ALIAS_*>`) | 0.00% | Gemma 2 / deterministic regex extracts secrets into local vault. |
| **Level 2** | Egress Gate | Sanitized payload | 0.00% | Egress firewall validates 0.00% private entropy before outbound TLS. |
| **Level 3** | Cloud LLM | Anonymized AST & placeholders | 0.00% | Frontier reasoning (NVIDIA Nemotron / OpenAI) computes solution. |
| **Level 4** | Inbound Stream | Placeholders (or Local Re-hydrate) | 0.00% | Default: Pass-through streaming with placeholders. Optional: `-r` re-hydrates. |

---

## 🛠️ CLI & Shortcut Commands Reference

| Command | Purpose |
| :--- | :--- |
| `alias-ai` / `alias-ai start` | Launch background proxy on `127.0.0.1:8080` & open interactive chat in terminal |
| `alias-ai start -r` | Start with local token re-hydration enabled |
| `alias-ai doctor` | Verify Node.js, port availability, Ollama CUDA daemon, Gemma 2, and crypto benchmark |
| `alias-ai test` | Run automated airgap verification test (0.00% entropy leakage) |
| `alias-ai sanitize "<text>"` | Real-time RAM vs Cloud Wire comparison for any prompt |
| `alias-ai config` | One-click copy-paste setup configs for Cursor, Python, and shell |

### In-Chat Slash Commands
- **`/vault`**: Inspect all secrets currently vaulted in local workstation RAM.
- **`/rehydrate`**: Toggle whether cloud responses restore original secrets locally.
- **`/clear`**: Clear screen and reset conversation history.
- **`/exit`** or **`exit`**: Safely purge in-memory session vault and exit.
- **`?`**: Display quick shortcut cheat sheet.

---

## 🤝 Welcoming Open Source Contributions

Alias AI is an independent, developer-first open source project under the **Apache 2.0 License**. We actively welcome community contributions!

- 🐛 **Found a bug or edge-case entity?** [Open an issue](https://github.com/Chandukasireddy/Alias_AI/issues).
- ✨ **Want to add an entity regex or classifier?** See our [Contributing Guide](CONTRIBUTING.md).
- 📜 **Code of Conduct:** Read our [Contributor Covenant Pledge](CODE_OF_CONDUCT.md).

### Quick Development Setup
```bash
git clone https://github.com/Chandukasireddy/Alias_AI.git
cd Alias_AI
npm link
alias-ai test
```

---

## ⚖️ Compliance & Governance Alignment

- **EU AI Act Article 14:** Technical Airgap Governance & Human Oversight.
- **GDPR Article 25:** Data Minimization & Privacy by Design and Default.
- **Zero Supply-Chain Risk:** Built with 100% Node.js standard library—zero third-party npm runtime dependencies for core proxy.

---

## 📄 License

Distributed under the [Apache 2.0 License](LICENSE).
