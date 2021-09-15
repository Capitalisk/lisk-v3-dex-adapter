'use strict';

const { getBase32AddressFromPublicKey } = require('@liskhq/lisk-cryptography');
const {toBuffer} = require('../common/utils')
const {InvalidActionError, multisigAccountDidNotExistError, blockDidNotExistError, accountWasNotMultisigError, accountDidNotExistError, transactionBroadcastError} = require('./errors');
const LiskServiceRepository = require('../lisk-service/repository');
const {getMatchingKeySignatures} = require('../common/signature');
const httpClient = require('../lisk-service/client');
const LiskWSClient = require('./client');
const {blockMapper, transactionMapper} = require('./mapper');
const packageJSON = require('../package.json');
const DEFAULT_MODULE_ALIAS = 'lisk_v3_dex_adapter';

class LiskV3DEXAdapter {

    MODULE_BOOTSTRAP_EVENT = 'bootstrap';
    MODULE_CHAIN_STATE_CHANGES_EVENT = 'chainChanges';
    MODULE_LISK_WS_CLOSE_EVENT = 'wsConnClose';

    constructor({alias, config = {}, logger = console} = {config: {}, logger: console}) {
        this.alias = alias || DEFAULT_MODULE_ALIAS;
        this.logger = logger;
        this.liskServiceRepo = new LiskServiceRepository({config, logger});
        this.liskWsClient = new LiskWSClient({config, logger});
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
        return [this.MODULE_BOOTSTRAP_EVENT, this.MODULE_CHAIN_STATE_CHANGES_EVENT, this.MODULE_LISK_WS_CLOSE_EVENT];
    }

    get actions() {
        return {
            getStatus: {handler: () => ({version: packageJSON.version})},
            getMultisigWalletMembers: {handler: this.getMultisigWalletMembers},
            getMinMultisigRequiredSignatures: {handler: this.getMinMultisigRequiredSignatures},
            getOutboundTransactions: {handler: this.getOutboundTransactions},
            getInboundTransactionsFromBlock: {handler: this.getInboundTransactionsFromBlock},
            getOutboundTransactionsFromBlock: {handler: this.getOutboundTransactionsFromBlock},
            getLastBlockAtTimestamp: {handler: this.getLastBlockAtTimestamp},
            getMaxBlockHeight: {handler: this.getMaxBlockHeight},
            getBlocksBetweenHeights: {handler: this.getBlocksBetweenHeights},
            getBlockAtHeight: {handler: this.getBlockAtHeight},
            postTransaction: {handler: this.postTransaction},
        };
    }

