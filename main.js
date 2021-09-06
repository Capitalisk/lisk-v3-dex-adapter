const {hexBufferToString} = require('./utils')
const {LiskRepository} = require('./lisk/repository');
const path = require('path');

async function main() {
    const homedir = require('os').homedir();
    const blockChainDBPath = path.join(homedir, '.lisk', 'lisk-core', 'data', 'blockchain.db')
    const rocksDBRepository = new LiskRepository(blockChainDBPath)
    const lastBlock = await rocksDBRepository.findLastBlockHeader()
    console.log(lastBlock)
    const lastBlockId = hexBufferToString(lastBlock.id) // id is a buffer
    const block = await rocksDBRepository.findBlockHeaderByID(lastBlockId)
    console.log(block)
}

(async () =>await main())()
