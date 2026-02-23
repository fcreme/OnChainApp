# OnChain — Blockchain Reconciliation Engine

A fintech-grade blockchain reconciliation platform that matches on-chain transactions (anchors) against off-chain records (claims) using an intelligent, explainable scoring engine. Built with React, Node/Express, and PostgreSQL.

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## Live Demo

**Deployed Application**: [View Live Demo](https://on-chain-app-git-main-felipe-cremerius-projects.vercel.app/)

**GitHub Repository**: [Source Code](https://github.com/fcreme/OnChainApp)

---

## Overview

OnChain solves a core fintech problem: **how do you prove that every internal financial record has a corresponding on-chain transaction?**

The platform ingests blockchain events as immutable anchors, accepts off-chain claims (manual entry, CSV import, or app-generated), and runs a weighted matching engine that produces explainable confidence scores. Operators review suggestions, approve or reject matches, and the system maintains a complete audit trail.

---

## System Architecture

```mermaid
graph TB
    subgraph Frontend ["Frontend (React + Vite)"]
        UI[UI Components]
        Stores[Zustand Stores]
        API[API Client Layer]
    end

    subgraph Backend ["Backend (Node + Express)"]
        Routes[REST API Routes]
        ME[Matching Engine]
        RS[Reconciliation Service]
        DS[Drift Service]
        RK[Risk Scoring Service]
        AS[Audit Service]
        BS[Blockchain Sync Service]
    end

    subgraph Data ["Data Layer"]
        PG[(PostgreSQL)]
        BC[Sepolia Blockchain]
    end

    UI --> Stores --> API
    API -->|HTTP| Routes
    Routes --> ME & RS & DS & RK & AS
    BS -->|Viem RPC| BC
    ME & RS & DS & RK & AS --> PG
    BS --> PG

    style Frontend fill:#1a1a2e,stroke:#14B8A6,color:#fff
    style Backend fill:#16213e,stroke:#a4cf5e,color:#fff
    style Data fill:#0f3460,stroke:#ffb347,color:#fff
```

---

## Core Features

### 1. Explainable Matching Engine

The matching engine uses a weighted scoring algorithm (0-100) with four configurable factors. Every score includes a full breakdown so operators understand *why* a match was suggested.

```mermaid
graph LR
    A[Anchor<br/>On-chain Tx] --> PF[SQL Pre-filter]
    PF -->|Same token<br/>Amount ±1%<br/>Time window| SC[Score Candidates]

    SC --> AM[Amount Match<br/>Weight: 40]
    SC --> AD[Address Match<br/>Weight: 30]
    SC --> TM[Time Proximity<br/>Weight: 20]
    SC --> TK[Token Match<br/>Weight: 10]

    AM --> TOTAL[Total Score<br/>0-100]
    AD --> TOTAL
    TM --> TOTAL
    TK --> TOTAL

    TOTAL -->|≥ threshold| SUG[Match Suggestion<br/>with Breakdown]

    style A fill:#14B8A6,stroke:#0f9a87,color:#fff
    style TOTAL fill:#a4cf5e,stroke:#93bf4d,color:#111
    style SUG fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

**Scoring Details:**

| Factor | Weight | Logic |
|--------|--------|-------|
| **Amount** | 40% | Linear decay within tolerance. Gas-aware: compares both gross and net amounts |
| **Address** | 30% | 15% for sender match + 15% for receiver match |
| **Time** | 20% | Linear decay within configurable time window |
| **Token** | 10% | Exact token symbol match (binary) |

### 2. Transaction State Machine

Claims follow a strict state machine with every transition logged in the audit trail.

```mermaid
stateDiagram-v2
    direction LR

    anchor: Anchor
    pending: Pending
    suggested: Suggested Match
    reconciled: Reconciled
    force: Force Reconciled
    unreconciled: Unreconciled

    note right of anchor: On-chain transactions<br/>Immutable source of truth

    [*] --> anchor: Blockchain Sync
    [*] --> pending: Import Claim

    pending --> suggested: Matching Engine
    suggested --> reconciled: Approve
    suggested --> pending: Reject
    pending --> force: Force Match
    pending --> unreconciled: Mark Unmatchable

    note right of suggested: Rejected pairs are<br/>permanently blocklisted
```

### 3. Drift Detection

Compares internal reconciled balances against actual on-chain balances per wallet/token pair to detect discrepancies.

```mermaid
graph TB
    subgraph Internal ["Internal Ledger"]
        RT[Reconciled Transactions]
        RT --> IB[Internal Balance<br/>SUM of reconciled tx effects]
    end

    subgraph Chain ["Blockchain"]
        SC[Smart Contract]
        SC --> OB[On-chain Balance<br/>ERC20 balanceOf]
    end

    IB --> DIFF{Compare}
    OB --> DIFF

    DIFF -->|drift < 1%| OK[No Alert]
    DIFF -->|drift 1-5%| WARN[Warning Alert]
    DIFF -->|drift > 5%| CRIT[Critical Alert]

    style OK fill:#a4cf5e,stroke:#93bf4d,color:#111
    style WARN fill:#ffb347,stroke:#e6a23c,color:#111
    style CRIT fill:#f45b5b,stroke:#dc3545,color:#fff
```

### 4. Wallet Risk Scoring

Behavioral anomaly detection assigns a risk score (0-100) per wallet based on transaction patterns.

```mermaid
graph LR
    TX[New Transaction] --> F1[New Counterparty<br/>+30 points]
    TX --> F2[Amount Anomaly<br/>+30 points<br/>z-score based]
    TX --> F3[New Token<br/>+20 points]
    TX --> F4[Time Anomaly<br/>+20 points<br/>1-5am UTC]

    F1 --> RS[Risk Score<br/>0-100]
    F2 --> RS
    F3 --> RS
    F4 --> RS

    RS -->|< 40| LOW[Low Risk]
    RS -->|40-70| MED[Medium Risk]
    RS -->|> 70| HIGH[High Risk]

    style LOW fill:#a4cf5e,stroke:#93bf4d,color:#111
    style MED fill:#ffb347,stroke:#e6a23c,color:#111
    style HIGH fill:#f45b5b,stroke:#dc3545,color:#fff
```

### 5. Audit Trail

Append-only log capturing every action with before/after state snapshots. Never updated, never deleted.

```mermaid
graph LR
    A1[Create Claim] --> AL[(Audit Log)]
    A2[Suggest Match] --> AL
    A3[Approve Match] --> AL
    A4[Reject Match] --> AL
    A5[Force Reconcile] --> AL
    A6[Update Config] --> AL

    AL --> |Each entry stores| D[Timestamp + Actor<br/>+ Previous State<br/>+ New State<br/>+ Metadata]

    style AL fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## Reconciliation Flow — End to End

```mermaid
sequenceDiagram
    actor Op as Operator
    participant UI as Frontend
    participant API as Backend API
    participant ME as Matching Engine
    participant DB as PostgreSQL
    participant BC as Blockchain

    Note over Op,BC: Phase 1 — Data Ingestion
    Op->>UI: Click "Sync Anchors"
    UI->>API: POST /sync-anchors
    API->>BC: Fetch Transfer/Approval events
    BC-->>API: Event logs
    API->>DB: Upsert as anchors
    API-->>UI: {anchors_synced: 42}

    Op->>UI: Import claims (CSV/Manual)
    UI->>API: POST /claims
    API->>DB: Insert with status=pending
    API-->>UI: {imported: 15}

    Note over Op,BC: Phase 2 — Matching
    Op->>UI: Click "Run Matching"
    UI->>API: POST /run-matching
    API->>ME: Generate suggestions
    ME->>DB: Pre-filter candidates (SQL)
    ME->>ME: Score each pair (weighted algorithm)
    ME->>DB: Insert suggestions ≥ threshold
    API-->>UI: {new_suggestions: 8}

    Note over Op,BC: Phase 3 — Review & Reconcile
    Op->>UI: Review suggestion (score: 87.5)
    UI->>UI: Show breakdown chart
    Op->>UI: Click "Approve"
    UI->>API: POST /reconcile
    API->>DB: Update statuses → reconciled
    API->>DB: Insert audit log entry
    API-->>UI: Confirmation

    Note over Op,BC: Phase 4 — Monitoring
    API->>DB: Compute drift (internal vs on-chain)
    API->>BC: Fetch balanceOf()
    API-->>UI: Drift alerts + Risk scores
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript 5.8, Vite 7, Material-UI 7, Framer Motion, Recharts |
| **State** | Zustand, TanStack React Query |
| **Blockchain** | Wagmi v2, Viem, RainbowKit (Sepolia Testnet) |
| **Backend** | Node.js, Express 4, pg-promise |
| **Database** | PostgreSQL 16 (Docker) |
| **Validation** | Zod (shared schemas) |
| **Testing** | Vitest, React Testing Library, Cypress |

---

## Database Schema

```mermaid
erDiagram
    transactions {
        int id PK
        varchar tx_hash
        varchar source "onchain | local | csv | manual"
        varchar status "anchor | pending | reconciled | ..."
        varchar type "Transfer | Approval | Mint"
        varchar token_symbol
        numeric amount_gross
        numeric amount_net
        varchar sender_address
        varchar receiver_address
        bigint timestamp
        int matched_tx_id FK
        numeric match_score
        jsonb score_breakdown
        boolean force_reconciled
    }

    match_suggestions {
        int id PK
        int anchor_id FK
        int claim_id FK
        numeric score
        jsonb score_breakdown
        varchar status "pending | approved | rejected"
        timestamp reviewed_at
    }

    rejected_pairs {
        int id PK
        int anchor_id FK
        int claim_id FK
        text reason
    }

    audit_log {
        int id PK
        timestamp timestamp
        varchar action
        varchar entity_type
        int entity_id
        varchar actor
        jsonb previous_state
        jsonb new_state
    }

    wallet_balances {
        int id PK
        varchar wallet_address
        varchar token_symbol
        numeric internal_balance
        numeric onchain_balance
        numeric drift
        numeric drift_percentage
    }

    wallet_risk_scores {
        int id PK
        varchar wallet_address UK
        numeric risk_score
        jsonb risk_breakdown
    }

    matching_config {
        int id PK
        varchar key UK
        jsonb value
    }

    transactions ||--o| transactions : "matched_tx_id"
    match_suggestions }o--|| transactions : "anchor_id"
    match_suggestions }o--|| transactions : "claim_id"
    rejected_pairs }o--|| transactions : "anchor_id"
    rejected_pairs }o--|| transactions : "claim_id"
