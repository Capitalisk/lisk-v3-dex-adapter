const {createWSClient} = require('@liskhq/lisk-api-client');

const waitForIt = require('./utils');

class LiskNodeWsClient {

    static RETRY_INTERVAL = 50; // ms

    constructor({config, logger}) {
        this.liskAddress = config.liskWs;
        this.logger = logger;
        this.isInstantiating = false;
        this.wsClient = null;
    }

    // eslint-disable-next-line consistent-return
    instantiateClient = async () => {
        try {
            if (!this.isInstantiating) {
                if (!this.wsClient || !this.wsClient._channel.isAlive) {
                    this.isInstantiating = true;
                    if (this.wsClient) await this.wsClient.disconnect();
                    this.wsClient = await createWSClient(`${this.liskAddress}/ws`);
                    this.isInstantiating = false;
                }
                return this.wsClient;
            }
        } catch (err) {
            this.logger.error(`Error instantiating WS client to ${liskAddress}`);
            this.logger.error(err.message);
            if (err.code === 'ECONNREFUSED') throw new Error('ECONNREFUSED: Unable to reach a network node');

            return {
                data: {error: 'Action not supported'},
                status: 'METHOD_NOT_ALLOWED',
            };
        }
    };

    getWsClient = async () => {
        const nodeWsClient = await waitForIt(this.instantiateClient, LiskNodeWsClient.RETRY_INTERVAL);
        return (nodeWsClient && nodeWsClient._channel && nodeWsClient._channel.invoke)
            ? nodeWsClient
            : this.getWsClient();
    };
}

module.exports = {
    LiskNodeWsClient,
};
