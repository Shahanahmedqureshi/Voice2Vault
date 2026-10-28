# Voice2Vault: B2B Operations Console Visual Redesign

A complete visual and design system overhaul transforming Voice2Vault from a dark developer terminal into a modern, Stripe/Linear-grade B2B operations console for small businesses. Visually showcases an autonomous AI workforce coordinating across planning, execution, and human approval without modifying any backend agents, supervisors, tools, schemas, policies, or unit tests.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters and constraints have been confirmed:
> - **Zero Logic Mutation**: No changes will be made to any agent, planner, supervisor, tool, store, policy, or test logic. All function names, types, and data fields remain unchanged.
> - **Theme & Palette**: Light theme default (`#F7F8FA` canvas, clean white cards with `#E5E7EB` borders, soft elevation, radius 12px) with a persistent dark mode toggle. Indigo `#4F46E5` primary brand accent.
> - **Unified Command Bar**: The top bar global search functions as a unified command input that routes directly to the Planner agent.
> - **Staged Delivery**: Execution is partitioned into 6 distinct steps, starting with Step 1 (Theme, typography, and top bar) for immediate user verification.

---

### 1. Overview & Core Concept

- **What It Does**: Refaces Voice2Vault into a calm, authoritative financial operations console ("Your AI back-office team, run by voice"). Merchants and judges see a team of 6 specialized AI workers actively handling intake, audit arithmetic, credit risk, master ledger commits, collections, and reporting.
- **Brand Consistency**: Clean "Voice2Vault" wordmark throughout; removal of "VyaparVault", "KHATA ERP", and mechanical `//` symbols. Honest open-weight model callout: `gemma-4-26b-a4b-it · Open-weight model, self-hostable. This build calls it via API.`
- **Indian Financial Localization**: Authentic Indian currency formatting (`₹1,25,000`, `₹42,000`) with tabular numerals on all numeric balances and timings.

---

### 2. Visual System & Design Architecture

#### Color System
- **Canvas Neutral**: Light `#F7F8FA` / Dark `#0F172A`
- **Surface Elevation**: White `#FFFFFF` / Dark `#1E293B` with 1px border (`#E5E7EB` / `#334155`)
- **Primary Accent**: Indigo `#4F46E5` (Hover: `#4338CA`, Active: `#3730A3`)
- **Semantic Signals**:
  - Success: `#16A34A` (Clean audit, approved dispatch, completed tasks)
  - Warning: `#D97706` (Math anomaly detected, approval required, medium risk)
  - Danger: `#DC2626` (Credit limit exceeded, high credit risk, failed attempt)
  - Info: `#0284C7` (Active workflow step, browser transcription tag)
  - Neutral: `#6B7280` (Muted labels, secondary timestamps)

#### Typography & Spacing
- **Font**: Inter for all body prose, headings, button labels, and badges.
- **Monospace Constraint**: `JetBrains Mono` reserved exclusively for voucher numbers (`V2V-1002`), currency figures (`₹27,000`), IDs, and measured milliseconds (`320ms`).
- **Scale**: Strict 12px / 14px / 16px / 20px / 28px type hierarchy on an 8px spacing grid.

---

### 3. Step-by-Step Delivery Phases

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Theme Engine, Inter Typography & Top Bar Navigation            │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 2: Live Store-Computed KPI Bento Strip & 12-Col Responsive Grid   │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 3: "Live Workflow" Step Cards & "Your AI Team" 6-Agent Strip      │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 4: "Needs Your Attention" Approval Cards & Real Activity Feed     │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 5: Business Data Tabs (Ledger, Risk Charts, Inventory, Outbox)   │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 6: Slide-Over "Developer Trace" Drawer, Toasts & Responsive Finish│
└────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Phase Breakdown

