const createApplication = async (req, res) => {
  let results = {};
  try {
    let ledger = req.app.get("ledger");
    let applicationData = req.app.get("applicationData");

    const insurerID = req.body.insurerID;
    const insuranceID = req.body.insuranceID;
    const hospitalID = req.body.hospitalID;
    const credentialDefinitions = req.body.credentialDefinitions;
    const testFraud = req.body.testFraud;

    let insurer = applicationData[insurerID];
    let insurance = applicationData[insuranceID];
    let hospital = applicationData[hospitalID];

    const insurerWallet = await ledger.openWallet(
      insurer.walletConfig, insurer.walletCredentials);

    const hospitalSchemaNameVersion = credentialDefinitions[hospitalID];
    const insuranceSchemaNameVersion = credentialDefinitions[insuranceID];

    const policyHolderSchema =
      insurance["credentialSchemas"][insuranceSchemaNameVersion];
    const medicalInvoiceSchema =
      hospital["credentialSchemas"][hospitalSchemaNameVersion];

    const policyHolderCredDef =
      insurance["credentialDefinitions"][insuranceSchemaNameVersion];
    const medicalInvoiceCredDef =
      hospital["credentialDefinitions"][hospitalSchemaNameVersion];

    // Prepare proof
    console.log(`Fraud test mode: ${testFraud}`);
    console.log("Preparing application proof request")
    const nonce = await ledger.generateNonce()
    const applicationProofRequestJson = {
      "nonce": nonce,
      "name": "Claim Application Proof",
      "version": "0.1",
      "requested_attributes": {
        "attr1_referent": {
          "name": "firstName"
        },
        "attr2_referent": {
          "name": "lastName"
        },
        "attr3_referent": {
          "name": "nationalID",
          "restrictions": [
            { "cred_def_id": policyHolderCredDef.id },
          ]
        },
        "attr4_referent": {
          "name": "invoiceNo",
          "restrictions": [
            { "cred_def_id": medicalInvoiceCredDef.id },
          ]
        }
      },
      "requested_predicates": {}
    };

    const applicationProofRequest = await ledger.proverSearchCredentialsForProofReq(
      insurerWallet, applicationProofRequestJson, null);

    let currentCredential;
    let attr1Credentials;
    let attr2Credentials;
    let attr3Credentials;
    let attr4Credentials;
    try {
      currentCredential = applicationProofRequestJson["requested_attributes"]["attr1_referent"]["name"];
      attr1Credentials = await ledger.proverFetchCredentialsForProofReq(
        applicationProofRequest, "attr1_referent", 10);
      attr1Credentials = attr1Credentials[0]["cred_info"];
      console.log(["attr1Credentials", attr1Credentials]);

      currentCredential = applicationProofRequestJson["requested_attributes"]["attr2_referent"]["name"];
      attr2Credentials = await ledger.proverFetchCredentialsForProofReq(
        applicationProofRequest, "attr2_referent", 10);
      attr2Credentials = attr2Credentials[0]["cred_info"];
      console.log(["attr2Credentials", attr2Credentials]);

      currentCredential = applicationProofRequestJson["requested_attributes"]["attr3_referent"]["name"];
      attr3Credentials = await ledger.proverFetchCredentialsForProofReq(
        applicationProofRequest, "attr3_referent", 10);
      attr3Credentials = attr3Credentials[0]["cred_info"];
      console.log(["attr3Credentials", attr3Credentials]);

      currentCredential = applicationProofRequestJson["requested_attributes"]["attr4_referent"]["name"];
      attr4Credentials = await ledger.proverFetchCredentialsForProofReq(
        applicationProofRequest, "attr4_referent", 10);
      attr4Credentials = attr4Credentials[0]["cred_info"];
      console.log(["attr4Credentials", attr4Credentials]);

      await ledger.proverCloseCredentialsSearchForProofReq(applicationProofRequest);
      console.log("Sent application proof request")
    } catch (e) {
      throw new Error(`Unable to get credential for ${currentCredential}`);
    }

    const applicationRequestedCredsJson = {
      "self_attested_attributes": {
        "attr1_referent": "Alice",
        "attr2_referent": "Garcia"
      },
      "requested_attributes": {
        "attr3_referent": {
          "cred_id": attr3Credentials["referent"],
          "revealed": true
        },
        "attr4_referent": {
          "cred_id": attr4Credentials["referent"],
          "revealed": true
        }
      },
      "requested_predicates": {}
    };

    let schemasJson = {};
    schemasJson[policyHolderSchema.id] = policyHolderSchema.schema;
    schemasJson[medicalInvoiceSchema.id] = medicalInvoiceSchema.schema;

    let credDefsJson = {};
    credDefsJson[policyHolderCredDef.id] = policyHolderCredDef.definition;
    credDefsJson[medicalInvoiceCredDef.id] = medicalInvoiceCredDef.definition;

    const applicationProofJson = await ledger.proverCreateProof(
      insurerWallet,
      applicationProofRequestJson,
      applicationRequestedCredsJson,
      insurer["masterSecretID"],
      schemasJson,
      credDefsJson,
      {});
    console.log("Created proof");

    if(testFraud) {
      console.log("Tampering attr 3 in generated proof");
      applicationProofJson["requested_proof"]["revealed_attrs"]["attr4_referent"]["raw"] = "123456789";
      applicationProofJson["requested_proof"]["revealed_attrs"]["attr4_referent"]["encoded"] = "123456789";
      console.log(applicationProofJson);
    }

    // Verify proof
    const isVerified = await ledger.verifierVerifyProof(
      applicationProofRequestJson,
      applicationProofJson,
      schemasJson,
      credDefsJson,
      {}, {});
    console.log(`Verify proof is tamper free completed - ${isVerified}`);

    await ledger.closeWallet(insurerWallet);

    req.app.set("applicationData", applicationData);

    results = {
      "message": `Application ${isVerified ? "is verified" : "fail verification"}`
    };

    res.status(200);
  } catch (e) {
    console.log(e);
    results = {
      "message": `Unable to verify this application. Reason: ${e.message}`
    };
    res.status(500);
  }

  res.append("Content-Type", "application/json");
  res.send(results);
}

module.exports = createApplication;