'use strict';

const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const path = require('path');
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);

const defaultConfig = require('../defaults/config');
const packageJSON = require('../package.json');
const LiskServiceRepository = require('../lisk-service/repository');
const metaStore = require('../lisk-service/meta');
const {InvalidActionError, multisigAccountDidNotExistError, blockDidNotExistError, accountWasNotMultisigError, accountDidNotExistError, transactionBroadcastError} = require('./errors');
const {firstOrNull} = require('./utils');
const DEFAULT_MODULE_ALIAS = 'lisk_v3_dex_adapter';

class LiskV3DEXAdapter {

    constructor({alias, config = {}, appConfig, logger = console} = {config : {}, logger : console}) {
        this.options = {...defaultConfig, ...config};
        this.appConfig = appConfig;
        this.alias = alias || DEFAULT_MODULE_ALIAS;
        this.logger = logger;
        this.liskServiceRepo = new LiskServiceRepository({config, logger});
    }

    get dependencies() {
        return ['app'];
    }

    get info() {
        return {
            author: packageJSON.author,
            version: packageJSON.version,
            name: packageJSON.name,
        };
    }

    get events() {
        return ['bootstrap', 'chainChanges'];
    }

    get actions() {
        return {
            getStatus: {
                handler: () => ({
                    version: packageJSON.version,
                }),
            },
        };
    }

    isMultiSigAccount = (account) => account.summary.isMultisignature;

    getMultisigWalletMembers = async ({params: {walletAddress}}) => {
        try {
            const account = await this.liskServiceRepo.getAccountByAddress(walletAddress);
            if (account) {
                if (!this.isMultiSigAccount(account)) {
                    throw new InvalidActionError(accountWasNotMultisigError, `Account with address ${walletAddress} is not a multisig account`);
                }
                return account.keys.members.map(({address}) => address);
            }
            throw new InvalidActionError(multisigAccountDidNotExistError, `Error getting multisig account with address ${walletAddress}`);
        } catch (err) {
            if (err instanceof InvalidActionError) {
                throw err;
            }
            throw new InvalidActionError(multisigAccountDidNotExistError, `Error getting multisig account with address ${walletAddress}`, err);
        }
    };

    getMinMultisigRequiredSignatures = async ({params: {walletAddress}}) => {
        try {
            const account = await this.liskServiceRepo.getAccountByAddress(walletAddress);
            if (account) {
                if (!this.isMultiSigAccount(account)) {
                    throw new InvalidActionError(accountWasNotMultisigError, `Account with address ${walletAddress} is not a multisig account`);
                }
                return account.keys.numberOfSignatures;
            }
            throw new InvalidActionError(multisigAccountDidNotExistError, `Error getting multisig account with address ${walletAddress}`);
        } catch (err) {
            if (err instanceof InvalidActionError) {
                throw err;
            }
            throw new InvalidActionError(multisigAccountDidNotExistError, `Error getting multisig account with address ${walletAddress}`, err);
        }
    };

    getOutboundTransactions = async ({params: {walletAddress, fromTimestamp, limit, order}}) => {
        try {
            const transactions = await this.liskServiceRepo.getOutboundTransactions(walletAddress, fromTimestamp, limit, order);
            return transactions;
        } catch (err) {
            throw new InvalidActionError(accountDidNotExistError, `Error getting outbound transactions with account address ${walletAddress}`, err);
        }
    };

    getInboundTransactionsFromBlock = async ({params: {walletAddress, blockId}}) => {
        try {
            const transactions = await this.liskServiceRepo.getInboundTransactionsFromBlock(walletAddress, blockId);
            return transactions;
        } catch (err) {
            throw new InvalidActionError(accountDidNotExistError, `Error getting inbound transactions with account address ${walletAddress}`, err);
        }
    };

    getOutboundTransactionsFromBlock = async ({params: {walletAddress, blockId}}) => {
        try {
            const transactions = await this.liskServiceRepo.getOutboundTransactionsFromBlock(walletAddress, blockId);
            return transactions;
        } catch (err) {
            throw new InvalidActionError(accountDidNotExistError, `Error getting outbound transactions with account address ${walletAddress}`, err);
        }
    };

    getLastBlockAtTimestamp = async ({params: {timestamp}}) => {
        try {
            const block = await this.liskServiceRepo.getLastBlockBelowTimestamp(timestamp);
            if (block) {
                return block;
            }
            throw new InvalidActionError(blockDidNotExistError, `Error getting block below timestamp ${timestamp}`);
        } catch (err) {
            if (err instanceof InvalidActionError) {
                throw err;
            }
            throw new InvalidActionError(blockDidNotExistError, `Error getting block below timestamp ${timestamp}`, err);
        }
    };

    getMaxBlockHeight = async () => {
        try {
            const block = await this.liskServiceRepo.getLastBlock();
            if (block) {
                return block.height;
            }
            throw new InvalidActionError(blockDidNotExistError, 'Error getting block at max height');
        } catch (err) {
            if (err instanceof InvalidActionError) {
                throw err;
            }
            throw new InvalidActionError(blockDidNotExistError, 'Error getting block at max height', err);
        }
    };

    getBlocksBetweenHeights = async ({params: {fromHeight, toHeight, limit}}) => {
        try {
            const blocks = await this.liskServiceRepo.getBlocksBetweenHeight(fromHeight, toHeight, limit);
            return blocks;
        } catch (err) {
            throw new InvalidActionError(blockDidNotExistError, `Error getting block between heights ${fromHeight} - ${toHeight}`, err);
        }
    };

    getBlockAtHeight = async ({params: {height}}) => {
        try {
            const block = await this.liskServiceRepo.getBlockAtHeight(height);
            if (block) {
                return block;
            }
            throw new InvalidActionError(blockDidNotExistError, `Error getting block at height ${height}`);
        } catch (err) {
            if (err instanceof InvalidActionError) {
                throw err;
            }
            throw new InvalidActionError(blockDidNotExistError, `Error getting block at height ${height}`, err);
        }
    };

    postTransaction = async ({params: {transaction}}) => {
        try {
            return await this.liskServiceRepo.postTransaction({transaction});
        } catch (err) {
            throw new InvalidActionError(transactionBroadcastError, `Error broadcasting transaction to the lisk-service`, err);
        }
    };

    async load(channel) {
        this.channel = channel;

        await this.channel.invoke('app:updateModuleState', {
            [this.alias]: {},
        });

        channel.publish(`${this.alias}:bootstrap`);
    }

    async unload() {
    }

}

function wait(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}

module.exports = LiskV3DEXAdapter;
