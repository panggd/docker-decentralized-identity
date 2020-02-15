const express = require("express");
const bodyParser = require("body-parser");

const CONSTANTS = require("./config/constants");
const LedgerService = require("./service/ledger");
const createWallet = require("./service/create-wallet");
const createCredentialSchema = require("./service/create-credential-schema");

const app = express();
const port = 9000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  let applicationData = req.app.get("applicationData");
  res.append('Content-Type', 'application/json');
  res.send(applicationData);
});

app.post("/wallet/create", async (req, res) => await createWallet(req, res));
app.post("/credential-schema/create", async (req, res) => await createCredentialSchema(req, res));

app.listen(port, async () => {
  [ledger, applicationData] = await LedgerService.initialize(CONSTANTS.POOL_NAME);
  app.set("ledger", ledger);
  app.set("applicationData", applicationData);
  console.log(`API server listening on port ${port}!`);
});