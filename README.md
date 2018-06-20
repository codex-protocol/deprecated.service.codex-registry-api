# Codex Protocol | Codex Registry API _(service.codex-registry-api)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Node API for Codex Registry

This is the Node API that serves as the off-chain backend for the [Codex Viewer](https://github.com/codex-protocol/web.codex-viewer). Among various other tasks, this API handles user authentication via [JSON Web Tokens](https://www.npmjs.com/package/jsonwebtoken), processes blockchain events via [EEL](https://github.com/codex-protocol/service.eel) & [Agenda](https://www.npmjs.com/package/agenda), manages MongoDB interactions via [Mongoose](https://www.npmjs.com/package/mongoose), and manages socket connections from the front end via [socket.io](https://www.npmjs.com/package/socket.io) & [Redis](https://www.npmjs.com/package/redis).

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)


## Security

It should be noted that this project requires the use of some "secret" variables that should be tailored to your development environment and never committed to the repository. These variables are read by [dotenv](https://www.npmjs.com/package/dotenv) and should be defined in a file called `.env` in the project root.

After cloning the repository, you should duplicate and rename `.env.example` to `.env`, then tailor the variables to your local environment accordingly:

```bash
$ cp .env.example .env
$ vi .env
```

`.env.example` has suitable local development defaults for most variables, so you should only have to set any missing values (i.e. `JWT_SECRET` & `SIGNER_PRIVATE_KEY`.) Descriptions for each variable are listed in [.env.example](.env.example).

## Install

There's a lot involved in setting up this project, so bear with me.

### Clone & Set Up Required Repositories

1. First, clone this repository and all dependency repositories (see below for more details):

```bash
$ git clone https://github.com/codex-protocol/service.codex-registry-api
$ git clone https://github.com/codex-protocol/contract.codex-registry
$ git clone https://github.com/codex-protocol/npm.ethereum-service
$ git clone https://github.com/codex-protocol/service.eel
```

**IMPORTANT NOTE:** It's necessary to have all of these repositories in the same directory, since our npm scripts assume this is the case.

1. Then install all npm packages in each repository:

```bash
$ cd service.codex-registry-api
$ npm install
$
$ cd ../contract.codex-registry
$ npm install
$
$ cd ../npm.ethereum-service
$ npm install
$
$ cd ../service.eel
$ npm install
```

2. After you've installed all npm packages, you will also need to [npm link](https://docs.npmjs.com/cli/link) the ethereum-service repository so that the API can use your locally-deployed smart contracts:

```bash
$ cd npm.ethereum-service
$ npm link
$
$ cd ../service.codex-registry-api
$ npm link @codex-protocol/ethereum-service
```

Now when you deploy the smart contracts locally, the API will be able to pull the ABIs from the linked ethereum-service repository.

**IMPORTANT NOTE:** every time you run `npm install` in the API repository, you will need to re-link the ethereum-service repository. For convenience, you can simply run the npm script `npm run link-all` to link, or `npm run install-and-link` to install and link in one step.

### Dependencies

Now you will need to install & set up some dependencies.

1. [MongoDB](https://www.mongodb.com/download-center)

MongoDB is where off-chain data (e.g. Codex Record metadata) is stored by the API. It's also used by [Agenda](https://www.npmjs.com/package/agenda) to track [jobs](src/jobs).

MongoDB can be installed via [Homebrew](https://brew.sh/):

```bash
$ brew install mongodb
```

or downloaded directly from [the MongoDB website](https://www.mongodb.com/download-center).


2. [Redis](https://www.npmjs.com/package/redis)

Redis is required for socket.io to emit events and track sockets in a multi-instance environment (for example cluster mode via [PM2](https://github.com/Unitech/pm2)). While Redis isn't really necessary for local development, at the moment it's required to run the application.

Redis can be installed via [Homebrew](https://brew.sh/):

```bash
$ brew install redis
```

or downloaded directly from [the Redis website](https://redis.io/).


3. [Ganache](http://truffleframework.com/ganache)

Ganache is a blockchain development application that allows you to deploy & test contracts locally.

You can download Ganache directly from [the Truffle Framework website](http://truffleframework.com/ganache).


4. [An AWS Account](https://aws.amazon.com/)

This API currently uses S3 to store files for Codex Record metadata, so you will need an AWS account that has access to write to an S3 bucket. You can sign up for a free AWS account [on the AWS website](https://aws.amazon.com/).

After you've set up your account, you will need to save your credentials to `~/.aws/credentials`. See [these instructions](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html) for further details.

```javascript
// @TODO: make S3 bucket configurable in .env
```

5. Link the [ethereum-service Repository](https://github.com/codex-protocol/npm.ethereum-service)

Make sure you've cloned the [ethereum-service repository](https://github.com/codex-protocol/npm.ethereum-service) and have `npm link`ed it so that the API will be able to use your locally-deployed smart contracts (see above).

For more information on this repository, see the [README](https://github.com/codex-protocol/npm.ethereum-service/blob/master/README.md).

6. Deploy [Codex Registry Smart Contracts](https://github.com/codex-protocol/contract.codex-registry)

After you've set up Ganache and linked the [ethereum-service](https://github.com/codex-protocol/npm.ethereum-service) repository, you will need to deploy the Codex Registry smart contracts. Make sure Ganache is running, and then run:

```bash
$ cd contract.codex-registry
$ npm run migrate:reset
```

This will make Truffle deploy the contracts to Ganache and copy over the built contract JSON files to the ethereum-service repository, where the API will be able to read them.


Wow that was a lot. You should now be able to run the API. Give yourself a pat on the back if you made it this far!


### Configure

After you've installed & set up all dependencies, you should now update your `.env` file to match your local environment (for example, change the MongoDB or Redis ports if you're not using the defaults.) See the [Security](#security) section for more details on the `.env` file.


## Usage

1. Start [EEL](https://github.com/codex-protocol/service.eel):

```bash
$ cd service.eel
$ npm start
```

2. Start the API:
```bash
$ cd service.codex-registry-api
$ npm start
```

Now you should be able to make requests to the API! To check and see if it's responding to requests, try and hit [http://localhost:3001/etc/health-check](http://localhost:3001/etc/health-check). You should receive an `HTTP 200` response.


## Maintainers

- [John Forrest](mailto:john@codexprotocol.com) ([@johnhforrest](https://github.com/johnhforrest))
- [Colin Wood](mailto:colin@codexprotocol.com) ([@Anaphase](https://github.com/Anaphase))
- [Shawn Price](mailto:shawn@codexprotocol.com) ([@sprice](https://github.com/sprice))


## Contribute

If you have any questions, feel free to reach out to one of the repository [maintainers](#maintainers) or simply [open an issue](https://github.com/codex-protocol/service.codex-registry-api/issues/new) here on GitHub.

[Pull Requests](https://github.com/codex-protocol/service.codex-registry-api/pulls) are not only allowed, but highly encouraged! All Pull Requests must pass CI checks (if applicable) and be approved by at least one repository [maintainer](#maintainers) before being considered for merge.

Codex Labs, Inc follows the [Contributor Covenant Code of Conduct](https://contributor-covenant.org/version/1/4/code-of-conduct).


## License

[GNU Affero General Public License v3.0 or later](LICENSE) © Codex Labs, Inc
