/**
 * Recorded typed path + params information used for querying data from lisk-service
 * https://github.com/LiskHQ/lisk-service/blob/development/docs/api/version2.md#network
 * @type {{Transactions: string, Blocks: string, Network: string, SentVotes: {filter: {address: string, publicKey: string, username: string}, path: string}, ReceivedVotes: {path: string, address: string, publicKey: string, username: string, aggregate: string}, Accounts: {filter: {isDelegate: string, search: string, address: string, offset: string, limit: string, publicKey: string, sort: string, username: string, status: string}, path: string, sortBy: {balanceDesc: string, balanceAsc: string, rankAsc: string, randDesc: string}, delegateStatus: {standby: string, nonEligible: string, active: string, banned: string, punished: string}}}}
 */

const Store = {
    Accounts: {
        path: '/api/v2/accounts',
        filter: {
            address: 'address', // Resolves new and old address system
            publicKey: 'publicKey',
            username: 'username',
            isDelegate: 'isDelegate',
            status: 'status', // [active, standby, banned, punished, non-eligible] (Multiple choice possible i.e. active,banned)
            search: 'search',
            limit: 'limit',
            offset: 'offset',
            sort: 'sort',
        },
        sortBy: {
            balanceAsc: 'balance:asc',
            balanceDesc: 'balance:desc',
            rankAsc: 'rank:asc',        // Rank is dedicated to delegate accounts
            randDesc: 'rank:desc',
        },
    },
    Blocks: {
        path: '/api/v2/blocks',
        filter: {
            blockId: 'blockId',
            height: 'height', // Can be expressed as an interval ie. 1:20
            generatorAddress: 'generatorAddress', // Resolves new and old address system
            generatorPublicKey: 'generatorPublicKey',
            generatorUsername: 'generatorUsername',
            timestamp: 'timestamp', // Can be expressed as interval ie. 100000:200000
            limit: 'limit',
            offset: 'offset',
            sort: 'sort',
        },
        sortBy: {
            heightAsc: 'height:asc',
            heightDesc: 'height:desc',
            timestampAsc: 'timestamp:asc',
            timestampDesc: 'timestamp:desc',
        },
    },
    Transactions: {
        path: '/api/v2/transactions',
        filter: {
            transactionId: 'transactionId',
            moduleAssetId: 'moduleAssetId', // Transfer transaction: moduleID = 2,assetID = 0 eg. 2:0
            moduleAssetName: 'moduleAssetName', // Transfer transaction: moduleName = token, assetName = transfer eg. token:transfer
            senderAddress: 'senderAddress',
            senderPublicKey: 'senderPublicKey',
            senderUsername: 'senderUsername',
            recipientAddress: 'recipientAddress',
            recipientPublicKey: 'recipientPublicKey',
            recipientUsername: 'recipientUsername',
            amount: 'amount', // Can be expressed as interval ie. 100000:200000
            timestamp: 'timestamp', // Can be expressed as interval ie. 100000:200000
            blockId: 'blockId',
            height: 'height',
            search: 'search', // Wildcard search
            data: 'data', // Wildcard search
            includePending: 'includePending',
            nonce: 'nonce', // In conjunction with senderAddress
            limit: 'limit',
            offset: 'offset',
            sort: 'sort',
        },
        sortBy: {
            amountAsc: 'amount:asc',
            amountDesc: 'amount:desc',
            timestampAsc: 'timestamp:asc',
            timestampDesc: 'timestamp:desc',
        },
    },
    TransactionStats: {
        path: '/api/v2/transactions/statistics/',
        filter: {
            interval: 'interval', // ['day', 'month']
            limit: 'limit', // default 10
            offset: 'offset', // default 0
        },
    },
    TransactionSchema: {
        path: '/api/v2/transactions/schemas',
        filter: {
            moduleAssetId: 'moduleAssetId', // Transfer transaction: moduleID = 2,assetID = 0 (ModuleId:AssetId /[0-9]+:[0-9]+/)
            moduleAssetName: 'moduleAssetName', // Transfer transaction: moduleName = token, assetName = transfer (ModuleName:AssetName /[a-z]+:[a-z]+/)
        },
    },
    Network: {
        path: '/api/v2/peers',
        filter: {
            ip: 'ip',
            networkVersion: 'networkVersion',
            state: 'state', // ['connected', 'disconnected', 'any']
            height: 'height',
            limit: 'limit', // default 10
            offset: 'offset', // default 0
            sort: 'sort', // default "height:desc"
        },
        sortBy: {
            heightAsc: 'height:asc',
            heightDesc: 'height:desc',
            networkVersionAsc: 'networkVersion:asc',
            networkVersionDesc: 'networkVersion:desc',
        },
    },
    SentVotes: {
        path: '/api/v2/votes_sent',
        filter: {
            address: 'address', // Resolves only new address system
            publicKey: 'publicKey',
            username: 'username',
        },
    },
    ReceivedVotes: {
        path: '/api/v2/votes_received',
        filter: {
            address: 'address', // Resolves only new address system
            publicKey: 'publicKey',
            username: 'username',
            aggregate: 'aggregate',
            limit: 'limit', // default 10
            offset: 'offset', // default 0
        },
    },
    RoundForgers: {
        path: '/api/v2/forgers',
        filter: {
            limit: 'limit', // default 10
            offset: 'offset', // default 0
        },
    },
};

module.exports = Store;
