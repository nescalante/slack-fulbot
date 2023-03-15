const db = require('knex')({
  client: 'pg',
  connection: `${process.env.DATABASE_URL}`,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = db;
