const { Pool } = require('pg');
const debug = require('debug');

const log = debug('fulbot:repository');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  execute,
  getClient
};

function getClient() {
  return new Promise(async (resolve, reject) => {
    let client;

    try {
      log('adquiring connection');
      client = await pool.connect();
      log('connection adquired');

      resolve(client);
    } catch (error) {
      reject(error);
    }
  });
}

function execute(client, query, params) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await client.query(query, params);

      resolve(res);
    } catch (error) {
      log('failed to execute query');
      reject(error);
    }
  });
}
