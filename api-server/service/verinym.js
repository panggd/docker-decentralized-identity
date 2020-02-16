const verinym = async (req, res) => {
  let results = {};
  try {
    let ledger = req.app.get("ledger");
    let applicationData = req.app.get("applicationData");

    const fromID = req.body.fromID;
    const toID = req.body.toID;

    let from = applicationData[fromID];
    let to = applicationData[toID];

    const fromWallet = await ledger.openWallet(from.walletConfig, from.walletCredentials);
    const toWallet = await ledger.openWallet(to.walletConfig, to.walletCredentials);

    const [toDid, toKey] = await ledger.createAndStoreMyDid(toWallet, {});

    const didInfoJson = JSON.stringify({
      "did": toDid,
      "verkey": toKey
    });

    const fromToKey = to["links"][`${fromID},${toID}`]["key"];
    const toFromKey = to["links"][`${toID},${fromID}`]["key"];
    const toFromDid = to["links"][`${toID},${fromID}`]["did"];

    const authcryptedDidInfo = await ledger.cryptoAuthCrypt(
      toWallet, toFromKey, fromToKey, Buffer.from(didInfoJson, "utf8"));

    const [senderVerkey, authdecryptedDidInfo] =
      await ledger.cryptoAuthDecrypt(
        fromWallet, fromToKey, Buffer.from(authcryptedDidInfo));

    const authdecryptedDidInfoJson = JSON.parse(Buffer.from(authdecryptedDidInfo));

    const retrievedVerkey = await ledger.keyForDid(
      applicationData.poolHandle, fromWallet, toFromDid);

    if (senderVerkey !== retrievedVerkey) {
      throw Error("Verkey mismatch!");
    }

    const toFromNymRequest = await ledger.buildNymRequest(
      from.did,
      authdecryptedDidInfoJson["did"],
      authdecryptedDidInfoJson["verkey"],
      null, "TRUST_ANCHOR");
    console.log(`Created request to build a veriNym NYM request from ${to.name} to ${from.name}`);

    const toFromRequestResult = await ledger.signAndSubmitRequest(
      applicationData.poolHandle, fromWallet, from.did, toFromNymRequest);
    console.log(["Signed and submitted request", toFromRequestResult]);

    to["did"] = authdecryptedDidInfoJson["did"];
    applicationData[toID] = to;
    req.app.set("applicationData", applicationData);

    ledger.closeWallet(fromWallet);
    ledger.closeWallet(toWallet);

    results = {
      "did": authdecryptedDidInfoJson["did"]
    };

    res.status(200);
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

module.exports = verinym;