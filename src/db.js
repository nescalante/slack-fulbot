const db = require('knex')({
  client: 'pg',
  connection: `${process.env.DATABASE_URL}?ssl=false`
});

module.exports = db;
