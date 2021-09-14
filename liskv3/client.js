const {createWSClient} = require('@liskhq/lisk-api-client');

const {wait} = require('./utils');

class LiskNodeWsClient {

    static RETRY_INTERVAL = 10 * 1000; // ms
    static MAX_RETRY = 10;
    static defaultNodeUrl = 'ws://localhost:8080';

    constructor({config, logger}) {
        this.setDefaultConfig(config);
        this.liskNodeWsHost = config.liskWsHost;
        this.liskNodeWsHostFallbacks = config.liskWsHostFallbacks;
        this.logger = logger;
        this.isInstantiating = false;
        this.wsClient = null;
    }

    setDefaultConfig = (config) => {
        if (!config.liskWsHost) {
            config.liskWsHost = LiskNodeWsClient.defaultNodeUrl;
        }
        if (!config.liskWsHostFallbacks) {
            config.liskWsHostFallbacks = [];
        }
    };

    // eslint-disable-next-line consistent-return
    instantiateClient = async (nodeWsHost) => {
        try {
            if (!this.isInstantiating) {
                if (!this.wsClient || !this.wsClient._channel.isAlive) {
                    this.isInstantiating = true;
                    if (this.wsClient) await this.wsClient.disconnect();
                    this.wsClient = await createWSClient(`${nodeWsHost}/ws`);
                    this.isInstantiating = false;
                }
                return this.wsClient;
            }
        } catch (err) {
            this.isInstantiating = false;
            this.logger.error(`Error instantiating WS client to ${nodeWsHost}`);
            this.logger.error(err.message);
            throw err;
        }
    };

    tryUsingFallback = async () => {
        if (!(this.liskNodeWsHostFallbacks && this.liskNodeWsHostFallbacks.length > 0)) {
            this.logger.warn('No fallbacks found');
        }
        for (const liskNodeWsHostFallback of this.liskNodeWsHostFallbacks) {
            try {
                this.logger.warn(`Trying out fallback host ${liskNodeWsHostFallback}`);
                return await this.instantiateClient(this.liskNodeWsHost);
            } catch (err) {
                this.logger.warn(`Fallback(${liskNodeWsHostFallback}) Error : ${err.message}, trying out next fallback`);
            }
        }
    };

    getWsClient = async () => {
        let wsClientErr = null;
        for (let retry = 0 ; retry <= LiskNodeWsClient.MAX_RETRY ; retry++) {
            try {
                this.logger.info(`Trying node WS primary host ${this.liskNodeWsHost}`);
                const nodeWsClient = await this.instantiateClient(this.liskNodeWsHost);
                if (nodeWsClient && nodeWsClient._channel && nodeWsClient._channel.invoke) {
                    this.logger.info(`Connected WS node client to Host : ${this.liskNodeWsHost}`);
                    return nodeWsClient;
                }
            } catch (err) {
                this.logger.warn(`Host(${this.liskNodeWsHost}) Error : ${err.message}, trying out available fallbacks`);
                wsClientErr = err;
                const nodeWsClient = await this.tryUsingFallback();
                if (nodeWsClient && nodeWsClient._channel && nodeWsClient._channel.invoke) {
                    return nodeWsClient;
                }
            }
            this.logger.warn(`Retry: ${retry + 1}, Max retries : ${LiskNodeWsClient.MAX_RETRY}`);
            await wait(LiskNodeWsClient.RETRY_INTERVAL);
        }
        throw wsClientErr;
    };

    disconnect = async () => {
        if (this.wsClient) {
            await this.wsClient.disconnect();
        }
    }
}

module.exports = LiskNodeWsClient;

