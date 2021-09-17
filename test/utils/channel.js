const {EventEmitter} = require('events');
const url = require('url');

class Channel {
    constructor(options) {
        this.emitter = new EventEmitter();
        this.modules = options.modules;

        let moduleNameList = Object.keys(this.modules);
        for (let moduleName of moduleNameList) {
            let moduleInstance = this.modules[moduleName];
            moduleInstance.setEmitter(this.emitter);
        }
    }

    async publish(channelName, data, info) {
        this.emitter.emit(channelName, {data, info});
    }

    async subscribe(channelName, handler) {
        this.emitter.on(channelName, handler);
    }

    async invoke(procedureName, data) {
        let procedureParts = procedureName.split(':');
        let {pathname: moduleName} = url.parse(procedureParts[0], true);
        let actionName = procedureParts[1];
        let targetFunction = this.modules[moduleName].actionHandlers[actionName];
        if (!targetFunction) {
            throw new Error(`The channel ${actionName} action did not exist on the ${moduleName} module`);
        }
        return {
            data: await targetFunction(data),
        };
    }
}

module.exports = Channel;
