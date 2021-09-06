const {KVStore} = require('@liskhq/lisk-db')

class RocksDBKVStore extends KVStore {
    constructor(dbPath) {
        super(dbPath);
    }
}

module.exports = {RocksDBKVStore}
