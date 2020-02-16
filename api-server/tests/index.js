const axios = require("axios");

const index = async () => {
  try {
    console.log("Creating wallets for steward, insurance, hospital and insurer");
    let idArray = await createWallets();

    let steward = "0";
    let insurance = idArray[0];
    let hospital = idArray[1];
    let gin = idArray[2];

    // link steward to insurance, hospital
    console.log("Onboarding insurance with steward");
    await onboard(steward, insurance);

    console.log("Onboarding hospital with steward");
    await onboard(steward, hospital);

    await getVeriNym(steward, insurance);
    await getVeriNym(steward, hospital);

    console.log("Create a policy credential definition for insurance");
    await createCredentialDefinition(insurance, {
      "name": "policy_holder",
      "versionID": "0.1",
      "attributes": ["firstName", "lastName", "age", "gender", "nationalID"]
    });

    console.log("Create a medical invoice credential definition for hospital");
    await createCredentialDefinition(hospital, {
      "name": "medical_invoice",
      "versionID": "0.1",
      "attributes": ["firstName", "lastName", "nationalID"]
    });

    console.log("Onboard insurer for insurance");
    await onboard(insurance, gin);

    console.log("Onboard insurer for hospital");
    await onboard(hospital, gin);

    // Encoded value of non-integer attribute is SHA256 converted to decimal
    const firstName = "Alice";
    const lastName = "Garcia";
    const age = "37";
    const gender = "male";
    const nationalID = "123-45-6789";
    const firstNameEncoded = "1139481716457488690172217916278103335";
    const lastNameEncoded = "5321642780241790123587902456789123452";
    const ageEncoded = "37";
    const genderEncoded = "5944657099558967239210949258394887428692050081607692519917050";
    const nationalIDEncoded = "3124141231422543541";

    console.log("Insurer register for policy with insurance");
    const policyCredentialValues = {
      "firstName": { "raw": firstName, "encoded": firstNameEncoded },
      "lastName": { "raw": lastName, "encoded": lastNameEncoded },
      "age": { "raw": age, "encoded": ageEncoded },
      "gender": { "raw": gender, "encoded": genderEncoded },
      "nationalID": { "raw": nationalID, "encoded": nationalIDEncoded }
    };
    await createCredential(
      insurance, gin, "policy_holder", "0.1",
      policyCredentialValues);

    console.log("Insurer get medical invoice from hospital");
    const medicialInvoiceCredentialValues = {
      "firstName": { "raw": firstName, "encoded": firstNameEncoded },
      "lastName": { "raw": lastName, "encoded": lastNameEncoded },
      "nationalID": { "raw": nationalID, "encoded": nationalIDEncoded }
    };
    await createCredential(
      hospital, gin, "medical_invoice", "0.1",
      medicialInvoiceCredentialValues);

    print();
  } catch (e) {
    console.error(e, e.stack);
  }
};

const createWallets = async () => {
  const idArray = [];
  let insurance = await axios({
    method: "POST",
    url: "http://localhost:9000/wallet/create",
    data: {
      "requestorName": "ABC Insurance",
      "requestorPassword": "abcabc"
    }
  });
  insurance = insurance.data;
  idArray.push(insurance.uid);

  let hospital = await axios({
    method: "POST",
    url: "http://localhost:9000/wallet/create",
    data: {
      "requestorName": "XYZ Hospital",
      "requestorPassword": "xyzxyz"
    }
  });
  hospital = hospital.data;
  idArray.push(hospital.uid);

  let insurer = await axios({
    method: "POST",
    url: "http://localhost:9000/wallet/create",
    data: {
      "requestorName": "Gin",
      "requestorPassword": "gintonic"
    }
  });
  insurer = insurer.data;
  idArray.push(insurer.uid);

  return idArray;
};

const createCredentialDefinition = async (id, schema) => {
  await axios({
    method: "POST",
    url: "http://localhost:9000/credential-schema/create",
    data: {
      "requestorID": id,
      "credentialSchema": schema
    }
  });
};

const createCredential = async (
  fromID, toID, schemaName, schemaVersion, credentialValues) => {
  await axios({
    method: "POST",
    url: "http://localhost:9000/credential/create",
    data: {
      "fromID": fromID,
      "toID": toID,
      "schemaName": schemaName,
      "schemaVersion": schemaVersion,
      "credentialValues": credentialValues,
    }
  });
}

const onboard = async (fromID, toID) => {
  await axios({
    method: "POST",
    url: "http://localhost:9000/onboard",
    data: {
      "fromID": fromID,
      "toID": toID
    }
  });
};

const getVeriNym = async (fromID, toID) => {
  let response = await axios({
    method: "POST",
    url: "http://localhost:9000/verinym",
    data: {
      "fromID": fromID,
      "toID": toID
    }
  });
  response = response.data;
  return response.did;
};

const print = async () => {
  let response = await axios({
    method: "GET",
    url: "http://localhost:9000"
  });
  response = response.data;
  console.log(response);
};

index();