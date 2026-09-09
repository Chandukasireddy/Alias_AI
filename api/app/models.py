from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import time
import uuid


class EntityType(str, Enum):
    PERSON_NAME = "PERSON_NAME"
    GERMAN_IBAN = "GERMAN_IBAN"
    CREDIT_CARD = "CREDIT_CARD"
    API_KEY = "API_KEY"
    PASSWORD = "PASSWORD"
    PRIVATE_IP = "PRIVATE_IP"
    VEHICLE_VIN = "VEHICLE_VIN"
    PROJECT_CODENAME = "PROJECT_CODENAME"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    CUSTOM_SECRET = "CUSTOM_SECRET"


class VaultEntry(BaseModel):
    """
    Represents a single confidential entity stored in the local memory vault.
    Never sent over the network or persisted to disk.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    entity_type: EntityType
    original_value: str
    alias_token: str
    synthetic_surrogate: str
    confidence_score: float = 0.98
    created_at: float = Field(default_factory=time.time)


class VaultSession(BaseModel):
    """
    Ephemeral in-memory vault for a specific inference session.
    """
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: float = Field(default_factory=time.time)
    entries: Dict[str, VaultEntry] = Field(default_factory=dict)

    def add_entry(self, entry: VaultEntry):
        self.entries[entry.alias_token] = entry

    def get_real_value(self, alias_token: str) -> Optional[str]:
        entry = self.entries.get(alias_token)
        return entry.original_value if entry else None


class AliasRequest(BaseModel):
    prompt: str
    scenario_id: Optional[str] = None
    preserve_syntax: bool = True


class AliasResponse(BaseModel):
    session_id: str
    original_prompt: str
    sanitized_prompt: str
    aliases_created: int
    detected_entities: List[VaultEntry]
    entropy_leakage_score: float = 0.00
    latency_ms: float


class ProcessStreamRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None
    model_override: Optional[str] = None
    strict_guardrails: bool = True


class ComplianceCertificate(BaseModel):
    certificate_id: str
    timestamp: str
    session_id: str
    gdpr_article_25_status: str = "COMPLIANT_BY_DESIGN"
    eu_ai_act_article_14_status: str = "HUMAN_OVERSIGHT_VERIFIED"
    private_entropy_leakage: float = 0.00
    edge_sanitizer: str = "Google Gemma 2 (Local Airgap)"
    cloud_reasoner: str = "NVIDIA Nemotron-70B (GKE EU-West3)"
    guardrail_validator: str = "NVIDIA NeMo Guardrails v0.9+"
    total_tokens_masked: int
    audit_hash: str

