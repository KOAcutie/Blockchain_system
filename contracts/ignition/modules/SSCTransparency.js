const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SSCTransparencyModule", (m) => {
  const sscTransparency = m.contract("SSCTransparency");
  return { sscTransparency };
});
