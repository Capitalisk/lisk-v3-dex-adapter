const LiskRepository = require('./lisk-service/repository')

async function main() {
    const liskTestnetUrl = 'https://testnet-service.lisk.com'
    const liskRepo = new LiskRepository({baseUrl: liskTestnetUrl, fallbacks : []});
    console.log(await liskRepo.getNetworkStatus())
    console.log(await liskRepo.getNetworkStats())
}

(async () => await main())()
