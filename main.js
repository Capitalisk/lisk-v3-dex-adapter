const adpater = require('./index')
async function main() {
    // const liskTestnetUrl = 'https://testnet-service.lisk.com'
    // const config = {baseUrl: liskTestnetUrl, fallbacks : [liskTestnetUrl, liskTestnetUrl]}
    const logger = console
    // const liskRepo = new LiskRepository({config, logger});
    // console.log(await liskRepo.getNetworkStatus())
    // console.log(await liskRepo.getNetworkStats())
    // console.log(await liskRepo.getFees())

    const adapter = new adpater({config: {env : 'test'}})
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

    const transactions = await adapter.getOutboundTransactions({params : {
        limit: 2,
        fromTimestamp: 0,
        walletAddress: 'lskhszrdpk5yzngd885cvsvsuxcko7trsvdpn2moz'
        }})
    console.log(transactions)
    // await adapter.subscribeToBlockChange((type, block) => {
    //     console.log(`type ${type} : block ${block}`)
    // })
    // await sleep(10000000)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => await main())()
