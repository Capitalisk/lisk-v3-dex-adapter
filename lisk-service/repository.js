const {firstOrNull} = require('../common/utils');

const metaStore = require('./meta');
const axios = require('axios');

const DEFAULT_MAIN_NET_URL = 'https://service.lisk.com';
const DEFAULT_ACK_TIMEOUT = 20000;

class LiskServiceRepository {

    constructor({config = {}, logger = console}) {
        this.serviceURL = config.serviceURL || DEFAULT_MAIN_NET_URL;
        this.axiosClient = axios.create({
            baseURL: this.serviceURL,
            timeout: config.ackTimeout == null ? DEFAULT_ACK_TIMEOUT : config.ackTimeout
        });
    }

    /**
     * For getting data at given path, with given filter params
     * @param metaStorePath - Meta store path to find the data (refer to meta.js)
     * @param filterParams - filter param object (key-value pairs)
     * @returns {Promise<*>}
     */

    async get(path, params = {}) {
        const response = await this.axiosClient.get(`${this.serviceURL}${path}`, {params});
        return response.data;
    };

    async post(path, payload = {}) {
        const response = await this.axiosClient.post(`${this.serviceURL}${path}`, payload);
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
        let fromHeightString = fromHeight == null ? '' : fromHeight;
        let toHeightString = toHeight == null ? '' : toHeight;
        const blockFilterParams = {
            [metaStore.Blocks.filter.height]: `${fromHeightString}:${toHeightString}`,
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
