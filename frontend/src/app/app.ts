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
  // Navigation & Tabs
  activeTab = signal<'cursor' | 'python' | 'langchain' | 'terminal' | 'claude'>('cursor');
  activeTerminalTab = signal<'chat' | 'doctor' | 'test' | 'sanitize'>('chat');
  copiedInstall = signal<boolean>(false);
  copiedSnippet = signal<boolean>(false);

  readonly cursorSnippet = `# 1. Start Alias AI local proxy:
$ npx alias-ai start

# 2. In Cursor Settings -> Models -> OpenAI API:
# Toggle "Override OpenAI Base URL" and enter:
http://127.0.0.1:8080/v1

# Cursor now routes all prompts & agent actions through your local airgap!`;

  readonly pythonSnippet = `from openai import OpenAI

# Direct all traffic to your sovereign local airgap
client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token"
)

# Secrets are stripped into local RAM before leaving your machine
response = client.chat.completions.create(
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    messages=[
        {
            "role": "user",
            "content": "Analyze VIN WDB2110761A123456 and bank IBAN DE89370400440532013000."
        }
    ]
)
print(response.choices[0].message.content)`;

  readonly langchainSnippet = `from langchain_openai import ChatOpenAI

# Point LangChain directly to Alias AI local airgap
llm = ChatOpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="alias-local-token",
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
)

response = llm.invoke("Draft bill of sale for VIN WDB2110761A123456 and IBAN DE89 3704 0044 0532 0130 00")
print(response.content)`;

  readonly terminalSnippet = `# Set environment variable in your terminal
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
export OPENAI_API_KEY="alias-local-token"

# Any CLI tool, Python script, or cURL automatically routes through Alias AI:
curl $OPENAI_BASE_URL/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "messages": [{"role": "user", "content": "Database secret postgres://admin:Secr3t@10.0.4.15"}]
  }'`;

  readonly claudeSnippet = `# Terminal 1: Launch Alias AI in background
alias-ai start

# Terminal 2: Point Claude Code or Aider to the local airgap
export OPENAI_BASE_URL="http://127.0.0.1:8080/v1"
export OPENAI_API_KEY="alias-local-token"

claude`;

  // Realistic Consumer & Enterprise Scenarios
  readonly scenarios: Scenario[] = [
    {
      id: 'car_sale',
      title: 'Used Car Sales Contract (Kaufvertrag)',
      icon: '🚗',
      category: 'Automotive & Consumer Commerce (ISO 26262)',
      prompt: `Draft a legally binding German used car purchase agreement (ADAC Kaufvertrag):\nSeller: Alexander Müller\nSeller IBAN: DE89 3704 0044 0532 0130 00\nBuyer: Chandu Kasireddy\nVehicle VIN: WDB2110761A123456\nModel: Mercedes-Benz E 350 CDI (2018)\nPurchase Price: €14,500.00\nRequest: Validate VIN format and generate bilateral contract terms with zero cloud secret leakage.`
    },
    {
      id: 'rental_deposit',
      title: 'Apartment Deposit Return (Mietkaution)',
      icon: '🏠',
      category: 'Real Estate & Tenant Rights (GDPR Art. 25)',
      prompt: `Write a formal German email to landlord Hausverwaltung Schmidt requesting refund of my €1,500 rental deposit:\nTenant: Chandu Kasireddy\nMobile Phone: +49 176 88992211\nPrevious Address: Hauptstraße 42, 10115 Berlin\nDeposit Refund Account: DE89 3704 0044 0532 0130 00\nMove-out Date: 31.01.2026\nRequest: Demand release of escrow deposit within 14 business days according to BGB § 551.`
    },
    {
      id: 'flight_refund',
      title: 'EU261 Flight Delay Claim',
      icon: '✈️',
      category: 'Consumer Aviation & SEPA Banking',
      prompt: `Compose an EU Regulation 261/2004 flight delay compensation claim to Lufthansa:\nPassenger: Dr. Heinrich Weber\nBooking Reference: LH-948271A\nFlight: LH2042 Berlin (BER) to Munich (MUC)\nDelay: 4 hours 45 minutes\nCompensation Due: €250.00\nRemittance IBAN: DE12 5001 0517 0648 4898 90\nRequest: Generate legal claim citing CJEU Sturgeon precedent.`
    },
    {
      id: 'devops_secret',
      title: 'Cloud DevOps Security Remediation',
      icon: '🛡️',
      category: 'Cloud Infrastructure & Secret Governance',
      prompt: `DevOps Security Audit for GKE Microservice:\nAuthor: Sarah Jenkins\nInternal Subnet: 10.0.4.15\nStaging API Key: sk-live-9941a8f912c0048e8912bc\nDatabase URI: postgres://admin:Secr3tP@ssw0rd@10.0.4.15:5432/fleet_db\nIssue: Plaintext secrets embedded in Kubernetes Deployment manifest.\nRequest: Refactor to Google Secret Manager and write safe sealed secret spec.`
    }
  ];

  selectedScenarioId = signal<string>('car_sale');
  customInput = signal<string>('');
  isProcessing = signal<boolean>(false);
  rehydrateEnabled = signal<boolean>(false); // Dehydration / Placeholder is default
  streamTokens = signal<number>(0);

  // Computed extracted entities (Runs 100% client-side for zero latency)
  vaultEntries = computed<VaultEntry[]>(() => {
    const text = this.customInput();
    if (!text) return [];

    const entries: VaultEntry[] = [];
    let count = 1;

    // 1. VIN Numbers (ISO 3779 17-character)
    const vinMatches = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/g);
    if (vinMatches) {
      for (const vin of Array.from(new Set(vinMatches))) {
        entries.push({ id: `vin-${count}`, type: 'VEHICLE_VIN', original: vin, alias: `<ALIAS_VEHICLE_VIN_${count}>` });
        count++;
      }
    }

    // 2. German & EU IBANs
    const ibanMatches = text.match(/\b(DE\d{2}[\s]?(?:\d{4}[\s]?){4}\d{2})\b/g);
    if (ibanMatches) {
      for (const iban of Array.from(new Set(ibanMatches))) {
        entries.push({ id: `iban-${count}`, type: 'GERMAN_IBAN', original: iban, alias: `<ALIAS_GERMAN_IBAN_${count}>` });
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

    // 6. Phone Numbers
    const phoneMatches = text.match(/\b(\+49[\s\d\-]{8,15}|01[5-7]\d[\s\d\-]{6,10})\b/g);
    if (phoneMatches) {
      for (const phone of Array.from(new Set(phoneMatches))) {
        entries.push({ id: `phone-${count}`, type: 'PHONE_NUMBER', original: phone, alias: `<ALIAS_PHONE_${count}>` });
        count++;
      }
    }

    // 7. Addresses
    const addressMatches = text.match(/\b(Hauptstraße\s+\d+,\s+\d{5}\s+Berlin)\b/g);
    if (addressMatches) {
      for (const addr of Array.from(new Set(addressMatches))) {
        entries.push({ id: `addr-${count}`, type: 'STREET_ADDRESS', original: addr, alias: `<ALIAS_ADDRESS_${count}>` });
        count++;
      }
    }

    // 8. Organizations
    const orgMatches = text.match(/\b(Hausverwaltung\s+Schmidt)\b/g);
    if (orgMatches) {
      for (const org of Array.from(new Set(orgMatches))) {
        entries.push({ id: `org-${count}`, type: 'ORGANIZATION', original: org, alias: `<ALIAS_ORGANIZATION_${count}>` });
        count++;
      }
    }

    // 9. Booking References
    const bookMatches = text.match(/\b(LH-[A-Z0-9]{6,8})\b/g);
    if (bookMatches) {
      for (const b of Array.from(new Set(bookMatches))) {
        entries.push({ id: `book-${count}`, type: 'BOOKING_REF', original: b, alias: `<ALIAS_BOOKING_REF_${count}>` });
        count++;
      }
    }

    // 10. Person Names
    const nameMatches = text.match(/\b(Alexander\s+Müller|Chandu\s+Kasireddy|Dr\.\s+Heinrich\s+Weber|Sarah\s+Jenkins)\b/g);
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

    let template = '';
    const id = this.selectedScenarioId();

    if (id === 'car_sale') {
      template = `### Bilateral ADAC Used Car Purchase Contract (Kaufvertrag)

1. Contracting Parties:
   - Seller: <ALIAS_PERSON_1>
   - Buyer: <ALIAS_PERSON_2>

2. Vehicle Identification & Specifications:
   - Chassis VIN: <ALIAS_VEHICLE_VIN_1>
   - Agreed Purchase Price: €14,500.00

3. Bank Wire Settlement:
   - Wire settlement to Seller IBAN: <ALIAS_GERMAN_IBAN_1>
   - Due upon vehicle handover and title transfer.

4. Legal Warranty & Defect Disclaimer:
   - The vehicle is sold under exclusion of statutory warranty for physical defects ("gekauft wie gesehen"), pursuant to BGB § 444, except in cases of fraudulent concealment.

Airgap Audit: Bilateral agreement drafted by NVIDIA Nemotron without exposing the VIN, German IBAN, or individual names to the cloud.`;
    } else if (id === 'rental_deposit') {
      template = `### Formal Notice: Demand for Rental Deposit Release (Mietkaution)

To: <ALIAS_ORGANIZATION_1>
Subject: Rückzahlung der Mietkaution für Wohnung <ALIAS_ADDRESS_1>

Sehr geehrte Damen und Herren,

hiermit fordere ich, <ALIAS_PERSON_1>, die vollständige Auszahlung der hinterlegten Mietkaution in Höhe von 1.500,00 € für das zum 31.01.2026 ordnungsgemäß übergebene Mietobjekt in <ALIAS_ADDRESS_1>.

Das Übergabeprotokoll wurde mängelfrei unterzeichnet. Bitte überweisen Sie den Betrag nebst aufgelaufener Zinsen innerhalb von 14 Werktagen auf mein Bankkonto:
IBAN: <ALIAS_GERMAN_IBAN_1>

Bei Rückfragen erreichen Sie mich telefonisch unter <ALIAS_PHONE_1>.

Mit freundlichen Grüßen,
<ALIAS_PERSON_1>

Airgap Audit: Legal demand prepared under GDPR Art. 25 without leaking postal address, phone, or bank account.`;
    } else if (id === 'flight_refund') {
      template = `### Passenger Rights EU261/2004 Delay Compensation Claim

To: Deutsche Lufthansa AG Customer Relations
Booking Reference: <ALIAS_BOOKING_REF_1>
Passenger: <ALIAS_PERSON_1>

Subject: Statutory Compensation Claim under Regulation (EC) No 261/2004

Flight LH2042 arrived with a verified delay of 4 hours 45 minutes, exceeding the 3-hour statutory threshold affirmed by the Court of Justice of the European Union in Sturgeon (Joined Cases C-402/07 & C-432/07).

Please transfer the statutory compensation of €250.00 within 14 calendar days to:
Beneficiary: <ALIAS_PERSON_1>
Bank Account (SEPA): <ALIAS_GERMAN_IBAN_1>

Airgap Audit: Passenger flight compensation claim generated with passenger credentials and bank accounts strictly sovereign.`;
    } else {
      template = `### GKE Cloud Infrastructure Secret Remediation Plan

1. Flagged Hardcoded API Credential: <ALIAS_API_KEY_1>
2. Flagged Database Connection: <ALIAS_DB_URI_1>
3. Remediation Actions:
   - Immediately revoke compromised API credentials in upstream console.
   - Provision Google Cloud Secret Manager resource:
     \`gcloud secrets create db-secret --data-file=credentials.json\`
   - Mount credentials into pod via Kubernetes External Secrets Operator (ESO).
4. Network Isolation:
   - Apply Kubernetes NetworkPolicy to restrict ingress on internal node <ALIAS_INTERNAL_IP_1>.

Airgap Audit: Hardened Kubernetes deployment spec generated with 0.00% secrets leaked to the LLM.`;
    }

    // Apply or withhold re-hydration
    if (this.rehydrateEnabled()) {
      for (const item of this.vaultEntries()) {
        template = template.replaceAll(item.alias, item.original);
      }
    }

    // Stream simulation token-by-token
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
    }, 20);
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