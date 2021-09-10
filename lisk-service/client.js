const axios = require('axios');

class HttpClient {

    static HttpGetRequestFn = (path, params) => (baseUrl) => axios.get(`${baseUrl}${path}`, {params});

    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.fallbacks = config.fallbacks;
    }

    tryWithFallback = async (requestFn) => {
        for (const fallback of this.fallbacks) {
            try {
                return await requestFn(fallback)
            } catch (e) {
                console.warn(`Failed to get data from ${fallback}, trying next fallback`)
            }
        }
        return null
    }

    get = async (path, params) => {
        const reqFn = HttpClient.HttpGetRequestFn(path, params)
        try {
            return await reqFn(this.baseUrl)
        } catch (err) {
            console.warn(`Failed to get data from ${this.baseUrl}, trying fallbacks in the given order`)
            const response = await this.tryWithFallback(reqFn)
            if (response) {
                return response
            }
            throw err
        }
    }
}

module.exports = HttpClient
