from typing import List, Dict
from pydantic import BaseModel


class EnterpriseScenario(BaseModel):
    id: str
    category: str
    title: str
    description: str
    raw_prompt: str
    expected_entities: List[str]


DEMO_SCENARIOS: List[EnterpriseScenario] = [
    EnterpriseScenario(
        id="automotive-fleet",
        category="Automotive & Industrial AI (Dr. Jörg Storm Domain)",
        title="Connected Fleet Telematics & Battery Diagnostic (Mercedes-Benz)",
        description=(
            "A fleet telemetry diagnostic report containing confidential vehicle VIN, "
            "internal technician name, Sindelfingen Factory 56 facility codename, and high-voltage battery DTC codes."
        ),
        raw_prompt=(
            "Vehicle Diagnostic Report for Mercedes-Benz Mobility:\n"
            "Chassis VIN: WDB2110761A123456\n"
            "Assembly Plant: Factory 56 (Sindelfingen)\n"
            "Lead Diagnostics Engineer: Dr. Heinrich Weber\n"
            "CAN Bus Diagnostic Trouble Code: P0A80 (High Voltage Battery Pack Anomaly)\n"
            "Telemetry Notes: Battery Module #4 cell voltage fluctuating at 3.12V vs 3.85V nominal.\n"
            "Request: Analyze the root cause and generate a step-by-step mechanical remediation checklist."
        ),
        expected_entities=[
            "WDB2110761A123456",
            "Factory 56",
            "Dr. Heinrich Weber",
            "Mercedes-Benz Mobility"
        ]
    ),
    EnterpriseScenario(
        id="banking-settlement",
        category="Financial Services & Banking (GDPR Compliance)",
        title="High-Value SEPA Wire Fraud & Risk Assessment",
        description=(
            "A corporate banking transaction query containing confidential client names, "
            "a German IBAN account number, and contact details requiring BaFin compliance."
        ),
        raw_prompt=(
            "Urgent Transaction Risk Evaluation:\n"
            "Originating Account (Deutsche Bank): DE89 3704 0044 0532 0130 00\n"
            "Account Holder: Alexander Müller\n"
            "Beneficiary Phone: +49 171 8923451\n"
            "Transaction Amount: €482,000.00 to offshore supplier\n"
            "Request: Evaluate this transaction against anti-money laundering (AML) risk indicators "
            "and determine if immediate settlement clearance is compliant."
        ),
        expected_entities=[
            "DE89 3704 0044 0532 0130 00",
            "Alexander Müller",
            "+49 171 8923451"
        ]
    ),
    EnterpriseScenario(
        id="devops-cloud-secrets",
        category="Enterprise Cloud & DevOps (GKE Infrastructure)",
        title="Infrastructure Bug Report with Hardcoded Credentials",
        description=(
            "A critical Kubernetes deployment script containing live API keys, "
            "internal database connection strings, and private cluster IPs."
        ),
        raw_prompt=(
            "Urgent DevOps Fix Request for Project Sovereign:\n"
            "Author: Sarah Jenkins\n"
            "Cluster Internal Subnet: 10.0.4.15\n"
            "Staging API Key: sk-live-9941a8f912c0048e8912bc\n"
            "Database Connection: postgres://admin:Secr3tP@ssw0rd@10.0.4.15:5432/fleet_db\n"
            "Issue: Microservice pod on GKE is experiencing connection timeouts.\n"
            "Request: Refactor this configuration to use Google Cloud Secret Manager and write the safe Kubernetes deployment manifest."
        ),
        expected_entities=[
            "Sarah Jenkins",
            "sk-live-9941a8f912c0048e8912bc",
            "10.0.4.15",
            "Project Sovereign"
        ]
    )
]


def get_scenario_by_id(scenario_id: str) -> EnterpriseScenario:
    for sc in DEMO_SCENARIOS:
        if sc.id == scenario_id:
            return sc
    return DEMO_SCENARIOS[0]

