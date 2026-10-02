const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();

  const SSCTransparency = await hre.ethers.getContractFactory("SSCTransparency");
  const contract = await SSCTransparency.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const deployTxHash = deployTx ? deployTx.hash : "";

  console.log("==========================================");
  console.log("SSCTransparency Smart Contract Deployed");
  console.log("==========================================");
  console.log(`Contract Address       : ${contractAddress}`);
  console.log(`Network                : ${networkName} (chainId: ${chainId})`);
  console.log(`Deployment Transaction : ${deployTxHash}`);
  console.log(`Deployer Address       : ${deployer.address}`);
  console.log("==========================================");

  // 1. Save deployment artifact in contracts/deployments/<network>.json and localhost.json
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const deploymentArtifact = {
    contractName: "SSCTransparency",
    contractAddress,
    network: networkName,
    chainId: Number(chainId),
    deploymentTransaction: deployTxHash,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentsDir, `${networkName}.json`),
    JSON.stringify(deploymentArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(deploymentsDir, "localhost.json"),
    JSON.stringify(deploymentArtifact, null, 2)
  );

  // 2. Copy compiled ABI to blockchain-api/app/abi/SSCTransparency.json
  const artifact = await hre.artifacts.readArtifact("SSCTransparency");
  const pythonAbiPath = path.join(
    __dirname,
    "..",
    "..",
    "blockchain-api",
    "app",
    "abi",
    "SSCTransparency.json"
  );
  if (fs.existsSync(path.dirname(pythonAbiPath))) {
    fs.writeFileSync(
      pythonAbiPath,
      JSON.stringify(
        {
          contractName: artifact.contractName,
          abi: artifact.abi,
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
