const onboard = async (req, res) => {
  let results = {};
  try {
    let ledger = req.app.get("ledger");
    let applicationData = req.app.get("applicationData");

    const fromID = req.body.fromID;
    const toID = req.body.toID;

    let from = applicationData[fromID];
    let to = applicationData[toID];

    // Establish did, verKey for From > To
    const fromWallet = await ledger.openWallet(from.walletConfig, from.walletCredentials);
    const [fromToDID, fromToKey] = await ledger.createAndStoreMyDid(fromWallet, {});

    const fromToNymRequest = await ledger.buildNymRequest(
      from.did, fromToDID, fromToKey, null, null);
    console.log(`Created request to build an onboard NYM request from ${from.name} to ${to.name}`);

    const fromToRequestResult = await ledger.signAndSubmitRequest(
      applicationData.poolHandle, fromWallet, from.did, fromToNymRequest);
    console.log(["Signed and submitted request", fromToRequestResult]);

    // Establish did, verKey for To > From
    const connectionRequest = {
      did: fromToDID,
      nonce: 123456789
    };

    const toWallet = await ledger.openWallet(to.walletConfig, to.walletCredentials);
    const [toFromDID, toFromKey] = await ledger.createAndStoreMyDid(toWallet, {});
    const fromToVerkey = await ledger.keyForDid(
      applicationData.poolHandle, toWallet, connectionRequest.did);

    const connectionResponse = JSON.stringify({
      "did": toFromDID,
      "verkey": toFromKey,
      "nonce": connectionRequest["nonce"]
    });

    const anoncryptedConnectionResponse = await ledger.cryptoAnonCrypt(
      fromToVerkey, Buffer.from(connectionResponse, "utf8"));
    const decryptedConnectionResponse = JSON.parse(Buffer.from(
      await ledger.cryptoAnonDecrypt(fromWallet, fromToKey, anoncryptedConnectionResponse)
    ));

    if (connectionRequest["nonce"] !== decryptedConnectionResponse["nonce"]) {
      throw Error("nonces mismatch!");
    }

    const toFromNymRequest = await ledger.buildNymRequest(
      from.did,
      decryptedConnectionResponse["did"],
      decryptedConnectionResponse["verkey"],
      null, null);
    console.log(`Created request to build an onboard NYM request from ${to.name} to ${from.name}`);

    const toFromRequestResult = await ledger.signAndSubmitRequest(
      applicationData.poolHandle, fromWallet, from.did, toFromNymRequest);
    console.log(["Signed and submitted request", toFromRequestResult]);

    to["links"][`${fromID},${toID}`] = {
      "did": fromToDID,
      "key": fromToKey,
    };
    to["links"][`${toID},${fromID}`] = {
      "did": toFromDID,
      "key": toFromKey,
    };

    applicationData[toID] = to;
    req.app.set("applicationData", applicationData);

    ledger.closeWallet(fromWallet);
    ledger.closeWallet(toWallet);

    results = {
      "message": "Success"
    };

    res.status(204);
  } catch (e) {
    if (e.message !== "WalletAlreadyOpenedError") {
      console.log(e);
      results = {
        "message": "Failed to create NYM request."
      };
      res.status(500);
    }
  }

  res.append("Content-Type", "application/json");
  res.send(results);
};

module.exports = onboard;