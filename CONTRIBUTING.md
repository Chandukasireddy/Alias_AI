# 🤝 Contributing to Alias AI

Thank you for your interest in contributing to **Alias AI**! 🎉

Alias AI is an open-source, zero-knowledge privacy airgap gateway designed to protect developers, enterprises, and everyday users from accidentally transmitting confidential credentials, automotive VINs, German IBANs, and PII to cloud LLMs.

We welcome contributions from developers of all backgrounds and experience levels—whether you are fixing a typo, adding a regex classification pattern for another country, integrating a local model, or improving the documentation.

---

## 🧭 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all contributors with kindness, empathy, and respect.

---

## 🚀 Quick Local Development Setup

Alias AI is built with pure Node.js standard library (**zero external npm dependencies** for the CLI core) to guarantee sub-millisecond startup, complete auditability, and zero supply-chain risk.

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Git**
- *(Optional)* [Ollama](https://ollama.com) running Google's `gemma2:2b` for local neural entity extraction

### 2. Clone and Link
```bash
# Clone the repository
git clone https://github.com/Chandukasireddy/Alias_AI.git
cd Alias_AI

# Link the CLI binary globally on your machine
npm link

# Test that the CLI is working
alias-ai doctor
```

### 3. Running System & Airgap Self-Tests
Verify that all sanitizers and airgap guarantees function correctly:
```bash
# Run the mathematical airgap verification test (0.00% leakage)
alias-ai test

# Test prompt sanitization locally
alias-ai sanitize "My name is Alice, mobile 0176889922, IBAN DE89370400440532013000"
```

---

## 🛠️ Areas Where You Can Contribute

### 1. New Entity Classification Patterns (`src/aliaser.js`)
We want Alias AI to support international identifiers, medical privacy tokens, and proprietary cloud secrets.
You can easily add new patterns to `this.patterns` in `src/aliaser.js`:
- Healthcare / HIPAA identifiers (e.g. NHS numbers, insurance IDs)
- Additional European / International IBANs & banking formats
- Enterprise cloud tokens (GCP service account keys, Azure connection strings, Databricks tokens)

### 2. Local Neural Model Integrations
- Extend `src/wizard.js` to support local backends like `vLLM`, `llama.cpp`, or `LocalAI` alongside Ollama.
- Benchmark and tune small language models (Gemma 2 2B, SmolLM2, Qwen 2.5) for local zero-shot NER.

### 3. Editor & AI Agent Extensions
- Create configurations or integrations for Cursor, Windsurf, Claude Code, Copilot, Cline, Aider, and NeoVim.
- See `.agents/skills/alias-ai/SKILL.md` and `AGENTS.md` for our 5-Level Privacy Reduction Ladder standard.

### 4. Docs & Website (`frontend/`)
- Improve the Angular 21 documentation website (`https://alias-ai-pi.vercel.app`).
- Add real-world privacy scenarios and video demos.

---

## 🔄 Contribution Workflow

1. **Fork the Repository:** Click the **Fork** button at the top right of GitHub.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/add-medical-id-sanitizer
   ```
3. **Commit Your Changes:** Write clear, concise commit messages adhering to Conventional Commits:
   ```bash
   git commit -m "feat(aliaser): add NHS patient number classification pattern"
   ```
4. **Run Tests:** Ensure `alias-ai test` and `alias-ai doctor` pass without warnings.
5. **Push and Open a Pull Request:**
   ```bash
   git push origin feature/add-medical-id-sanitizer
   ```
6. Submit your PR on GitHub using our PR template.

---

## 🏆 Community Recognition

All contributors will be featured in our README and documentation release notes. Whether you contribute code, documentation, or report an edge-case bug, your efforts help build a more sovereign, private future for AI.

Thank you for helping make AI safe and private for everyone!

