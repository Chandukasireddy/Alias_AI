import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VaultEntry {
  id: string;
  type: string;
  original: string;
  alias: string;
}

interface Scenario {
  id: string;
  title: string;
  icon: string;
  category: string;
  prompt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Navigation
  activeTab = signal<'cursor' | 'python' | 'langchain' | 'terminal'>('cursor');
  copiedInstall = signal<boolean>(false);
  copiedSnippet = signal<boolean>(false);

  readonly cursorSnippet = `# 1. Start Alias AI local proxy:
$ npx alias-ai start

# 2. In Cursor Settings -> Models -> OpenAI API:
# Toggle "Override OpenAI Base URL" and enter:
http://127.0.0.1:8080/v1

# Cursor now routes all requests through your sovereign local airgap!`;

  readonly pythonSnippet = `from openai import OpenAI

# Point base_url to local proxy
client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="local-proxy"
)

# Secrets are stripped before leaving your machine
response = client.chat.completions.create(
    model="meta/llama-3.1-nemotron-70b-instruct",
    messages=[{"role": "user", "content": "Analyze VIN WDB2110761A123456"}]
)
print(response.choices[0].message.content)`;

  readonly langchainSnippet = `from langchain_openai import ChatOpenAI

# Point LangChain to Alias AI local airgap
llm = ChatOpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="local-proxy",
    model="meta/llama-3.1-nemotron-70b-instruct"
)

response = llm.invoke("Evaluate German IBAN DE89 3704 0044 0532 0130 00")
print(response.content)`;

  readonly terminalSnippet = `# Set environment variable in your terminal
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"

# Any CLI tool or curl automatically routes through Alias AI
curl $OPENAI_BASE_URL/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nvidia/nemotron-70b",
    "messages": [{"role": "user", "content": "Database secret postgres://admin:Secr3t@10.0.4.15"}]
  }'`;

  // Scenarios
  readonly scenarios: Scenario[] = [
    {
      id: 'automotive',
      title: 'Mercedes-Benz Telematics & Battery DTC',
      icon: '🚗',
      category: 'Industrial IoT & Automotive (ISO 26262)',
      prompt: `Diagnostic Report for Mercedes-Benz Mobility:\nChassis VIN: WDB2110761A123456\nAssembly Plant: Factory 56 (Sindelfingen)\nEngineer: Dr. Heinrich Weber\nCAN-Bus DTC Code: P0A80 (High Voltage Battery Pack Anomaly)\nNotes: Module #4 cell fluctuating at 3.12V vs 3.85V nominal.\nRequest: Analyze root cause and provide repair checklist.`
    },
    {
      id: 'banking',
      title: 'High-Value SEPA Wire Settlement & AML',
      icon: '🏦',
      category: 'Financial Services & Banking (GDPR Art. 25)',
      prompt: `Wire Risk Evaluation:\nOrigin Account (Deutsche Bank): DE89 3704 0044 0532 0130 00\nAccount Holder: Alexander Müller\nBeneficiary Phone: +49 171 8923451\nAmount: €482,000.00 to offshore supplier\nRequest: Evaluate anti-money laundering indicators and clearance compliance.`
    },
    {
      id: 'devops',
      title: 'GKE Cloud Script with Hardcoded Credentials',
      icon: '☁️',
      category: 'Cloud Infrastructure & DevOps',
      prompt: `DevOps Incident for Project Sovereign:\nAuthor: Sarah Jenkins\nInternal Subnet: 10.0.4.15\nStaging API Key: sk-live-9941a8f912c0048e8912bc\nDB URI: postgres://admin:Secr3tP@ssw0rd@10.0.4.15:5432/fleet_db\nIssue: GKE microservice connection timeout.\nRequest: Refactor to Google Secret Manager and write safe Kubernetes deployment spec.`
    }
  ];

  selectedScenarioId = signal<string>('automotive');
  customInput = signal<string>('');
  isProcessing = signal<boolean>(false);
  rehydrateEnabled = signal<boolean>(false); // Dehydration / Placeholder is default!
  streamTokens = signal<number>(0);

