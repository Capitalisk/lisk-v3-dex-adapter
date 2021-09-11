const LiskRepository = require('./lisk-service/repository')
const adpater = require('./index')
async function main() {
    const liskTestnetUrl = 'https://testnet-service.lisk.com'
    const config = {baseUrl: liskTestnetUrl, fallbacks : [liskTestnetUrl, liskTestnetUrl]}
    const logger = console
    // const liskRepo = new LiskRepository({config, logger});
    // console.log(await liskRepo.getNetworkStatus())
    // console.log(await liskRepo.getNetworkStats())
    // console.log(await liskRepo.getFees())

    const adapter = new adpater({config, logger})
    console.log(await adapter.getMultisigWalletMembers({
        params: {
            walletAddress: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4"
        }
    }))

    console.log(await adapter.getMinMultisigRequiredSignatures({
        params: {
            walletAddress: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4"
        }
    }))
}

(async () => await main())()
