const axios = require('axios');

class HttpClient {

    constructor({config, logger}) {
        this.baseUrl = config.baseUrl;
        this.fallbacks = config.fallbacks;
        this.logger = logger;
    }

    static HttpGetRequestFn = (path, params) => (baseUrl) => axios.get(`${baseUrl}${path}`, {params});

    static HttpPostRequestFn = (path, payload) => (baseUrl) => axios.post(`${baseUrl}${path}`, payload);

    static notFound = (err) => err && err.response && err.response.status === 404;

    tryWithFallback = async (requestFn) => {
        if (!(this.fallbacks && this.fallbacks.length > 0)) {
            this.logger.warn('No fallbacks found');
            return null;
        }
        for (const fallback of this.fallbacks) {
            try {
                this.activeHost = fallback;
                const response = await requestFn(fallback);
                this.setActiveHost(fallback);
                return response;
            } catch (e) {
                this.logger.warn(`Failed to get data from fallback ${fallback}, trying next fallback`);
            }
        }
        return null;
    };

    canFallback = (err) => !(err && err.response && err.response.status < 500);

    setActiveHost = (host) => {
        if (host === this.activeHost) {
            return;
        }
        this.fallbacks = this.fallbacks.filter(fallback => fallback !== host);
        this.fallbacks.push(this.getPreferredHost()); // push prev fallback host
        this.activeHost = host;
    };

    getPreferredHost = () => this.activeHost ? this.activeHost : this.baseUrl;

    get = async (path, params) => {
        const getReqFn = HttpClient.HttpGetRequestFn(path, params);
        try {
            return await getReqFn(this.getPreferredHost());
        } catch (err) {
            if (this.canFallback(err)) {
                this.logger.warn(`Failed to get data from ${this.baseUrl}, trying fallbacks in given order`);
                const response = await this.tryWithFallback(getReqFn);
                if (response) {
                    return response;
                }
            }
            throw err;
        }
    };

    post = async (path, payload) => {
        const postReqFn = HttpClient.HttpPostRequestFn(path, payload);
        try {
            return await postReqFn(this.getPreferredHost());
        } catch (err) {
            if (this.canFallback(err)) {
                this.logger.warn(`Failed to get data from ${this.baseUrl}, trying fallbacks in given order`);
                const response = await this.tryWithFallback(postReqFn);
                if (response) {
                    return response;
                }
            }
            throw err;
        }
    };
}

module.exports = HttpClient;
