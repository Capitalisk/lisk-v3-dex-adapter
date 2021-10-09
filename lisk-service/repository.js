const {firstOrNull} = require('../common/utils');

const {HttpClient} = require('./client');
const metaStore = require('./meta');

const defaultTestNetURL = 'https://testnet-service.lisk.com';
const defaultMainNetURL = 'https://service.lisk.com';

class LiskServiceRepository {

    constructor({config = {}, logger = console}) {
        this.liskServiceClient = new HttpClient({config: this.getDefaultHttpClientConfig(config), logger});
    }

    getDefaultHttpClientConfig(config) {
        let defaultURL = defaultMainNetURL;
        if (config.env === 'test') {
            defaultURL = defaultTestNetURL;
        }
        const baseURL = config.serviceURL ? config.serviceURL : defaultURL;
        if (!config.serviceURLFallbacks) {
            config.serviceURLFallbacks = [];
        }
        const fallbacks = [...config.serviceURLFallbacks, defaultURL];
        return {baseURL, fallbacks};
    };

    /**
     * For getting data at given path, with given filter params
     * @param metaStorePath - Meta store path to find the data (refer to meta.js)
     * @param filterParams - filter param object (key-value pairs)
     * @returns {Promise<*>}
     */

    async get(metaStorePath, filterParams = {}) {
        const response = await this.liskServiceClient.get(metaStorePath, filterParams);
        return response.data;
    };

    async post(metaStorePath, payload = {}) {
        const response = await this.liskServiceClient.post(metaStorePath, payload);
        return response.data;
    };

    async postTransaction(payload) {
      return this.post(metaStore.Transactions.path, payload);
    };

    async getNetworkStatus() {
      return this.get('/api/v2/network/status');
    };

    async getNetworkStats() {
      return this.get('/api/v2/network/statistics');
    };

    async getFees() {
      return this.get('/api/v2/fees');
    };

    async getAccounts(filterParams) {
      return (await this.get(metaStore.Accounts.path, filterParams)).data;
    };

    async getTransactions(filterParams) {
      return (await this.get(metaStore.Transactions.path, filterParams)).data;
    };

    async getBlocks(filterParams) {
      return (await this.get(metaStore.Blocks.path, filterParams)).data;
    };

    async getAccountByAddress(walletAddress) {
        const accounts = await this.getAccounts({
            [metaStore.Accounts.filter.address]: walletAddress,
        });
        return firstOrNull(accounts);
    };

    async getOutboundTransactions(senderAddress, fromTimestamp, limit, order = 'asc') {
        const transactionFilterParams = {
            [metaStore.Transactions.filter.senderAddress]: senderAddress,
            [metaStore.Transactions.filter.limit]: limit,
            [metaStore.Transactions.filter.moduleAssetId]: '2:0', // transfer transaction
            [metaStore.Transactions.filter.moduleAssetName]: 'token:transfer', // token transfer
        };
        if (order === 'asc') {
            transactionFilterParams[metaStore.Transactions.filter.sort] = metaStore.Transactions.sortBy.timestampAsc;
            transactionFilterParams[metaStore.Transactions.filter.timestamp] = `${fromTimestamp}:`;
        } else {
            transactionFilterParams[metaStore.Transactions.filter.sort] = metaStore.Transactions.sortBy.timestampDesc;
            transactionFilterParams[metaStore.Transactions.filter.timestamp] = `0:${fromTimestamp}`;
        }
        return await this.getTransactions(transactionFilterParams);
    };

    async getInboundTransactionsFromBlock(recipientAddress, blockId) {
        const transactionFilterParams = {
            [metaStore.Transactions.filter.recipientAddress]: recipientAddress,
            [metaStore.Transactions.filter.blockId]: blockId,
            [metaStore.Transactions.filter.moduleAssetId]: '2:0', // transfer transaction
            [metaStore.Transactions.filter.moduleAssetName]: 'token:transfer', // token transfer
        };
        return await this.getTransactions(transactionFilterParams);
    };

    async getOutboundTransactionsFromBlock(senderAddress, blockId) {
        const transactionFilterParams = {
            [metaStore.Transactions.filter.senderAddress]: senderAddress,
            [metaStore.Transactions.filter.blockId]: blockId,
            [metaStore.Transactions.filter.moduleAssetId]: '2:0', // transfer transaction
            [metaStore.Transactions.filter.moduleAssetName]: 'token:transfer', // token transfer
        };
        return await this.getTransactions(transactionFilterParams);
    };

    async getLastBlockBelowTimestamp(timeStamp) {
        const blockFilterParams = {
            [metaStore.Blocks.filter.timestamp]: `0:${timeStamp}`,
            [metaStore.Blocks.filter.sort]: metaStore.Blocks.sortBy.timestampDesc,
            [metaStore.Blocks.filter.limit]: 1,
        };
        const blocks = await this.getBlocks(blockFilterParams);
        return firstOrNull(blocks);
    };

    async getLastBlock() {
        const blockFilterParams = {
            [metaStore.Blocks.filter.sort]: metaStore.Blocks.sortBy.heightDesc,
            [metaStore.Blocks.filter.limit]: 1,
        };
        const blocks = await this.getBlocks(blockFilterParams);
        return firstOrNull(blocks);
    };

    async getBlocksBetweenHeights(fromHeight, toHeight, limit) {
        const blockFilterParams = {
            [metaStore.Blocks.filter.height]: `${fromHeight}:${toHeight}`,
            [metaStore.Blocks.filter.sort]: metaStore.Blocks.sortBy.heightAsc,
            [metaStore.Blocks.filter.limit]: limit,
        };
        let blocks = await this.getBlocks(blockFilterParams);
        if (blocks.length && blocks[0].height === fromHeight) {
          blocks.shift();
        }
        return blocks;
    };

    async getBlockAtHeight(height) {
        const blockFilterParams = {
            [metaStore.Blocks.filter.height]: height,
        };
        const blocks = await this.getBlocks(blockFilterParams);
        return firstOrNull(blocks);
    };
}

module.exports = LiskServiceRepository;
