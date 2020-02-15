const CONSTANTS = {
  POOL_NAME: 'indy_pool',
  WALLETS: {
    STEWARD: {
      NAME: "Steward Agent",
      CONFIG: { 'id': '39e19703-f275-4102-ae17-8db16dd670a1' },
      CREDENTIALS: { 'key': 'yezST2w3GT7pLpbU' },
      DID_SEED: '000000000000000000000000Steward1'
    },
    NON_STEWARD: {
      INSURANCE: {
        NAME: "Insurance Agent",
        CONFIG: { 'id': '566c1ade-ba2b-423b-a979-5fb656fcca7b' },
        CREDENTIALS: { 'key': 'kTA5jrtHBJHZTFqU' },
        DID_SEED: '000000000000000000000000Insurance'
      },
      HOSPITAL: {
        NAME: "Hospital Agent",
        CONFIG: { 'id': 'c0dd1536-47df-4ecb-a564-d4b04c102de4' },
        CREDENTIALS: { 'key': 'zTsvjgTX9jAp7s9g' },
        DID_SEED: '000000000000000000000000Hospital'
      }
    }
  }
};

module.exports = CONSTANTS;