1. **Step 1: Theme, Typography & Top Bar (Current Target)**
   - Create theme state management (`light` / `dark`) in `src/index.css` and `App.tsx`.
   - Update `index.html` with Inter font family.
   - Rebuild `HeaderBar.tsx`:
     - Clean "Voice2Vault" wordmark + tagline "Your AI back-office team, run by voice."
     - Model badge: `gemma-4-26b-a4b-it` (Open-weight, self-hostable. This build calls it via API.)
     - Unified global command search input ("Ask or type a request... e.g. Sharma Kirana pe 20 peti oil...").
     - "Run Judge Mode" primary indigo button.
     - "Developer trace" icon button (opens slide-over).
     - Settings modal trigger and Theme toggle (Sun/Moon).

2. **Step 2: Live Store-Computed KPI Row & Layout Grid**
   - Build `KpiSummaryRow.tsx` computing 5 live metrics directly from `vouchers`, `customers`, `approvals`, and `supervisor.getMetrics()`:
     1. Total Outstanding Udhaar (`₹`)
     2. High-Risk Exposure (`₹` and count of high-risk accounts)
     3. Pending Approvals (count, highlighted in amber when >0)
     4. Tasks Completed Today (real measured count)
     5. Retries Recovered (real measured count)
   - Setup 12-column grid layout (Left: 4 cols, Center: 5 cols, Right: 3 cols at 1440px max width).

3. **Step 3: Live Workflow Pipeline & AI Team Strip**
   - Redesign `LiveDagView` into `LiveWorkflowPipeline.tsx`:
     - Clean card sequence with directional connector arrows.
     - Active step glow and progress bar; agent avatar, "AI" / "Tool" badge, status pill, and measured ms.
     - "View trace" deep-link per step opening filtered developer drawer.
     - Never-empty state with 3 clickable business examples.
   - Create `AiTeamStrip.tsx`: 6 horizontal agent cards (Intake, Auditor, Risk, Ledger, Collections, Reporter) showing live status (Idle, Working, Waiting for you, Error), LLM/Tool chip, and real tasks-handled counter.

4. **Step 4: Approvals Inbox & Plain-Language Activity Feed**
   - Redesign `TraceAndApprovalsPanel` into `AttentionAndActivityPanel.tsx`:
     - Prominent amber-bordered approval cards with clear comparison (`₹27,000 Computed vs ₹29,000 Stated`), Approve/Reject/Edit action buttons.
     - Activity Feed in plain human language ("Auditor caught a ₹2,000 discrepancy for Sharma Kirana", "Ledger committed Voucher #V2V-1002").

5. **Step 5: Business Data Tabs & Recharts Analytics**
   - Redesign `WorkspaceTabs.tsx`:
     - Master Ledger: clean table with sticky header, risk/audit status chips, and side-drawer row click.
     - Customers & Risk: credit exposure progress bar + 2 Recharts widgets (Outstanding by Customer bar chart, Risk Distribution donut chart).
     - Inventory & Rates: stock counters with low-stock warnings.
     - Outbox: message cards with "Copy", "Open wa.me", and "Pre-filled UPI QR" viewer modal.
     - "Export" buttons for `.xlsx` and `.csv` using SheetJS.

6. **Step 6: Slide-Over Developer Trace Drawer & Micro-Interactions**
   - Slide-over drawer on the right side containing:
     - Message Bus table (filter by task or agent)
     - Audit Log with duration and inputs/outputs
     - In-app Unit Test runner
   - Non-intrusive completion toasts with real measured run timings.
   - Full responsive stacking (<1024px) and WCAG AA contrast.

---

### Acceptance Checklist & Verification

- [ ] Zero logic, agent, supervisor, tool, store, or policy changes made.
- [ ] Voice2Vault branding, tagline, and honest model copy in place.
- [ ] Clean light theme by default with functional dark mode toggle.
- [ ] All 3 demo scenarios and Judge Mode run with identical end-to-end functionality.
- [ ] Unit tests pass with 100% success rate.
- [ ] All metrics computed live from store and `performance.now()`.
