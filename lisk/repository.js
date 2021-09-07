const {RocksDbReadonlyKVStore} = require('./kvstore');
const {LiskStorageMiddleware} = require('./storageMiddleware');
const {Application} = require('lisk-framework');
const {getAccountSchemaWithDefault, getRegisteredBlockAssetSchema} = require('@liskhq/lisk-chain')
const {DataAccess} = require('@liskhq/lisk-chain/dist-node/data_access')
const {toHexBuffer} = require('../utils')


class LiskRepository extends DataAccess {

    constructor(blockChainDBPath) {
        const db = new RocksDbReadonlyKVStore(blockChainDBPath)
        const modules = Application.getDefaultModules()
        let moduleAccountSchemas = {}
        for (let module of modules) {
            const moduleInstance = new module({}) // pass empty genesis config
            moduleAccountSchemas[moduleInstance.name] = {
                ...moduleInstance.accountSchema,
                fieldNumber: moduleInstance.id,
            };
        }
        const {default: defaultAccount, ...accountSchema} = getAccountSchemaWithDefault(moduleAccountSchemas);
        const registeredBlockHeaders = getRegisteredBlockAssetSchema(accountSchema);
        super({
            db,
            accountSchema,
            registeredBlockHeaders,
            maxBlockHeaderCache: 0, // no need to set cache, since we will not be storing any data, rather quering i
            minBlockHeaderCache: 0
        });
        super._storage = new LiskStorageMiddleware(db); // override existing storage with custom implementation
    }

    findBlockHeaderById = async (blockID) => await this.getBlockHeaderByID(toHexBuffer(blockID))

    findRawBlockHeaderByID = async (blockID) => await this.getRawBlockHeaderByID(toHexBuffer(blockID))

    findIfBlockExists = async (blockID) => await this.blockHeaderExists(toHexBuffer(blockID))

    findBlockHeadersByIDs = async (...blockIDs) => await this.getBlockHeadersByIDs(blockIDs.map(toHexBuffer))

    findLastBlockHeader = async (blockID) => await this.getLastBlockHeader()

    findBlockHeaderByHeight = async (height) => await this.getBlockHeaderByHeight(height)

    findBlockHeadersByHeightBetween = async (fromHeight, toHeight) => await this.getBlockHeadersByHeightBetween(fromHeight, toHeight)

    findBlockHeaderWithHeights = async (heightList) => await this.getBlockHeadersWithHeights(heightList)

    findHighestCommonBlockID = async (...blockIDs) => await this.getHighestCommonBlockID(blockIDs.map(toHexBuffer))

    findBlockByID = async (blockID) => await this.getBlockByID(toHexBuffer(blockID))

    findBlocksByIDs = async (...blockIDs) => await this.getBlocksByIDs(blockIDs.map(toHexBuffer))

    findBlockByHeight = async (height) => await this.getBlockByHeight(height)

    findBlocksByHeightBetween = async (fromHeight, toHeight) => await this.getBlocksByHeightBetween(fromHeight, toHeight)
c
    findLastBlock = async () => await this.getLastBlock()

    findIfBlockPersisted = async (blockID) => await this.isBlockPersisted(toHexBuffer(blockID))

    findAccountsByPublicKey = async (...publicKeys) => await this.getAccountsByPublicKey(publicKeys.map(toHexBuffer))

    findAccountByAddress = async (address) => await this.getAccountByAddress(toHexBuffer(address))

    findAccountsByAddress = async (...addresses) => await this.getAccountsByAddress(addresses.map(toHexBuffer))

    findTransactionByID = async (id) => await this.getTransactionByID(toHexBuffer(id))

    findTransactionsByIDs = async (...ids) => await this.getTransactionsByIDs(ids.map(toHexBuffer))

    findIfTransactionPersisted = async (id) => await this.isTransactionPersisted(toHexBuffer(id))
}

module.exports = {LiskRepository}
