const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

function sha256Bytes32(input) {
  return "0x" + crypto.createHash("sha256").update(input).digest("hex");
}

describe("SSCTransparency Smart Contract", function () {
  async function deployFixture() {
    const [owner, recorder, unauthorizedUser] = await ethers.getSigners();
    const SSCTransparency = await ethers.getContractFactory("SSCTransparency");
    const contract = await SSCTransparency.deploy();
    await contract.waitForDeployment();
    return { contract, owner, recorder, unauthorizedUser };
  }

  it("1. Deploys contract and sets deployer as owner and authorized recorder", async function () {
    const { contract, owner } = await deployFixture();
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.authorizedRecorders(owner.address)).to.equal(true);
  });

  it("2. Allows owner to authorize a recorder and record a verified transaction hash", async function () {
    const { contract, owner, recorder } = await deployFixture();

    await expect(contract.connect(owner).setAuthorizedRecorder(recorder.address, true))
      .to.emit(contract, "RecorderAuthorizationUpdated")
      .withArgs(recorder.address, true);

    const txKey = sha256Bytes32("SSC-2026-000001");
    const recordHash = sha256Bytes32('{"amount":"150.00","fee_id":1,"transaction_id":"SSC-2026-000001"}');
    const amount = 15000;
    const timestamp = 1790762400;

    await expect(
      contract.connect(recorder).recordTransaction(txKey, recordHash, amount, timestamp)
    )
      .to.emit(contract, "TransactionRecorded")
      .withArgs(txKey, recordHash, amount, timestamp);

    expect(await contract.transactionExists(txKey)).to.equal(true);
    expect(await contract.recordHashExists(recordHash)).to.equal(true);

    const [storedHash, storedAmount, storedTimestamp, exists] =
      await contract.getTransaction(txKey);

    expect(storedHash).to.equal(recordHash);
    expect(storedAmount).to.equal(BigInt(amount));
    expect(storedTimestamp).to.equal(BigInt(timestamp));
    expect(exists).to.equal(true);
  });

  it("3. Rejects unauthorized recording attempts", async function () {
    const { contract, unauthorizedUser } = await deployFixture();
    const txKey = sha256Bytes32("SSC-2026-000002");
    const recordHash = sha256Bytes32("canonical-payload-2");

    await expect(
      contract
        .connect(unauthorizedUser)
        .recordTransaction(txKey, recordHash, 7500, 1790762400)
    ).to.be.revertedWith("SSCTransparency: caller is not an authorized recorder");
  });

  it("4. Rejects duplicate transaction keys and duplicate record hashes", async function () {
    const { contract, owner } = await deployFixture();
    const txKey1 = sha256Bytes32("SSC-2026-000003");
    const txKey2 = sha256Bytes32("SSC-2026-000004");
    const recordHash1 = sha256Bytes32("canonical-payload-3");
    const recordHash2 = sha256Bytes32("canonical-payload-4");

    await contract.connect(owner).recordTransaction(txKey1, recordHash1, 12000, 1790762400);

    // Duplicate txKey
    await expect(
      contract.connect(owner).recordTransaction(txKey1, recordHash2, 12000, 1790762400)
    ).to.be.revertedWith("SSCTransparency: transaction already recorded");

    // Duplicate recordHash
    await expect(
      contract.connect(owner).recordTransaction(txKey2, recordHash1, 12000, 1790762400)
    ).to.be.revertedWith("SSCTransparency: recordHash already recorded");
  });

  it("5. Returns exists=false for unrecorded transactions and validates invalid inputs", async function () {
    const { contract, owner } = await deployFixture();
    const unknownKey = sha256Bytes32("SSC-2026-999999");

    expect(await contract.transactionExists(unknownKey)).to.equal(false);
    const [, , , exists] = await contract.getTransaction(unknownKey);
    expect(exists).to.equal(false);

    const zeroBytes32 = ethers.ZeroHash;
    const validKey = sha256Bytes32("SSC-2026-000005");
    const validHash = sha256Bytes32("canonical-payload-5");

    await expect(
      contract.connect(owner).recordTransaction(zeroBytes32, validHash, 5000, 1790762400)
    ).to.be.revertedWith("SSCTransparency: txKey cannot be zero");

    await expect(
      contract.connect(owner).recordTransaction(validKey, zeroBytes32, 5000, 1790762400)
    ).to.be.revertedWith("SSCTransparency: recordHash cannot be zero");

    await expect(
      contract.connect(owner).recordTransaction(validKey, validHash, 0, 1790762400)
    ).to.be.revertedWith("SSCTransparency: amount must be greater than zero");

    await expect(
      contract.connect(owner).recordTransaction(validKey, validHash, 5000, 0)
    ).to.be.revertedWith("SSCTransparency: timestamp must be greater than zero");
  });
});
