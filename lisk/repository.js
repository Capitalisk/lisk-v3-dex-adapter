const {RocksDBKVStore} = require('./kvstore');
const {LiskStorageMiddleware} = require('./storageMiddleware');
const {Application} = require('lisk-framework');
const {getAccountSchemaWithDefault, getRegisteredBlockAssetSchema} = require('@liskhq/lisk-chain')
const {DataAccess} = require('@liskhq/lisk-chain/dist-node/data_access')
const {toHexBuffer} = require('../utils')


class LiskRepository extends DataAccess {
    constructor(blockChainDBPath) {
        const db = new RocksDBKVStore(blockChainDBPath)
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

    findBlockHeaderByID = async (blockID) => await this.getRawBlockHeaderByID(toHexBuffer(blockID))

    blockExists = async (blockID) => await this.blockHeaderExists(toHexBuffer(blockID))

    findBlockHeadersByIDs = async (blockIDs) => await this.getBlockHeadersByIDs(blockIDs.map(toHexBuffer))

    findLastBlockHeader = async (blockID) => await this.getLastBlockHeader()

    // getBlockHeaderByHeight(height: number): Promise<BlockHeader>;
    // getBlockHeadersByHeightBetween(fromHeight: number, toHeight: number): Promise<BlockHeader[]>;
    // getBlockHeadersWithHeights(heightList: ReadonlyArray<number>): Promise<BlockHeader[]>;
    // getHighestCommonBlockID(arrayOfBlockIds: ReadonlyArray<Buffer>): Promise<Buffer | undefined>;
    // getBlockByID<T>(id: Buffer): Promise<Block<T>>;
    // getBlocksByIDs(arrayOfBlockIds: ReadonlyArray<Buffer>): Promise<Block[]>;
    // getBlockByHeight(height: number): Promise<Block>;
    // getBlocksByHeightBetween(fromHeight: number, toHeight: number): Promise<Block[]>;
    // getLastBlock(): Promise<Block>;
    // isBlockPersisted(blockId: Buffer): Promise<boolean>;
    // getTempBlocks(): Promise<Block[]>;
    // isTempBlockEmpty(): Promise<boolean>;
    // clearTempBlocks(): Promise<void>;
    // getChainState(key: string): Promise<Buffer | undefined>;
    // getConsensusState(key: string): Promise<Buffer | undefined>;
    // setConsensusState(key: string, val: Buffer): Promise<void>;
    // getAccountsByPublicKey(arrayOfPublicKeys: ReadonlyArray<Buffer>): Promise<Account[]>;
    // getAccountByAddress<T>(address: Buffer): Promise<Account<T>>;
    // getEncodedAccountByAddress(address: Buffer): Promise<Buffer>;
    // getAccountsByAddress<T>(arrayOfAddresses: ReadonlyArray<Buffer>): Promise<Account<T>[]>;
    // getTransactionByID(id: Buffer): Promise<Transaction>;
    // getTransactionsByIDs(arrayOfTransactionIds: ReadonlyArray<Buffer>): Promise<Transaction[]>;
    // isTransactionPersisted(transactionId: Buffer): Promise<boolean>;
    // decode<T = BlockHeaderAsset>(buffer: Buffer): Block<T>;
    // encode(block: Block<unknown>): Buffer;
    // decodeBlockHeader<T = BlockHeaderAsset>(buffer: Buffer): BlockHeader<T>;
    // encodeBlockHeader<T = BlockHeaderAsset>(blockHeader: BlockHeader<T>, skipSignature?: boolean): Buffer;
    // decodeAccount<T>(buffer: Buffer): Account<T>;
    // encodeAccount<T>(account: Account<T>): Buffer;
    // decodeTransaction(buffer: Buffer): Transaction;
    // encodeTransaction(tx: Transaction): Buffer;
    // saveBlock(block: Block, stateStore: StateStore, finalizedHeight: number, removeFromTemp?: boolean): Promise<void>;
    // deleteBlock(block: Block, stateStore: StateStore, saveToTemp?: boolean): Promise<Account[]>;
}

module.exports = {LiskRepository}
