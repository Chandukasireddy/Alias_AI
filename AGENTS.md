# 🤖 AGENTS.md — Autonomous Agent Directives & Privacy Ladder

> **Standard for Autonomous AI Coding Agents** (Cursor, Windsurf, Claude Code, Copilot, Cline, Aider)  
> Operating with **Alias AI: Zero-Knowledge Privacy Airgap Gateway**.

---

## 🔒 1. Core Principle: Zero-Knowledge Network Airgap

When operating in this codebase or utilizing LLM APIs via **Alias AI**:
1. **Never Transmit Raw Credentials:** Plaintext secrets (VINs, German IBANs, OpenAI/NVIDIA API keys, DB connection strings, AWS tokens) must **never** reach the cloud unmasked.
2. **Local Interception:** All upstream LLM interactions must be routed through the local transparent proxy:
   ```bash
   export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
   ```
3. **Respect Typed Placeholders:** In code transformations, diffs, and generated artifacts, treat all `<ALIAS_*>` tokens (e.g., `<ALIAS_VIN_1>`, `<ALIAS_DB_URI_1>`, `<ALIAS_APIKEY_1>`) as immutable semantic variables. Never attempt to guess, brute-force, or substitute random dummy secrets into these placeholders.

---

## 🪜 2. The 5-Level Privacy Reduction Ladder

Agents must adhere to the **Privacy Reduction Ladder** when preparing code snippets, logs, or debugging prompts:

| Level | Enclave / Stage | Content Transferred | Leakage Risk | Description |
|---|---|---|---|---|
| **Level 0** | Local Disk / RAM | Raw code + sensitive credentials | 0% (Local) | Operator workstation only. Secrets never leave memory. |
| **Level 1** | Local Sanitizer | Typed placeholders (`<ALIAS_*>`) | 0.00% | Gemma 2 / deterministic regex extracts secrets into local vault. |
| **Level 2** | Egress Gate | Sanitized payload | 0.00% | Egress firewall validates 0.00% private entropy before outbound TLS. |
| **Level 3** | Cloud LLM | Anonymized AST & placeholders | 0.00% | Frontier reasoning (NVIDIA Nemotron-70B / OpenAI) computes solution. |
| **Level 4** | Inbound Stream | Placeholders (or Local Re-hydrate) | 0.00% | Default: Pass-through streaming with placeholders. Optional: `-r` re-hydrates. |

---

## ⚙️ 3. Agent Tooling & Configuration

### For Cursor IDE Users
Configure `.cursor/settings.json` or Model Settings:
```json
{
  "openai.baseUrl": "http://127.0.0.1:8080/v1",
  "openai.apiKey": "alias-local-token"
}
```

### For Claude Code / Terminal Agents
```bash
# Launch Alias AI in background or separate tab:
npx alias-ai start

# Route agent traffic through the local airgap:
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
export OPENAI_API_KEY="sk-..."
```

### For Python / LangChain / LlamaIndex
```python
from openai import OpenAI

# Automatically sanitizes all prompts before sending to cloud
client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="your-api-key"
)
```

---

## 🛡️ 4. Compliance & Audit Verification
Alias AI automatically enforces:
- **GDPR Article 25:** Privacy by Design & Default (data minimization).
- **EU AI Act Article 14:** Human Oversight & Technical Airgap Governance.
- **Mathematical Attestation:** 0.00% cloud private entropy leakage.
