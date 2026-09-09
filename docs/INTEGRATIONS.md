# 🔌 Alias AI — Integration Guides

Alias AI speaks the standard OpenAI API protocol over HTTP (`http://127.0.0.1:8080/v1`). It acts as a drop-in replacement for `https://api.openai.com` in any tool, library, or autonomous agent.

---

## 💻 1. Cursor IDE

In Cursor:
1. Open **Cursor Settings** (`Ctrl+,` or `Cmd+,`).
2. Navigate to **Models** $\rightarrow$ **OpenAI API**.
3. Toggle on **Override OpenAI Base URL**.
4. Set the Base URL to:
   ```
   http://127.0.0.1:8080/v1
   ```
5. Enter any placeholder or your local token in **API Key** (e.g. `alias-local-token`).
6. Start the gateway in your terminal:
   ```bash
   alias-ai start
   ```

Now, every prompt, inline edit (`Ctrl+K`), and agentic workflow in Cursor is automatically scrubbed by Alias AI before transmission.

---

## 🐍 2. Python (Official OpenAI SDK)

```python
from openai import OpenAI

# Direct all traffic to your sovereign local airgap
client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token"  # Real cloud key is held securely in Alias AI .env
)

# Secrets in prompts are extracted to RAM and replaced before leaving your machine
response = client.chat.completions.create(
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    messages=[
        {
            "role": "user",
            "content": "Analyze VIN WDB2110761A123456 with German IBAN DE89370400440532013000."
        }
    ]
)

print(response.choices[0].message.content)
```

---

## 🦜 3. LangChain & LlamaIndex

### LangChain
```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
)

response = llm.invoke("Evaluate German SEPA IBAN DE89 3704 0044 0532 0130 00 for settlement risk.")
print(response.content)
```

### LlamaIndex
```python
from llama_index.llms.openai import OpenAI

llm = OpenAI(
    api_base="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
)
```

---

## 🖥️ 4. Claude Code / Terminal Coding Agents

Route any terminal-based agent through Alias AI:

```bash
# Terminal 1: Launch Alias AI
alias-ai start

# Terminal 2: Export standard OpenAI environment variables
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
export OPENAI_API_KEY="alias-local-token"

# Launch your agent:
claude
# or aider, cline, etc.
```

---

## 🌐 5. cURL / Shell Scripts

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer alias-local-token" \
  -d '{
    "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "messages": [
      {"role": "user", "content": "Database secret: postgres://admin:SuperSecretPass@10.0.4.15:5432/fleet"}
    ]
  }'
```
