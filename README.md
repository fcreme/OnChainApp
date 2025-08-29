# Frontend Challenge

Create a **React app** that demonstrates blockchain integration and state management using React Context or Zustand. Keep it clean, simple, and well-structured.

---

## Requirements

### Core Features:

1. **Connect Wallet**: Enable wallet connection with RainbowKit, RabbyKit, or Reown.
2. **Network Detection**: Ensure the app detects the wrong network (e.g., Sepolia) and allows switching chains.
3. **Token Balances**:
    - Fetch and display human-readable `DAI` (18 decimals) and `USDC` (6 decimals) balances.
4. **Approve & Transfer**:
    - Inputs for specifying approval or transfer amounts.
    - Buttons for `APPROVE` and `TRANSFER` with validations and error messages (e.g., "Not enough funds").
5. **Event Table**:
    - Display transfer and approval events in a table with details (token, amount, sender, recipient, transaction hash).
6. **Mint Tokens**:
    - Add a `MINT` button to get test tokens.
7. **Unit Tests**: Add unit tests to ensure functionality.

### Bonus Features:

- **State Architecture**: Use a well-structured Zustand/Context store.
- **E2E Tests**: Add end-to-end tests for key workflows with Cypress.
- **UI/UX**:
    - Custom styling or Material-UI.
    - Responsive design with animations.
    - Buttons with loading states.

---

## Tech Stack

- **Framework**: Next.js or Vite
- **Routing**: React Router / Next router
- **State Management**: Zustand / React Context
- **Blockchain Libraries**: Viem / Wagmi
- **Wallet Integration**: RainbowKit, RabbyKit, Web3Modal
- **Code Quality**: Prettier, Linter
- **Language**: TypeScript

---

## Tools & Testnet Info

- **Etherscan**: Inspect contracts and methods.
- **Sepolia Testnet**:
    - Faucet: [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia)
    - ERC20 Contracts:
        - `DAI`: `0x1D70D57ccD2798323232B2dD027B3aBcA5C00091`
        - `USDC`: `0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47`

---

## Deliverables

1. **Repo**: Clean and organized structure with routes and components with a concise and commit history
2. **Docs**: A README explaining setup, key decisions, and usage.
3. **Functionality**:
    - Fetch balances and allowances.
    - Approve, Transfer and Mint tokens.
    - Display event logs in a table.

Note: The commit history will also be taken into account as part of the challenge.

Feel free to add your own creativity and ideas. Let’s see what you build!
