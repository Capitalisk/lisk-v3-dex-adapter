'use strict';

const {
  getBase32AddressFromPublicKey,
  getAddressFromBase32Address,
} = require('@liskhq/lisk-cryptography');
const {toBuffer} = require('../common/utils');
const {InvalidActionError, multisigAccountDidNotExistError, blockDidNotExistError, accountWasNotMultisigError, accountDidNotExistError, transactionBroadcastError} = require('./errors');
const LiskServiceRepository = require('../lisk-service/repository');
const httpClient = require('../lisk-service/client');
const LiskWSClient = require('lisk-v3-ws-client-manager');
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
        this.dexWalletAddress = config.dexWalletAddress;
        this.chainSymbol = config.chainSymbol || 'lsk';
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

    isMultisigAccount = (account) => account.summary && account.summary.isMultisignature;

    getMultisigWalletMembers = async ({params: {walletAddress}}) => {
        try {
            const account = await this.liskServiceRepo.getAccountByAddress(walletAddress);
            if (account) {
                if (!this.isMultisigAccount(account)) {
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
                if (!this.isMultisigAccount(account)) {
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
            const blocks = await this.liskServiceRepo.getBlocksBetweenHeights(fromHeight, toHeight, limit);
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
        const wsClient = await this.liskWsClient.createWsClient();

        let publicKeySignatures = {};
        for (let signaturePacket of transaction.signatures) {
            publicKeySignatures[signaturePacket.publicKey] = signaturePacket;
        }

        const signatures = this.dexMultisigPublicKeys.map((memberPublicKey) => {
            let signaturePacket = publicKeySignatures[memberPublicKey];
            return Buffer.from(signaturePacket ? signaturePacket.signature : '', 'hex');
        });

        let signedTxn = {
            moduleID: transaction.moduleID,
            assetID: transaction.assetID,
            fee: BigInt(transaction.fee),
            asset: {
                amount: BigInt(transaction.amount),
                recipientAddress: getAddressFromBase32Address(transaction.recipientAddress),
                data: transaction.message,
            },
            nonce: BigInt(transaction.nonce),
            senderPublicKey: Buffer.from(transaction.senderPublicKey, 'hex'),
            signatures,
            id: Buffer.from(transaction.id, 'hex'),
        };

        try {
            let response = await wsClient.transaction.send(signedTxn);
            if (!response || !response.transactionId) {
                throw new Error('Invalid transaction response');
            }
        } catch (err) {
            throw new InvalidActionError(transactionBroadcastError, `Error broadcasting transaction to the lisk network`, err);
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
        if (!this.dexWalletAddress) {
            throw new Error('Dex wallet address not provided in the config');
        }
        this.channel = channel;

        await this.channel.invoke('app:updateModuleState', {
            [this.alias]: {},
        });

        const account = await this.liskServiceRepo.getAccountByAddress(this.dexWalletAddress);
        const {mandatoryKeys, optionalKeys} = account.keys;
        this.dexMultisigPublicKeys = Array.from(new Set([...mandatoryKeys, ...optionalKeys]));

        await channel.publish(`${this.alias}:${this.MODULE_BOOTSTRAP_EVENT}`);

        const publishBlockChangeEvent = async (eventType, block) => {
            const eventPayload = {
                type: eventType,
                block: {
                    timestamp: block.header.timestamp,
                    height: block.header.height,
                },
            };
            await channel.publish(`${this.alias}:${this.MODULE_CHAIN_STATE_CHANGES_EVENT}`, eventPayload);
        };
        const wsClient = await this.liskWsClient.createWsClient(true);
        this.networkIdentifier = wsClient._nodeInfo.networkIdentifier;

        await this.subscribeToBlockChange(wsClient, publishBlockChangeEvent);

        // For future reconnects, subscribe to block change
        this.liskWsClient.onConnected = async (wsClient) => {
            await this.subscribeToBlockChange(wsClient, publishBlockChangeEvent);
        };

        this.liskWsClient.onClosed = async (err) => {
            const errPayload = {
                type: 'LiskNodeWsConnectionErr',
                err,
            };
            await channel.publish(`${this.alias}:${this.MODULE_LISK_WS_CLOSE_EVENT}`, errPayload);
        };
    }

    async unload() {
        await this.liskWsClient.close();
    }

    transactionMapper = async (transaction) => {
        let sanitizedTransaction = {
          ...transaction,
          signatures: this.dexMultisigPublicKeys.map((publicKey, index) => {
              const signerAddress = getBase32AddressFromPublicKey(toBuffer(publicKey), this.chainSymbol);
              return {signerAddress, publicKey, signature: transaction.signatures[index]};
          })
        };
        return transactionMapper(sanitizedTransaction);
    };
}

module.exports = LiskV3DEXAdapter;
