const hre = require("hardhat");

async function main() {
  console.log("=== Testing SSCTransparency on Sepolia Testnet ===");

  const contractAddress = process.env.CONTRACT_ADDRESS || "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856";
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer address:", signer.address);
  console.log("Contract address:", contractAddress);

  const SSCTransparency = await hre.ethers.getContractFactory("SSCTransparency");
  const contract = SSCTransparency.attach(contractAddress);

  // 1. Verify Contract Ownership & Recorder Auth
  const owner = await contract.owner();
  console.log("Contract Owner:", owner);

  const isRecorder = await contract.authorizedRecorders(signer.address);
  console.log("Signer is Authorized Recorder:", isRecorder);

  if (!isRecorder && owner.toLowerCase() === signer.address.toLowerCase()) {
    console.log("Authorizing signer as recorder...");
    const authTx = await contract.setAuthorizedRecorder(signer.address, true);
    await authTx.wait();
    console.log("Signer authorized successfully.");
  }

  // 2. Prepare Unique Test Data
  const testId = "SSC-TEST-" + Date.now();
  const txKey = hre.ethers.sha256(hre.ethers.toUtf8Bytes(testId));
  const recordHash = hre.ethers.sha256(hre.ethers.toUtf8Bytes(JSON.stringify({
    amount: "150.00",
    test_id: testId,
    timestamp: new Date().toISOString()
  })));
  const amountCentavos = 15000n; // 150.00 PHP in centavos
  const timestamp = BigInt(Math.floor(Date.now() / 1000));

  console.log(`\nSubmitting live on-chain record for ${testId}...`);
  console.log("txKey:", txKey);
  console.log("recordHash:", recordHash);
  console.log("amount (centavos):", amountCentavos.toString());
  console.log("timestamp:", timestamp.toString());

  // 3. Record on Sepolia
  const tx = await contract.recordTransaction(txKey, recordHash, amountCentavos, timestamp);
  console.log("Transaction broadcasted! Tx Hash:", tx.hash);
  console.log("Etherscan URL: https://sepolia.etherscan.io/tx/" + tx.hash);

  console.log("Waiting for block confirmation...");
  const receipt = await tx.wait(1);
  console.log(`Confirmed in block #${receipt.blockNumber}! Gas used: ${receipt.gasUsed.toString()}`);

  // 4. Verify on-chain data retrieval
  console.log("\nVerifying stored data from Ethereum Sepolia...");
  const exists = await contract.transactionExists(txKey);
  console.log("transactionExists:", exists);

  const hashExists = await contract.recordHashExists(recordHash);
  console.log("recordHashExists:", hashExists);

  const record = await contract.getTransaction(txKey);
  console.log("On-Chain Retieved Record:");
  console.log("  recordHash:", record.recordHash);
  console.log("  amount:", record.amount.toString());
  console.log("  timestamp:", record.timestamp.toString());
  console.log("  exists:", record.exists);

  if (record.recordHash.toLowerCase() === recordHash.toLowerCase() && record.exists === true) {
    console.log("\n>>> LIVE BLOCKCHAIN VERIFICATION SUCCESSFUL! <<<");
  } else {
    throw new Error("On-chain verification hash mismatch!");
  }
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
