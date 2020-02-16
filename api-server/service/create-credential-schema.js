const uuidv4 = require("uuid/v4");
const CONSTANTS = require("../config/constants");

const createCredentialSchema = async (req, res) => {
  let results = {};
  try {
    let ledger = req.app.get("ledger");
    let applicationData = req.app.get("applicationData");

    const credentialSchema = req.body.credentialSchema;
    const requestorID = req.body.requestorID;
    let requestor = applicationData[requestorID];

    const wallet = await ledger.openWallet(
      requestor.walletConfig,
      requestor.walletCredentials);

    let attributes = [];
    credentialSchema.attributes.forEach((attribute) => {
      attributes.push(attribute);
    });

    const [schemaID, schema] = await ledger.issuerCreateSchema(
      requestor.did,
      credentialSchema.name,
      credentialSchema.versionID,
      attributes);

    console.log(`Created credential schema ${requestorID} ${credentialSchema.name} ${credentialSchema.versionID}`);

    let schemas = (requestor["credentialSchemas"]) ?
      requestor["credentialSchemas"] : {};

    schemas[`${credentialSchema.name}-${credentialSchema.versionID}`] = {
      "id": schemaID,
      "schema": schema
    };

    requestor["credentialSchemas"] = schemas;

    const schemaRequest = await ledger.buildSchemaRequest(requestor.did, schema);
    console.log("Built schema request");

    const schemaRequestResult = await ledger.signAndSubmitRequest(
      applicationData.poolHandle,
      wallet,
      requestor.did,
      schemaRequest);
    console.log(["Signed and submitted schema request", schemaRequestResult]);

    const getSchemaRequest = await ledger.buildGetSchemaRequest(requestor.did, schemaID);
    const getSchemaResponse = await ledger.submitRequest(applicationData.poolHandle, getSchemaRequest);
    const [getSchemaId, getSchema] = await ledger.parseGetSchemaResponse(getSchemaResponse);
    console.log("Got schema response");

    const [credDefID, credDefJson] =
      await ledger.issuerCreateAndStoreCredentialDef(
        wallet,
        requestor.did,
        getSchema, "tag", "CL", "{\"support_revocation\": false}");

    let credentialDefinitions = (requestor["credentialDefinitions"]) ?
      requestor["credentialDefinitions"] : {};

    credentialDefinitions[`${credentialSchema.name}-${credentialSchema.versionID}`] = {
      "id": credDefID,
      "definition": credDefJson
    };

    requestor["credentialDefinitions"] = credentialDefinitions;

    const credDefRequest = await ledger.buildCredDefRequest(requestor.did, credDefJson);
    console.log("Built credential definition request");

    const credDefRequestResult = await ledger.signAndSubmitRequest(
      applicationData.poolHandle,
      wallet,
      requestor.did,
      credDefRequest);
    console.log(["Signed and submitted credential definition request",
      credDefRequestResult]);

    await ledger.closeWallet(wallet);

    // TODO: Save to db
    applicationData[requestor.uid] = requestor;
    req.app.set("applicationData", applicationData);

    res.status(204);
  } catch (e) {
    console.log(e);
    results = {
      "message": "Failed to create credential schema."
    };
    res.status(500);
  }

  res.append("Content-Type", "application/json");
  res.send(results);
};

module.exports = createCredentialSchema;