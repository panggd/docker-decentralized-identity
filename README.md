# docker-decentralized-identity

### Overview
This is a project to explore the use case of decentralized identity with HyperLedger Indy.

## Prerequisites
* NodeJS, latest version
* NPM,latest version
* Docker desktop client, latest version

## Techology Stack
1. NodeJS, latest version
2. ExpressJS, latest version
3. HyperLedger Indy, latest version
4. Docker, latest version

## Architecture Design
### Microservices
I decided to approach this from the business perspective and identify what are the key RESTful API and develop microservices using ExpressJS. This will help to decouple the front-end application (yet to implement) and the business logic.

### Distributed Ledger
To understand decentralized identity, HyperLedger Indy seem to be a popular choice. Therefore, I use that as the DL database to store the decentralized identities, credentials, schemas and credential definitions.

## Further improvements
- To scale, it will be good to introduce queues in front of each API endpoint, so this allow to regulate the flow or extend to other work flows.

- Tighten the API endpoint security with OAuth, JWT token.

- In general, take the solution to any cloud provider will be a great idea, there are a lot of managed services that help with infrastructure setup, scaling, security and resource management.

## Initialization
We need to first run the docker container before testing.
1. At the project root folder level, run **./run.sh**
2. Wait for run.sh to complete. Wait for **API server listening on port 9000!**

### USE CASE 0 - Normal use case
1. **Stop and run ./run.sh** to flush and reset the docker container.
2. At api-server folder, run **node tests 0**

Results should look like this:
```
$ node tests 0
== USE CASE 0: NORMAL ==
Creating wallets for steward, insurance, hospital and insurer
Onboarding insurance with steward
Onboarding hospital with steward
Create a policy credential definition for insurance
Create a medical invoice credential definition for hospital
Onboard insurer for insurance
Onboard insurer for hospital
Insurer register for policy with insurance
Insurer get medical invoice from hospital
Insurer file medical claim to insurance

APPLICATION IS VERIFIED
```

### USE CASE 1 - Missing medical invoice use case
1. **Stop and run ./run.sh** to flush and reset the docker container.
2. At api-server folder, run **node tests 1**

Results should look like this:
```
$ node tests 1
== USE CASE 1: MISSING MEDICAL CLAIM ==
Creating wallets for steward, insurance, hospital and insurer
Onboarding insurance with steward
Onboarding hospital with steward
Create a policy credential definition for insurance
Create a medical invoice credential definition for hospital
Onboard insurer for insurance
Onboard insurer for hospital
Insurer register for policy with insurance
Insurer file medical claim to insurance

UNABLE TO VERIFY THIS APPLICATION. REASON: UNABLE TO GET CREDENTIAL FOR INVOICENO
```

### USE CASE 2 - Tampering proof use case
This use case is special as it involve tampering the created proof.
See [create-application.js:L139](./api-server/services/create-application.js)
1. **Stop and run ./run.sh** to flush and reset the docker container.
2. At api-server folder, run **node tests 2**

Results should look like this:
```
$ node tests 2
== USE CASE 2: MEDICAL CLAIM PROOF TAMPERING ==
Creating wallets for steward, insurance, hospital and insurer
Onboarding insurance with steward
Onboarding hospital with steward
Create a policy credential definition for insurance
Create a medical invoice credential definition for hospital
Onboard insurer for insurance
Onboard insurer for hospital
Insurer register for policy with insurance
Insurer get medical invoice from hospital
Insurer file medical claim to insurance


UNABLE TO VERIFY THIS APPLICATION. REASON: ANONCREDSPROOFREJECTED
```

##Troubleshooting
- In case the docker fail to connect to ledger pool, just re-run **./run.sh**
- Alternatively, restart docker client helps too.
```
Attaching to docker-decentralized-identity_ledger_1, docker-decentralized-identity_api_1
ledger_1  | 2020-02-17 03:33:39,667 CRIT Set uid to user 1000
api_1     |
api_1     | > api-server@1.0.0 start /usr/src/app
api_1     | > node index.js
api_1     |
api_1     | Bootstrapping...
api_1     | Connected to indy_pool
api_1     | This will take a while, trying to open ledger pool...
api_1     | { IndyError: PoolLedgerTimeout
api_1     |     at Object.callback (/usr/src/app/node_modules/indy-sdk/src/wrapIndyCallback.js:15:10)
api_1     |   name: 'IndyError',
api_1     |   message: 'PoolLedgerTimeout',
api_1     |   indyCode: 307,
api_1     |   indyName: 'PoolLedgerTimeout',
api_1     |   indyCurrentErrorJson: null }
api_1     | (node:17) UnhandledPromiseRejectionWarning: IndyError: PoolLedgerTimeout
api_1     |     at Object.callback (/usr/src/app/node_modules/indy-sdk/src/wrapIndyCallback.js:15:10)
```

