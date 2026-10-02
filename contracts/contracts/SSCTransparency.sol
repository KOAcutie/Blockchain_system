// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SSCTransparency
 * @notice Supreme Student Council Fee Collection & Financial Transparency Verification Contract.
 * @dev Stores ONLY non-PII cryptographic record hashes (SHA-256 digests), amounts, and timestamps.
 *      Never stores student names, student IDs, emails, passwords, or private documents on-chain.
 */
contract SSCTransparency {
    struct TransactionRecord {
        bytes32 recordHash;
        uint256 amount;
        uint256 timestamp;
        bool exists;
    }

    address public owner;
    mapping(address => bool) public authorizedRecorders;

    mapping(bytes32 => TransactionRecord) private recordsByTxKey;
    mapping(bytes32 => bool) private recordedHashes;

    event RecorderAuthorizationUpdated(address indexed account, bool authorized);

    event TransactionRecorded(
        bytes32 indexed txKey,
        bytes32 indexed recordHash,
        uint256 amount,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "SSCTransparency: caller is not the owner");
        _;
    }

    modifier onlyAuthorizedRecorder() {
        require(
            msg.sender == owner || authorizedRecorders[msg.sender],
            "SSCTransparency: caller is not an authorized recorder"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedRecorders[msg.sender] = true;
        emit RecorderAuthorizationUpdated(msg.sender, true);
    }

    /**
     * @notice Authorize or revoke an address to record official SSC transaction hashes.
     */
    function setAuthorizedRecorder(address recorder, bool authorized) external onlyOwner {
        require(recorder != address(0), "SSCTransparency: invalid recorder address");
        authorizedRecorders[recorder] = authorized;
        emit RecorderAuthorizationUpdated(recorder, authorized);
    }

    /**
     * @notice Record a verified SSC transaction hash on-chain.
     * @param txKey Deterministic bytes32 hash of the application transaction_id (e.g. SHA-256("SSC-2026-000001"))
     * @param recordHash Deterministic SHA-256 hash of canonical transaction data
     * @param amount Transaction amount in integer units (e.g., centavos)
     * @param timestamp Unix timestamp when the transaction was confirmed
     */
    function recordTransaction(
        bytes32 txKey,
        bytes32 recordHash,
        uint256 amount,
        uint256 timestamp
    ) external onlyAuthorizedRecorder {
        require(txKey != bytes32(0), "SSCTransparency: txKey cannot be zero");
        require(recordHash != bytes32(0), "SSCTransparency: recordHash cannot be zero");
        require(amount > 0, "SSCTransparency: amount must be greater than zero");
        require(timestamp > 0, "SSCTransparency: timestamp must be greater than zero");
        require(!recordsByTxKey[txKey].exists, "SSCTransparency: transaction already recorded");
        require(!recordedHashes[recordHash], "SSCTransparency: recordHash already recorded");

        recordsByTxKey[txKey] = TransactionRecord({
            recordHash: recordHash,
            amount: amount,
            timestamp: timestamp,
            exists: true
        });
        recordedHashes[recordHash] = true;

        emit TransactionRecorded(txKey, recordHash, amount, timestamp);
    }

    /**
     * @notice Retrieve an on-chain transaction record by its txKey.
     */
    function getTransaction(
        bytes32 txKey
    )
        external
        view
        returns (
            bytes32 recordHash,
            uint256 amount,
            uint256 timestamp,
            bool exists
        )
    {
        TransactionRecord memory rec = recordsByTxKey[txKey];
        return (rec.recordHash, rec.amount, rec.timestamp, rec.exists);
    }

    /**
     * @notice Check whether a transaction key has been recorded on-chain.
     */
    function transactionExists(bytes32 txKey) external view returns (bool) {
        return recordsByTxKey[txKey].exists;
    }

    /**
     * @notice Check whether a specific recordHash has been recorded on-chain.
     */
    function recordHashExists(bytes32 recordHash) external view returns (bool) {
        return recordedHashes[recordHash];
    }
}
