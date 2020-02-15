const uuidv4 = require("uuid/v4");
const CONSTANTS = require("../config/constants");

const createWallet = async (req, res) => {
  let results = {};
  try {
    let ledger = req.app.get("ledger");
    let applicationData = req.app.get("applicationData");

    const requestorName = req.body.requestorName;
    const requestorPassword = req.body.requestorPassword;

    const config = {
      "id": uuidv4()
    };

    const credentials = {
      "key": requestorPassword
    };

    await ledger.createWallet(config, credentials);
    const wallet = await ledger.openWallet(config, credentials);
    const [did, verKey] = await ledger.createAndStoreMyDid(wallet, "{}");

    // TODO: Save to db
    applicationData[config.id] = {
      "uid": config.id,
      "name": requestorName,
      "wallet": wallet,
      "walletConfig": config,
      "walletCredentials": credentials,
      "did": did,
      "verKey": verKey
    };

    const steward = applicationData[CONSTANTS.STEWARD.NAME];

    let nymRequest = await ledger.buildNymRequest(
      steward.did, did, verKey, null, "TRUST_ANCHOR");
    console.log(`Created request to build a NYM request from Steward to ${requestorName}`);

    await ledger.signAndSubmitRequest(
      applicationData.poolHandle, steward.wallet, steward.did, nymRequest);
    console.log("Signed and submitted request!");

    results = applicationData[config.id];

    res.status(200);
  } catch (e) {
    if (e.message !== "WalletAlreadyExistsError") {
      console.log(e);
      results = {
        "message": "Failed to create wallet."
      };
      res.status(500);
    }
  }

  res.append("Content-Type", "application/json");
  res.send(results);
};

module.exports = createWallet;