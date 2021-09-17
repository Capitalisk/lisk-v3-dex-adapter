class AppModule {
    constructor() {
        this.appState = {};
    }

    get eventHandlers() {
        return {};
    }

    get actionHandlers() {
        return {
            updateModuleState: async (stateChange) => {
                this.appState = {
                    ...this.appState,
                    ...stateChange,
                };
            },
            getApplicationState: async () => {
                return {
                    ...this.appState,
                };
            },
        };
    }

    setEmitter(emitter) {
        this.emitter = emitter;
    }
}

module.exports = AppModule;