  // Computed extracted entities (Runs 100% client-side for zero latency)
  vaultEntries = computed<VaultEntry[]>(() => {
    const text = this.customInput();
    if (!text) return [];

    const entries: VaultEntry[] = [];
    let count = 1;

    // 1. VIN Numbers (ISO 3779 17-char)
    const vinMatches = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/g);
    if (vinMatches) {
      for (const vin of Array.from(new Set(vinMatches))) {
        entries.push({ id: `vin-${count}`, type: 'VEHICLE_VIN', original: vin, alias: `<ALIAS_VIN_${count}>` });
        count++;
      }
    }

    // 2. German IBAN
    const ibanMatches = text.match(/\b(DE\d{2}[\s]?(?:\d{4}[\s]?){4}\d{2})\b/g);
    if (ibanMatches) {
      for (const iban of Array.from(new Set(ibanMatches))) {
        entries.push({ id: `iban-${count}`, type: 'GERMAN_IBAN', original: iban, alias: `<ALIAS_IBAN_${count}>` });
        count++;
      }
    }

    // 3. API Keys
    const apiKeyMatches = text.match(/\b(sk-[a-zA-Z0-9\-_]{20,})\b/g);
    if (apiKeyMatches) {
      for (const key of Array.from(new Set(apiKeyMatches))) {
        entries.push({ id: `api-${count}`, type: 'API_KEY', original: key, alias: `<ALIAS_API_KEY_${count}>` });
        count++;
      }
    }

    // 4. DB Connection URIs
    const uriMatches = text.match(/\b(postgres(?:ql)?:\/\/[^\s]+)\b/g);
    if (uriMatches) {
      for (const uri of Array.from(new Set(uriMatches))) {
        entries.push({ id: `db-${count}`, type: 'DB_CONNECTION', original: uri, alias: `<ALIAS_DB_URI_${count}>` });
        count++;
      }
    }

    // 5. Internal IPv4
    const ipMatches = text.match(/\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g);
    if (ipMatches) {
      for (const ip of Array.from(new Set(ipMatches))) {
        entries.push({ id: `ip-${count}`, type: 'INTERNAL_IP', original: ip, alias: `<ALIAS_INTERNAL_IP_${count}>` });
        count++;
      }
    }

    // 6. German Names (Dr. Heinrich Weber, Alexander Müller, Sarah Jenkins)
    const nameMatches = text.match(/\b(Dr\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+|Alexander\s+Müller|Sarah\s+Jenkins)\b/g);
    if (nameMatches) {
      for (const name of Array.from(new Set(nameMatches))) {
        entries.push({ id: `name-${count}`, type: 'PERSON_NAME', original: name, alias: `<ALIAS_PERSON_${count}>` });
        count++;
      }
    }

    return entries;
  });

  // Sanitized wire payload (What cloud model receives)
  anonymizedWirePayload = computed<string>(() => {
    let text = this.customInput();
    for (const item of this.vaultEntries()) {
      text = text.replaceAll(item.original, item.alias);
    }
    return text;
  });

  // Simulated Cloud Response
  simulatedResponse = signal<string>('');

  ngOnInit() {
    this.selectScenario(this.scenarios[0].id);
  }

  selectScenario(id: string) {
    this.selectedScenarioId.set(id);
    const sc = this.scenarios.find(s => s.id === id);
    if (sc) {
      this.customInput.set(sc.prompt);
      this.simulatedResponse.set('');
    }
  }

  toggleRehydration() {
    this.rehydrateEnabled.update(v => !v);
  }

  runSimulation() {
    this.isProcessing.set(true);
    this.simulatedResponse.set('');
    this.streamTokens.set(0);

    // Generate output with aliases
    let template = '';
    const id = this.selectedScenarioId();

    if (id === 'automotive') {
      template = `### High-Voltage Diagnostics Report (Nemotron-70B on GKE)\n\n1. Target Unit: <ALIAS_VIN_1>\n2. Plant: Factory 56 | Diagnostics Lead: <ALIAS_PERSON_1>\n3. Root Cause Analysis: Cell differential on Module #4 (3.12V vs 3.85V) confirms high internal impedance under CAN DTC P0A80.\n4. Remediation: Isolate HV bus contactors; replace cell group #4; verify torque to 8.5 Nm (ISO 26262).\n\nStatus: Analysis completed without exposing vehicle VIN or engineer identity.`;
    } else if (id === 'banking') {
      template = `### SEPA Transaction Clearance Audit (Nemotron-70B on GKE)\n\n1. Sender Account: <ALIAS_IBAN_1>\n2. Account Holder: <ALIAS_PERSON_1>\n3. AML Evaluation: Transaction value €482,000.00 exceeds standard threshold. Beneficiary offshore routing requires enhanced due diligence.\n4. Verdict: Hold settlement until secondary KYC authorization.\n\nStatus: Clearance evaluated under GDPR Article 25 without cloud PII exposure.`;
    } else {
      template = `### GKE Cloud Secret Remediation (Nemotron-70B on GKE)\n\n1. Flagged Credential: <ALIAS_API_KEY_1>\n2. Flagged Database: <ALIAS_DB_URI_1>\n3. Remediation Step: Extract credentials from Kubernetes manifest and mount via Google Cloud Secret Manager.\n4. Network Hardening: Apply NetworkPolicy to restrict subnet <ALIAS_INTERNAL_IP_1>.\n\nStatus: Secure deployment generated with zero credentials leaked to cloud.`;
    }

    // Apply or withhold re-hydration
    if (this.rehydrateEnabled()) {
      for (const item of this.vaultEntries()) {
        template = template.replaceAll(item.alias, item.original);
      }
    }

    // Stream simulation
    const words = template.split(' ');
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        this.simulatedResponse.update(curr => curr + (currentIdx > 0 ? ' ' : '') + words[currentIdx]);
        this.streamTokens.update(c => c + 1);
        currentIdx++;
      } else {
        clearInterval(interval);
        this.isProcessing.set(false);
      }
    }, 25);
  }

  copyInstallCommand() {
    navigator.clipboard.writeText('npx alias-ai start');
    this.copiedInstall.set(true);
    setTimeout(() => this.copiedInstall.set(false), 2000);
  }

  copySnippet(code: string) {
    navigator.clipboard.writeText(code);
    this.copiedSnippet.set(true);
    setTimeout(() => this.copiedSnippet.set(false), 2000);
  }

  scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}