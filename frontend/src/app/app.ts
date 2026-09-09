import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VaultEntry {
  id: string;
  entity_type: string;
  original_value: string;
  alias_token: string;
  synthetic_surrogate: string;
}

interface ComplianceCertificate {
  certificate_id: string;
  timestamp: string;
  session_id: string;
  gdpr_article_25_status: string;
  eu_ai_act_article_14_status: string;
  private_entropy_leakage: number;
  edge_sanitizer: string;
  cloud_reasoner: string;
  guardrail_validator: string;
  total_tokens_masked: number;
  audit_hash: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Scenario definitions matching Dr. Storm's domain and enterprise use-cases
  readonly scenarios = [
    {
      id: 'automotive-fleet',
      title: 'Mercedes-Benz Telematics & Battery DTC',
      category: 'Automotive & Industrial AI (Dr. Jörg Storm Domain)',
      icon: '🚗',
      prompt: `Vehicle Diagnostic Report for Mercedes-Benz Mobility:\nChassis VIN: WDB2110761A123456\nAssembly Plant: Factory 56 (Sindelfingen)\nLead Diagnostics Engineer: Dr. Heinrich Weber\nCAN Bus Diagnostic Trouble Code: P0A80 (High Voltage Battery Pack Anomaly)\nTelemetry Notes: Battery Module #4 cell voltage fluctuating at 3.12V vs 3.85V nominal.\nRequest: Analyze the root cause and generate a step-by-step mechanical remediation checklist.`
    },
    {
      id: 'banking-settlement',
      title: 'High-Value SEPA Wire Transfer & Fraud',
      category: 'Financial Services & Banking (GDPR Compliance)',
      icon: '🏦',
      prompt: `Urgent Transaction Risk Evaluation:\nOriginating Account (Deutsche Bank): DE89 3704 0044 0532 0130 00\nAccount Holder: Alexander Müller\nBeneficiary Phone: +49 171 8923451\nTransaction Amount: €482,000.00 to offshore supplier\nRequest: Evaluate this transaction against anti-money laundering (AML) risk indicators and determine if immediate settlement clearance is compliant.`
    },
    {
      id: 'devops-cloud-secrets',
      title: 'GKE Cloud Script with Hardcoded Secrets',
      category: 'Enterprise Cloud & DevOps (GKE Infrastructure)',
      icon: '☁️',
      prompt: `Urgent DevOps Fix Request for Project Sovereign:\nAuthor: Sarah Jenkins\nCluster Internal Subnet: 10.0.4.15\nStaging API Key: sk-live-9941a8f912c0048e8912bc\nDatabase Connection: postgres://admin:Secr3tP@ssw0rd@10.0.4.15:5432/fleet_db\nIssue: Microservice pod on GKE is experiencing connection timeouts.\nRequest: Refactor this configuration to use Google Cloud Secret Manager and write the safe Kubernetes deployment manifest.`
    }
  ];

  selectedScenarioId = signal<string>('automotive-fleet');
  rawPrompt = signal<string>('');
  sanitizedPrompt = signal<string>('');
  cloudWireText = signal<string>('');
  rehydratedOutput = signal<string>('');
  
  detectedEntities = signal<VaultEntry[]>([]);
  isProcessing = signal<boolean>(false);
  entropyLeakage = signal<number>(0.0);
  aliasingLatency = signal<number>(0);
  tokensGenerated = signal<number>(0);
  auditCertificate = signal<ComplianceCertificate | null>(null);
  activeTab = signal<'cockpit' | 'audit' | 'architecture'>('cockpit');

  private backendUrl = 'http://localhost:8000';

  ngOnInit() {
    this.selectScenario(this.scenarios[0].id);
  }

  selectScenario(id: string) {
    this.selectedScenarioId.set(id);
    const sc = this.scenarios.find(s => s.id === id);
    if (sc) {
      this.rawPrompt.set(sc.prompt);
      this.resetRun();
    }
  }

  resetRun() {
    this.sanitizedPrompt.set('');
    this.cloudWireText.set('');
    this.rehydratedOutput.set('');
    this.detectedEntities.set([]);
    this.auditCertificate.set(null);
    this.tokensGenerated.set(0);
    this.entropyLeakage.set(0.0);
  }

  async runAirgapPipeline() {
    if (!this.rawPrompt().trim()) return;

    this.resetRun();
    this.isProcessing.set(true);

    try {
      const aliasRes = await fetch(`${this.backendUrl}/api/alias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: this.rawPrompt() })
      });

      if (!aliasRes.ok) {
        throw new Error(`Aliasing failed: ${aliasRes.statusText}`);
      }

      const aliasData = await aliasRes.json();
      this.sanitizedPrompt.set(aliasData.sanitized_prompt);
      this.detectedEntities.set(aliasData.detected_entities);
      this.aliasingLatency.set(aliasData.latency_ms);
      this.entropyLeakage.set(aliasData.entropy_leakage_score);

      const response = await fetch(`${this.backendUrl}/api/process-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aliasData.sanitized_prompt,
          session_id: aliasData.session_id
        })
      });

      if (!response.body) {
        throw new Error('ReadableStream not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.cloud_chunk !== undefined) {
                this.cloudWireText.update(val => val + data.cloud_chunk);
                this.rehydratedOutput.update(val => val + data.rehydrated_chunk);
                this.tokensGenerated.update(c => c + 1);
              }

              if (data.certificate_id) {
                this.auditCertificate.set(data);
              }
            } catch (e) {
              // Ignore partial chunk parse error
            }
          }
        }
      }
    } catch (error) {
      console.error('Pipeline error:', error);
      this.rehydratedOutput.set(`Connection error connecting to Alias AI backend on ${this.backendUrl}. Please ensure FastAPI is running.`);
    } finally {
      this.isProcessing.set(false);
    }
  }

  downloadAuditReport() {
    const cert = this.auditCertificate();
    if (!cert) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cert, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${cert.certificate_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
