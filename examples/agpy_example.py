"""
Example: Using Antigravity Python Agent with Alias AI Privacy Airgap

This script demonstrates routing Python AI agents through the local
Alias AI transparent gateway at http://127.0.0.1:8080/v1.

Sensitive attributes (VINs, IBANs, API keys) are sanitized locally on your laptop
with Google Gemma 2 and deterministic regex before reaching the cloud.
"""

import os
from openai import OpenAI

def main():
    # 1. Connect to the local Alias AI transparent proxy
    gateway_url = os.getenv("OPENAI_BASE_URL", "http://127.0.0.1:8080/v1")
    api_key = os.getenv("OPENAI_API_KEY", "dummy-local-token")

    print(f"Connecting agent to local airgap gateway: {gateway_url}")
    client = OpenAI(base_url=gateway_url, api_key=api_key)

    # 2. Example raw prompt containing sensitive enterprise attributes
    sensitive_prompt = (
        "Please diagnose high-voltage battery degradation on chassis VIN WDB2040011A123456. "
        "Disburse testing compensation of €1,200 to German IBAN DE89370400440532013000. "
        "Store results to postgresql://telematics:Admin99Secret@db.prod.internal:5432/diagnostics."
    )

    print("\n--- Outbound Prompt (Local Workstation) ---")
    print(sensitive_prompt)

    # 3. Send request through local proxy
    # The proxy intercepts this prompt, extracts the VIN, IBAN, and DB password,
    # locks them into the local in-memory session vault, and sends <ALIAS_*> placeholders to the cloud.
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": sensitive_prompt}]
        )
        print("\n--- Model Response ---")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"\nNote: Upstream call reached gateway. (Ensure upstream API key or mock is configured): {e}")

if __name__ == "__main__":
    main()

