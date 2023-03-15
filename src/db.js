const db = require('knex')({
  client: 'pg',
  connection: `${process.env.DATABASE_URL}?ssl=true`,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = db;
