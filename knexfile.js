module.exports = {
  client: process.env.USE_SQLITE ? 'sqlite3' : 'pg',
  connection: process.env.USE_SQLITE ?
    {
      filename: 'db.sqlite3'
    } :
    {
      host: '127.0.0.1',
      user: 'lisk',
      password: '',
      database: 'lisk_v3da_test',
      port: '5432',
      charset: 'utf8',
      timezone: 'UTC',
    },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: __dirname + '/knex/migrations',
  },
  seeds: {
    directory: __dirname + '/knex/seeds',
  },
};
