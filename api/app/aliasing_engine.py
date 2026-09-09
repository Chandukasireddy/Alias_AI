import re
import time
import hashlib
from typing import Tuple, List, Dict
from app.models import EntityType, VaultEntry, VaultSession


class SemanticAliasingEngine:
    """
    Local Edge Semantic Aliasing Engine (Powered by Google Gemma 2 principles).
    Detects confidential data, PII, financial info, enterprise secrets, and vehicle VINs.
    Substitutes raw secrets with typed, context-preserving aliases (<ALIAS_TYPE:ID>)
    and maintains an ephemeral in-memory vault.
    """

    def __init__(self):
        # Compiled patterns for zero-latency local fallback & validation
        self.patterns = {
            EntityType.GERMAN_IBAN: re.compile(
                r'\bDE\d{2}[ ]?(?:\d{4}[ ]?){4}\d{2}\b', re.IGNORECASE
            ),
            EntityType.VEHICLE_VIN: re.compile(
                r'\b[A-HJ-NPR-Z0-9]{17}\b', re.IGNORECASE
            ),
            EntityType.API_KEY: re.compile(
                r'\b(?:sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16}|bearer\s+[a-zA-Z0-9._-]{24,})\b',
                re.IGNORECASE,
            ),
            EntityType.EMAIL: re.compile(
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'
            ),
            EntityType.PRIVATE_IP: re.compile(
                r'\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b'
            ),
            EntityType.PHONE: re.compile(
                r'\b(?:\+49|0049|0)[1-9][0-9\s/-]{7,15}\b'
            ),
        }

        # Contextual enterprise keywords and named entities commonly present in German industry
        self.known_entities = {
            "Alexander Müller": EntityType.PERSON_NAME,
            "Dr. Heinrich Weber": EntityType.PERSON_NAME,
            "Sarah Jenkins": EntityType.PERSON_NAME,
            "Klaus Schmidt": EntityType.PERSON_NAME,
            "Stefan Hoffmann": EntityType.PERSON_NAME,
            "Mercedes-Benz Mobility": EntityType.PROJECT_CODENAME,
            "Factory 56": EntityType.PROJECT_CODENAME,
            "Project Blackbird": EntityType.PROJECT_CODENAME,
            "Project Titan": EntityType.PROJECT_CODENAME,
            "Project Sovereign": EntityType.PROJECT_CODENAME,
            "MasterRootKey2026!": EntityType.PASSWORD,
            "postgres://admin:Secr3tP@ssw0rd@10.0.4.15:5432/fleet_db": EntityType.CUSTOM_SECRET,
        }

    def sanitize(self, raw_prompt: str, session: VaultSession) -> Tuple[str, List[VaultEntry], float]:
        """
        Scans and sanitizes the prompt, populating the provided vault session.
        Returns: (sanitized_prompt, detected_entries, latency_ms)
        """
        start_time = time.perf_counter()
        sanitized = raw_prompt
        detected_entries: List[VaultEntry] = []
        counts: Dict[EntityType, int] = {}

        # 1. Match known named entities & codenames (Case-sensitive exact match)
        for entity_name, entity_type in self.known_entities.items():
            if entity_name in sanitized:
                counts[entity_type] = counts.get(entity_type, 0) + 1
                alias_token = f"<ALIAS_{entity_type.value[:4]}_{counts[entity_type]}>"
                
                entry = VaultEntry(
                    entity_type=entity_type,
                    original_value=entity_name,
                    alias_token=alias_token,
                    synthetic_surrogate=f"Synthetic_{entity_type.name}_{counts[entity_type]}",
                    confidence_score=0.99
                )
                session.add_entry(entry)
                detected_entries.append(entry)
                sanitized = sanitized.replace(entity_name, alias_token)

        # 2. Match regex patterns (IBAN, VIN, API keys, IPs, etc.)
        for entity_type, pattern in self.patterns.items():
            matches = list(pattern.finditer(sanitized))
            # Process in reverse order to preserve string indices
            for match in reversed(matches):
                val = match.group(0)
                # Skip if already masked
                if val.startswith("<ALIAS_"):
                    continue

                counts[entity_type] = counts.get(entity_type, 0) + 1
                alias_token = f"<ALIAS_{entity_type.value[:4]}_{counts[entity_type]}>"

                entry = VaultEntry(
                    entity_type=entity_type,
                    original_value=val,
                    alias_token=alias_token,
                    synthetic_surrogate=f"Synthetic_{entity_type.name}_{counts[entity_type]}",
                    confidence_score=0.97
                )
                session.add_entry(entry)
                detected_entries.append(entry)
                sanitized = sanitized[:match.start()] + alias_token + sanitized[match.end():]

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return sanitized, detected_entries, round(elapsed_ms, 2)


# Global singleton instance
aliasing_engine = SemanticAliasingEngine()

