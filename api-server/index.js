const express = require("express");
const bodyParser = require("body-parser");
const ledger = require("indy-sdk");

const CONSTANTS = require("./config/constants");
const { getPoolGenesisTxnPath } = require("./utils");

const app = express();
const port = 9000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("hello from api server");
});

app.listen(port, async () => {
  await bootstrap();
  console.log(`API server listening on port ${port}!`);
});

// Set up the hyperledger ledger pool
// Create steward wallet
// Create steward DID
const bootstrap = async () => {
  let didRegistry = {};
  let poolHandle = null;

  console.log("Bootstrapping...");

  // Connect to ledger pool
  try {
    let config = {
      "genesis_txn": await getPoolGenesisTxnPath(CONSTANTS.POOL_NAME)
    };
    await ledger.createPoolLedgerConfig(CONSTANTS.POOL_NAME, config);
    console.log(`Connected to ${CONSTANTS.POOL_NAME}`);
  } catch (e) {
    console.log(e);
    if (e.message !== "PoolLedgerConfigAlreadyExistsError") {
      throw e;
    }
  }

  await ledger.setProtocolVersion(2);

  try {
    poolHandle = await ledger.openPoolLedger(CONSTANTS.POOL_NAME);
  } catch(e) {
    console.log(e);
    throw e;
  }

  // Setup wallet, did, verkey for Steward agent
  try {
    await ledger.createWallet(
      CONSTANTS.WALLETS.STEWARD.CONFIG,
      CONSTANTS.WALLETS.STEWARD.CREDENTIALS);

    let stewardWallet = await ledger.openWallet(
      CONSTANTS.WALLETS.STEWARD.CONFIG,
      CONSTANTS.WALLETS.STEWARD.CREDENTIALS);

    let stewardDidInfo = {
      "seed": CONSTANTS.WALLETS.STEWARD.DID_SEED
    };

    let [stewardDid, stewardVerKey] = await ledger.createAndStoreMyDid(
      stewardWallet, stewardDidInfo);

    didRegistry[CONSTANTS.WALLETS.STEWARD.NAME] = {
      "wallet": stewardWallet,
      "walletConfig": CONSTANTS.WALLETS.STEWARD.CONFIG,
      "walletCredentials": CONSTANTS.WALLETS.STEWARD.CREDENTIALS,
      "did": stewardDid,
      "verKey": stewardVerKey
    };
  } catch (e) {
    console.log(e);
    throw e;
  }

  // Setup wallet, did, verkey for non Steward agents
  // Establish connection with Steward
  let steward = didRegistry[CONSTANTS.WALLETS.STEWARD.NAME];
  let wallets = Object.values(CONSTANTS.WALLETS.NON_STEWARD);
  for (let i = 0; i < wallets.length; i++) {
    let currentWallet;
    let wallet = wallets[i];
    try {
      await ledger.createWallet(
        wallet.CONFIG,
        wallet.CREDENTIALS);

      currentWallet = await ledger.openWallet(
        wallet.CONFIG,
        wallet.CREDENTIALS);

      let [did, verKey] = await ledger.createAndStoreMyDid(
        currentWallet, "{}");

      didRegistry[wallet.NAME] = {
        "wallet": currentWallet,
        "walletConfig": wallet.CONFIG,
        "walletCredentials": wallet.CREDENTIALS,
        "did": did,
        "verKey": verKey
      };

      let nymRequest = await ledger.buildNymRequest(
        steward.did, did, verKey, null, "TRUST_ANCHOR");
      console.log(`Created request to build a NYM request from ${CONSTANTS.WALLETS.STEWARD.NAME} to ${wallet.NAME}`);

      await ledger.signAndSubmitRequest(
        poolHandle, steward.wallet, steward.did, nymRequest);
      console.log(`Signed and submitted request: ${nymRequest}`);
    } catch (e) {
      console.log(e);
      if (e.message !== "WalletAlreadyExistsError") {
        throw e;
      }
    }
  }

  console.log(didRegistry); // save to mongodb
};