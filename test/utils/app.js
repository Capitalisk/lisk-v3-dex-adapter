class AppModule {
  constructor() {
    this.appState = {};
  }

  setEmitter(emitter) {
    this.emitter = emitter;
  }

  get eventHandlers() {
    return {};
  }

  get actionHandlers() {
    return {
      updateModuleState: async (stateChange) => {
        this.appState = {
          ...this.appState,
          ...stateChange
        };
      },
      getApplicationState: async () => {
        return {
          ...this.appState
        };
      }
    };
  }
}

module.exports = AppModule;
