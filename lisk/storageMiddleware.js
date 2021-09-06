const {Storage} = require('@liskhq/lisk-chain/dist-node/data_access')
class LiskStorageMiddleware extends Storage {
    constructor(kvStore) {
        super(kvStore);
    }
}

module.exports = {LiskStorageMiddleware}
