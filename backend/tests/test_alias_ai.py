import pytest
from app.models import VaultSession, EntityType
from app.aliasing_engine import aliasing_engine
from app.rehydrator import StreamingRehydrator
from app.guardrails_engine import guardrails_firewall


def test_german_iban_and_person_aliasing():
    session = VaultSession()
    raw = "Wire transfer €5000 to Alexander Müller on account DE89 3704 0044 0532 0130 00 immediately."
    
    sanitized, entries, latency = aliasing_engine.sanitize(raw, session)
    
    # Assert secrets are removed from sanitized prompt
    assert "DE89 3704 0044 0532 0130 00" not in sanitized
    assert "Alexander Müller" not in sanitized
    assert "<ALIAS_GERM_" in sanitized
    assert "<ALIAS_PERS_" in sanitized
    assert len(entries) >= 2
    assert latency < 100.0  # Fast local performance


def test_automotive_mercedes_vin_aliasing():
    session = VaultSession()
    raw = "Mercedes-Benz Mobility VIN: WDB2110761A123456 at Factory 56 diagnosed by Dr. Heinrich Weber."
    
    sanitized, entries, _ = aliasing_engine.sanitize(raw, session)
    
    assert "WDB2110761A123456" not in sanitized
    assert "<ALIAS_VEHI_" in sanitized
    assert "Dr. Heinrich Weber" not in sanitized
    assert "Factory 56" not in sanitized


def test_nemo_guardrail_egress_audit():
    session = VaultSession()
    raw = "Private Key: sk-live-9941a8f912c0048e8912bc"
    sanitized, entries, _ = aliasing_engine.sanitize(raw, session)
    
    is_safe, leakage, violations = guardrails_firewall.audit_wire_traffic(sanitized, session)
    assert is_safe is True
    assert leakage == 0.00
    assert len(violations) == 0


@pytest.mark.asyncio
async def test_streaming_rehydration():
    session = VaultSession()
    raw = "Customer Sarah Jenkins has IBAN DE89 3704 0044 0532 0130 00."
    sanitized, _, _ = aliasing_engine.sanitize(raw, session)
    
    # Simulate tokens arriving from cloud LLM with alias tags
    async def mock_cloud_stream():
        yield "Approved report for "
        yield "<ALIAS_PERS_1>"
        yield " with account "
        yield "<ALIAS_GERM_1>"
        yield "."

    rehydrator = StreamingRehydrator(session)
    rehydrated_chunks = []
    async for chunk in rehydrator.rehydrate_stream(mock_cloud_stream()):
        rehydrated_chunks.append(chunk["rehydrated_chunk"])

    full_output = "".join(rehydrated_chunks)
    assert "Sarah Jenkins" in full_output
    assert "DE89 3704 0044 0532 0130 00" in full_output
    assert "<ALIAS_" not in full_output

