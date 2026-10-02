# SSC Transparency — Smart Contracts (`/contracts`)

Hardhat + Solidity `0.8.24` project containing the **`SSCTransparency.sol`** smart contract.

## Smart Contract Design (`contracts/SSCTransparency.sol`)

### Stored Struct (`TransactionRecord`)
- `string transactionId` (e.g., `SSC-TX-2026-00001`)
- `bytes32 recordHash` (SHA-256 digest of `{transaction_id, fee_id, amount, timestamp}`)
- `uint256 amount`
- `uint256 timestamp`
- `address recordedBy`
- `bool exists`

> **Privacy Guarantee**: No student names, emails, or student IDs are ever stored on-chain.

### Core Functions
- `setAuthorizedRecorder(address recorder, bool authorized)` — `onlyOwner`
- `recordTransaction(string transactionId, bytes32 recordHash, uint256 amount, uint256 timestamp)` — `onlyAuthorized`
- `getTransaction(string transactionId)` — `external view`
- `transactionExists(string transactionId)` — `external view`
- `recordHashExists(bytes32 recordHash)` — `external view`

## Setup & Commands

```powershell
cd contracts
npm install
```

### Compile Contract
```powershell
npx hardhat compile
```

### Run Unit Tests
```powershell
npx hardhat test
```

### Start Local Hardhat Node & Deploy
```powershell
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

Running `scripts/deploy.js` automatically saves deployment metadata to `deployments/localhost.json` and syncs the contract ABI to `../blockchain-api/app/abi/SSCTransparency.json`.
