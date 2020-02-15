const ledger = require("indy-sdk");
const CONSTANTS = require("../config/constants");
const { getPoolGenesisTxnPath } = require("../utils");

module.exports = LedgerService = {
  initialize: async (poolName) => {

    let applicationData = {};

    console.log("Bootstrapping...");

    // Connect to ledger pool
    try {
      let config = {
        "genesis_txn": await getPoolGenesisTxnPath(poolName)
      };
      await ledger.createPoolLedgerConfig(poolName, config);
      console.log(`Connected to ${poolName}`);
      console.log("This will take a while, trying to open ledger pool...");
    } catch (e) {
      if (e.message !== "PoolLedgerConfigAlreadyExistsError") {
        console.log(e);
        throw e;
      }
    }

    await ledger.setProtocolVersion(2);

    let poolHandle = null;
    try {
      poolHandle = await ledger.openPoolLedger(poolName);
      applicationData["poolHandle"] = poolHandle;
      console.log(`Opened pool ledger ${poolName}`);
    } catch (e) {
      console.log(e);
      throw e;
    }

    try {
      await ledger.createWallet(
        CONSTANTS.STEWARD.CONFIG,
        CONSTANTS.STEWARD.CREDENTIALS);

      const stewardWallet = await ledger.openWallet(
        CONSTANTS.STEWARD.CONFIG,
        CONSTANTS.STEWARD.CREDENTIALS);

      const stewardDidInfo = {
        "seed": CONSTANTS.STEWARD.DID_SEED
      };

      const [stewardDid, stewardVerKey] = await ledger.createAndStoreMyDid(
        stewardWallet, stewardDidInfo);

      applicationData["0"] = {
        "uid": "0",
        "name": "Steward",
        "wallet": stewardWallet,
        "walletConfig": CONSTANTS.STEWARD.CONFIG,
        "walletCredentials": CONSTANTS.STEWARD.CREDENTIALS,
        "did": stewardDid
      };

      await ledger.closeWallet(stewardWallet);
    } catch (e) {
      if (e.message !== "WalletAlreadyExistsError") {
        console.log(e);
        throw e;
      }
    }

    return [ledger, applicationData];
  }
}