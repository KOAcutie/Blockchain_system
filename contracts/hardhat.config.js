require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CHAIN_ID = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : 31337;
const rawPrivateKey = (process.env.PRIVATE_KEY || "").trim();
const PRIVATE_KEY = rawPrivateKey
  ? (rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`)
  : undefined;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: RPC_URL,
      chainId: CHAIN_ID,
      ...(PRIVATE_KEY ? { accounts: [PRIVATE_KEY] } : {}),
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      ...(PRIVATE_KEY ? { accounts: [PRIVATE_KEY] } : {}),
      timeout: 120000,
    },
  },
};
