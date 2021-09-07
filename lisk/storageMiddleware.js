const {DB_KEY_BLOCKS_HEIGHT} = require('@liskhq/lisk-chain/dist-node/data_access/constants');

const {getFirstPrefix, getLastPrefix, NotFoundError}  = require('@liskhq/lisk-db/dist-node');
const { hash } = require('@liskhq/lisk-cryptography');

const {Storage} = require('@liskhq/lisk-chain/dist-node/data_access')

class LiskStorageMiddleware extends Storage {
    constructor(kvStore) {
        super(kvStore);
    }

    async getFirstBlockHeader() {
        const stream = this._db.createReadStream({
            gte: getFirstPrefix(DB_KEY_BLOCKS_HEIGHT),
            lte: getLastPrefix(DB_KEY_BLOCKS_HEIGHT),
            limit: 1,
        });
        const [blockID] = await new Promise((resolve, reject) => {
            const ids = [];
            stream
                .on('data', ({ value }) => {
                    ids.push(value);
                })
                .on('error', error => {
                    reject(error);
                })
                .on('end', () => {
                    resolve(ids);
                });
        });
        if (!blockID) {
            throw new NotFoundError('Last block header not found');
        }
        return this.getBlockHeaderByID(blockID);
    }

    async getFirstBlock() {
        const header = await this.getFirstBlockHeader();
        const blockID = hash(header);
        const transactions = await this._getTransactions(blockID);
        return {
            header,
            payload: transactions,
        };
    }
}

module.exports = {LiskStorageMiddleware}
