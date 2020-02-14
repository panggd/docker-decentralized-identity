const express = require('express');
const bodyParser = require('body-parser');
const indy = require('indy-sdk');

const {getPoolGenesisTxnPath} = require('./utils');

const app = express();
const port = 9000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/',(req, res) => {
  res.send('hello from api server');
});

app.listen(port, async () => {
  await bootstrap();
  console.log(`API server listening on port ${port}!`);
});

// Set up the hyperledge indy pool, steward wallet and DID
const bootstrap = async () => {
  try {
    let poolName = 'indy_pool';
    let config = {
      "genesis_txn": await getPoolGenesisTxnPath(poolName)
    };
    await indy.createPoolLedgerConfig(poolName, config);
  } catch (e) {
    console.log(e);
    if (e.message !== "PoolLedgerConfigAlreadyExistsError") {
      throw e;
    }
  }
  await indy.setProtocolVersion(2);
};