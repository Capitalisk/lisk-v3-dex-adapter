const adpater = require('./index')
const LiskRepository = require('./lisk-service/repository')
async function main() {
    // const liskTestnetUrl = 'https://testnet-service.lisk.com'
    // const config = {baseUrl: liskTestnetUrl, fallbacks : [liskTestnetUrl, liskTestnetUrl]}
    // const logger = console
    // console.log(TAG_TRANSACTION)
    // const liskRepo = new LiskRepository({});
    // console.log(await liskRepo.getNetworkStatus())
    // console.log(await liskRepo.getNetworkStats())
    // console.log(await liskRepo.getFees())

    const adapter = new adpater({config: {
        env : 'test',
    }})
    // const info = await liskRepo.getNetworkStatus()
    // console.log(info)
    // console.log(await adapter.getMultisigWalletMembers({
    //     params: {
    //         walletAddress: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4"
    //     }
    // }))
    //
    // console.log(await adapter.getMinMultisigRequiredSignatures({
    //     params: {
    //         walletAddress: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4"
    //     }
    // }))

    // const transactions = await adapter.getOutboundTransactions({params : {
    //     limit: 2,
    //     fromTimestamp: 0,
    //     walletAddress: 'lskhszrdpk5yzngd885cvsvsuxcko7trsvdpn2moz'
    //     }})
    // console.log(transactions)

    // const transactionBytes = await adapter._getSignedTransactionBytes('22abf94935943a3e3cd7b5cd59f521b508c2e7b58e1585d34c129dd1cf7ec4ff')
    // const transactionHex = transactionBytes.toString('hex')
    // console.log(transactionHex)

    const wsClient = await adapter.liskWsClient.createWsClient()
    await adapter.subscribeToBlockChange(wsClient, (type, block) => {
        console.log(`type ${type} : block ${block}`)
    })
    adapter.liskWsClient.onConnected = async (wsClient) => {
        await adapter.subscribeToBlockChange(wsClient, (type, block) => {
            console.log(`type ${type} : block ${block}`)
        })
    }
    adapter.liskWsClient.onDisconnected = (wsClient) => {
        console.log("Disconnected")
    }
    await adapter.subscribeToBlockChange(wsClient, (type, block) => {
        console.log(`type ${type} : block ${block}`)
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => await main())()
