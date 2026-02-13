# TokenFlow - Modern DeFi Interface

A sophisticated React application for interacting with ERC20 tokens on the Ethereum Sepolia testnet. Built with a modern dark-themed UI featuring glassmorphism design, real-time blockchain integration, and comprehensive token management.

![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.1-purple?style=for-the-badge&logo=vite)
![Material-UI](https://img.shields.io/badge/Material--UI-7.3-blue?style=for-the-badge&logo=mui)

## Live Demo

**Deployed Application**: [View Live Demo](https://tokenflow-app.vercel.app/)

**GitHub Repository**: [Source Code](https://github.com/fcreme/tokenflow)

## Features

- **Multi-wallet Support** — Connect with MetaMask, WalletConnect, Coinbase Wallet, and more via RainbowKit
- **Network Detection** — Automatic Sepolia testnet detection with one-click chain switching
- **Token Balances** — Real-time DAI (18 decimals) and USDC (6 decimals) balance display with formatted numbers
- **Token Operations** — Approve, transfer, and mint tokens with Zod-powered form validation
- **Transaction Tracking** — Real-time event monitoring with Etherscan links and toast notifications
- **Dark Theme** — Glassmorphism UI with gradient animations and smooth transitions
- **Responsive Design** — Optimized for desktop, tablet, and mobile
- **State Management** — Zustand store with optimistic updates
- **Testing** — Unit tests (Vitest + React Testing Library) and E2E tests (Cypress)

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite 7 |
| **Blockchain** | Wagmi v2, Viem, RainbowKit |
| **UI** | Material-UI 7, Emotion, Framer Motion |
| **State** | Zustand, TanStack React Query |
| **Validation** | Zod |
| **Testing** | Vitest, React Testing Library, Cypress |
| **Tools** | ESLint, Prettier |

## Getting Started

### Prerequisites

- Node.js 18+
- A Web3 wallet (MetaMask recommended)
- Sepolia testnet ETH ([Get free test ETH](https://sepoliafaucet.com/))

### Installation

```bash
git clone https://github.com/fcreme/tokenflow.git
cd tokenflow
npm install
```

### Configuration (Optional)

```bash
cp env.example .env.local
```

Edit `.env.local` to add your WalletConnect Project ID if needed.

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Testing

```bash
npm test                # Unit tests
npm run test:coverage   # Coverage report
npm run test:e2e:open   # Cypress E2E
```

## Project Structure

```
src/
├── pages/
│   ├── Dashboard.tsx          # Main dashboard with balances, operations, events
│   ├── Transfers.tsx          # Transaction history page
│   ├── store/
│   │   └── useAppStore.ts     # Zustand store (balances, transactions, operations)
│   └── components/
│       ├── ConnectBar.tsx     # Wallet connection navbar
│       ├── BalancesCard.tsx   # Token balance display
│       ├── ActionsForm.tsx    # Approve/Transfer/Mint forms
│       ├── EventsTable.tsx    # Transaction events table
│       ├── NetworkStatus.tsx  # Network detection alerts
│       └── TransactionStatus.tsx  # Toast notifications
├── lib/
│   ├── web3.ts               # Wagmi config, wallet connectors
│   └── erc20.ts              # Contract addresses and ABI
└── theme.ts                   # Material-UI dark theme
```

## Contract Addresses (Sepolia Testnet)

| Token | Address | Decimals |
|-------|---------|----------|
| DAI | `0x1D70D57ccD2798323232B2dD027B3aBcA5C00091` | 18 |
| USDC | `0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47` | 6 |

## License

MIT
