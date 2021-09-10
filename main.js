const fetch = require('./lisk-service-repo')

async function main() {
    const data = await fetch();
    console.log(data)
}

(async () => await main())()
