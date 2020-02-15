const axios = require("axios");

const index = async () => {
  let idArray = await createWallets();

  let steward = "0";
  let insurance = idArray[0];
  let hospital = idArray[1];

  // link steward to insurance, hospital
  await onboard(steward, insurance);
  await onboard(steward, hospital);

  let insuranceDID = await getVeriNym(steward, insurance);
  let hospitalDID = await getVeriNym(steward, hospital);

  await createCredentialDefinition(insurance, {
    "name": "policy_holder",
    "versionID": "0.1",
    "attributes": ["firstName", "lastName", "age", "gender", "nationalID"]
  });

  await createCredentialDefinition(hospital, {
    "name": "medical_invoice",
    "versionID": "0.1",
    "attributes": ["firstName", "lastName", "nationalID"]
  });

  print();
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