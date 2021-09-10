/**
 * Recorded typed path + params information used for querying data from lisk-service
 * https://github.com/LiskHQ/lisk-service/blob/development/docs/api/version2.md#network
 * @type {{Transactions: string, Blocks: string, Network: string, SentVotes: {filter: {address: string, publicKey: string, username: string}, path: string}, ReceivedVotes: {path: string, address: string, publicKey: string, username: string, aggregate: string}, Accounts: {filter: {isDelegate: string, search: string, address: string, offset: string, limit: string, publicKey: string, sort: string, username: string, status: string}, path: string, sortBy: {balanceDesc: string, balanceAsc: string, rankAsc: string, randDesc: string}, delegateStatus: {standby: string, nonEligible: string, active: string, banned: string, punished: string}}}}
 */

const Store = {
    Accounts: {
        path: '/api/v2/accounts',
        filter: {
            address: 'address',
            publicKey: 'publicKey',
            username: 'username',
            isDelegate: 'isDelegate',
            status: 'status',
            search: 'search',
            limit: 'limit',
            offset: 'offset',
            sort: 'sort',
        },
        sortBy: {
            balanceAsc: 'balance:asc',
            balanceDesc: 'balance:desc',
            rankAsc: 'rank:asc',
            randDesc: 'rank:desc',
        },
        delegateStatus: {
            active: 'active',
            standby: 'standby',
            banned: 'banned',
            punished: 'punished',
            nonEligible: 'non-eligible',
        },
    },
    Blocks: {
        path : '/api/v2/blocks',
        filter : {
            blockId: 'blockId',
            height : 'height',
            generatorAddress : 'generatorAddress',
            generatorPublicKey: 'generatorPublicKey',
            generatorUsername: 'generatorUsername',
            timestamp: 'timestamp',
            limit: 'limit',
            offset: 'offset',
            sort: 'sort'
        },
        sortBy: {
            heightAsc: 'height:asc',
            heightDesc: 'height:desc',
            timestampAsc: 'timestamp:asc',
            timestampDesc: 'timestamp:desc',
        },
    },
    Transactions: {
        path : '/api/v2/transactions',
        filter : {
            transactionId: 'transactionId',
            moduleAssetId: 'moduleAssetId',
            moduleAssetName: 'moduleAssetName',
            senderAddress: 'senderAddress',
            senderPublicKey: 'senderPublicKey',
            senderUsername: 'senderUsername',
            recipientAddress: 'recipientAddress',
            recipientPublicKey: 'recipientPublicKey',
            recipientUsername: 'recipientUsername',
            amount: 'amount',
            timestamp: 'timestamp',
            blockId: 'blockId',
            height: 'height',
            search: 'search',
            data: 'data',
            includePending: 'includePending',
            nonce: 'nonce',
            limit: 'limit',
            offset: 'offset',
            sort: 'sort'
        },
        sortBy: {
            amountAsc: 'amount:asc',
            amountDesc: 'amount:desc',
            timestampAsc: 'timestamp:asc',
            timestampDesc: 'timestamp:desc',
        }
    },
    TransactionStats : {
        path : '/api/v2/transactions/statistics/',
        filter: {
            interval : 'interval', // ['day', 'month']
            limit: 'limit',
            offset: 'offset'
        }
    },
    TransactionSchema : {
        path : '/api/v2/transactions/schemas',
        filter: {
            moduleAssetId: 'moduleAssetId',
            moduleAssetName: 'moduleAssetName'
        }
    },
    Network: {
        path : '/api/v2/peers',
        filter: {
            ip: 'ip',
            networkVersion: 'networkVersion',
            state: 'state', // ['connected', 'disconnected', 'any']
            height: 'height',
            limit: 'limit',
            offset: 'offset',
            sort: 'sort'
        },
        sortBy : {
            heightAsc: 'height:asc',
            heightDesc: 'height:desc',
            networkVersionAsc : 'networkVersion:asc',
            networkVersionDesc : 'networkVersion:desc'
        }
    },
    SentVotes: {
        path: '/api/v2/votes_sent',
        filter: {
            address: 'address',
            publicKey: 'publicKey',
            username: 'username',
        },
    },
    ReceivedVotes: {
        path: '/api/v2/votes_received',
        filter: {
            address: 'address',
            publicKey: 'publicKey',
            username: 'username',
            aggregate: 'aggregate',
            limit: 'limit',
            offset: 'offset',
        },
    },
    RoundForgers: {
        path: '/api/v2/forgers',
        filter: {
            limit: 'limit',
            offset: 'offset',
        },
    },
};

module.exports = Store;
