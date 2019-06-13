const db = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

module.exports = db;
