const LiskRepository = require('./lisk-service/repository')

async function main() {
    const liskTestnetUrl = 'https://testnet-service.lisk.com'
    const config = {baseUrl: liskTestnetUrl, fallbacks : []}
    const logger = console
    const liskRepo = new LiskRepository({config, logger});
    console.log(await liskRepo.getNetworkStatus())
    console.log(await liskRepo.getNetworkStats())
    console.log(await liskRepo.getFees())
}

(async () => await main())()