    isMultiSigAccount = (account) => account.summary && account.summary.isMultisignature;

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
            return await Promise.all(transactions.map(this.transactionMapper));
        } catch (err) {
            if (httpClient.notFound(err)) {
                return [];
            }
            throw new InvalidActionError(accountDidNotExistError, `Error getting outbound transactions with account address ${walletAddress}`, err);
        }
    };

    getInboundTransactionsFromBlock = async ({params: {walletAddress, blockId}}) => {
        try {
            const transactions = await this.liskServiceRepo.getInboundTransactionsFromBlock(walletAddress, blockId);
            return await Promise.all(transactions.map(this.transactionMapper));
        } catch (err) {
            if (httpClient.notFound(err)) {
                return [];
            }
            throw new InvalidActionError(accountDidNotExistError, `Error getting inbound transactions with account address ${walletAddress}`, err);
        }
    };

    getOutboundTransactionsFromBlock = async ({params: {walletAddress, blockId}}) => {
        try {
            const transactions = await this.liskServiceRepo.getOutboundTransactionsFromBlock(walletAddress, blockId);
            return await Promise.all(transactions.map(this.transactionMapper));
        } catch (err) {
            if (httpClient.notFound(err)) {
                return [];
            }
            throw new InvalidActionError(accountDidNotExistError, `Error getting outbound transactions with account address ${walletAddress}`, err);
        }
    };

    getLastBlockAtTimestamp = async ({params: {timestamp}}) => {
        try {
            const block = await this.liskServiceRepo.getLastBlockBelowTimestamp(timestamp);
            if (block) {
                return blockMapper(block);
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
            return blocks.map(blockMapper);
        } catch (err) {
            if (httpClient.notFound(err)) {
                return [];
            }
            throw new InvalidActionError(blockDidNotExistError, `Error getting block between heights ${fromHeight} - ${toHeight}`, err);
        }
    };

    getBlockAtHeight = async ({params: {height}}) => {
        try {
            const block = await this.liskServiceRepo.getBlockAtHeight(height);
            if (block) {
                return blockMapper(block);
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

    subscribeToBlockChange = async (wsClient, onBlockChangedEvent) => {
        const decodedBlock = (data) => wsClient.block.decode(Buffer.from(data.block, 'hex'));
        wsClient.subscribe('app:block:new', async data => {
            try {
                const block = decodedBlock(data);
                await onBlockChangedEvent('addBlock', block);
            } catch (err) {
                this.logger.error(`Error while processing the 'app:block:new' event:\n${err.stack}`);
            }
        });

        wsClient.subscribe('app:block:delete', async data => {
            try {
                const block = decodedBlock(data);
                await onBlockChangedEvent('removeBlock', block);
            } catch (err) {
                this.logger.error(`Error while processing the 'app:block:delete' event:\n${err.stack}`);
            }
        });
    };

    async load(channel) {
        this.channel = channel;

        await this.channel.invoke('app:updateModuleState', {
            [this.alias]: {},
        });

        await channel.publish(`${this.alias}:${this.MODULE_BOOTSTRAP_EVENT}`);
        const publishBlockChangeEvent = async (eventType, block) => {
            const eventPayload = {
                data: {
                    type: eventType,
                    block: {
                        timestamp: block.header.timestamp,
                        height: block.header.height,
                    },
                }
            };
            await channel.publish(`${this.alias}:${this.MODULE_CHAIN_STATE_CHANGES_EVENT}`, eventPayload);
        }
        const wsClient = await this.liskWsClient.createWsClient(true);
        await this.subscribeToBlockChange(wsClient, publishBlockChangeEvent);

        // For future reconnects, subscribe to block change
        this.liskWsClient.onConnected = async (wsClient) => {
            await this.subscribeToBlockChange(wsClient, publishBlockChangeEvent);
        }

        this.liskWsClient.onClosed = async (err) => {
            const errPayload = {
                data: {
                    type: "LiskNodeWsConnectionErr",
                    err
                }
            };
            await channel.publish(`${this.alias}:${this.MODULE_LISK_WS_CLOSE_EVENT}`, errPayload);
        }
    }

    async unload() {
        await this.liskWsClient.close();
    }

    _getSignedTransactionBytes = async (transactionId) => {
        const wsClient = await this.liskWsClient.createWsClient();
        const transaction = await wsClient.transaction.get(transactionId);
        const unsignedTransaction = {...transaction, signatures: []};
        return wsClient.transaction.encode(unsignedTransaction);
    };

    _signatureMapper = async ({id, sender, signatures}) => {
        if (signatures.length > 0) {
            const account = await this.liskServiceRepo.getAccountByAddress(sender.address);
            if (this.isMultiSigAccount(account)) {
                const {mandatoryKeys, optionalKeys} = account.keys;
                const publicKeys = Array.from(new Set([...mandatoryKeys, ...optionalKeys, sender.publicKey]));
                const transactionBytes = await this._getSignedTransactionBytes(id);
                return getMatchingKeySignatures(publicKeys, signatures, transactionBytes);
            }
        }
        return []
    };

    transactionMapper = async (transaction) => {
        const keySignatureMapping = await this._signatureMapper(transaction)
        transaction.signatures = keySignatureMapping.map(({publicKey, signature}) => {
            const signerAddress = getBase32AddressFromPublicKey(toBuffer(publicKey), "lsk")
            return {signerAddress, signature}
        })
        return transactionMapper(transaction)
    }
}

module.exports = LiskV3DEXAdapter;
