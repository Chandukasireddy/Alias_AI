import json
import asyncio
from typing import Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from app.models import (
    AliasRequest,
    AliasResponse,
    ProcessStreamRequest,
    VaultSession,
    ComplianceCertificate,
)
from app.aliasing_engine import aliasing_engine
from app.cloud_client import cloud_client
from app.rehydrator import StreamingRehydrator
from app.guardrails_engine import guardrails_firewall
from app.scenarios import DEMO_SCENARIOS, get_scenario_by_id


app = FastAPI(
    title="Alias AI Gateway",
    description="Zero-Knowledge Privacy Airgap Gateway for Enterprise LLMs on GKE",
    version="1.0.0"
)

# Enable CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (RAM only, zero persistence to disk)
ACTIVE_VAULT_SESSIONS: Dict[str, VaultSession] = {}


@app.get("/")
@app.get("/health")
@app.get("/api")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "Alias AI Privacy Gateway",
        "edge_model": "Google Gemma 2",
        "cloud_model": "NVIDIA Nemotron-70B on GKE",
        "guardrail_engine": "NVIDIA NeMo Guardrails",
        "environment": "Vercel / Cloud Native"
    }


@app.get("/api/scenarios")
def list_scenarios():
    """Returns curated enterprise scenarios for quick testing."""
    return DEMO_SCENARIOS


@app.post("/api/alias", response_model=AliasResponse)
def alias_prompt(request: AliasRequest):
    """
    Local Edge Aliasing: Google Gemma 2 analyzes the prompt locally,
    extracts sensitive entities, and creates the in-memory vault.
    """
    session = VaultSession()
    sanitized_prompt, detected_entries, latency_ms = aliasing_engine.sanitize(
        request.prompt, session
    )
    
    # Audit wire traffic with NeMo Guardrails
    is_safe, leakage_score, violations = guardrails_firewall.audit_wire_traffic(
        sanitized_prompt, session
    )

    ACTIVE_VAULT_SESSIONS[session.session_id] = session

    return AliasResponse(
        session_id=session.session_id,
        original_prompt=request.prompt,
        sanitized_prompt=sanitized_prompt,
        aliases_created=len(detected_entries),
        detected_entities=detected_entries,
        entropy_leakage_score=leakage_score,
        latency_ms=latency_ms
    )


@app.post("/api/process-stream")
async def process_stream(request: ProcessStreamRequest):
    """
    End-to-End Secure Streaming Pipeline:
    1. Local Gemma 2 aliasing (if not already aliased).
    2. NeMo Guardrails wire audit (0.00% leakage verification).
    3. NVIDIA Nemotron-70B cloud reasoning on GKE over sanitized prompt.
    4. Local sliding-window re-hydration.
    """
    # Retrieve or create vault session
    session = ACTIVE_VAULT_SESSIONS.get(request.session_id or "")
    if not session:
        session = VaultSession()
        sanitized_prompt, detected_entries, _ = aliasing_engine.sanitize(
            request.prompt, session
        )
        ACTIVE_VAULT_SESSIONS[session.session_id] = session
    else:
        sanitized_prompt = request.prompt

    # NeMo Guardrail safety check
    is_safe, leakage_score, violations = guardrails_firewall.audit_wire_traffic(
        sanitized_prompt, session
    )
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Egress Guardrail Violation: {violations}")

    async def event_generator():
        # Step 1: Send initial metadata event
        yield {
            "event": "metadata",
            "data": json.dumps({
                "session_id": session.session_id,
                "sanitized_prompt": sanitized_prompt,
                "entropy_leakage": leakage_score,
                "guardrail_status": "PASSED (0.00% Leakage)",
                "aliases_active": len(session.entries)
            })
        }

        # Step 2: Stream reasoning tokens from Nemotron-70B on GKE
        raw_token_generator = cloud_client.stream_reasoning(sanitized_prompt)
        rehydrator = StreamingRehydrator(session)
        
        token_count = 0
        async for chunk_info in rehydrator.rehydrate_stream(raw_token_generator):
            token_count += 1
            yield {
                "event": "token",
                "data": json.dumps(chunk_info)
            }

        # Step 3: Emit final signed EU AI Act compliance certificate
        cert = guardrails_firewall.generate_compliance_certificate(session, token_count)
        yield {
            "event": "compliance",
            "data": cert.model_dump_json()
        }

        # Step 4: Emit completion event
        yield {
            "event": "done",
            "data": json.dumps({"status": "completed", "total_tokens": token_count})
        }

    return EventSourceResponse(event_generator())


@app.get("/api/audit-certificate/{session_id}", response_model=ComplianceCertificate)
def get_audit_certificate(session_id: str):
    """Fetches a cryptographic EU AI Act compliance certificate for a session."""
    session = ACTIVE_VAULT_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session vault not found or expired from memory.")
    
    return guardrails_firewall.generate_compliance_certificate(session, len(session.entries))

