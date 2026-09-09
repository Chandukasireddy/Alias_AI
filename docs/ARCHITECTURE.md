# 🏗️ Alias AI: Deep Technical Architecture Specification

This document details the engineering specifications, mathematical guarantees, streaming algorithms, and security protocols of **Alias AI**.

---

## 1. Threat Model & Enterprise Privacy Boundary

The Alias AI threat model assumes:
1. **The Cloud Network is Untrusted:** Any data traversing TLS egress to cloud AI endpoints (e.g. GKE Nemotron clusters, OpenAI, Anthropic) is subject to multi-tenant interception, third-party model training, logging, or sub-processor leakage.
2. **The Local Host is Sovereign:** The client environment (local developer machine, on-premise industrial edge server, or private sovereign VPC) has exclusive access to the Ephemeral In-Memory Vault.
3. **The Adversary Seeks Secret Recovery:** An attacker with access to the cloud prompt logs or network packets attempts to reconstruct:
   - Chassis VIN numbers (Mercedes-Benz fleet tracking).
   - German bank accounts (IBANs / SEPA routing).
   - Personal identifiable information (lead engineers, account holders).
   - Cryptographic API credentials or database connection URIs.

---

## 2. Mathematical Entropy Leakage Metric

Before any payload is allowed through the egress firewall, NVIDIA NeMo Guardrails computes the **Empirical Entropy Leakage Score** ($E_{leak}$):

$$E_{leak} = \left( \frac{\sum_{i=1}^{N} \mathbb{I}(v_i \in \mathcal{P}_{egress})}{N} \right) \times 100\%$$

Where:
- $\mathcal{V} = \{v_1, v_2, \dots, v_N\}$ is the set of all extracted raw secret values stored in the Ephemeral Vault for the active session.
- $\mathcal{P}_{egress}$ is the string payload prepared for network transmission.
- $\mathbb{I}(\cdot)$ is the indicator function:
  $$\mathbb{I}(A) = \begin{cases} 1 & \text{if } A \text{ is true} \\ 0 & \text{if } A \text{ is false} \end{cases}$$

**Invariant Guarantee:** The egress gate enforces:
$$E_{leak} \equiv 0.00\%$$
If $E_{leak} > 0$, the egress pipeline hard-aborts, raises an `EntropyLeakageViolation`, and immediately invalidates the session keys.

---

## 3. Sliding-Window Streaming Re-hydration Algorithm

### The Token-Split Problem
When frontier models like NVIDIA Nemotron-70B stream tokens via Server-Sent Events (SSE), token boundaries do not align with alias boundaries.
For example, the alias `<ALIAS_VEHICLE_VIN:1>` might arrive across three consecutive streaming packets:
- **Chunk 1:** `"The diagnosed chassis is <ALIAS_VEH"`
- **Chunk 2:** `"ICLE_VI"`
- **Chunk 3:** `"N:1> which indicates an anomaly."`

A naive token-by-token replacement will fail because neither Chunk 1 nor Chunk 2 contains the complete tag.

### The Sliding-Window Solution
Alias AI implements a stateful sliding-window re-hydrator:

```python
# Streaming buffer state machine:
# 1. Maintain carry-over buffer between chunk yields.
# 2. Check for partial alias prefixes: r"<ALIAS_[A-Z0-9_]*$"
# 3. If a trailing partial prefix is detected, retain the partial prefix in the window.
# 4. Flush confirmed safe characters immediately to minimize UI latency.
# 5. On tag closure (">"), execute atomic substitution from Vault.
```

This guarantees:
- **Zero Token Lag:** Safe text is flushed to the frontend immediately without waiting for stream completion.
- **Atomic Substitution:** Real secrets are never fragmented or corrupted.
- **Zero Cloud Exposure:** The entire substitution occurs inside the client process memory.

---

## 4. Cryptographic Audit Attestation

Every session emits an immutable JSON audit log containing a SHA-256 integrity hash:

```
AuditHash = SHA256(SessionID || Timestamp || Article25Status || Article14Status || EntropyLeakage || TotalMasked)
```

This artifact can be fed directly into enterprise GRC (Governance, Risk, and Compliance) systems such as ServiceNow GRC, OneTrust, or AWS CloudTrail/GCP Cloud Audit Logs.
