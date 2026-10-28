# ⚡ Voice2Vault OS: Multi-Agent AI Workforce
> **Autonomous Multi-Agent Commercial Workforce for Indian Small Businesses & Mandis — Powered by Google Gemma 4 (`gemma-4-26b-a4b-it`).**

Open-weight model (Gemma 4); can be self-hosted so data stays on your infrastructure. This build calls the model via API.

---

## Architecture

```text
Request (Hinglish Text / Voice / Photo)
                  │
                  ▼
          ┌───────────────┐
          │ Planner Agent │ (Gemma JSON DAG Plan)
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │   Task DAG    │ (Topological Order & Parallelism)
          └───────┬───────┘
                  │
                  ▼
       ┌───────────────────────┐
       │   Worker Agents       │ <───> ┌───────────────────────┐
       │ ├── Intake Agent      │       │ Tools (Simulated DB)  │
       │ ├── Auditor Agent     │       │ ├── lookup_price      │
       │ ├── Ledger Agent      │       │ ├── search_customer   │
       │ ├── Risk Agent        │       │ ├── audit_math        │
       │ ├── Collections Agent │       │ ├── calc_credit_risk  │
       │ └── Reporter Agent    │       │ ├── write_voucher     │
       └──────────┬────────────┘       │ └── update_inventory  │
                  │                    └───────────────────────┘
                  ▼
       ┌───────────────────────┐
       │      Supervisor       │ (Deterministic State Machine & Retries)
       └──────────┬────────────┘
                  │
                  ▼
       ┌───────────────────────┐
       │ Human Approval Policy │ (Math Mismatch / High Risk / Outbox)
       └──────────┬────────────┘
                  │
                  ▼
               Outputs
       ├── Master Ledger & Vouchers (IndexedDB Persisted)
       ├── Pre-filled UPI QR (Client-Side Rendered)
       ├── WhatsApp Digital Parchi (Draft Outbox)
       └── Excel/CSV Export (SheetJS)
```

---

## Hackathon Requirement Mapping

| Hackathon Requirement | Implementation File | Details |
| :--- | :--- | :--- |
| **Request & Input Modes** | `src/components/CommandPanel.tsx` | Hinglish text, voice with browser Web Speech API (hi-IN) fallback & clear source label, kachha-bill photo OCR. |
| **Planner Agent (LLM, Gemma)** | `src/agents/plannerAgent.ts`, `server.ts` | Analyzes request, produces strict JSON DAG tasks with dependencies. Validates schema, auto-retries, and falls back to template DAG. |
| **Intake Agent (Multimodal)** | `src/agents/intakeAgent.ts` | Extracts customer, items, amounts, stated pending, confidence, and language. Rates come from price list or marked "estimated" (never invented). |
| **Auditor Agent (Hybrid)** | `src/agents/auditorAgent.ts`, `src/tools/auditMath.ts` | Pure deterministic math: `Total - Paid == Stated`. Math is never done by LLM. LLM writes Hinglish explanation. Catches 42000 - 15000 = 27000 vs 29000. |
| **Ledger Agent** | `src/agents/ledgerAgent.ts` | Deterministic write with idempotency key (`customer + date + total + hash of items`) preventing duplicate vouchers. |
| **Risk Agent** | `src/agents/riskAgent.ts`, `src/tools/creditRisk.ts` | Pure deterministic risk calculator. Computes exposure ratio and customer limit against customizable thresholds. |
| **Collections Agent** | `src/agents/collectionsAgent.ts` | Generates pre-filled UPI QR client-side (`vyaparvault@upi`) and drafts WhatsApp receipt without auto-sending. |
| **Reporter Agent** | `src/agents/reporterAgent.ts` | Daily collection tallies and customer ledger statements. |
| **Tool Layer & Simulated Backend** | `src/tools/index.ts`, `src/store/db.ts` | IndexedDB with in-memory fallback. Tables: customers, price_list, inventory, vouchers, ledger_entries, outbox, audit_log, message_bus. |
| **Supervisor & State Machine** | `src/orchestrator/supervisor.ts` | Deterministic state machine, topological execution, parallel ready tasks, exponential backoff retries, downstream cascade skipping. |
| **Human-in-the-Loop Policies** | `src/orchestrator/supervisor.ts`, `src/components/TraceAndApprovalsPanel.tsx` | Pauses for math mismatch (user selects computed vs stated), high credit risk, uncertain intake, outbox release, and limit breaches. |
| **Failure Handling Demo Controls** | `src/components/SettingsModal.tsx`, `src/tools/index.ts` | Injected tool failure (auto-recovers on retry), model 429 rate limit simulation, bad input handling. |
| **Live Task DAG Visualizer** | `src/components/LiveDagView.tsx` | Real-time task nodes, LLM/Tool badges, status colors, elapsed ms, and dependency arrows. |
| **Real Metrics & Anti-Slop** | `src/components/MetricsStrip.tsx` | Live measured timings via `performance.now()`, retries, approvals, and tasks. Zero fabricated claims. |
| **Excel/CSV Export** | `src/utils/sheetExport.ts`, `src/components/WorkspaceTabs.tsx` | Client-side `.xlsx` and `.csv` export via SheetJS (`xlsx`). Strictly labeled "Export". |
| **Unit Test Suite** | `src/tools/unitTests.ts`, `src/components/UnitTestsModal.tsx` | Automated test suite for pure financial functions including the 42,000 / 15,000 / 29,000 benchmark case. |
| **Judge Mode** | `src/App.tsx`, `src/components/HeaderBar.tsx` | Auto-runs the 3 hackathon scenarios in sequence with pauses at human approval gates. |

---

## 3 One-Click Demo Scenarios

1. **Happy Path:** *"Patel Hardware pe 50 box drill bits, 15000 ka bill, 12000 mila, baaki 3000"* — Clean arithmetic match, low risk, instant voucher commit and pre-filled UPI QR.
2. **Forensic Math Mismatch:** *"Sharma Kirana pe 20 peti oil utaara, 42000 bill, 15000 mila, baaki 29000"* — Arithmetic calculates ₹27,000 due, note claims ₹29,000. Catches ₹2,000 overstatement and halts at the Human Approval Gate where the merchant chooses the computed balance.
3. **Failure Injection & Auto-Retry:** Injects a simulated Godown DB write failure; the Supervisor catches the fault, triggers exponential backoff, recovers on retry, and logs the recovery in the audit trace.
