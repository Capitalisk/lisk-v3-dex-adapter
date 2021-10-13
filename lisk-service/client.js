const axios = require('axios');

const notFound = (err) => err && err.response && err.response.status === 404;

class HttpClient {

    constructor({config, logger}) {
        this.baseURL = config.baseURL;
        this.logger = logger;
    }

    async get(path, params) {
        return await axios.get(`${this.baseURL}${path}`, {params});
    }

    async post(path, payload) {
        const postReqFn = HttpPostRequestFn(path, payload);
        return await axios.post(`${this.baseURL}${path}`, payload);
    }
}

module.exports = {
  HttpClient,
  notFound
};
