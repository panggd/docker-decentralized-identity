const requestCredential = async (req, res) => {
  let results = {};
  try {
    let ledger = req.app.get("ledger");
    let applicationData = req.app.get("applicationData");

    const fromID = req.body.fromID;
    const toID = req.body.toID;
    const schemaName = req.body.schemaName;
    const schemaVersion = req.body.schemaVersion;
    const credentialValues = req.body.credentialValues;

    let from = applicationData[fromID];
    let to = applicationData[toID];

    const fromWallet = await ledger.openWallet(from.walletConfig, from.walletCredentials);
    const toWallet = await ledger.openWallet(to.walletConfig, to.walletCredentials);

    const credentialDefinitionID =
      from["credentialDefinitions"][`${schemaName}-${schemaVersion}`]["id"];

    const credentialOfferJson = await ledger.issuerCreateCredentialOffer(
      fromWallet, credentialDefinitionID);

    const fromToKey = to["links"][`${fromID},${toID}`]["key"];
    const fromToDID = to["links"][`${fromID},${toID}`]["did"];
    const toFromKey = to["links"][`${toID},${fromID}`]["key"];
    const toFromDID = to["links"][`${toID},${fromID}`]["did"];

    const toFromVerkey = await ledger.keyForDid(
      applicationData.poolHandle,
      fromWallet,
      toFromDID);

    // Prepare credential offer
    console.log(`Preparing credential offer from ${from.name} to ${to.name}`);

    const authcryptedCredentialOffer = await ledger.cryptoAuthCrypt(
      fromWallet, fromToKey, toFromVerkey,
      Buffer.from(JSON.stringify(credentialOfferJson), "utf8"));

    const [credentialOfferFromVerkey, decryptedCredentialOfferJsonBuffer] =
      await ledger.cryptoAuthDecrypt(
        toWallet, toFromKey, Buffer.from(authcryptedCredentialOffer));

    const decryptedCredentialOffer = JSON.parse(decryptedCredentialOfferJsonBuffer);
    const decryptedCredentialOfferJson = JSON.stringify(decryptedCredentialOffer);

    const toMasterSecretID = await ledger.proverCreateMasterSecret(toWallet, null);

    const getCredDefRequest = await ledger.buildGetCredDefRequest(
      fromToDID, decryptedCredentialOffer["cred_def_id"]);

    const getCredDefResponse = await ledger.submitRequest(
      applicationData.poolHandle, getCredDefRequest);

    const [credDefId, credDef] = await ledger.parseGetCredDefResponse(getCredDefResponse);

    // Prepare Credential Request
    console.log(`Preparing credentials request from ${to.name} to ${from.name}`);

    const [credRequestJson, credRequestMetadataJson] = await ledger.proverCreateCredentialReq(
      toWallet, toFromDID, decryptedCredentialOfferJson,
      credDef, toMasterSecretID);

    const authcryptedCredentialRequest = await ledger.cryptoAuthCrypt(
      toWallet, toFromKey, credentialOfferFromVerkey,
      Buffer.from(JSON.stringify(credRequestJson), "utf8"));

    const [fromCredentialRequestVerkey, decryptedCredentialRequestJsonBuffer] = await ledger.cryptoAuthDecrypt(
      fromWallet, fromToKey, Buffer.from(authcryptedCredentialRequest));

    const decryptedCredentialRequest = JSON.parse(decryptedCredentialRequestJsonBuffer);
    const decryptedCredentialRequestJson = JSON.stringify(decryptedCredentialRequest);

    // Issue credentials
    console.log(`Issuing credentials from ${from.name} to ${to.name}`);

    const [credentialJson] = await ledger.issuerCreateCredential(
      fromWallet,
      credentialOfferJson,
      decryptedCredentialRequestJson,
      credentialValues,
      null,
      -1);

    const authcryptedCredJson = await ledger.cryptoAuthCrypt(
      fromWallet, fromToKey, fromCredentialRequestVerkey,
      Buffer.from(JSON.stringify(credentialJson), "utf8"));

    const [fromCredentialVerkey, decryptedCredentialBuffer] = await ledger.cryptoAuthDecrypt(
      toWallet, toFromKey, Buffer.from(authcryptedCredJson));

    const decryptedCredential = JSON.parse(decryptedCredentialBuffer);
    const decryptedCredentialJson = JSON.stringify(decryptedCredential);

    // Save credentials
    console.log(`Saving credentials for ${schemaName} to ${to.name}`);

    await ledger.proverStoreCredential(
      toWallet, null,
      credRequestMetadataJson,
      decryptedCredentialJson,
      credDef, null);

      console.log(`Credentials saved for ${to.name}`);

    await ledger.closeWallet(fromWallet);
    await ledger.closeWallet(toWallet);

    req.app.set("applicationData", applicationData);

    res.status(200);
  } catch (e) {
    console.log(e);
    results = {
      "message": "Failed to offer credentials."
    };
    res.status(500);
  }

  res.append("Content-Type", "application/json");
  res.send(results);
}

module.exports = createCredential;