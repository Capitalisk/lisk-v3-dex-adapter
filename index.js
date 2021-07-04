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
const knex = require('knex');

const defaultKnexConfig = require('./knexfile.js');
const defaultConfig = require('./defaults/config');
const packageJSON = require('./package.json');

const DEFAULT_MODULE_ALIAS = 'lisk_v3_dex_adapter';

module.exports = class LiskV3DEXAdapter {
  constructor({alias, config, appConfig, logger}) {
    this.options = {...defaultConfig, ...config};
    this.appConfig = appConfig;
    this.alias = alias || DEFAULT_MODULE_ALIAS;
    this.logger = logger;

    let dalConfig = this.options.dal;

    this.knexConfig = {
      ...defaultKnexConfig,
      client: dalConfig.client || defaultConfig.client,
      connection: {
        ...defaultConfig.connection,
        ...dalConfig.connection,
      },
      pool: {
        ...defaultConfig.pool,
        ...dalConfig.pool,
      },
      migrations: {
        ...defaultConfig.migrations,
        ...dalConfig.migrations,
      },
      seeds: {
        ...defaultConfig.seeds,
        ...dalConfig.seeds,
      },
      useNullAsDefault: true,
    };
    this.knex = knex(this.knexConfig);
  }

  get dependencies() {
    return ['app'];
  }

  static get alias() {
    return DEFAULT_MODULE_ALIAS;
  }

  static get info() {
    return {
      author: 'Jonathan Gros-Dubois',
      version: packageJSON.version,
      name: DEFAULT_MODULE_ALIAS,
    };
  }

  static get migrations() {
    return [];
  }

  get events() {
    return [
      'bootstrap',
    ];
  }

  get actions() {
    return {
      getStatus: {
        handler: () => {
          return {
            version: packageJSON.version
          };
        }
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
