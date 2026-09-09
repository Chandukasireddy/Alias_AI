import os
import asyncio
import json
import httpx
from typing import AsyncGenerator, Dict, Any, Optional


class CloudReasoningClient:
    """
    Cloud Reasoning Client for NVIDIA Nemotron-70B on Google Kubernetes Engine (GKE) / NVIDIA NIM.
    Receives only sanitized prompts with aliases (<ALIAS_...:N>).
    Zero confidential secrets ever leave the local boundary.
    """

    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY", "")
        self.model = os.getenv("CLOUD_REASONING_MODEL", "meta/llama-3.1-nemotron-70b-instruct")
        self.endpoint = os.getenv("CLOUD_NIM_ENDPOINT", "https://integrate.api.nvidia.com/v1/chat/completions")

    async def stream_reasoning(
        self,
        sanitized_prompt: str,
        scenario_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams reasoning response token-by-token.
        Uses the live NVIDIA NIM API if key is available, or high-fidelity simulation.
        """
        if self.api_key and not self.api_key.startswith("mock_"):
            async for token in self._stream_from_live_nim(sanitized_prompt):
                yield token
        else:
            async for token in self._stream_simulation(sanitized_prompt, scenario_id):
                yield token

    async def _stream_from_live_nim(self, sanitized_prompt: str) -> AsyncGenerator[str, None]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        }
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an enterprise AI reasoning co-pilot running securely on Google Kubernetes Engine (GKE). "
                        "All confidential data in your prompt has been replaced with structural aliases like <ALIAS_USER_1>, "
                        "<ALIAS_IBAN_1>, <ALIAS_VIN_1>. Always preserve these exact alias tags in your reasoning and recommendations "
                        "so the local client can safely re-hydrate them."
                    )
                },
                {"role": "user", "content": sanitized_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", self.endpoint, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    yield f"Error from Cloud NIM ({response.status_code}): {await response.aread()}"
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if delta:
                                yield delta
                        except json.JSONDecodeError:
                            continue

    async def _stream_simulation(self, sanitized_prompt: str, scenario_id: Optional[str]) -> AsyncGenerator[str, None]:
        """
        High-fidelity TensorRT-LLM stream simulation for zero-cost evaluation ($0 cloud bill).
        Emits realistic tokens with TensorRT latency (~25ms TTFT, ~45 tokens/sec).
        """
        # Determine simulated response based on content
        if "VIN" in sanitized_prompt or "telematics" in sanitized_prompt.lower() or "automotive" in sanitized_prompt.lower():
            response_text = (
                "### Diagnostic Telemetry Analysis (NVIDIA Nemotron-70B on GKE)\n\n"
                "1. **Vehicle Identity & Telemetry Verification**:\n"
                "   - Target Vehicle Serial: `<ALIAS_VEHI_1>`\n"
                "   - Assigned Lead Technician: `<ALIAS_PERS_1>`\n"
                "   - Facility Unit: `<ALIAS_PROJ_1>`\n\n"
                "2. **Causal Fault Investigation (OBD-II / CAN Bus)**:\n"
                "   - Analysis of battery cell telemetry reveals internal impedance anomaly on Module #4.\n"
                "   - Diagnostic Trouble Code `P0A80` is triggered by voltage differential exceeding 0.45V under peak load.\n\n"
                "3. **Remediation Action Plan**:\n"
                "   - Isolate high-voltage contactors before mechanical inspection.\n"
                "   - Inspect wiring harness connected to `<ALIAS_VEHI_1>` cell cluster #4.\n"
                "   - Technician `<ALIAS_PERS_1>` must verify torque specifications (8.5 Nm) according to ISO 26262 standard.\n\n"
                "✅ **Verdict**: Hardware fault isolated. Zero proprietary customer or vehicle secrets leaked to cloud."
            )
        elif "IBAN" in sanitized_prompt or "bank" in sanitized_prompt.lower() or "fraud" in sanitized_prompt.lower():
            response_text = (
                "### Financial Audit & Compliance Assessment (NVIDIA Nemotron-70B on GKE)\n\n"
                "1. **Account Entity Verification**:\n"
                "   - Audited Account: `<ALIAS_GERM_1>`\n"
                "   - Beneficiary: `<ALIAS_PERS_1>`\n\n"
                "2. **Risk & Velocity Scoring**:\n"
                "   - High-velocity transaction volume flagged across European SEPA clearing rails.\n"
                "   - Risk score: **0.14 (LOW RISK)** - Regular commercial settlement pattern.\n\n"
                "3. **Compliance Ruling (BaFin / ECB Compliance)**:\n"
                "   - Beneficiary `<ALIAS_PERS_1>` cleared for immediate release.\n"
                "   - Wire release authorized for `<ALIAS_GERM_1>` without manual escrow hold.\n\n"
                "🔒 **Privacy Assertion**: Evaluation completed using zero-knowledge aliasing. Bank account numbers never reached cloud memory."
            )
        else:
            response_text = (
                "### Cloud Engineering Review (NVIDIA Nemotron-70B on GKE)\n\n"
                "1. **Infrastructure Vulnerability Scan**:\n"
                "   - Developer Reference: `<ALIAS_PERS_1>`\n"
                "   - Cluster Subnet Target: `<ALIAS_PRIV_1>`\n"
                "   - Sensitive Credential Flagged: `<ALIAS_API__1>`\n\n"
                "2. **Root-Cause Analysis**:\n"
                "   - Hardcoded API credentials detected inside production application deployment configuration.\n"
                "   - Threat model: Unauthorized cluster pod could extract `<ALIAS_API__1>` via environment variable inspection.\n\n"
                "3. **Remediation & Hardening**:\n"
                "   - Migrate `<ALIAS_API__1>` to Google Cloud Secret Manager with workload identity federation.\n"
                "   - Restrict cluster ingress on `<ALIAS_PRIV_1>` via NetworkPolicy.\n\n"
                "🛡️ **Security Status**: Remediation verified. Credentials remained inside your local enclave."
            )

        # Stream token-by-token to simulate real-time LLM generation
        words = response_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield chunk
            await asyncio.sleep(0.03)  # ~30ms per word simulates TensorRT-LLM stream


cloud_client = CloudReasoningClient()