```

---

## API Endpoints

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/claims` | Import claims (manual or CSV array) |
| `GET` | `/api/v1/transactions` | List all transactions (paginated, filterable) |
| `GET` | `/api/v1/transactions/stats` | Aggregate stats (anchors, pending, reconciled) |
| `GET` | `/api/v1/transactions/:id` | Single transaction detail |
| `POST` | `/api/v1/sync-anchors` | Fetch on-chain events and store as anchors |

### Reconciliation
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/suggestions` | List match suggestions (filter by score, token, status) |
| `POST` | `/api/v1/run-matching` | Trigger the matching engine |
| `POST` | `/api/v1/reconcile` | Approve a match (or force reconcile) |
| `POST` | `/api/v1/reject` | Reject a match (adds to permanent blocklist) |
| `POST` | `/api/v1/batch-reconcile` | Approve multiple matches at once |

### Drift & Risk
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/drift` | All wallet drift summaries |
| `POST` | `/api/v1/drift/sync` | Force recompute drift for all wallets |
| `GET` | `/api/v1/risk` | All wallet risk scores |
| `POST` | `/api/v1/risk/recalculate` | Force recalculate risk scores |

### Audit & Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/audit` | Paginated audit logs (filterable) |
| `GET` | `/api/v1/config/matching` | Current matching configuration |
| `PUT` | `/api/v1/config/matching` | Update weights, tolerances, thresholds |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Docker Desktop** ([Install](https://www.docker.com/products/docker-desktop/))
- A Web3 wallet (MetaMask recommended)
- Sepolia testnet ETH ([Faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/fcreme/OnChainApp.git
cd OnChainApp

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### Start the Database

```bash
# Start PostgreSQL via Docker
npm run db:up

# Run migrations (creates all tables, indexes, triggers)
npm run db:migrate
```

### Run the Application

```bash
# Start both frontend and backend
npm run dev:all

# Or run separately:
npm run dev          # Frontend → http://localhost:5173
npm run dev:server   # Backend  → http://localhost:3001
```

### Verify Setup

```bash
# Health check
curl http://localhost:3001/api/v1/health
# → { "status": "ok", "database": "connected" }
```

---

## Project Structure

```
onchainapp/
├── src/                                 # Frontend (React + Vite)
│   ├── api/                             # API client layer
│   │   ├── client.ts                    # Fetch-based HTTP client
│   │   ├── transactions.ts              # Transaction endpoints
│   │   ├── reconciliation.ts            # Matching & suggestions
│   │   ├── audit.ts                     # Audit log queries
│   │   └── drift.ts                     # Drift & risk endpoints
│   ├── stores/                          # Zustand state management
│   │   ├── useReconciliationStore.ts    # Suggestions, matching, approve/reject
│   │   ├── useAuditStore.ts             # Audit log with filters
│   │   ├── useDriftStore.ts             # Drift & risk scores
│   │   └── useMatchConfigStore.ts       # Matching configuration
│   ├── pages/
│   │   ├── Dashboard.tsx                # Overview + drift alerts + risk widget
│   │   ├── Reconciliation.tsx           # Matching engine UI
│   │   ├── Audit.tsx                    # Audit trail viewer
│   │   ├── Settings.tsx                 # Matching config sliders
│   │   ├── Transfers.tsx                # Transaction history
│   │   └── components/
│   │       ├── reconciliation/          # Matching UI components
│   │       │   ├── SuggestionsTable.tsx
│   │       │   ├── MatchDetailDrawer.tsx
│   │       │   ├── ScoreBreakdownChart.tsx
│   │       │   ├── DriftAlertCard.tsx
│   │       │   ├── ClaimsImportDialog.tsx
│   │       │   └── BatchActionBar.tsx
│   │       └── audit/
│   │           └── AuditLogTable.tsx
│   └── lib/                             # Web3 config, contracts, utils
│
├── server/                              # Backend (Node + Express)
│   └── src/
│       ├── index.ts                     # Express entry point
│       ├── config/                      # Database, env, constants
│       ├── db/migrations/               # SQL migration files
│       ├── models/                      # TypeScript types + Zod schemas
│       ├── services/
│       │   ├── MatchingEngine.ts        # Pre-filter + weighted scoring
│       │   ├── ReconciliationService.ts # State machine transitions
│       │   ├── DriftService.ts          # Balance drift detection
│       │   ├── RiskScoringService.ts    # Behavioral anomaly detection
│       │   ├── AuditService.ts          # Append-only logging
│       │   ├── TransactionService.ts    # CRUD + candidate queries
│       │   └── BlockchainSyncService.ts # On-chain event fetching
│       ├── routes/                      # Express route handlers
│       └── middleware/                  # Error handling, Zod validation
│
└── docker-compose.yml                   # PostgreSQL + pgAdmin
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server (Vite) |
| `npm run dev:server` | Start backend dev server (Express) |
| `npm run dev:all` | Start both frontend + backend |
| `npm run build` | Build frontend for production |
| `npm run db:up` | Start PostgreSQL container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:migrate` | Run database migrations |
| `npm test` | Run frontend unit tests |
| `npm run test:server` | Run backend tests |
| `npm run type-check` | TypeScript type checking |

---

## Contract Addresses (Sepolia Testnet)

| Token | Address | Decimals |
|-------|---------|----------|
| DAI | `0x1D70D57ccD2798323232B2dD027B3aBcA5C00091` | 18 |
| USDC | `0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47` | 6 |

---

## License

MIT
