const uuidv4 = require("uuid/v4");

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

    // TODO: Save to db
    applicationData[config.id] = {
      "uid": config.id,
      "name": requestorName,
      "walletConfig": config,
      "walletCredentials": credentials,
      "links": {}
    };
    req.app.set("applicationData", applicationData);

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