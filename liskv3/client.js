const {createWSClient} = require('@liskhq/lisk-api-client');

const {wait} = require('../common/utils');

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
        this.onConnected = async () => {
        };
        this.onDisconnected = async () => {
        };
        this.onClosed = async () => {
        };
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
                    if (this.wsClient._channel && this.wsClient._channel.invoke) {
                        this.logger.info(`Connected WS node client to Host : ${nodeWsHost}`);
                        this.activeHost = nodeWsHost;
                        this.patchDisconnectEvent();
                        this.onConnected(this.wsClient);
                    }
                    this.isInstantiating = false;
                }
                if (this.wsClient._channel && this.wsClient._channel.invoke) {
                    return this.wsClient;
                }
            }
        } catch (err) {
            this.logger.error(`Error instantiating WS client to ${nodeWsHost}`);
            this.isInstantiating = false;
            this.logger.error(err.message);
            throw err;
        }
        return null;
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

    patchDisconnectEvent = () => {
        this.internalOnClose = this.wsClient._channel._ws.onclose;
        this.wsClient._channel._ws.onclose = this.onDisconnect;
    };

    onDisconnect = () => {
        this.logger.warn(`Disconnected from server host ${this.activeHost}`);
        this.internalOnClose();
        this.onDisconnected();
        if (this.canReconnect) {
            this.createWsClient();
        }
    };

    createWsClient = async (throwOnConnectErr = false) => {
        let wsClientErr = null;
        this.canReconnect = true;
        for (let retry = 0 ; retry < LiskNodeWsClient.MAX_RETRY && this.canReconnect ; retry++) {
            try {
                this.logger.info(`Trying node WS primary host ${this.liskNodeWsHost}`);
                const nodeWsClient = await this.instantiateClient(this.liskNodeWsHost);
                if (nodeWsClient) {
                    return nodeWsClient;
                }
            } catch (err) {
                this.logger.warn(`Host(${this.liskNodeWsHost}) Error : ${err.message}, trying out available fallbacks`);
                wsClientErr = err;
                const nodeWsClient = await this.tryUsingFallback();
                if (nodeWsClient) {
                    return nodeWsClient;
                }
            }
            this.logger.warn(`Retry: ${retry + 1}, Max retries : ${LiskNodeWsClient.MAX_RETRY}`);
            await wait(LiskNodeWsClient.RETRY_INTERVAL);
        }
        if (throwOnConnectErr) {
            throw wsClientErr;
        }
        await this.close(wsClientErr);
    };

    close = async (err) => {
        this.canReconnect = false;
        if (this.wsClient) {
            await this.wsClient.disconnect();
        }
        await this.onClosed(err);
    };
}

module.exports = LiskNodeWsClient;

