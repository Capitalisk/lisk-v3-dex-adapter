const axios = require('axios');

const HttpGetRequestFn = (path, params) => (baseURL) => axios.get(`${baseURL}${path}`, {params});
const HttpPostRequestFn = (path, payload) => (baseURL) => axios.post(`${baseURL}${path}`, payload);
const notFound = (err) => err && err.response && err.response.status === 404;

class HttpClient {

    constructor({config, logger}) {
        this.baseURL = config.baseURL;
        this.fallbacks = config.fallbacks;
        this.logger = logger;
    }

    async tryWithFallback(requestFn) {
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
    }

    canFallback(err) {
        return !(err && err.response && err.response.status < 500);
    }

    setActiveHost(host) {
        if (host === this.activeHost) {
            return;
        }
        this.fallbacks = this.fallbacks.filter(fallback => fallback !== host);
        this.fallbacks.push(this.getPreferredHost()); // push prev fallback host
        this.activeHost = host;
    }

    getPreferredHost() {
      return this.activeHost ? this.activeHost : this.baseURL;
    }

    async get(path, params) {
        const getReqFn = HttpGetRequestFn(path, params);
        try {
            return await getReqFn(this.getPreferredHost());
        } catch (err) {
            if (this.canFallback(err)) {
                this.logger.warn(`Failed to get data from ${this.baseURL}, trying fallbacks in given order`);
                const response = await this.tryWithFallback(getReqFn);
                if (response) {
                    return response;
                }
            }
            throw err;
        }
    }

    async post(path, payload) {
        const postReqFn = HttpPostRequestFn(path, payload);
        try {
            return await postReqFn(this.getPreferredHost());
        } catch (err) {
            if (this.canFallback(err)) {
                this.logger.warn(`Failed to get data from ${this.baseURL}, trying fallbacks in given order`);
                const response = await this.tryWithFallback(postReqFn);
                if (response) {
                    return response;
                }
            }
            throw err;
        }
    }
}

module.exports = {
  HttpClient,
  notFound
};
