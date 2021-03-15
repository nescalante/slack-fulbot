const db = require('knex')({
  client: 'pg',
  connection: `${process.env.DATABASE_URL}?sslmode=require`
});

module.exports = db;
