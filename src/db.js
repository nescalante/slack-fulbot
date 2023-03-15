const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  execute
};

function execute(query, params) {
  return new Promise(async (resolve, reject) => {
    let client;

    try {
      client = await pool.connect();
    } catch (error) {
      reject(error);
      return;
    }

    try {
      const res = await client.query(query, params);

      resolve(res);
      client.release();
    } catch (error) {
      reject(error);
      client.release();
    }
  });
}
