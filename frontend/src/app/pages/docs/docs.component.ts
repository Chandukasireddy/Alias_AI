import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

interface DocSection {
  id: string;
  title: string;
  category: string;
  description: string;
  badge?: string;
}

interface CategoryGroup {
  name: string;
  icon: string;
  sections: DocSection[];
}

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.css'
})
export class DocsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  searchQuery = signal<string>('');
  activeSection = signal<string>('overview');
  copiedMap = signal<{ [key: string]: boolean }>({});
  sidebarOpen = signal<boolean>(false);

  // Interactive Code Tabs
  langchainTab = signal<'basic' | 'lcel' | 'agent' | 'streaming'>('basic');
  agentTab = signal<'cursor' | 'claude' | 'python' | 'curl'>('cursor');

  // Code snippets repository
  readonly snippets: Record<string, string> = {
    'overview-cmd': 'npx alias-ai start',
    'qs-1': 'npx alias-ai start',
    'qs-2': `export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"\nexport OPENAI_API_KEY="alias-local-token"`,
    'qs-3': `curl http://127.0.0.1:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer alias-local-token" \\
  -d '{
    "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "messages": [{"role": "user", "content": "Analyze VIN WDB2110761A123456 with German IBAN DE89370400440532013000"}]
  }'`,
    'repl-1': 'alias-ai',
    'start-cmds': `alias-ai start\nalias-ai start --port 8081\nalias-ai start --rehydrate\nalias-ai start --no-gemma`,
    'doc-1': 'alias-ai doctor',
    'doc-2': 'alias-ai test',
    'san-1': `alias-ai sanitize "Deploy VIN WDB2110761A123456 using postgres://admin:pass@10.0.4.15:5432/db"`,
    'cfg-1': 'alias-ai config',
    'lc-basic': `from langchain_openai import ChatOpenAI

# Point LangChain directly to Alias AI sovereign local proxy
llm = ChatOpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",  # Cloud key stays safe in Alias AI
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    temperature=0.2
)

# The prompt contains private VIN and German IBAN data:
response = llm.invoke("Draft ADAC bill of sale for VIN WDB2110761A123456 and SEPA IBAN DE89 3704 0044 0532 0130 00")
print(response.content)`,
    'lc-lcel': `from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

# 1. Define prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an enterprise GDPR compliance legal counsel."),
    ("user", "Audit tenant refund request for deposit IBAN {iban} at address {address}.")
])

# 2. Configure Airgap LLM
llm = ChatOpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
)

# 3. Build LCEL Runnable Chain
chain = prompt | llm | StrOutputParser()

# 4. Invoke chain with confidential tenant data:
result = chain.invoke({
    "iban": "DE89 3704 0044 0532 0130 00",
    "address": "Hauptstraße 42, 10115 Berlin"
})
print(result)`,
    'lc-agent': `from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

@tool
def query_telemetry(chassis_vin: str) -> str:
    """Query vehicle telemetry database for a specific chassis VIN."""
    return f"Vehicle telemetry OK for VIN {chassis_vin}. Odometer: 42,100km."

tools = [query_telemetry]

llm = ChatOpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an automotive diagnostics engineer."),
    ("user", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# The agent reasons with <ALIAS_VIN_1> without cloud leakage:
executor.invoke({"input": "Check diagnostic status for VIN WDB2110761A123456"})`,
    'lc-stream': `from langchain_openai import ChatOpenAI
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

llm = ChatOpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)

llm.invoke("Review database credentials postgres://fleet:p4ss@10.0.4.15/fleet")`,
    'llama-1': `from llama_index.llms.openai import OpenAI
from llama_index.core import Settings

Settings.llm = OpenAI(
    api_base="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
)

response = Settings.llm.complete("Summarize lease contract with IBAN DE89 3704 0044 0532 0130 00")
print(response.text)`,
    'cur-url': 'http://127.0.0.1:8080/v1',
    'claude-agent': `# Terminal 1: Start Alias AI Gateway
alias-ai start

# Terminal 2: Export variables and run agent
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
export OPENAI_API_KEY="alias-local-token"

# Launch your agent:
claude`,
    'py-sdk': `from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token"
)

stream = client.chat.completions.create(
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    messages=[
        {"role": "user", "content": "Investigate host db-fleet.internal:5432 with key sk-proj-supersecretkey99"}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()`,
    'ts-sdk': `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://127.0.0.1:8080/v1',
  apiKey: 'alias-local-token',
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    messages: [
      { role: 'user', content: 'Check VIN WDB2110761A123456 warranty.' }
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();`,
    'ollama-cmd': `curl -fsSL https://ollama.com/install.sh | sh\nollama pull gemma2:2b\ncurl http://127.0.0.1:11434/api/tags`,
    'audit-json': `{\n  "timestamp": "2026-09-10T18:30:00Z",\n  "session_id": "sess_9f81a7b3c2e148",\n  "governance": {\n    "gdpr_article_25": "VERIFIED_COMPLIANT",\n    "eu_ai_act_article_14": "VERIFIED_COMPLIANT"\n  },\n  "metrics": {\n    "total_masked": 4,\n    "categories": ["AUTOMOTIVE_VIN", "GERMAN_IBAN", "API_KEY"],\n    "entropy_leakage": "0.00%",\n    "enclave_latency_ms": 0.32\n  },\n  "integrity_hash": "a8f1b2c4e6d7890abcdef1234567890abcdef1234567890abcdef1234567890"\n}`,
    'k8s-spec': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-airgap
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: my-app
          image: my-app:latest
          env:
            - name: OPENAI_BASE_URL
              value: "http://127.0.0.1:8080/v1"
            - name: OPENAI_API_KEY
              value: "alias-local-token"
        - name: alias-ai-gateway
          image: node:20-alpine
          command: ["npx", "alias-ai", "start", "--port", "8080"]
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: cloud-api-keys
                  key: nvidia-nim-key`,
    'toc-npx': 'npx alias-ai start'
  };

  // Documentation Structure
  readonly categories: CategoryGroup[] = [
    {
      name: 'Getting Started',
      icon: '🚀',
      sections: [
        { id: 'overview', title: 'What is Alias AI?', category: 'Getting Started', description: 'Zero-Knowledge local privacy airgap gateway overview & philosophy.' },
        { id: 'why-airgap', title: 'Why Airgap Gateway?', category: 'Getting Started', description: 'Why local airgap beats VPNs, cloud DLP, and manual anonymization.' },
        { id: 'quickstart', title: '30-Second Quickstart', category: 'Getting Started', description: 'Run immediately with npx or install globally.', badge: 'Fast' },
        { id: 'threat-model', title: 'Architecture & Threat Model', category: 'Getting Started', description: 'Untrusted cloud vs sovereign workstation enclave specifications.' }
      ]
    },
    {
      name: 'Core Concepts',
      icon: '🧠',
      sections: [
        { id: 'privacy-ladder', title: '5-Level Privacy Ladder', category: 'Core Concepts', description: 'Formal governance framework from L0 local RAM to L4 stream rehydration.' },
        { id: 'zero-leakage', title: 'Zero-Leakage Guarantee', category: 'Core Concepts', description: 'Mathematical invariant formula E_leak = 0.00% across outbound TLS.', badge: '0.00%' },
        { id: 'ram-vault', title: 'Ephemeral RAM Vault', category: 'Core Concepts', description: 'Bidirectional in-memory key-value mappings with zero-disk persistence.' },
        { id: 'streaming-algorithm', title: 'Sliding-Window Streaming', category: 'Core Concepts', description: 'Solving the SSE token-split problem without buffering delay.' },
        { id: 'entity-classifiers', title: 'Supported Entity Classifiers', category: 'Core Concepts', description: 'All 10+ regex and NER patterns for VINs, IBANs, credentials, and PII.' }
      ]
    },
    {
      name: 'CLI & Commands',
      icon: '💻',
      sections: [
        { id: 'cli-repl', title: 'alias-ai (Interactive REPL)', category: 'CLI & Commands', description: 'Interactive terminal chat session with Google Antigravity-style UI.' },
        { id: 'cli-start', title: 'alias-ai start (Proxy Server)', category: 'CLI & Commands', description: 'Run background OpenAI-compatible transparent proxy server.' },
        { id: 'cli-flags', title: 'Command Flags & Options', category: 'CLI & Commands', description: 'Complete reference for --port, --upstream, --rehydrate, --gemma, etc.' },
        { id: 'cli-doctor-test', title: 'Diagnostics & Self-Tests', category: 'CLI & Commands', description: 'Environment validation (doctor) and mathematical airgap proof (test).' },
        { id: 'cli-sanitize', title: 'alias-ai sanitize', category: 'CLI & Commands', description: 'Offline prompt classifier inspector comparing RAM vs wire payload.' },
        { id: 'cli-config', title: 'alias-ai config', category: 'CLI & Commands', description: 'One-click copy-paste setup configs for Cursor, Python, and shell.' },
        { id: 'slash-commands', title: 'In-Chat Slash Commands', category: 'CLI & Commands', description: 'Direct prompt shortcuts: /vault, /rehydrate, /clear, /help, /exit.' },
        { id: 'env-vars', title: 'Environment Variables', category: 'CLI & Commands', description: 'Priority resolution order and complete .env configuration variables.' }
      ]
    },
    {
      name: 'SDKs & Integrations',
      icon: '🦜',
      sections: [
        { id: 'langchain', title: 'LangChain Integration', category: 'SDKs & Integrations', description: 'Use ChatOpenAI, LCEL chains, autonomous agents, and tool calling.', badge: 'Popular' },
        { id: 'llamaindex', title: 'LlamaIndex Integration', category: 'SDKs & Integrations', description: 'Connect RAG pipelines and query engines through sovereign airgap.' },
        { id: 'cursor-ide', title: 'Cursor IDE & Copilot', category: 'SDKs & Integrations', description: 'Configure OpenAI Base URL override for AI inline edits and composer.' },
        { id: 'claude-code', title: 'Claude Code & Terminal Agents', category: 'SDKs & Integrations', description: 'Route Claude Code, Aider, and Cline agents through localhost.' },
        { id: 'python-sdk', title: 'Python (Official OpenAI SDK)', category: 'SDKs & Integrations', description: 'Drop-in client configuration with zero secret leakage.' },
        { id: 'nodejs-sdk', title: 'Node.js & TypeScript SDK', category: 'SDKs & Integrations', description: 'Using Alias AI with official OpenAI npm package and fetch.' },
        { id: 'rest-api', title: 'cURL & REST API Reference', category: 'SDKs & Integrations', description: 'Direct HTTP endpoints: /v1/chat/completions, /v1/models, /health.' }
      ]
    },
    {
      name: 'Local Enclave & Gemma 2',
      icon: '⚡',
      sections: [
        { id: 'ollama-setup', title: 'Ollama & CUDA Daemon', category: 'Local Enclave', description: 'Hardware acceleration setup for local GPU neural inference.' },
        { id: 'gemma-ner', title: 'Google Gemma 2 (2B) NER', category: 'Local Enclave', description: 'Zero-cloud deep semantic entity extraction pipeline.' },
        { id: 'hybrid-enclave', title: 'Hybrid Regex Engine (< 0.5ms)', category: 'Local Enclave', description: 'Deterministic sub-millisecond fallback when Ollama is offline.' }
      ]
    },
    {
      name: 'Governance & Audits',
      icon: '⚖️',
      sections: [
        { id: 'eu-ai-act', title: 'EU AI Act Article 14', category: 'Governance & Audits', description: 'Technical airgap governance and human oversight compliance.' },
        { id: 'gdpr-art25', title: 'GDPR Article 25 (Privacy by Design)', category: 'Governance & Audits', description: 'Mathematical data minimization and sovereign cryptographic vaults.' },
        { id: 'audit-attestation', title: 'Cryptographic Audit Attestation', category: 'Governance & Audits', description: 'SHA-256 integrity logs for enterprise GRC pipelines.' },
        { id: 'docker-k8s', title: 'Docker & Kubernetes Sidecar', category: 'Governance & Audits', description: 'Production container manifests and enterprise cloud deployment.' }
      ]
    },
    {
      name: 'Troubleshooting & FAQ',
      icon: '🛠️',
      sections: [
        { id: 'troubleshooting', title: 'Common Issues & Debugging', category: 'Troubleshooting & FAQ', description: 'Port 8080 busy, upstream API key resolution, and streaming lag.' },
        { id: 'faq', title: 'Frequently Asked Questions', category: 'Troubleshooting & FAQ', description: 'Answers to latency, model compatibility, and security questions.' }
      ]
    }
  ];

  // Flattened sections for search
  allSections = computed(() => {
    return this.categories.flatMap(c => c.sections);
  });

  // Filtered categories based on search query
  filteredCategories = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.categories;

    return this.categories
      .map(cat => ({
        ...cat,
        sections: cat.sections.filter(s =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        )
      }))
      .filter(cat => cat.sections.length > 0);
  });

  // Active section metadata
  currentSectionMeta = computed(() => {
    const active = this.activeSection();
    return this.allSections().find(s => s.id === active) || this.allSections()[0];
  });

  // Breadcrumbs
  breadcrumbs = computed(() => {
    const meta = this.currentSectionMeta();
    return ['Docs', meta.category, meta.title];
  });

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const found = this.allSections().find(s => s.id === fragment);
        if (found) {
          this.activeSection.set(fragment);
          this.scrollToElement(fragment);
        }
      }
    });
  }

  selectSection(id: string) {
    this.activeSection.set(id);
    this.sidebarOpen.set(false);
    this.router.navigate([], { fragment: id });
    this.scrollToElement(id);
  }

  scrollToElement(id: string) {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  copySnippet(key: string) {
    const code = this.snippets[key] || '';
    this.copyCode(code, key);
  }

  copyCode(code: string, key: string) {
    navigator.clipboard.writeText(code);
    this.copiedMap.update(map => ({ ...map, [key]: true }));
    setTimeout(() => {
      this.copiedMap.update(map => ({ ...map, [key]: false }));
    }, 2000);
  }

  isCopied(key: string): boolean {
    return !!this.copiedMap()[key];
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  getPreviousSection(): DocSection | null {
    const list = this.allSections();
    const idx = list.findIndex(s => s.id === this.activeSection());
    return idx > 0 ? list[idx - 1] : null;
  }

  getNextSection(): DocSection | null {
    const list = this.allSections();
    const idx = list.findIndex(s => s.id === this.activeSection());
    return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  }
}

