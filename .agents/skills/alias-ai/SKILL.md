---
name: alias-ai
description: Zero-Knowledge Privacy Airgap Gateway. Use to sanitize code, telemetry, VINs, IBANs, and API credentials before cloud transmission, check airgap status, and manage the local Gemma 2 proxy.
---

# Alias AI — Antigravity Skill & Privacy Airgap Directive

This skill equips Antigravity (`agy`) with direct commands and procedures to manage and utilize the **Alias AI Zero-Knowledge Privacy Airgap Gateway**.

---

## 🔒 1. Core Directives

1. **Zero-Knowledge Principle:** Plaintext secrets (automotive VINs, German IBANs, OpenAI/NVIDIA API keys, DB credentials) must never be transmitted in prompts unmasked.
2. **Immutable Placeholders:** Treat all `<ALIAS_*>` tokens (e.g. `<ALIAS_VIN_1>`, `<ALIAS_DB_URI_1>`, `<ALIAS_APIKEY_1>`) as immutable semantic variables. Never guess or overwrite them with dummy values.
3. **Local Route:** The local transparent proxy gateway runs on `http://127.0.0.1:8080/v1`.

---

## 🛠️ 2. Gateway CLI Commands

Run these commands in PowerShell or via `run_command`:

| Command | Action |
|---|---|
| `alias-ai doctor` | Verify Node.js, port 8080, Ollama service, and Google Gemma 2 model |
| `alias-ai test` | Execute automated airgap test verifying 0.00% private entropy leakage |
| `alias-ai start` | Launch the local transparent proxy gateway on `127.0.0.1:8080` |
| `alias-ai start -r` | Launch with local response re-hydration enabled |
| `alias-ai config` | Display copy-paste integration configs for Cursor, Python, and shell |

---

## 🐍 3. Antigravity Python SDK (`agpy`) Integration

When writing Python agent scripts with the Antigravity Python SDK or OpenAI client:

```python
import os
from openai import OpenAI

# Route all agent traffic through the local airgap gateway
client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key=os.getenv("OPENAI_API_KEY", "alias-local-token")
)

# Prompts are automatically scanned and sanitized before hitting the cloud
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze telematics for VIN WDB2040011A123456"}]
)
print(response.choices[0].message.content)
```

---

## 🪜 4. The 5-Level Privacy Reduction Ladder

- **Level 0 (Local Disk/RAM):** Raw code with secrets (operator machine only).
- **Level 1 (Local Sanitizer):** Gemma 2 + regex substitutes secrets with `<ALIAS_*>`.
- **Level 2 (Egress Gate):** Validates 0.00% private entropy leakage.
- **Level 3 (Cloud LLM):** Frontier cloud model reasons on anonymized AST and placeholders.
- **Level 4 (Inbound Stream):** Placeholders streamed natively (or re-hydrated with `-r`).

