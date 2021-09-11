'use strict';

const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const path = require('path');
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);

const defaultConfig = require('./defaults/config');
const packageJSON = require('./package.json');
const LiskRepository = require('./lisk-service/repository')

const DEFAULT_MODULE_ALIAS = 'lisk_v3_dex_adapter';

module.exports = class LiskV3DEXAdapter {
  constructor({alias, config, appConfig, logger}) {
    this.options = {...defaultConfig, ...config};
    this.appConfig = appConfig;
    this.alias = alias || DEFAULT_MODULE_ALIAS;
    this.logger = logger;
    this.liskRepository = new LiskRepository({config, logger})
  }

  get dependencies() {
    return ['app'];
  }

  get info() {
    return {
      author: packageJSON.author,
      version: packageJSON.version,
      name: packageJSON.name,
    };
  }

  get events() {
    return ['bootstrap', 'chainChanges'];
  }

  get actions() {
    return {
      getStatus: {
        handler: () => ({
          version: packageJSON.version,
        })
      }
    };
  }

  async load(channel) {
    this.channel = channel;

    await this.channel.invoke('app:updateModuleState', {
      [this.alias]: {}
    });

    channel.publish(`${this.alias}:bootstrap`);
  }

  async unload() {
  }

};

function wait(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
