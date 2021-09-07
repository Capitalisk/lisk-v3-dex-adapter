let {KVStore} = require('@liskhq/lisk-db')
const levelup  = require('levelup');
const rocksDB = require('rocksdb');

class RocksDbReadonlyKVStore {
    constructor(dbPath) {
        this._db = levelup(rocksDB(dbPath), {readOnly: true});
    }
}

Object.setPrototypeOf(RocksDbReadonlyKVStore.prototype, KVStore.prototype);
RocksDbReadonlyKVStore.constructor = RocksDbReadonlyKVStore

module.exports = {RocksDbReadonlyKVStore}
