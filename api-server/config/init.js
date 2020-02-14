const indy = require('indy-sdk');

const {getPoolGenesisTxnPath} = require('../utils');

const bootstrap = async () => {
  try {
    let poolName = 'indy_pool';
    console.log(`poolName: ${poolName}`);
    await indy.createPoolLedgerConfig(poolName, {
      "genesis_txn": await getPoolGenesisTxnPath(poolName)
    });
  } catch (e) {
    console.log(e);
    if (e.message !== "PoolLedgerConfigAlreadyExistsError") {
      throw e;
    }
  }

  await indy.setProtocolVersion(2);
};

bootstrap();