const HttpClient = require('./client')
class LiskServiceRepository {

    constructor(config) {
        this.liskServiceClient = new HttpClient(config)
    }

    getNetworkStatus = async () => {
        const response = await this.liskServiceClient.get("/api/v2/network/status")
        return response.data
    }

    getNetworkStats = async () => {
        const response = await this.liskServiceClient.get("/api/v2/network/statistics")
        return response.data
    }
}

module.exports = LiskServiceRepository
