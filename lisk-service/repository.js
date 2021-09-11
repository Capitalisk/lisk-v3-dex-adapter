const {firstOrNull} = require('../liskv3/utils');

const HttpClient = require('./client');
const metaStore = require('./meta');

class LiskServiceRepository {

    constructor({config, logger}) {
        this.liskServiceClient = new HttpClient({config, logger});
    }

    /**
     * For getting data at given path, with given filter params
     * @param metaStorePath - Meta store path to find the data (refer to meta.js)
     * @param filterParams - filter param object (key-value pairs)
     * @returns {Promise<*>}
     */

    get = async (metaStorePath, filterParams = {}) => {
        const response = await this.liskServiceClient.get(metaStorePath, filterParams);
        return response.data;
    };

    post = async (metaStorePath, payload = {}) => {
        const response = await this.liskServiceClient.post(metaStorePath, payload);
        return response.data;
    };

    postTransaction = async (payload) => await this.post(metaStore.Transactions.path, payload);

    getNetworkStatus = async () => await this.get('/api/v2/network/status');

    getNetworkStats = async () => await this.get('/api/v2/network/statistics');

    getFees = async () => await this.get('/api/v2/fees');

    getAccounts = async (filterParams) => await this.get(metaStore.Accounts.path, filterParams);

    getAccountByAddress = async (walletAddress) => {
        const accountsList = await this.getAccounts({
            [metaStore.Accounts.filter.address]: walletAddress
        });
        return firstOrNull(accountsList.data);
    };

    getTransactions = async (filterParams) => await this.get(metaStore.Transactions.path, filterParams);

    getOutboundTransactions = async (senderAddress, timestamp, limit, order = 'asc') => {
        const transactionFilterParams = {
            [metaStore.Transactions.filter.senderAddress]: senderAddress,
            [metaStore.Transactions.filter.timestamp]: timestamp,
            [metaStore.Transactions.filter.limit]: limit,
        }
        if (order === 'desc') {
            transactionFilterParams[metaStore.Transactions.filter.sort] = metaStore.Transactions.sortBy.timestampDesc
        }
        return await this.getTransactions(transactionFilterParams)
    }

    getInboundTransactionsFromBlock = async (recipientAddress, blockId) => {
        const transactionFilterParams = {
            [metaStore.Transactions.filter.recipientAddress]: recipientAddress,
            [metaStore.Transactions.filter.blockId]: blockId,
        }
        return await this.getTransactions(transactionFilterParams)
    }

    getOutboundTransactionsFromBlock = async (senderAddress, blockId) => {
        const transactionFilterParams = {
            [metaStore.Transactions.filter.senderAddress]: senderAddress,
            [metaStore.Transactions.filter.blockId]: blockId,
        }
        return await this.getTransactions(transactionFilterParams)
    }

    getBlocks = async (filterParams) => await this.get(metaStore.Blocks.path, filterParams);
}

module.exports = LiskServiceRepository;
